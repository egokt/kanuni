import { RoleDefault } from "./memory/types.js";
import { Query } from "./types.js";

export interface Formatter<
  Params extends Record<string, any>,
  Result,
  OutputType extends (Record<string, any> | string),
  Role extends string = RoleDefault,
  ToolName extends string = string,
> {
  format: (query: Query<OutputType, Role, ToolName>, params?: Params) => Result;
}
