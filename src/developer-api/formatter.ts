import { RoleDefault } from "./memory/types.js";
import { Query, Tool } from "./types.js";

export interface Formatter<
  Params extends Record<string, any>,
  Result,
  OutputType extends (Record<string, any> | string),
  Role extends string = RoleDefault,
  ToolsType extends Tool<any, any> = never,
> {
  format: (
    query: Query<OutputType, Role, ToolsType>,
    params?: Params
  ) => Result;
}
