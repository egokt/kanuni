import { ZodSchema } from "zod";
import { MemoryBuilderFunction } from "./memory/memory-builder.js";
import { OutputBuilder } from "./output-builder.js";
import { SectionBuilderWoMemoryFunction } from "./prompt/section-builder.js";
import { Query } from "./types.js";
import { RoleDefault } from "./memory/types.js";

export interface QueryBuilder<
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault
> {
  prompt(
    promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>,
  ): QueryBuilder<Params, Role>;
  memory(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role>,
  ): QueryBuilder<Params, Role>;

  output<Schema extends Record<string, ZodSchema> = Record<string, ZodSchema>>(
    outputBuilderFunction: (outputBuilder: OutputBuilder<Schema>) => OutputBuilder<Schema>,
  ): QueryBuilder<Params, Role>;

  // Unlike other builder classes, QueryBuilder has a build method, because
  // it is the final step in the query building process.
  build(data: Params): Query;
}
