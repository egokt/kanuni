import z, { ZodSchema } from "zod";
import {
  OutputBuilder,
  TextOutput,
  JsonOutput,
} from "../developer-api/index.js";

export class OutputBuilderImpl<Schema extends Record<string, ZodSchema>> implements OutputBuilder<Schema> {
  private data: TextOutput | JsonOutput<Schema> | null;

  constructor() {
    this.data = null;
  }

  text(): OutputBuilderImpl<Schema> {
    this.data = { type: "output-text" };
    return this;
  }

  json(schema: Schema, schemaName: string = "response_schema"): OutputBuilderImpl<Schema> {
    const zodObjectSchema = z.strictObject(schema);
    this.data = {
      type: "output-json",
      schemaName,
      schema: zodObjectSchema,
    };
    return this;
  }

  build(): TextOutput | JsonOutput<Schema> {
    if (!this.data) {
      throw new Error("OutputBuilder must be configured with at least one output type.");
    }
    return this.data;
  }
}
