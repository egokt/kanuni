import { Kanuni } from "../../src/kanuni.js";
import { ToolRegistry, Tool, Memory, RoleDefault } from "../../src/developer-api/index.js";
import { MemoryBuilderImpl } from "../../src/implementation/memory/index.js";
import { z } from "zod";

// Test types
type TestTool = Tool<"test_tool", { param: string }>;
type SearchTool = Tool<"search", { query: string; limit?: number }>;
type CalculatorTool = Tool<"calculate", { expression: string }>;
type MultiTools = SearchTool | CalculatorTool;

describe("Kanuni", () => {
  describe("newQuery", () => {
    it("returns a QueryBuilder instance", () => {
      const builder = Kanuni.newQuery();
      expect(builder).toBeDefined();
      expect(typeof builder.prompt).toBe("function");
      expect(typeof builder.memory).toBe("function");
      expect(typeof builder.tools).toBe("function");
      expect(typeof builder.build).toBe("function");
    });

    it("supports generic type parameters", () => {
      const builder = Kanuni.newQuery<{ name: string }, RoleDefault, TestTool>();
      expect(builder).toBeDefined();
      // Test type safety by building with correct data structure
      const query = builder
        .prompt((p) => p.paragraph`Hello, ${"name"}`)
        .build({ name: "Alice" });
      
      expect(query.prompt.contents[0]).toEqual(
        expect.objectContaining({ type: "paragraph", content: "Hello, Alice" })
      );
    });

    it("creates builder that produces valid queries", () => {
      const query = Kanuni.newQuery<{ message: string }>()
        .prompt((p) => p.paragraph`${"message"}`)
        .build({ message: "Hello World" });

      expect(query).toEqual({
        prompt: {
          type: "prompt",
          contents: [
            expect.objectContaining({
              type: "paragraph",
              content: "Hello World",
            }),
          ],
        },
        output: { type: "output-text" },
      });
    });
  });

  describe("newMemory", () => {
    it("returns a MemoryBuilder instance", () => {
      const builder = Kanuni.newMemory();
      expect(builder).toBeDefined();
      expect(typeof builder.utterance).toBe("function");
      expect(typeof builder.toolCall).toBe("function");
      expect(typeof builder.toolCallResult).toBe("function");
      expect(typeof builder.append).toBe("function");
    });

    it("supports generic type parameters", () => {
      const builder = Kanuni.newMemory<{ userName: string }, "user" | "assistant", "test_tool">();
      expect(builder).toBeDefined();
      
      // Test that the builder works with the specified types
      builder.utterance("user", (data) => `Hello from ${data.userName}`)
             .toolCall("test_tool", '{"param": "value"}', "call-123");
      
      expect(builder).toBeInstanceOf(MemoryBuilderImpl);
    });

    it("creates builder that can be used independently", () => {
      const memoryBuilder = Kanuni.newMemory<{ msg: string }>()
        .utterance("user", (data) => data.msg)
        .utterance("assistant", () => "Response");

      // Should be able to use the builder
      expect(memoryBuilder).toBeDefined();
      expect(typeof memoryBuilder.utterance).toBe("function");
    });
  });

  describe("buildMemory", () => {
    it("builds memory from a MemoryBuilder instance", () => {
      const builder = Kanuni.newMemory<{ msg: string }>()
        .utterance("user", (data) => data.msg)
        .utterance("assistant", () => "Response");

      const memory = Kanuni.buildMemory(builder, { msg: "Hello" });

      expect(memory).toEqual({
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "Hello" },
          { type: "utterance", role: "assistant", contents: "Response" },
        ],
      });
    });

    it("handles empty memory builder", () => {
      const builder = Kanuni.newMemory();
      const memory = Kanuni.buildMemory(builder, {});

      expect(memory).toEqual({
        type: "memory",
        contents: [],
      });
    });

    it("supports complex memory with tool calls", () => {
      const builder = Kanuni.newMemory<{ query: string }, RoleDefault, "search">()
        .utterance("user", (data) => data.query)
        .toolCall("search", '{"query": "weather"}', "search-1")
        .toolCallResult("search-1", "Sunny, 25°C")
        .utterance("assistant", () => "The weather is sunny!");

      const memory = Kanuni.buildMemory(builder, { query: "What's the weather?" });

      expect(memory.contents).toHaveLength(4);
      expect(memory.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        contents: "What's the weather?",
      });
      expect(memory.contents[1]).toEqual({
        type: "tool-call",
        toolName: "search",
        arguments: '{"query": "weather"}',
        toolCallId: "search-1",
      });
      expect(memory.contents[2]).toEqual({
        type: "tool-call-result",
        toolCallId: "search-1",
        result: "Sunny, 25°C",
      });
      expect(memory.contents[3]).toEqual({
        type: "utterance",
        role: "assistant", 
        contents: "The weather is sunny!",
      });
    });

    it("works with custom roles and tool names", () => {
      type CustomRole = "system" | "bot";
      type CustomTool = "database";
      
      const builder = Kanuni.newMemory<{}, CustomRole, CustomTool>()
        .utterance("system", () => "System initialized")
        .utterance("bot", () => "Bot ready")
        .toolCall("database", '{"query": "SELECT 1"}', "db-1");

      const memory = Kanuni.buildMemory(builder, {});

      expect(memory.contents).toEqual([
        { type: "utterance", role: "system", contents: "System initialized" },
        { type: "utterance", role: "bot", contents: "Bot ready" },
        { type: "tool-call", toolName: "database", arguments: '{"query": "SELECT 1"}', toolCallId: "db-1" },
      ]);
    });

    it("passes data correctly to memory builder functions", () => {
      interface ComplexData {
        user: { name: string; id: number };
        context: { sessionId: string };
      }

      const builder = Kanuni.newMemory<ComplexData>()
        .utterance("user", (data) => `User ${data.user.name} (ID: ${data.user.id}) in session ${data.context.sessionId}`);

      const memory = Kanuni.buildMemory(builder, {
        user: { name: "Alice", id: 123 },
        context: { sessionId: "session-456" },
      });

      expect(memory.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        contents: "User Alice (ID: 123) in session session-456",
      });
    });
  });

  describe("extractMemoryFromQuery", () => {
    it("extracts memory from a query that has memory", () => {
      const query = Kanuni.newQuery<{ msg: string }>()
        .prompt((p) => p.paragraph`Prompt content`)
        .memory((m) => m.utterance("user", (data) => data.msg))
        .build({ msg: "Hello" });

      const extractedMemory = Kanuni.extractMemoryFromQuery(query);

      expect(extractedMemory).toBeDefined();
      expect(extractedMemory).toEqual({
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "Hello" },
        ],
      });
    });

    it("returns undefined for a query without memory", () => {
      const query = Kanuni.newQuery()
        .prompt((p) => p.paragraph`No memory here`)
        .build({});

      const extractedMemory = Kanuni.extractMemoryFromQuery(query);

      expect(extractedMemory).toBeUndefined();
    });

    it("extracts complex memory with tool calls", () => {
      const tools: ToolRegistry<TestTool> = {
        test_tool: {
          name: "test_tool",
          description: "A test tool",
          parameters: { param: z.string() },
        },
      };

      const query = Kanuni.newQuery<{}, RoleDefault, TestTool>()
        .prompt((p) => p.paragraph`Use the tool`)
        .memory((m) => 
          m.utterance("user", () => "Please use the tool")
           .toolCall("test_tool", '{"param": "value"}', "call-123")
           .toolCallResult("call-123", "Tool completed")
           .utterance("assistant", () => "Tool execution finished")
        )
        .tools(tools)
        .build({});

      const extractedMemory = Kanuni.extractMemoryFromQuery(query);

      expect(extractedMemory).toBeDefined();
      expect(extractedMemory!.contents).toHaveLength(4);
      expect(extractedMemory!.contents[1]).toEqual({
        type: "tool-call",
        toolName: "test_tool",
        arguments: '{"param": "value"}',
        toolCallId: "call-123",
      });
    });

    it("works with JSON output queries", () => {
      const query = Kanuni.newQuery<{ data: string }>()
        .prompt((p) => p.paragraph`Generate JSON`)
        .memory((m) => m.utterance("user", () => "Generate data"))
        .outputJson(z.object({ result: z.string() }))
        .build({ data: "test" });

      const extractedMemory = Kanuni.extractMemoryFromQuery(query);

      expect(extractedMemory).toBeDefined();
      expect(extractedMemory!.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        contents: "Generate data",
      });
    });

    it("preserves memory structure and references", () => {
      const originalMemory: Memory<RoleDefault, never> = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "Original" },
        ],
      };

      const query = Kanuni.newQuery()
        .memory((m) => m.append(originalMemory.contents))
        .build({});

      const extractedMemory = Kanuni.extractMemoryFromQuery(query);

      expect(extractedMemory).toBeDefined();
      expect(extractedMemory!.type).toBe("memory");
      expect(extractedMemory!.contents).toEqual(originalMemory.contents);
      
      // Memory items should share references for performance (as documented)
      expect(extractedMemory!.contents[0]).toBe(originalMemory.contents[0]);
    });

    it("works with custom roles and tool types", () => {
      type CustomRole = "admin" | "user";
      type CustomTool = Tool<"admin_tool", { action: string }>;

      const query = Kanuni.newQuery<{}, CustomRole, CustomTool>()
        .memory((m) => 
          m.utterance("admin", () => "Admin command")
           .utterance("user", () => "User response")
        )
        .build({});

      const extractedMemory = Kanuni.extractMemoryFromQuery(query);

      expect(extractedMemory).toBeDefined();
      expect(extractedMemory!.contents).toEqual([
        { type: "utterance", role: "admin", contents: "Admin command" },
        { type: "utterance", role: "user", contents: "User response" },
      ]);
    });
  });

  describe("serializeQuery", () => {
    it("serializes a simple text query", () => {
      const query = Kanuni.newQuery<{ msg: string }>()
        .prompt((p) => p.paragraph`Message: ${"msg"}`)
        .build({ msg: "Hello" });

      const serialized = Kanuni.serializeQuery(query);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual({
        prompt: query.prompt,
        output: { type: "output-text" },
      });
    });

    it("serializes a query with memory", () => {
      const query = Kanuni.newQuery<{ name: string }>()
        .prompt((p) => p.paragraph`Hello ${"name"}`)
        .memory((m) => m.utterance("user", (data) => `I am ${data.name}`))
        .build({ name: "Alice" });

      const serialized = Kanuni.serializeQuery(query);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual({
        prompt: query.prompt,
        memory: query.memory,
        output: { type: "output-text" },
      });
    });

    it("serializes a JSON output query with schema conversion", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const query = Kanuni.newQuery<{}>()
        .prompt((p) => p.paragraph`Generate person data`)
        .outputJson(schema, "person_schema")
        .build({});

      const serialized = Kanuni.serializeQuery(query);
      const parsed = JSON.parse(serialized);

      expect(parsed.output).toEqual({
        type: "output-json",
        schemaName: "person_schema",
        schema: expect.any(Object), // Zod schema converted to JSON schema
      });
      expect(parsed.output.schema).toHaveProperty("type", "object");
      expect(parsed.output.schema).toHaveProperty("properties");
    });

    it("serializes a query with tools", () => {
      const tools: ToolRegistry<MultiTools> = {
        search: {
          name: "search",
          description: "Search for information",
          parameters: {
            query: z.string().describe("Search query"),
            limit: z.number().optional().describe("Result limit"),
          },
        },
        calculate: {
          name: "calculate",
          description: "Perform calculation",
          parameters: {
            expression: z.string().describe("Math expression"),
          },
        },
      };

      const query = Kanuni.newQuery<{}, RoleDefault, MultiTools>()
        .prompt((p) => p.paragraph`Use tools as needed`)
        .tools(tools)
        .build({});

      const serialized = Kanuni.serializeQuery(query);
      const parsed = JSON.parse(serialized);

      expect(parsed.tools).toEqual({
        search: {
          name: "search",
          description: "Search for information",
          parameters: {
            query: expect.any(Object), // JSON schema representation
            limit: expect.any(Object),
          },
        },
        calculate: {
          name: "calculate",
          description: "Perform calculation",
          parameters: {
            expression: expect.any(Object),
          },
        },
      });
    });

    it("serializes a complex query with all components", () => {
      const tools: ToolRegistry<TestTool> = {
        test_tool: {
          name: "test_tool",
          description: "Test tool",
          parameters: { param: z.string() },
        },
      };

      const query = Kanuni.newQuery<{ task: string }, RoleDefault, TestTool>()
        .prompt((p) => p.paragraph`Task: ${"task"}`)
        .memory((m) => 
          m.utterance("user", (data) => data.task)
           .toolCall("test_tool", '{"param": "test"}', "call-1")
           .toolCallResult("call-1", "Success")
        )
        .tools(tools)
        .outputJson(z.object({ result: z.string() }), "task_result")
        .build({ task: "Complete analysis" });

      const serialized = Kanuni.serializeQuery(query);
      const parsed = JSON.parse(serialized);

      expect(parsed).toHaveProperty("prompt");
      expect(parsed).toHaveProperty("memory");
      expect(parsed).toHaveProperty("tools");
      expect(parsed).toHaveProperty("output");
      expect(parsed.output.type).toBe("output-json");
      expect(parsed.output.schemaName).toBe("task_result");
      expect(parsed.output.schema).toBeDefined();
      expect(parsed.output.schema.parse).toBeUndefined();
      expect(parsed.tools.test_tool.parameters).toBeDefined();
      expect(parsed.tools.test_tool.parameters.parse).toBeUndefined();
    });

    it("handles queries without optional components", () => {
      const query = Kanuni.newQuery()
        .prompt((p) => p.paragraph`Simple query`)
        .build({});

      const serialized = Kanuni.serializeQuery(query);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual({
        prompt: query.prompt,
        output: { type: "output-text" },
      });
      expect(parsed).not.toHaveProperty("memory");
      expect(parsed).not.toHaveProperty("tools");
    });

    it("produces valid JSON string", () => {
      const query = Kanuni.newQuery<{ data: any }>()
        .prompt((p) => p.paragraph`Complex data: ${"data"}`)
        .build({ data: { nested: { value: 123, array: [1, 2, 3] } } });

      const serialized = Kanuni.serializeQuery(query);

      expect(() => JSON.parse(serialized)).not.toThrow();
      expect(typeof serialized).toBe("string");
    });

    it("handles special characters and unicode in content", () => {
      const query = Kanuni.newQuery<{ msg: string }>()
        .prompt((p) => p.paragraph`Message: ${"msg"}`)
        .memory((m) => m.utterance("user", (data) => data.msg))
        .build({ msg: "Special chars: 🚀 ñáéíóú @#$%^&*()" });

      const serialized = Kanuni.serializeQuery(query);
      const parsed = JSON.parse(serialized);

      expect(parsed.prompt.contents[0].content).toContain("🚀 ñáéíóú @#$%^&*()");
      expect(parsed.memory.contents[0].contents).toContain("🚀 ñáéíóú @#$%^&*()");
    });
  });

  describe("deserializeQuery", () => {
    it("deserializes a simple text query", async () => {
      const originalQuery = Kanuni.newQuery<{ msg: string }>()
        .prompt((p) => p.paragraph`Message: ${"msg"}`)
        .build({ msg: "Hello" });

      const serialized = Kanuni.serializeQuery(originalQuery);
      const deserialized = await Kanuni.deserializeQuery(serialized);

      expect(deserialized.prompt).toEqual(originalQuery.prompt);
      expect(deserialized.output).toEqual({ type: "output-text" });
    });

    it("deserializes a query with memory", async () => {
      const originalQuery = Kanuni.newQuery<{ name: string }>()
        .prompt((p) => p.paragraph`Hello ${"name"}`)
        .memory((m) => m.utterance("user", (data) => `I am ${data.name}`))
        .build({ name: "Alice" });

      const serialized = Kanuni.serializeQuery(originalQuery);
      const deserialized = await Kanuni.deserializeQuery(serialized);

      expect(deserialized.prompt).toEqual(originalQuery.prompt);
      expect(deserialized.memory).toEqual(originalQuery.memory);
      expect(deserialized.output).toEqual({ type: "output-text" });
    });

    it("deserializes a JSON output query", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const originalQuery = Kanuni.newQuery<{}>()
        .prompt((p) => p.paragraph`Generate person`)
        .outputJson(schema, "person")
        .build({});

      const serialized = Kanuni.serializeQuery(originalQuery);
      const deserialized = await Kanuni.deserializeQuery<Record<string, any>>(serialized);

      expect(deserialized.prompt).toEqual(originalQuery.prompt);
      expect(deserialized.output.type).toBe("output-json");
      expect(deserialized.output.schemaName).toBe("person");
      expect(deserialized.output.schema).toBeDefined();
      expect(deserialized.output.schema.parse).toBeInstanceOf(Function);
    });

    it("throws error for invalid JSON", async () => {
      const invalidJson = "{ invalid json }";

      await expect(Kanuni.deserializeQuery(invalidJson)).rejects.toThrow("Kanuni: Error deserializing query.");
    });

    it("throws error for valid JSON with invalid structure", async () => {
      const invalidStructure = JSON.stringify({
        prompt: "invalid prompt structure",
        output: "invalid output",
      });

      await expect(Kanuni.deserializeQuery(invalidStructure)).rejects.toThrow("Kanuni: Error deserializing query.");
    });

    it("handles missing optional components correctly", async () => {
      const minimalQuery = {
        prompt: {
          type: "prompt",
          contents: [{ type: "paragraph", content: "Test" }],
        },
        output: { type: "output-text" },
      };

      const serialized = JSON.stringify(minimalQuery);
      const deserialized = await Kanuni.deserializeQuery(serialized);

      expect(deserialized.prompt).toEqual(minimalQuery.prompt);
      expect(deserialized.output).toEqual({ type: "output-text" });
      expect(deserialized.memory).toBeUndefined();
      expect(deserialized.tools).toBeUndefined();
    });

    it("preserves special characters and unicode", async () => {
      const originalQuery = Kanuni.newQuery<{ msg: string }>()
        .prompt((p) => p.paragraph`${"msg"}`)
        .build({ msg: "Unicode: 🚀 ñáéíóú Special: @#$%^&*()" });

      const serialized = Kanuni.serializeQuery(originalQuery);
      const deserialized = await Kanuni.deserializeQuery(serialized);

      expect(deserialized.prompt.contents[0]).toEqual(
        originalQuery.prompt.contents[0]
      );
    });

    it("deserializes a query with tools", async () => {
      const tools: ToolRegistry<SearchTool> = {
        search: {
          name: "search",
          description: "Search for information",
          parameters: {
            query: z.string(),
            limit: z.number().optional(),
          },
        },
      };

      const originalQuery = Kanuni.newQuery<{}, RoleDefault, SearchTool>()
        .prompt((p) => p.paragraph`Search query`)
        .tools(tools)
        .build({});

      const serialized = Kanuni.serializeQuery(originalQuery);
      const deserialized = await Kanuni.deserializeQuery(serialized);

      expect(deserialized.prompt).toEqual(originalQuery.prompt);
      expect(deserialized.tools).toBeDefined();
      expect((deserialized.tools as any).search).toBeDefined();
      expect((deserialized.tools as any).search.name).toBe("search");
      expect((deserialized.tools as any).search.description).toBe("Search for information");
      expect((deserialized.tools as any).search.parameters.query.parse).toBeInstanceOf(Function);
    });

    it("deserializes complex query with all components", async () => {
      const tools: ToolRegistry<TestTool> = {
        test_tool: {
          name: "test_tool",
          description: "Test tool",
          parameters: { param: z.string() },
        },
      };

      const originalQuery = Kanuni.newQuery<{ msg: string }, RoleDefault, TestTool>()
        .prompt((p) => p.paragraph`Message: ${"msg"}`)
        .memory((m) => 
          m.utterance("user", (data) => data.msg)
           .toolCall("test_tool", '{"param": "value"}', "call-1")
        )
        .tools(tools)
        .outputJson(z.object({ response: z.string() }))
        .build({ msg: "Test message" });

      const serialized = Kanuni.serializeQuery(originalQuery);
      const deserialized = await Kanuni.deserializeQuery(serialized);

      expect(deserialized.prompt).toEqual(originalQuery.prompt);
      expect(deserialized.memory).toEqual(originalQuery.memory);
      expect(deserialized.tools).toBeDefined();
      expect(deserialized.output.type).toBe("output-json");
    });

    it("maintains query structure after serialize/deserialize round trip", async () => {
      const tools: ToolRegistry<MultiTools> = {
        search: {
          name: "search",
          description: "Search tool",
          parameters: { query: z.string() },
        },
        calculate: {
          name: "calculate",
          description: "Calculator tool",
          parameters: { expression: z.string() },
        },
      };

      const originalQuery = Kanuni.newQuery<{ input: string }, RoleDefault, MultiTools>()
        .prompt((p) => p.paragraph`Input: ${"input"}`)
        .memory((m) => 
          m.utterance("user", (data) => data.input)
           .toolCall("search", '{"query": "test"}', "search-1")
           .toolCallResult("search-1", "Found results")
           .utterance("assistant", () => "Here are the results")
        )
        .tools(tools)
        .outputJson(z.object({ 
          summary: z.string(),
          confidence: z.number(),
        }), "analysis_result")
        .build({ input: "Analyze this data" });

      const serialized = Kanuni.serializeQuery(originalQuery);
      const deserialized = await Kanuni.deserializeQuery<Record<string, any>>(serialized);

      // Compare structure (not exact equality due to schema transformation)
      expect(deserialized.prompt).toEqual(originalQuery.prompt);
      expect(deserialized.memory).toEqual(originalQuery.memory);
      expect(deserialized.output.type).toBe(originalQuery.output.type);
      expect(deserialized.output.schemaName).toBe(originalQuery.output.schemaName);
      expect(deserialized.tools).toBeDefined();
      expect(Object.keys(deserialized.tools!)).toEqual(Object.keys(originalQuery.tools!));
    });
  });

  describe("Integration and Edge Cases", () => {
    it("works with empty data objects", () => {
      const query = Kanuni.newQuery<{}>()
        .prompt((p) => p.paragraph`Static content`)
        .build({});

      expect(query.prompt.contents[0]).toEqual(
        expect.objectContaining({ content: "Static content" })
      );
    });

    it("handles complex nested data structures", () => {
      interface ComplexData {
        user: {
          profile: {
            name: string;
            settings: { theme: string; notifications: boolean };
          };
          permissions: string[];
        };
        session: {
          id: string;
          metadata: Record<string, any>;
        };
      }

      const complexData: ComplexData = {
        user: {
          profile: {
            name: "Alice",
            settings: { theme: "dark", notifications: true },
          },
          permissions: ["read", "write"],
        },
        session: {
          id: "session-123",
          metadata: { ip: "127.0.0.1", userAgent: "TestAgent" },
        },
      };

      const query = Kanuni.newQuery<ComplexData>()
        .prompt((p) => p.paragraph`User: ${"user"}`)
        .memory((m) => m.utterance("user", (data) => `Session: ${data.session.id}`))
        .build(complexData);

      expect(query.memory!.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        contents: "Session: session-123",
      });
    });

    it("supports method chaining across all static methods", async () => {
      // Test that methods can be used in sequence for complex workflows
      const memoryBuilder = Kanuni.newMemory<{ context: string }>()
        .utterance("user", (data) => `Context: ${data.context}`);

      const builtMemory = Kanuni.buildMemory(memoryBuilder, { context: "test" });

      const query = Kanuni.newQuery<{ msg: string }>()
        .prompt((p) => p.paragraph`Message: ${"msg"}`)
        .memory((m) => m.utterance("assistant", () => "Response"))
        .build({ msg: "Hello" });

      const extractedMemory = Kanuni.extractMemoryFromQuery(query);

      const serialized = Kanuni.serializeQuery(query);
      const deserialized = await Kanuni.deserializeQuery(serialized);

      expect(builtMemory.contents).toHaveLength(1);
      expect(extractedMemory!.contents).toHaveLength(1);
      expect(deserialized.memory!.contents).toEqual(extractedMemory!.contents);
    });

    it("maintains type safety across serialization", async () => {
      type CustomRole = "admin" | "user";
      type CustomTool = Tool<"admin_action", { action: string }>;

      const query = Kanuni.newQuery<{ command: string }, CustomRole, CustomTool>()
        .prompt((p) => p.paragraph`Command: ${"command"}`)
        .memory((m) => m.utterance("admin", (data) => `Execute: ${data.command}`))
        .build({ command: "backup" });

      const serialized = Kanuni.serializeQuery(query);
      const deserialized = await Kanuni.deserializeQuery<{ command: string }, CustomRole, CustomTool>(serialized);

      expect(deserialized.memory!.contents[0]).toEqual({
        type: "utterance",
        role: "admin",
        contents: "Execute: backup",
      });
    });

    it("handles performance edge case with large data", async () => {
      // Test with reasonably large data to ensure no performance issues
      const largeArray = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      const largeData = {
        items: largeArray,
        description: "A".repeat(1000), // Long string
      };

      const query = Kanuni.newQuery<typeof largeData>()
        .prompt((p) => p.paragraph`Processing items`)
        .memory((m) => m.utterance("user", (data) => `Description length: ${data.description.length}`))
        .build(largeData);

      const serialized = Kanuni.serializeQuery(query);
      const deserialized = await Kanuni.deserializeQuery(serialized);

      expect(deserialized.prompt.contents[0]).toEqual(
        expect.objectContaining({ content: "Processing items" })
      );
      expect(deserialized.memory!.contents[0]).toEqual(
        expect.objectContaining({ contents: "Description length: 1000" })
      );
    });

    it("handles concurrent usage scenarios", () => {
      // Test that static methods don't interfere with each other
      const builder1 = Kanuni.newQuery<{ msg1: string }>();
      const builder2 = Kanuni.newQuery<{ msg2: string }>();

      const query1 = builder1
        .prompt((p) => p.paragraph`First: ${"msg1"}`)
        .build({ msg1: "Query 1" });

      const query2 = builder2
        .prompt((p) => p.paragraph`Second: ${"msg2"}`)
        .build({ msg2: "Query 2" });

      expect(query1.prompt.contents[0]).toEqual(
        expect.objectContaining({ content: "First: Query 1" })
      );
      expect(query2.prompt.contents[0]).toEqual(
        expect.objectContaining({ content: "Second: Query 2" })
      );
    });

    it("properly handles memory reference sharing as documented", () => {
      const originalMemory: Memory<RoleDefault, never> = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "Original" },
        ],
      };

      const query = Kanuni.newQuery()
        .memory((m) => m.append(originalMemory.contents))
        .build({});

      const extracted = Kanuni.extractMemoryFromQuery(query);

      // As documented, memory should share references for performance
      expect(extracted!.contents[0]).toBe(originalMemory.contents[0]);

      // Modifying original affects extracted (expected behavior)
      const utteranceItem = originalMemory.contents[0];
      if (utteranceItem.type === "utterance") {
        utteranceItem.contents = "Modified";
        const extractedUtterance = extracted!.contents[0];
        if (extractedUtterance.type === "utterance") {
          expect(extractedUtterance.contents).toBe("Modified");
        }
      }
    });

    it("validates schema preservation through serialization", async () => {
      const complexSchema = z.object({
        user: z.object({
          id: z.number(),
          name: z.string(),
          email: z.string().email(),
        }),
        data: z.array(z.object({
          key: z.string(),
          value: z.union([z.string(), z.number(), z.boolean()]),
        })),
        metadata: z.record(z.any()).optional(),
      });

      const query = Kanuni.newQuery()
        .prompt((p) => p.paragraph`Generate user data`)
        .outputJson(complexSchema, "user_data")
        .build({});

      const serialized = Kanuni.serializeQuery(query);
      const deserialized = await Kanuni.deserializeQuery<Record<string, any>>(serialized);

      expect(deserialized.output.type).toBe("output-json");
      expect(deserialized.output.schemaName).toBe("user_data");
      expect(deserialized.output.schema).toBeDefined();

      // The schema should be functionally equivalent (though not necessarily identical)
      expect(typeof deserialized.output.schema.parse).toBe("function");
    });

    it("handles null and undefined data properties gracefully", () => {
      interface DataWithNulls {
        required: string;
        optional?: string;
        nullable: string | null;
      }

      const dataWithNulls: DataWithNulls = {
        required: "value",
        optional: undefined,
        nullable: null,
      };

      const query = Kanuni.newQuery<DataWithNulls>()
        .prompt((p) => p.paragraph`Required: ${"required"}`)
        .memory((m) => m.utterance("user", (data) => `Nullable: ${data.nullable || "null"}`))
        .build(dataWithNulls);

      expect(query.prompt.contents[0]).toEqual(
        expect.objectContaining({ content: "Required: value" })
      );
      expect(query.memory!.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        contents: "Nullable: null",
      });
    });

    it("handles builder functions that return undefined/null", () => {
      const query = Kanuni.newQuery<{ show: boolean }>()
        .prompt((p) => {
          p.paragraph`Always shown`;
          return null; // Prompt builder returns null
        })
        .memory((m) => {
          m.utterance("user", () => "This will be added");
          return undefined; // Memory builder returns undefined
        })
        .build({ show: false });

      expect(query.prompt.contents).toEqual([]);
      expect(query.memory).toBeUndefined();
    });

    it("works correctly with builders that have no chained methods", () => {
      const memoryBuilder = Kanuni.newMemory();
      const queryBuilder = Kanuni.newQuery();

      const memory = Kanuni.buildMemory(memoryBuilder, {});
      const query = queryBuilder.build({});

      expect(memory.contents).toEqual([]);
      expect(query.prompt.contents).toEqual([]);
      expect(query.memory).toBeUndefined();
    });

    it("handles extractMemoryFromQuery with different query types", () => {
      // Test with text output query
      const textQuery = Kanuni.newQuery()
        .memory((m) => m.utterance("user", () => "Text query"))
        .build({});

      // Test with JSON output query 
      const jsonQuery = Kanuni.newQuery()
        .memory((m) => m.utterance("user", () => "JSON query"))
        .outputJson(z.object({ result: z.string() }))
        .build({});

      const textMemory = Kanuni.extractMemoryFromQuery(textQuery);
      const jsonMemory = Kanuni.extractMemoryFromQuery(jsonQuery);

      expect(textMemory!.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        contents: "Text query",
      });
      expect(jsonMemory!.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        contents: "JSON query",
      });
    });

    it("supports reusing memory builders across different data", () => {
      const memoryBuilder = Kanuni.newMemory<{ msg: string }>()
        .utterance("user", (data) => `Message: ${data.msg}`);

      const memory1 = Kanuni.buildMemory(memoryBuilder, { msg: "first" });
      const memory2 = Kanuni.buildMemory(memoryBuilder, { msg: "second" });

      expect(memory1.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        contents: "Message: first",
      });
      expect(memory2.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        contents: "Message: second",
      });
      
      // Memories should be independent
      expect(memory1.contents).not.toBe(memory2.contents);
    });

    it("handles serialization of queries with complex prompt structures", async () => {
      const query = Kanuni.newQuery<{ title: string }>()
        .prompt((p) => 
          p.section((s) => 
            s.heading`Section: ${"title"}`
             .paragraph`Content paragraph`
             .list((l) => 
               l.item`First item`
                .item`Second item`
             )
             .table((t) => 
               t.columnHeaders(() => ["Col1", "Col2"])
                .row((r) => 
                  r.cell((c) => c.paragraph`Cell 1`)
                   .cell((c) => c.paragraph`Cell 2`)
                )
             )
          )
        )
        .build({ title: "Test" });

      const serialized = Kanuni.serializeQuery(query);
      const deserialized = await Kanuni.deserializeQuery(serialized);

      expect(deserialized.prompt.contents).toHaveLength(1);
      expect(deserialized.prompt.contents[0].type).toBe("section");
    });

    it("handles buildMemory with complex memory patterns", () => {
      const builder = Kanuni.newMemory<{ sessionId: string, userId: number }, "system" | "user" | "assistant">()
        .utterance("system", () => "System initialized")
        .utterance("user", (data) => `User ${data.userId} in session ${data.sessionId}`)
        .toolCall("auth", '{"action": "validate"}', "auth-1")
        .toolCallResult("auth-1", "User authenticated")
        .utterance("assistant", () => "Ready to help!");

      const memory = Kanuni.buildMemory(builder, { sessionId: "sess-123", userId: 456 });

      expect(memory.contents).toHaveLength(5);
      expect(memory.contents[1]).toEqual({
        type: "utterance",
        role: "user",
        contents: "User 456 in session sess-123",
      });
      expect(memory.contents[2]).toEqual({
        type: "tool-call",
        toolName: "auth",
        arguments: '{"action": "validate"}',
        toolCallId: "auth-1",
      });
    });
  });
});