import { ZodObject } from "zod";
import { Prompt } from "./prompt/index.js";
import { Memory, RoleDefault } from "./memory/index.js";

export type Query<
  OutputSchema extends Record<string, any> = Record<string, any>,
  Role extends string = RoleDefault
> = {
  prompt: Prompt;
  output?: Output<OutputSchema>;
  memory?: Memory<Role>;
};

type Output<OutputSchema extends Record<string, any> = Record<string, any>> =
  | TextOutput
  | JsonOutput<OutputSchema>;

export type TextOutput = {
  type: "output-text";
};

export type JsonOutput<T extends Record<string, any> = Record<string, any>> = {
  type: "output-json";
  schemaName: string;
  schema: ZodObject<T>;
};
