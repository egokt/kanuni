import { Memory, MemoryBuilder, Query, QueryBuilder, RoleDefault, Tool } from "./developer-api/index.js";
import { MemoryBuilderImpl, QueryBuilderImpl } from "./implementation/index.js";

export class Kanuni {
  static newQuery<Params extends Record<string, any>, Role extends string = RoleDefault, ToolsType extends Tool<any, any> = never>(): QueryBuilder<Params, Role, ToolsType> {
    return new QueryBuilderImpl<Params, Role, ToolsType>();
  }

  static newMemory<Params extends Record<string, any> = Record<string, any>, Role extends string = RoleDefault, ToolName extends string = string>(): MemoryBuilder<Params, Role, ToolName> {
    return new MemoryBuilderImpl<Params, Role, ToolName>();
  }

  /**
   * Extracts memory from a query for reuse in subsequent queries.
   * 
   * **Important**: The returned memory should be treated as opaque and immutable.
   * Do not modify the memory objects after extraction, as they may share references
   * with the original query for performance reasons.
   * 
   * @param query The query to extract memory from
   * @returns The memory if present, undefined otherwise
   */
  static extractMemoryFromQuery<Role extends string, ToolsType extends Tool<any, any> = never>(query: Query<any, Role, ToolsType>): Memory<Role, ToolsType['name']> | undefined {
    return query.memory;
  }
}
