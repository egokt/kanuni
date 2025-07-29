import { MemoryBuilderFunction } from "./memory/memory-builder.js";
import { SectionBuilderWoMemoryFunction } from "./prompt/section-builder.js";
import { Query } from "./types.js";
import { RoleDefault } from "./memory/types.js";
import { ZodType } from "zod";

export interface QueryBuilder<
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault
> extends TextReturningQueryBuilder<Params, Role> { };

export interface TextReturningQueryBuilder<
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault
> {
  prompt(
    promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>,
  ): TextReturningQueryBuilder<Params, Role>;
  memory(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role>,
  ): TextReturningQueryBuilder<Params, Role>;

  outputText(): TextReturningQueryBuilder<Params, Role>;
  outputJson<OutputType extends Record<string, any>>(
    schema: ZodType<OutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<OutputType, Params, Role>;

  build(data: Params): Query<string, Role>;
}

export interface JsonReturningQueryBuilder<
  OutputType extends Record<string, any>,
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault,
> {
  prompt(
    promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>,
  ): JsonReturningQueryBuilder<OutputType, Params, Role>;
  memory(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role>,
  ): JsonReturningQueryBuilder<OutputType, Params, Role>;

  outputText(): TextReturningQueryBuilder<Params, Role>;
  outputJson<NewOutputType extends Record<string, any>>(
    schema: ZodType<NewOutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<NewOutputType, Params, Role>;

  build(data: Params): Query<OutputType, Role>;
}
