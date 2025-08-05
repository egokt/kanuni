import { QueryBuilder, RoleDefault } from "./developer-api/index.js";
import { QueryBuilderImpl } from "./implementation/index.js";

export class Kanuni {
  static newQuery<Params extends Record<string, any>, Role extends string = RoleDefault>(): QueryBuilder<Params, Role> {
    return new QueryBuilderImpl<Params, Role>();
  }
}
