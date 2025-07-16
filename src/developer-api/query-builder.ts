import { MemoryBuilderFunction } from "./memory/memory-builder.js";
import { SectionBuilderFunction } from "./prompt/section-builder.js";

export interface QueryBuilder<Params extends Record<string, any> = {}> {
  prompt(
    promptBuilderFunction: SectionBuilderFunction<Params>,
  ): QueryBuilder<Params>;
  memory<Role extends string>(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role>,
  ): QueryBuilder<Params>;
}
