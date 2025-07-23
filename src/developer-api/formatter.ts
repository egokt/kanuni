import { RoleDefault } from "./memory/types.js";
import { Query } from "./types.js";

export interface Formatter<
  Params extends Record<string, any>,
  Result,
  OutputSchema extends Record<string, any> = Record<string, any>,
  Role extends string = RoleDefault,
> {
  format: (query: Query<OutputSchema, Role>, params?: Params) => Result;
}
