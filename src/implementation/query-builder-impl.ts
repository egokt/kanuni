import {
  Memory,
  MemoryBuilderFunction,
  OutputBuilderFunction,
  Query,
  QueryBuilder,
  RoleDefault,
  Section,
  SectionBuilderWoMemoryFunction,
} from "../developer-api/index.js";
import { MemoryBuilderImpl } from "./memory/index.js";
import { OutputBuilderImpl } from "./output-builder-impl.js";
import { SectionBuilderImpl } from "./prompt/index.js";

export class QueryBuilderImpl<Params extends Record<string, any> = {}, Role extends string = RoleDefault>
  implements QueryBuilder<Params, Role>
{
  private promptData: ((data: Params, memory?: Memory) => Section) | null;
  private memoryData: ((data: Params) => Memory) | null;
  private outputData: ReturnType<OutputBuilderImpl<any>["build"]> | null;

  constructor() {
    this.promptData = null;
    this.memoryData = null;
    this.outputData = null;
  }

  prompt(
    promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>,
  ): QueryBuilder<Params, Role> {
    const newBuilder = new SectionBuilderImpl<Params>();
    const sectionBuilderOrNull = promptBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.promptData = (data, memory) => newBuilder.build(data, memory);
    }
    return this;
  }

  memory(
    memoryBuilderFunction: MemoryBuilderFunction<Params, Role>,
  ): QueryBuilder<Params, Role> {
    const newBuilder = new MemoryBuilderImpl<Params, Role>();
    const memoryBuilderOrNull = memoryBuilderFunction(newBuilder);
    if (memoryBuilderOrNull !== undefined && memoryBuilderOrNull !== null) {
      this.memoryData = (data) => newBuilder.build(data);
    }
    return this;
  }

  output<Schema extends Record<string, any> = Record<string, any>>(
    outputBuilderFunction: OutputBuilderFunction<Schema>,
  ): QueryBuilder<Params, Role> {
    const newBuilder = new OutputBuilderImpl<Schema>();
    const outputBuilderOrNull = outputBuilderFunction(newBuilder);
    if (outputBuilderOrNull !== undefined && outputBuilderOrNull !== null) {
      this.outputData = newBuilder.build();
    }
    return this;
  }

  build(data: Params): Query {
    const memory = this.memoryData === null ? undefined : this.memoryData(data);
    return {
      prompt: {
        type: "prompt",
        contents:
          this.promptData === null
            ? []
            : this.promptData(data, memory).contents,
      },
      memory,
      output: this.outputData === null ? undefined : this.outputData,
    };
  }
}
