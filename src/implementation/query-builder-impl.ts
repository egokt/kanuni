import { ZodType } from "zod";
import {
  JsonReturningQueryBuilder,
  JsonOutput,
  Memory,
  MemoryBuilderFunction,
  Query,
  Section,
  SectionBuilderWoMemoryFunction,
  TextReturningQueryBuilder,
  MemoryBuilder,
} from "../developer-api/index.js";
import { MemoryBuilderImpl } from "./memory/index.js";
import { SectionBuilderImpl } from "./prompt/index.js";

export class TextReturningQueryBuilderImpl<
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string,
> implements TextReturningQueryBuilder<Params, Role, ToolName>
{
  private promptData: ((data: Params, memory?: Memory<Role, ToolName>) => Section<Role, ToolName>) | null;
  private memoryData: ((data: Params) => Memory<Role, ToolName>) | null;

  constructor(
    promptData: ((data: Params, memory?: Memory<Role, ToolName>) => Section<Role, ToolName>) | null = null,
    memoryData: ((data: Params) => Memory<Role, ToolName>) | null = null,
  ) {
    this.promptData = promptData;
    this.memoryData = memoryData;
  } 

  outputText(): TextReturningQueryBuilder<Params, Role, ToolName> {
    // this method does nothing
    return this;
  }

  outputJson<OutputType extends Record<string, any>>(
    schema: ZodType<OutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolName> {
    // switch to a json returning query builder
    return JsonReturningQueryBuilderImpl.fromExistingDataAndSchema<OutputType, Params, Role, ToolName>(
      this.promptData,
      this.memoryData,
      schema,
      schemaName,
    );
  }

  prompt(promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>): TextReturningQueryBuilder<Params, Role, ToolName> {
    const newBuilder = new SectionBuilderImpl<Params, Role, ToolName>();
    const sectionBuilderOrNull = promptBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.promptData = (data, memory) => newBuilder.build(data, memory);
    }
    return this;
  }

  memory(memoryBuilderFunction: MemoryBuilderFunction<Params, Role, ToolName>): TextReturningQueryBuilder<Params, Role, ToolName>;
  memory(memoryBuilder: MemoryBuilder<Params, Role, ToolName>): TextReturningQueryBuilder<Params, Role, ToolName>;
  memory(memoryBuilderFunctionOrMemoryBuilder: MemoryBuilder<Params, Role, ToolName> | MemoryBuilderFunction<Params, Role, ToolName>): TextReturningQueryBuilder<Params, Role, ToolName> {
    if (memoryBuilderFunctionOrMemoryBuilder instanceof Function) {
      const memoryBuilderFunction = memoryBuilderFunctionOrMemoryBuilder;
      const newBuilder = new MemoryBuilderImpl<Params, Role, ToolName>();
      const memoryBuilderOrNull = memoryBuilderFunction(newBuilder);
      if (memoryBuilderOrNull !== undefined && memoryBuilderOrNull !== null) {
        this.memoryData = (data) => newBuilder.build(data);
      }
    } else {
      const memoryBuilder = memoryBuilderFunctionOrMemoryBuilder as MemoryBuilderImpl<Params, Role, ToolName>;
      this.memoryData = (data) => memoryBuilder.build(data);
    }
    return this;
  }

  build(data: Params): Query<string, Role, ToolName> {
    const memory = this.memoryData === null ? undefined : this.memoryData(data);
    return {
      prompt: {
        type: "prompt" as const,
        contents:
          this.promptData === null
            ? []
            : this.promptData(data, memory).contents,
      },
      ...(memory !== undefined ? { memory } : {}),
      output: { type: 'output-text' as const, },
    };
  }
}

