import { zodToJsonSchema }  from "zod-to-json-schema";
import {
  Memory,
  MemoryBuilder,
  Query,
  QueryBuilder,
  RoleDefault,
  Tool,
  ToolRegistry,
} from "./developer-api/index.js";
import { MemoryBuilderImpl, QueryBuilderImpl, querySchema, toolRegistrySchema } from "./implementation/index.js";
import { jsonSchemaToZod } from "json-schema-to-zod";
import z from "zod";

export class Kanuni {
  static newQuery<Params extends Record<string, any>, Role extends string = RoleDefault, ToolsType extends Tool<any, any> = never>(): QueryBuilder<Params, Role, ToolsType> {
    return new QueryBuilderImpl<Params, Role, ToolsType>();
  }

  static newMemory<Params extends Record<string, any> = Record<string, any>, Role extends string = RoleDefault, ToolName extends string = string>(): MemoryBuilder<Params, Role, ToolName> {
    return new MemoryBuilderImpl<Params, Role, ToolName>();
  }

  static buildMemory<
    Params extends Record<string, any>,
    Role extends string,
    ToolName extends string,
  >(
    builder: MemoryBuilder<Params, Role, ToolName>,
    data: Params
  ): Memory<Role, ToolName>  {
    return (builder as MemoryBuilderImpl<Params, Role, ToolName>).build(data);
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

  /**
   * Serializes a Query object to a JSON string for storage or transmission.
   * 
   * This method converts a Kanuni Query into a portable JSON representation that can be
   * stored, transmitted, or persisted. It handles the conversion of Zod schemas to JSON Schema
   * format for both output specifications and tool parameter definitions.
   * 
   * **Important considerations:**
   * - Zod schemas are converted to JSON Schema format during serialization
   * - Tool parameter schemas are also converted from Zod to JSON Schema
   * - The serialized format is self-contained and doesn't require the original Zod schemas
   * - Use `deserializeQuery` to restore the serialized query back to a usable Query object
   * 
   * @param query The Query object to serialize
   * @returns A JSON string representation of the query
   * 
   * @example
   * ```typescript
   * const query = Kanuni.newQuery<{ name: string }>()
   *   .prompt(p => p.paragraph`Hello, ${"name"}`)
   *   .outputJson(z.object({ greeting: z.string() }))
   *   .build({ name: "Alice" });
   * 
   * const serialized = Kanuni.serializeQuery(query);
   * // Store or transmit the serialized string
   * localStorage.setItem('query', serialized);
   * ```
   */
  static serializeQuery<OutputType extends (Record<string, any> | string), Role extends string, ToolsType extends Tool<any, any> = never>(
    query: Query<OutputType, Role, ToolsType>
  ): string {
    // create a new shallow copy of the query
    const serializable = {
      prompt: query.prompt,
      ...(query.memory !== undefined ? { memory: query.memory } : {}),
      output: query.output.type === 'output-text' ? query.output : {
        type: query.output.type,
        schemaName: query.output.schemaName,
        schema: zodToJsonSchema(query.output.schema),
      },
      ...(query.tools === undefined ? {} : { tools: makeToolsSerializable(query.tools) }),
    };

    return JSON.stringify(serializable);
  }

  /**
   * Deserializes a JSON string back into a Query object.
   * 
   * This method converts a serialized Query (created with `serializeQuery`) back into a 
   * functional Query object. It automatically handles the conversion of JSON Schema back 
   * to Zod schemas for both output specifications and tool parameters.
   * 
   * **Important considerations:**
   * - The input must be a valid JSON string created by `serializeQuery`
   * - JSON Schema representations are converted back to functional Zod schemas
   * - Tool parameter schemas are restored as functional Zod validators
   * - The deserialized query is functionally equivalent to the original
   * - Uses `eval()` internally for schema reconstruction (ensure trusted input)
   * 
   * @param query A JSON string representation of a Query (from `serializeQuery`)
   * @returns A fully functional Query object
   * @throws Error if the input is invalid JSON or has an incorrect structure
   * 
   * @example
   * ```typescript
   * // Deserialize a previously stored query
   * const serializedQuery = localStorage.getItem('query');
   * if (serializedQuery) {
   *   const query = await Kanuni.deserializeQuery<{ name: string }>(serializedQuery);
   *   // Use the deserialized query normally
   * }
   * ```
   * 
   * @example
   * ```typescript
   * // Complete serialize/deserialize round trip
   * const originalQuery = Kanuni.newQuery<{ task: string }>()
   *   .prompt(p => p.paragraph`Task: ${"task"}`)
   *   .build({ task: "Process data" });
   * 
   * const serialized = Kanuni.serializeQuery(originalQuery);
   * const restored = await Kanuni.deserializeQuery(serialized);
   * // restored is functionally equivalent to originalQuery
   * ```
   */
  static async deserializeQuery<OutputType extends Record<string, any> | string, Role extends string = RoleDefault, ToolsType extends Tool<any, any> = never>(
    query: string,
  ): Promise<Query<OutputType, Role, ToolsType>> {

    try {
      const deserializable = JSON.parse(query);
      const safe = querySchema.parse(deserializable);

      const uncheckedDeserialized = {
        prompt: safe.prompt,
        output: safe.output.type === 'output-text' ? safe.output : {
          type: safe.output.type,
          schemaName: safe.output.schemaName,
          schema: await getExportedSchema(safe.output.schema),
        },
        ...(safe.memory === undefined ? {} : { memory: safe.memory }),
        ...(safe.tools === undefined ? {} : { tools: await deserializeTools(safe.tools)}),
      }

      // TODO: any better way to align the types here?
      return uncheckedDeserialized as unknown as Query<OutputType, Role, ToolsType>;
    }
    catch (error) {
      throw new Error('Kanuni: Error deserializing query.', { cause: error });
    }
  }
}

async function deserializeTools(deserializableToolRegistry: z.infer<typeof toolRegistrySchema>) {
  if (deserializableToolRegistry === undefined) {
    return undefined;
  }

  const deserialized: { [key: string]: Object } = {}
  for (const toolName in deserializableToolRegistry) {
    deserialized[toolName] = {
      name: toolName,
      description: deserializableToolRegistry[toolName].description,
      parameters: await deserializeParameters(deserializableToolRegistry[toolName].parameters)
    }
  }
  return deserialized;
}

async function deserializeParameters(deserializableParams: Record<string, any>) {
  if (deserializableParams === undefined) {
    return undefined;
  }

  const deserialized: {[key: string]: Object} = {};
  for (const paramName in deserializableParams) {
    deserialized[paramName] = await getExportedSchema(
      deserializableParams[paramName]
    );
  }
  return deserialized;
}

function makeToolsSerializable(toolRegistry: ToolRegistry<any>) {
  const serializable: {[key: string]: Object} = {};
  for (const toolName in toolRegistry) {
    const tool: Tool<any, any> = toolRegistry[toolName];
    serializable[toolName] = {
      name: toolName,
      description: tool.description,
      parameters: makeToolParametersSerializable(tool.parameters),
    };
  }
  return serializable;
}

function makeToolParametersSerializable(params: Tool<any, any>['parameters']) {
  const serializable: {[key: string]: Object} = {};
  for (const paramName in params) {
    serializable[paramName] = zodToJsonSchema(params[paramName]);
  }
  return serializable;
}

async function getExportedSchema(jsonSchema: any) {
  const zodSchemaBuilder = jsonSchemaToZod(jsonSchema);

  // The following line raises a typescript warning that z is unused.
  // It's not. This line is tricky. jsonSchemaToZod return code that build
  // the zod schema. We have to execute it to build the schema.
  // TODO: find a better way to do this.
  // Acknowledgement: this is a fantastic vector for a supply line attack,
  // as well as may execute any malicious code that may be generated by
  // jsonSchemaToZod. Not an ideal solution, but considering it is machine
  // generated code, and not directly from any external source, it is
  // safe enough. Nevertheless, be aware.
  // This method is only used for deserializing any serialized queries.
  // If you are concerned about this disclaimer, just don't use
  // serialization/deserialization in Kanuni.
  // @ts-ignore
  const zodSchema = (z => eval(zodSchemaBuilder))(z);

  return zodSchema;
}
