import { RoleDefault } from "./memory/types.js";
import { Query } from "./types.js";

export interface Formatter<
  Params extends Record<string, any>,
  Result,
  OutputType extends (Record<string, any> | string) = string,
  Role extends string = RoleDefault,
> {
  format: (query: Query<OutputType, Role>, params?: Params) => Result;
}
