import { MemoryBuilder, MemoryBuilderFunction } from "./memory/index.js";
import { SectionBuilderWoMemoryFunction } from "./prompt/section-builder.js";
import { Query } from "./types.js";
import { ZodType } from "zod";

export interface QueryBuilder<
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string,
> extends TextReturningQueryBuilder<Params, Role, ToolName> { };

export interface TextReturningQueryBuilder<
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string,
> {
  prompt(
    promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>,
  ): TextReturningQueryBuilder<Params, Role, ToolName>;

  memory(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role, ToolName>,
  ): TextReturningQueryBuilder<Params, Role, ToolName>;
  memory(
    memoryBuilder: MemoryBuilder<Params, Role, ToolName>
  ): TextReturningQueryBuilder<Params, Role, ToolName>;

  outputText(): TextReturningQueryBuilder<Params, Role, ToolName>;
  outputJson<OutputType extends Record<string, any>>(
    schema: ZodType<OutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolName>;

  build(data: Params): Query<string, Role, ToolName>;
}

export interface JsonReturningQueryBuilder<
  OutputType extends Record<string, any>,
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string,
> {
  prompt(
    promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>,
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolName>;
  memory(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role, ToolName>,
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolName>;
  memory(
    memoryBuilder: MemoryBuilder<Params, Role, ToolName>
  ): JsonReturningQueryBuilder<OutputType, Params, Role, ToolName>;

  outputText(): TextReturningQueryBuilder<Params, Role, ToolName>;
  outputJson<NewOutputType extends Record<string, any>>(
    schema: ZodType<NewOutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<NewOutputType, Params, Role, ToolName>;

  build(data: Params): Query<OutputType, Role, ToolName>;
}
