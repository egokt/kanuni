import { ZodSchema } from "zod";
import { MemoryBuilderFunction } from "./memory/memory-builder.js";
import { OutputBuilder } from "./output-builder.js";
import { SectionBuilderWoMemoryFunction } from "./prompt/section-builder.js";
import { Query } from "./types.js";

export interface QueryBuilder<Params extends Record<string, any> = {}> {
  prompt(
    promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>,
  ): QueryBuilder<Params>;
  memory<Role extends string>(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role>,
  ): QueryBuilder<Params>;

  output<Schema extends Record<string, ZodSchema> = Record<string, ZodSchema>>(
    outputBuilderFunction: (outputBuilder: OutputBuilder<Schema>) => OutputBuilder<Schema>,
  ): QueryBuilder<Params>;

  // Unlike other builder classes, QueryBuilder has a build method, because
  // it is the final step in the query building process.
  build(data: Params): Query;
}
