import { ZodType } from "zod";
import { Prompt } from "./prompt/index.js";
import { Memory, RoleDefault } from "./memory/index.js";

type QOutput<OutputType extends (Record<string, any> | string)> = OutputType extends Record<string, any>
  ? { output: JsonOutput<OutputType> }
  : { output: TextOutput };
type QBase<Role extends string> = {
  prompt: Prompt;
  memory?: Memory<Role>;
};

export type Query<
  OutputType extends (Record<string, any> | string) = string,
  Role extends string = RoleDefault
> = QBase<Role> & QOutput<OutputType>;

export type TextQuery<Role extends string = RoleDefault> = {
  prompt: Prompt;
  memory?: Memory<Role>;
  output?: TextOutput;
};

export type JsonQuery<
  OutputType extends Record<string, any> = Record<string, any>,
  Role extends string = RoleDefault
> = {
  prompt: Prompt;
  memory?: Memory<Role>;
  output: JsonOutput<OutputType>;
};

export type TextOutput = {
  type: "output-text";
};

export type JsonOutput<OutputType extends Record<string, any> = Record<string, any>> = {
  type: "output-json";
  schemaName: string;
  schema: ZodType<OutputType>;
};

export type OutputSchemaDescription = {
  title?: string;
  description?: string;
  exampleValues?: string[];
};
