import { ZodObject } from "zod";

// export type OutputBuilderFunction<
//   OutputType extends (Record<string, any> | string) = string
// > = (outputBuilder: OutputBuilder<OutputType>) => OutputBuilder<OutputType> | undefined | null;

// export interface OutputBuilder<OutputType extends (Record<string, any> | string) = string> {
//   text: OutputType extends string ? () => OutputBuilder<string> : never;
//   json: OutputType extends Record<string, any> ? (schema: ZodObject<OutputType>, schemaName?: string) => OutputBuilder<OutputType> : never;
// }

// export interface OutputBuilder<OutputType extends (Record<string, any> | string) = string> extends TextOutputBuilder, JsonOutputBuilder<OutputType>;

export type OutputBuilderFunction<
  OutputType extends (Record<string, any> | string) = string
> = (outputBuilder: OutputType extends Record<string, any> ? JsonOutputBuilder<OutputType> : TextOutputBuilder) => (OutputType extends Record<string, any> ? JsonOutputBuilder<OutputType> : TextOutputBuilder) | undefined | null;

export interface TextOutputBuilder {
  text(): TextOutputBuilder;
}

export interface JsonOutputBuilder<OutputType extends Record<string, any>> {
  json(schema: ZodObject<OutputType>, schemaName?: string): JsonOutputBuilder<OutputType>;
}
