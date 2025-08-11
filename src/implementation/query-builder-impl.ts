import { ZodType } from "zod";
import {
  JsonReturningQueryBuilder,
  JsonOutput,
  Memory,
  MemoryBuilderFunction,
  PromptContentBuilderFunction,
  Query,
  TextReturningQueryBuilder,
  MemoryBuilder,
  Tool,
  Prompt,
} from "../developer-api/index.js";
import { MemoryBuilderImpl } from "./memory/index.js";
import { ToolRegistry } from "../developer-api/types.js";
import { PromptContentBuilderImpl } from "./prompt/prompt-content-builder-impl.js";

type PromptDataBuilderFunction<Params extends Record<string, any>> =
  (data: Params) => Prompt;

type MemoryDataBuilderFunction<
  Params extends Record<string, any>,
  Role extends string,
  ToolNames extends string,
> = (data: Params) => Memory<Role, ToolNames>;

export class TextReturningQueryBuilderImpl<
  Params extends Record<string, any>,
  Role extends string,
  ToolsType extends Tool<any, any>,
> implements TextReturningQueryBuilder<Params, Role, ToolsType>
{
  private promptData: PromptDataBuilderFunction<Params> | null;
  private memoryData:
    MemoryDataBuilderFunction<Params, Role, ToolsType['name']> | null;
  private toolsData: ToolRegistry<ToolsType> | null;

  constructor(
    promptData: PromptDataBuilderFunction<Params> | null = null,
    memoryData:
      MemoryDataBuilderFunction<Params, Role, ToolsType['name']> | null = null,
    toolsData: ToolRegistry<ToolsType> | null = null,
  ) {
    this.promptData = promptData;
    this.memoryData = memoryData;
    this.toolsData = toolsData;
  } 

  outputText(): TextReturningQueryBuilder<Params, Role, ToolsType> {
    // this method does nothing
    return this;
  }

  outputJson<OutputType extends Record<string, any>>(
    schema: ZodType<OutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType> {
    // switch to a json returning query builder
    return JsonReturningQueryBuilderImpl
      .fromExistingDataAndSchema<OutputType, Params, Role, ToolsType>(
        this.promptData,
        this.memoryData,
        this.toolsData,
        schema,
        schemaName,
      );
  }

  prompt(
    promptBuilderFunction: PromptContentBuilderFunction<Params>
  ): TextReturningQueryBuilder<Params, Role, ToolsType> {
    const newBuilder =
      new PromptContentBuilderImpl<Params, Role, ToolsType['name']>();
    const sectionBuilderOrNull = promptBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.promptData =
        (data) => newBuilder.build(data);
    }
    return this;
  }

  memory(
    memoryBuilderFunction:
      MemoryBuilderFunction<Params, Role, ToolsType['name']>
  ): TextReturningQueryBuilder<Params, Role, ToolsType['name']>;
  memory(
    memoryBuilder: MemoryBuilder<Params, Role, ToolsType['name']>
  ): TextReturningQueryBuilder<Params, Role, ToolsType>;
  memory(
    memoryBuilderFunctionOrMemoryBuilder:
      | MemoryBuilder<Params, Role, ToolsType['name']>
      | MemoryBuilderFunction<Params, Role, ToolsType['name']>
  ): TextReturningQueryBuilder<Params, Role, ToolsType> {
    if (memoryBuilderFunctionOrMemoryBuilder instanceof Function) {
      const memoryBuilderFunction = memoryBuilderFunctionOrMemoryBuilder;
      const newBuilder =
        new MemoryBuilderImpl<Params, Role, ToolsType['name']>();
      const memoryBuilderOrNull = memoryBuilderFunction(newBuilder);
      if (memoryBuilderOrNull !== undefined && memoryBuilderOrNull !== null) {
        this.memoryData = (data) => newBuilder.build(data);
      }
    } else {
      const memoryBuilder =
        memoryBuilderFunctionOrMemoryBuilder as MemoryBuilderImpl<Params, Role, ToolsType['name']>;
      this.memoryData = (data) => memoryBuilder.build(data);
    }
    return this;
  }

  tools(
    registry: ToolRegistry<ToolsType>
  ): TextReturningQueryBuilder<Params, Role, ToolsType> {
    this.toolsData = registry;
    return this;
  }

  build(data: Params): Query<string, Role, ToolsType['name']> {
    const memory = this.memoryData === null ? undefined : this.memoryData(data);
    const tools = this.toolsData === null ? undefined : this.toolsData;
    return {
      prompt: {
        type: "prompt" as const,
        contents:
          this.promptData === null
            ? []
            : this.promptData(data).contents,
      },
      ...(memory !== undefined ? { memory } : {}),
      ...(tools !== undefined ? { tools } : {}),
      output: { type: 'output-text' as const, },
    };
  }
}

export class JsonReturningQueryBuilderImpl<
  OutputType extends Record<string, any>,
  Params extends Record<string, any>,
  Role extends string,
  ToolsType extends Tool<any, any>,