export class JsonReturningQueryBuilderImpl<
  OutputType extends Record<string, any>,
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string,
> implements JsonReturningQueryBuilder<OutputType, Params, Role, ToolName>
{
  private promptData: ((data: Params, memory?: Memory<Role, ToolName>) => Section<Role, ToolName>) | null;
  private memoryData: ((data: Params) => Memory<Role, ToolName>) | null;
  private outputData: JsonOutput<OutputType>;

  constructor(
    outputData: JsonOutput<OutputType>,
    promptData: ((data: Params, memory?: Memory<Role, ToolName>) => Section<Role, ToolName>) | null = null,
    memoryData: ((data: Params) => Memory<Role, ToolName>) | null = null,
  ) {
    this.promptData = promptData;
    this.memoryData = memoryData;
    this.outputData = outputData;
  } 

  outputText(): TextReturningQueryBuilder<Params, Role, ToolName> {
    return new TextReturningQueryBuilderImpl<Params, Role, ToolName>(
      this.promptData,
      this.memoryData,
    );
  }

  outputJson<NewOutputType extends Record<string, any>>(
    schema: ZodType<NewOutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<NewOutputType, Params, Role, ToolName> {
    const outputData: JsonOutput<NewOutputType> = {
      type: "output-json",
      schemaName: schemaName === undefined ? "response_schema" : schemaName,
      schema,
    };
    return new JsonReturningQueryBuilderImpl<NewOutputType, Params, Role, ToolName>(
      outputData,
      this.promptData,
      this.memoryData,
    );
  }

  static fromExistingDataAndSchema<
    OutputType extends Record<string, any>,
    Params extends Record<string, any>,
    Role extends string,
    ToolName extends string,
  >(
    promptData: ((data: Params, memory?: Memory<Role, ToolName>) => Section<Role, ToolName>) | null,
    memoryData: ((data: Params) => Memory<Role, ToolName>) | null,
    outputSchema: ZodType<OutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilderImpl<OutputType, Params, Role, ToolName> {
    const outputData: JsonOutput<OutputType> = {
      type: "output-json",
      schemaName: schemaName === undefined ? "response_schema" : schemaName,
      schema: outputSchema,
    };
    return new JsonReturningQueryBuilderImpl<OutputType, Params, Role, ToolName>(
      outputData,
      promptData,
      memoryData,
    );
  }

  prompt(promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>): JsonReturningQueryBuilder<OutputType, Params, Role, ToolName> {
    const newBuilder = new SectionBuilderImpl<Params, Role, ToolName>();
    const sectionBuilderOrNull = promptBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.promptData = (data, memory) => newBuilder.build(data, memory);
    }
    return this;
  }

  memory(memoryBuilderFunction: MemoryBuilderFunction<Params, Role, ToolName>): JsonReturningQueryBuilder<OutputType, Params, Role, ToolName>;
  memory(memoryBuilder: MemoryBuilder<Params, Role, ToolName>): JsonReturningQueryBuilder<OutputType, Params, Role, ToolName>;
  memory(memoryBuilderFunctionOrMemoryBuilder: MemoryBuilder<Params, Role, ToolName> | MemoryBuilderFunction<Params, Role, ToolName>): JsonReturningQueryBuilder<OutputType, Params, Role, ToolName> {
    if (memoryBuilderFunctionOrMemoryBuilder instanceof Function) {
      const memoryBuilderFunction = memoryBuilderFunctionOrMemoryBuilder;
      const newBuilder = new MemoryBuilderImpl<Params, Role, ToolName>();
      const memoryBuilderOrNull = memoryBuilderFunction(newBuilder);
      if (memoryBuilderOrNull !== undefined && memoryBuilderOrNull !== null) {
        this.memoryData = (data) => newBuilder.build(data);
      }
    } else {
      // TODO: find a better way to unsure the safety of this cast
      const memoryBuilder = memoryBuilderFunctionOrMemoryBuilder as MemoryBuilderImpl<Params, Role, ToolName>;
      this.memoryData = (data) => memoryBuilder.build(data);
    }
    return this;
  }

  build(data: Params): Query<OutputType, Role, ToolName> {
    const memory = this.memoryData === null ? undefined : this.memoryData(data);
    return {
      prompt: {
        type: "prompt" as const,
        contents:
          this.promptData === null
            ? []
            : this.promptData(data, memory).contents,
      },
      memory,
      output: this.outputData,
    } as Query<OutputType, Role, ToolName>;
  }
}

export class QueryBuilderImpl<
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string,
> extends TextReturningQueryBuilderImpl<Params, Role, ToolName> { }
