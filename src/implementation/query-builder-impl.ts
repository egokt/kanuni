import { ZodType } from "zod";
import {
  JsonReturningQueryBuilder,
  JsonOutput,
  Memory,
  MemoryBuilderFunction,
  Query,
  RoleDefault,
  Section,
  SectionBuilderWoMemoryFunction,
  TextReturningQueryBuilder,
} from "../developer-api/index.js";
import { MemoryBuilderImpl } from "./memory/index.js";
import { SectionBuilderImpl } from "./prompt/index.js";

export class TextReturningQueryBuilderImpl<
  Params extends Record<string, any> = {}, Role extends string = RoleDefault
> implements TextReturningQueryBuilder<Params, Role>
{
  private promptData: ((data: Params, memory?: Memory<Role>) => Section) | null;
  private memoryData: ((data: Params) => Memory<Role>) | null;

  constructor(
    promptData: ((data: Params, memory?: Memory<Role>) => Section) | null = null,
    memoryData: ((data: Params) => Memory<Role>) | null = null,
  ) {
    this.promptData = promptData;
    this.memoryData = memoryData;
  } 

  outputText(): TextReturningQueryBuilder<Params, Role> {
    // this method does nothing
    return this;
  }

  outputJson<OutputType extends Record<string, any>>(
    schema: ZodType<OutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<OutputType, Params, Role> {
    // switch to a json returning query builder
    return JsonReturningQueryBuilderImpl.fromExistingDataAndSchema<OutputType, Params, Role>(
      this.promptData,
      this.memoryData,
      schema,
      schemaName,
    );
  }

  prompt(promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>): TextReturningQueryBuilder<Params, Role> {
    const newBuilder = new SectionBuilderImpl<Params>();
    const sectionBuilderOrNull = promptBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.promptData = (data, memory) => newBuilder.build<Role>(data, memory);
    }
    return this;
  }

  memory(memoryBuilderFunction: MemoryBuilderFunction<Params, Role>): TextReturningQueryBuilder<Params, Role> {
    const newBuilder = new MemoryBuilderImpl<Params, Role>();
    const memoryBuilderOrNull = memoryBuilderFunction(newBuilder);
    if (memoryBuilderOrNull !== undefined && memoryBuilderOrNull !== null) {
      this.memoryData = (data) => newBuilder.build(data);
    }
    return this;
  }

  build(data: Params): Query<string, Role> {
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
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault,
> implements JsonReturningQueryBuilder<OutputType, Params, Role>
{
  private promptData: ((data: Params, memory?: Memory<Role>) => Section) | null;
  private memoryData: ((data: Params) => Memory<Role>) | null;
  private outputData: JsonOutput<OutputType>;

  constructor(
    outputData: JsonOutput<OutputType>,
    promptData: ((data: Params, memory?: Memory<Role>) => Section) | null = null,
    memoryData: ((data: Params) => Memory<Role>) | null = null,
  ) {
    this.promptData = promptData;
    this.memoryData = memoryData;
    this.outputData = outputData;
  } 

  outputText(): TextReturningQueryBuilder<Params, Role> {
    return new TextReturningQueryBuilderImpl<Params, Role>(
      this.promptData,
      this.memoryData,
    );
  }

  outputJson<NewOutputType extends Record<string, any>>(
    schema: ZodType<NewOutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilder<NewOutputType, Params, Role> {
    const outputData: JsonOutput<NewOutputType> = {
      type: "output-json",
      schemaName: schemaName === undefined ? "response_schema" : schemaName,
      schema,
    };
    return new JsonReturningQueryBuilderImpl<NewOutputType, Params, Role>(
      outputData,
      this.promptData,
      this.memoryData,
    );
  }

  static fromExistingDataAndSchema<
    OutputType extends Record<string, any>,
    Params extends Record<string, any> = {},
    Role extends string = RoleDefault
  >(
    promptData: ((data: Params, memory?: Memory<Role>) => Section) | null,
    memoryData: ((data: Params) => Memory<Role>) | null,
    outputSchema: ZodType<OutputType>,
    schemaName?: string,
  ): JsonReturningQueryBuilderImpl<OutputType, Params, Role> {
    const outputData: JsonOutput<OutputType> = {
      type: "output-json",
      schemaName: schemaName === undefined ? "response_schema" : schemaName,
      schema: outputSchema,
    };
    return new JsonReturningQueryBuilderImpl<OutputType, Params, Role>(
      outputData,
      promptData,
      memoryData,
    );
  }

  prompt(promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>): JsonReturningQueryBuilder<OutputType, Params, Role> {
    const newBuilder = new SectionBuilderImpl<Params>();
    const sectionBuilderOrNull = promptBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.promptData = (data, memory) => newBuilder.build<Role>(data, memory);
    }
    return this;
  }

  memory(memoryBuilderFunction: MemoryBuilderFunction<Params, Role>): JsonReturningQueryBuilder<OutputType, Params, Role> {
    const newBuilder = new MemoryBuilderImpl<Params, Role>();
    const memoryBuilderOrNull = memoryBuilderFunction(newBuilder);
    if (memoryBuilderOrNull !== undefined && memoryBuilderOrNull !== null) {
      this.memoryData = (data) => newBuilder.build(data);
    }
    return this;
  }

  build(data: Params): Query<OutputType, Role> {
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
    } as Query<OutputType, Role>;
  }
}

export class QueryBuilderImpl<
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault
> extends TextReturningQueryBuilderImpl<Params, Role> { }


// export class QueryBuilderImpl<
//   Params extends Record<string, any> = {},
//   Role extends string = RoleDefault
// > implements QueryBuilder<Params, Role>
// {
//   private promptData: ((data: Params, memory?: Memory<Role>) => Section) | null;
//   private memoryData: ((data: Params) => Memory<Role>) | null;

//   constructor() {
//     this.promptData = null;
//     this.memoryData = null;
//   }

//   prompt(
//     promptBuilderFunction: SectionBuilderWoMemoryFunction<Params>,
//   ): QueryBuilder<Params, Role> {
//     const newBuilder = new SectionBuilderImpl<Params>();
//     const sectionBuilderOrNull = promptBuilderFunction(newBuilder);
//     if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
//       this.promptData = (data, memory) => newBuilder.build<Role>(data, memory);
//     }
//     return this;
//   }

//   memory(
//     memoryBuilderFunction: MemoryBuilderFunction<Params, Role>,
//   ): QueryBuilder<Params, Role> {
//     const newBuilder = new MemoryBuilderImpl<Params, Role>();
//     const memoryBuilderOrNull = memoryBuilderFunction(newBuilder);
//     if (memoryBuilderOrNull !== undefined && memoryBuilderOrNull !== null) {
//       this.memoryData = (data) => newBuilder.build(data);
//     }
//     return this;
//   }

//   outputText(): TextReturningQueryBuilder<Params, Role> {
//     // this method does nothing but change the type of the builder
//     return this;
//   }
//   outputJson<OutputType extends Record<string, any>>(): JsonReturningQueryBuilder<OutputType, Params, Role> {
//     throw new Error("Method not implemented.");
//   }


//   // output<OutputType extends (Record<string, any> | string)>(
//   //   outputBuilderFunction: OutputBuilderFunction<OutputType>,
//   // ): OutputType extends Record<string, any>
//   //   ? JsonReturningQueryBuilder<OutputType, Params, Role>
//   //   : TextReturningQueryBuilder<Params, Role>
//   // {
//   //   const newBuilder = new OutputBuilderImpl<OutputType>();
//   //   const outputBuilderOrNull = outputBuilderFunction(newBuilder);
//   //   if (outputBuilderOrNull !== undefined && outputBuilderOrNull !== null) {
//   //     this.outputData = newBuilder.build();
//   //   }
//   //   return this;
//   // }

//   build(data: Params): Query<string, Role> {
//     const memory = this.memoryData === null ? undefined : this.memoryData(data);
//     const output = this.outputData === null ? undefined : this.outputData;
//     const baseRetval = {
//       prompt: {
//         type: "prompt" as const,
//         contents:
//           this.promptData === null
//             ? []
//             : this.promptData(data, memory).contents,
//       },
//       memory,
//     };
//     if (output === undefined || output.type === 'output-text') {
//       const textQuery: TextQuery<Role> = {
//         ...baseRetval,
//         output: 
//       }
//     }
//     return {
//       prompt: {
//         type: "prompt",
//         contents:
//           this.promptData === null
//             ? []
//             : this.promptData(data, memory).contents,
//       },
//       memory,
//       output: this.outputData === null ? undefined : this.outputData,
//     };
//   }
// }
