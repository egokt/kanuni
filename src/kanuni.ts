import { QueryBuilder, QueryBuilderImpl } from "./developer-api/query-builder.js";

export class Kanuni {
  static newQuery<Params extends Record<string, any>>(): QueryBuilder<Params> {
    return new QueryBuilderImpl<Params>();
  }
}