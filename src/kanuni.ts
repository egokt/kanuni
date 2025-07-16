import { QueryBuilder } from "./developer-api/index.js";
import { QueryBuilderImpl } from "./implementation/index.js";

export class Kanuni {
  static newQuery<Params extends Record<string, any>>(): QueryBuilder<Params> {
    return new QueryBuilderImpl<Params>();
  }
}