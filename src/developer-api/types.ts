import { ZodType } from "zod";
import { Prompt } from "./prompt/index.js";
import { Memory } from "./memory/index.js";

type QOutput<OutputType extends (Record<string, any> | string)> = OutputType extends Record<string, any>
  ? { output: JsonOutput<OutputType> }
  : { output: TextOutput };
type QBase<Role extends string, ToolsType extends Tool<any, any>> = {
  prompt: Prompt;
  memory?: Memory<Role, ToolsType['name']>;
  tools?: ToolRegistry<ToolsType>;
};

export type Query<
  OutputType extends (Record<string, any> | string),
  Role extends string,
  ToolsType extends Tool<any, any> = never,
> = QBase<Role, ToolsType> & QOutput<OutputType>;

// export type TextQuery<Role extends string = RoleDefault, ToolName extends string = string> = {
//   prompt: Prompt;
//   memory?: Memory<Role, ToolName>;
//   output?: TextOutput;
// };

// export type JsonQuery<
//   OutputType extends Record<string, any> = Record<string, any>,
//   Role extends string = RoleDefault
// > = {
//   prompt: Prompt;
//   memory?: Memory<Role>;
//   output: JsonOutput<OutputType>;
// };

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

export type Tool<Name extends string, Params extends {[key: string]: any}> = {
  name: Name;
  description: string;
  parameters: {[K in keyof Params]: ZodType<Params[K]>},
};

export type ToolRegistry<ToolsType extends Tool<any, any>> = {
  [K in ToolsType['name']]: Extract<
    ToolsType,
    { name: K }
  >;
};

