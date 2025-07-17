import { Query } from "./types.js";

export interface Formatter<Params extends Record<string, any>, Result> {
  format: (query: Query, params?: Params) => Result;
}
