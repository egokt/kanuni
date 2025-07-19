import { ZodObject } from "zod";
import { Prompt } from "./prompt/index.js";
import { Memory } from "./memory/index.js";

export type Query<T extends Record<string, any> = Record<string, any>> = {
  prompt: Prompt;
  output?: Output<T> | null;
  memory?: Memory;
};

type Output<T extends Record<string, any> = Record<string, any>> =
  | TextOutput
  | JsonOutput<T>;

export type TextOutput = {
  type: "output-text";
};

export type JsonOutput<T extends Record<string, any> = Record<string, any>> = {
  type: "output-json";
  schemaName?: string;
  schema: ZodObject<T>;
};
