import { ZodSchema } from "zod";

export type OutputBuilderFunction<Schema extends Record<string, ZodSchema> =
  Record<string, ZodSchema>> = (outputBuilder: OutputBuilder<Schema>) => OutputBuilder<Schema>;

export interface OutputBuilder<Schema extends Record<string, ZodSchema> = Record<string, ZodSchema>> {
  text(): OutputBuilder<Schema>;
  json(schema: Schema, schemaName?: string): OutputBuilder<Schema>;
}
