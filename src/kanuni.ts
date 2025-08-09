import { Memory, MemoryBuilder, Query, QueryBuilder, RoleDefault, Tool } from "./developer-api/index.js";
import { MemoryBuilderImpl, QueryBuilderImpl } from "./implementation/index.js";

export class Kanuni {
  static newQuery<Params extends Record<string, any>, Role extends string = RoleDefault, ToolsType extends Tool<any, any> = never>(): QueryBuilder<Params, Role, ToolsType> {
    return new QueryBuilderImpl<Params, Role, ToolsType>();
  }

  static newMemory<Params extends Record<string, any> = Record<string, any>, Role extends string = RoleDefault, ToolName extends string = string>(): MemoryBuilder<Params, Role, ToolName> {
    return new MemoryBuilderImpl<Params, Role, ToolName>
  }

  static extractMemoryFromQuery<Role extends string, ToolName extends string>(query: Query<any, Role, ToolName>): Memory<Role, ToolName> | undefined {
    return query.memory;
  }
}
