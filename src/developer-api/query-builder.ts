import { SectionBuilderFunction, SectionBuilderImpl, Section } from "./prompt/index.js";
import { Memory } from "./memory/index.js";
import { MemoryBuilderFunction, MemoryBuilderImpl } from "./memory/memory-builder.js";

export interface QueryBuilder<Params extends Record<string, any> = {}> {
  prompt(
    promptBuilderFunction: SectionBuilderFunction<Params>,
  ): QueryBuilder<Params>;
  memory<Role extends string>(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role>,
  ): QueryBuilder<Params>;
}

export class QueryBuilderImpl<Params extends Record<string, any> = {}> implements QueryBuilder<Params> {
  private promptData: ((data: Params) => Section) | null;
  private memoryData: ((data: Params) => Memory) | null;

  constructor() {
    this.promptData = null;
    this.memoryData = null;
  }

  prompt(
    promptBuilderFunction: SectionBuilderFunction<Params>,
  ): QueryBuilder<Params> {
    const newBuilder = new SectionBuilderImpl<Params>();
    const sectionBuilderOrNull = promptBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.promptData = (data) => newBuilder.build(data);
    }
    return this;
  }

  memory<Role extends string>(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role>,
  ): QueryBuilder<Params> {
    const newBuilder = new MemoryBuilderImpl<Params, Role>();
    const memoryBuilderOrNull = memoryBuilderFunction(newBuilder);
    if (memoryBuilderOrNull !== undefined && memoryBuilderOrNull !== null) {
      this.memoryData = (data) => newBuilder.build(data);
    }
    return this;
  }

  build(data: Params) {
    // FIXME
    this.promptData;
    this.memoryData;
    data;
    return '';
  }
}
