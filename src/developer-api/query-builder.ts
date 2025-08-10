import { MemoryBuilder, MemoryBuilderFunction } from "./memory/index.js";
import { PromptContentBuilderFunction } from "./prompt/index.js";
import { Query, Tool, ToolRegistry } from "./types.js";
import { ZodType } from "zod";

export interface QueryBuilder<
  Params extends Record<string, any>,
  Role extends string,
  ToolsType extends Tool<any, any>
> extends TextReturningQueryBuilder<Params, Role, ToolsType> { };

export interface TextReturningQueryBuilder<
  Params extends Record<string, any>,
  Role extends string,
  ToolsType extends Tool<any, any>,
> {
  prompt(
    promptBuilderFunction: PromptContentBuilderFunction<Params>,
  ): TextReturningQueryBuilder<Params, Role, ToolsType>;

  memory(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role, ToolsType['name']>,
  ): TextReturningQueryBuilder<Params, Role, ToolsType['name']>;
  memory(
    memoryBuilder: MemoryBuilder<Params, Role, ToolsType['name']>
  ): TextReturningQueryBuilder<Params, Role, ToolsType>;

  tools(
    registry: ToolRegistry<ToolsType>,
  ): TextReturningQueryBuilder<Params, Role, ToolsType>;

  outputText(): TextReturningQueryBuilder<Params, Role, ToolsType>;
  outputJson<OutputType extends Record<string, any>>(
    schema: ZodType<OutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType>;

  build(data: Params): Query<string, Role, ToolsType['name']>;
}

export interface JsonReturningQueryBuilder<
  OutputType extends Record<string, any>,
  Params extends Record<string, any>,
  Role extends string,
  ToolsType extends Tool<any, any>,
> {
  prompt(
    promptBuilderFunction: PromptContentBuilderFunction<Params>,
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType>;
  memory(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role, ToolsType['name']>,
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType>;
  memory(
    memoryBuilder: MemoryBuilder<Params, Role, ToolsType['name']>
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType>;

  tools(
    registry: ToolRegistry<ToolsType>,
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolsType>;

  outputText(): TextReturningQueryBuilder<Params, Role, ToolsType>;
  outputJson<NewOutputType extends Record<string, any>>(
    schema: ZodType<NewOutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<NewOutputType, Params, Role, ToolsType>;

  build(data: Params): Query<OutputType, Role, ToolsType['name']>;
}
