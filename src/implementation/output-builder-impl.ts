// import { ZodObject } from "zod";
// import {
//   OutputBuilder,
//   TextOutput,
//   JsonOutput,
//   TextOutputBuilder,
//   JsonOutputBuilder,
// } from "../developer-api/index.js";

// export class OutputBuilderImpl<
//   OutputType extends (Record<string, any> | string)
// > implements TextOutputBuilder, JsonOutputBuilder<OutputType> {
//   private data: (OutputType extends Record<string, any> ? JsonOutput<OutputType> : TextOutput) | null;

//   constructor() {
//     this.data = null;
//   }

//   text: () => OutputBuilderImpl<string> = () => {
//     this.data = { type: "output-text" } as TextOutput;
//     return this as OutputBuilderImpl<string>;
//   }

//   json(
//     schema: ZodObject<OutputType extends string ? {} : OutputType>,
//     schemaName: string = "response_schema"
//   ): OutputBuilderImpl<OutputType> {
//     this.data = {
//       type: "output-json",
//       schemaName,
//       schema,
//     };
//     return this;
//   }

//   build(): TextOutput | JsonOutput<OutputType extends string ? {} : OutputType> {
//     if (!this.data) {
//       throw new Error("OutputBuilder must be configured with at least one output type.");
//     }
//     return this.data;
//   }
// }