> implements JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType>
{
  private promptData: PromptDataBuilderFunction<Params> | null;
  private memoryData:
    MemoryDataBuilderFunction<Params, Role, ToolsType['name']> | null;
  private outputData: JsonOutput<OutputType>;
  private toolsData: ToolRegistry<ToolsType> | null;

  constructor(
    outputData: JsonOutput<OutputType>,
    promptData: PromptDataBuilderFunction<Params> | null = null,
    memoryData:
      MemoryDataBuilderFunction<Params, Role, ToolsType['name']> | null = null,
    toolsData: ToolRegistry<ToolsType> | null = null,
  ) {
    this.promptData = promptData;
    this.memoryData = memoryData;
    this.outputData = outputData;
    this.toolsData = toolsData;
  } 

  outputText(): TextReturningQueryBuilder<Params, Role, ToolsType> {
    return new TextReturningQueryBuilderImpl<Params, Role, ToolsType>(
      this.promptData,
      this.memoryData,
      this.toolsData,
    );
  }

  outputJson<NewOutputType extends Record<string, any>>(
    schema: ZodType<NewOutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<NewOutputType, Params, Role, ToolsType> {
    const outputData: JsonOutput<NewOutputType> = {
      type: "output-json",
      schemaName: schemaName === undefined ? "response_schema" : schemaName,
      schema,
    };
    return new JsonReturningQueryBuilderImpl<NewOutputType, Params, Role, ToolsType>(
      outputData,
      this.promptData,
      this.memoryData,
      this.toolsData,
    );
  }

  static fromExistingDataAndSchema<
    OutputType extends Record<string, any>,
    Params extends Record<string, any>,
    Role extends string,
    ToolsType extends Tool<any, any>,
  >(
    promptData: PromptDataBuilderFunction<Params> | null,
    memoryData:
      MemoryDataBuilderFunction<Params, Role, ToolsType['name']> | null,
    toolsData: ToolRegistry<ToolsType> | null,
    outputSchema: ZodType<OutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilderImpl<OutputType, Params, Role, ToolsType> {
    const outputData: JsonOutput<OutputType> = {
      type: "output-json",
      schemaName: schemaName === undefined ? "response_schema" : schemaName,
      schema: outputSchema,
    };
    return new JsonReturningQueryBuilderImpl<OutputType, Params, Role, ToolsType>(
      outputData,
      promptData,
      memoryData,
      toolsData,
    );
  }

  prompt(promptBuilderFunction: PromptContentBuilderFunction<Params>): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType> {
    const newBuilder = new PromptContentBuilderImpl<Params, Role, ToolsType['name']>();
    const sectionBuilderOrNull = promptBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.promptData = (data) => newBuilder.build(data);
    }
    return this;
  }

  memory(memoryBuilderFunction: MemoryBuilderFunction<Params, Role, ToolsType['name']>): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType>;
  memory(memoryBuilder: MemoryBuilder<Params, Role, ToolsType['name']>): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType>;
  memory(memoryBuilderFunctionOrMemoryBuilder: MemoryBuilder<Params, Role, ToolsType['name']> | MemoryBuilderFunction<Params, Role, ToolsType['name']>): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType> {
    if (memoryBuilderFunctionOrMemoryBuilder instanceof Function) {
      const memoryBuilderFunction = memoryBuilderFunctionOrMemoryBuilder;
      const newBuilder = new MemoryBuilderImpl<Params, Role, ToolsType['name']>();
      const memoryBuilderOrNull = memoryBuilderFunction(newBuilder);
      if (memoryBuilderOrNull !== undefined && memoryBuilderOrNull !== null) {
        this.memoryData = (data) => newBuilder.build(data);
      }
    } else {
      // TODO: find a better way to unsure the safety of this cast
      const memoryBuilder = memoryBuilderFunctionOrMemoryBuilder as MemoryBuilderImpl<Params, Role, ToolsType['name']>;
      this.memoryData = (data) => memoryBuilder.build(data);
    }
    return this;
  }

  tools(
    registry: ToolRegistry<ToolsType>
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType> {
    this.toolsData = registry;
    return this;
  }

  build(data: Params): Query<OutputType, Role, ToolsType['name']> {
    const memory = this.memoryData === null ? undefined : this.memoryData(data);
    const tools = this.toolsData === null ? undefined : this.toolsData;
    return {
      prompt: {
        type: "prompt" as const,
        contents:
          this.promptData === null
            ? []
            : this.promptData(data).contents,
      },
      ...(memory !== undefined ? { memory } : {}),
      ...(tools !== undefined ? { tools } : {}),
      output: this.outputData,
    } as Query<OutputType, Role, ToolsType['name']>;
  }
}

export class QueryBuilderImpl<
  Params extends Record<string, any>,
  Role extends string,
  ToolsType extends Tool<any, any>,
> extends TextReturningQueryBuilderImpl<Params, Role, ToolsType> { }
