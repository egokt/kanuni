import { MemoryBuilderImpl } from "../../../../src/implementation/memory/index.js";

describe("MemoryBuilder implementation", () => {
  it("returns a memory object with correct type and contents for multiple messages", () => {
    const builder = new MemoryBuilderImpl<{ foo: string }, string, string>();
    builder
      .utterance("user", (d) => `User: ${d.foo}`)
      .utterance("assistant", (d) => `Assistant: ${d.foo}`);
    const result = builder.build({ foo: "bar" });
    expect(result).toEqual({
      type: "memory",
      contents: [
        { type: "utterance", role: "user", contents: "User: bar" },
        { type: "utterance", role: "assistant", contents: "Assistant: bar" },
      ],
    });
  });

  it("skips messages whose builder function returns undefined or null", () => {
    const builder = new MemoryBuilderImpl<{ show: boolean }, string, string>();
    builder
      .utterance("user", (d) => (d.show ? "Visible" : undefined))
      .utterance("assistant", () => null);
    const result = builder.build({ show: false });
    expect(result.contents.length).toBe(0);
  });

  it("handles empty memory (no messages added)", () => {
    const builder = new MemoryBuilderImpl<{}, string, string>();
    const result = builder.build({});
    expect(result).toEqual({ type: "memory", contents: [] });
  });

  it("preserves the order of messages", () => {
    const builder = new MemoryBuilderImpl<{}, string, string>();
    builder
      .utterance("user", () => "first")
      .utterance("assistant", () => "second")
      .utterance("user", () => "third");
    const result = builder.build({});
    expect(result.contents.map((c) => c.type === "utterance" ? c.contents : "")).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("supports custom roles", () => {
    type CustomRole = "system" | "bot";
    const builder = new MemoryBuilderImpl<{}, CustomRole, string>();
    builder
      .utterance("system", () => "System message")
      .utterance("bot", () => "Bot message");
    const result = builder.build({});
    const systemItem = result.contents[0];
    const botItem = result.contents[1];
    expect(systemItem.type).toBe("utterance");
    expect(botItem.type).toBe("utterance");
    if (systemItem.type === "utterance") {
      expect(systemItem.role).toBe("system");
    }
    if (botItem.type === "utterance") {
      expect(botItem.role).toBe("bot");
    }
  });

  it("passes the correct data to message builder functions", () => {
    const builder = new MemoryBuilderImpl<{ value: number }, string, string>();
    builder.utterance("user", (d) => `Value is ${d.value}`);
    const result = builder.build({ value: 42 });
    const firstItem = result.contents[0];
    expect(firstItem.type).toBe("utterance");
    if (firstItem.type === "utterance") {
      expect(firstItem.contents).toBe("Value is 42");
    }
  });

  it("handles messages with empty string (should include them)", () => {
    const builder = new MemoryBuilderImpl<{}, string, string>();
    builder.utterance("user", () => "");
    const result = builder.build({});
    // Should include empty string
    expect(result.contents.length).toBe(1);
    expect(result.contents[0]).toEqual({
      type: "utterance",
      role: "user",
      contents: "",
    });
  });

  it("handles mixed valid and skip (undefined/null) message outputs", () => {
    const builder = new MemoryBuilderImpl<{}, string, string>();
    builder
      .utterance("user", () => "valid")
      .utterance("assistant", () => undefined)
      .utterance("user", () => null)
      .utterance("assistant", () => "also valid");
    const result = builder.build({});
    expect(result.contents).toEqual([
      { type: "utterance", role: "user", contents: "valid" },
      { type: "utterance", role: "assistant", contents: "also valid" },
    ]);
  });

  describe("utterance with name parameter", () => {
    it("correctly handles utterance with name and message function", () => {
      const builder = new MemoryBuilderImpl<{ value: string }, string, string>();
      builder.utterance("user", "John", (d) => `Hello from ${d.value}`);
      const result = builder.build({ value: "test" });
      expect(result.contents).toEqual([
        {
          type: "utterance",
          role: "user",
          name: "John",
          contents: "Hello from test",
        },
      ]);
    });

    it("throws error when name is provided but message function is missing", () => {
      const builder = new MemoryBuilderImpl<{}, string, string>();
      expect(() => {
        builder.utterance("user", "John");
      }).toThrow("Message builder function must be provided when name is specified.");
    });

    it("does not include name field when only message function is provided", () => {
      const builder = new MemoryBuilderImpl<{}, string, string>();
      builder.utterance("user", () => "Hello");
      const result = builder.build({});
      expect(result.contents).toEqual([
        {
          type: "utterance",
          role: "user",
          contents: "Hello",
        },
      ]);
      expect(result.contents[0]).not.toHaveProperty("name");
    });

    it("handles multiple utterances with mixed named and unnamed messages", () => {
      const builder = new MemoryBuilderImpl<{ value: string }, string, string>();
      builder
        .utterance("user", "Alice", (d) => `Named: ${d.value}`)
        .utterance("assistant", (d) => `Unnamed: ${d.value}`)
        .utterance("user", "Bob", (d) => `Another named: ${d.value}`);
      const result = builder.build({ value: "test" });
      expect(result.contents).toEqual([
        { type: "utterance", role: "user", name: "Alice", contents: "Named: test" },
        { type: "utterance", role: "assistant", contents: "Unnamed: test" },
        { type: "utterance", role: "user", name: "Bob", contents: "Another named: test" },
      ]);
    });

    it("skips named utterances whose builder function returns undefined or null", () => {
      const builder = new MemoryBuilderImpl<{ show: boolean }, string, string>();
      builder
        .utterance("user", "Alice", (d) => (d.show ? "Visible" : undefined))
        .utterance("assistant", "Bot", () => null)
        .utterance("user", "Bob", () => "Always visible");
      const result = builder.build({ show: false });
      expect(result.contents).toEqual([
        { type: "utterance", role: "user", name: "Bob", contents: "Always visible" },
      ]);
    });

    it("handles empty string name", () => {
      const builder = new MemoryBuilderImpl<{}, string, string>();
      builder.utterance("user", "", () => "Hello");
      const result = builder.build({});
      expect(result.contents).toEqual([
        {
          type: "utterance",
          role: "user",
          contents: "Hello",
        },
      ]);
    });

    it("supports custom roles with names", () => {
      type CustomRole = "system" | "bot";
      const builder = new MemoryBuilderImpl<{}, CustomRole, string>();
      builder
        .utterance("system", "Config", () => "System configuration")
        .utterance("bot", "Assistant", () => "Bot response");
      const result = builder.build({});
      expect(result.contents).toEqual([
        { type: "utterance", role: "system", name: "Config", contents: "System configuration" },
        { type: "utterance", role: "bot", name: "Assistant", contents: "Bot response" },
      ]);
    });

    it("passes correct data to named message builder functions", () => {
      const builder = new MemoryBuilderImpl<{ count: number; prefix: string }, string, string>();
      builder.utterance("user", "Counter", (d) => `${d.prefix}: ${d.count}`);
      const result = builder.build({ count: 5, prefix: "Value" });
      expect(result.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        name: "Counter",
        contents: "Value: 5",
      });
    });

    it("preserves order of named and unnamed utterances", () => {
      const builder = new MemoryBuilderImpl<{}, string, string>();
      builder
        .utterance("user", "First", () => "1")
        .utterance("assistant", () => "2")
        .utterance("user", "Third", () => "3")
        .utterance("assistant", () => "4")
        .utterance("user", "Fifth", () => "5");
      const result = builder.build({});
      const expectedOrder = ["1", "2", "3", "4", "5"];
      expect(result.contents.map(c => c.type === "utterance" ? c.contents : "")).toEqual(expectedOrder);
      
      // Check specific names where expected
      const items = result.contents;
      expect(items[0].type).toBe("utterance");
      expect(items[1].type).toBe("utterance");
      expect(items[2].type).toBe("utterance");
      expect(items[3].type).toBe("utterance");
      expect(items[4].type).toBe("utterance");
      
      if (items[0].type === "utterance") expect(items[0].name).toBe("First");
      if (items[1].type === "utterance") expect(items[1]).not.toHaveProperty("name");
      if (items[2].type === "utterance") expect(items[2].name).toBe("Third");
      if (items[3].type === "utterance") expect(items[3]).not.toHaveProperty("name");
      if (items[4].type === "utterance") expect(items[4].name).toBe("Fifth");
    });
  });

  describe("toolCall method", () => {
    it("adds a tool call to the memory", () => {
      const builder = new MemoryBuilderImpl<{}, string, "testTool">();
      builder.toolCall("testTool", '{"param": "value"}', "call-123");
      const result = builder.build({});
      expect(result.contents).toEqual([
        {
          type: "tool-call",
          toolName: "testTool",
          arguments: '{"param": "value"}',
          toolCallId: "call-123",
        },
      ]);
    });

    it("handles multiple tool calls", () => {
      type ToolName = "tool1" | "tool2";
      const builder = new MemoryBuilderImpl<{}, string, ToolName>();
      builder
        .toolCall("tool1", '{"a": 1}', "call-1")
        .toolCall("tool2", '{"b": 2}', "call-2");
      const result = builder.build({});
      expect(result.contents).toEqual([
        {
          type: "tool-call",
          toolName: "tool1",
          arguments: '{"a": 1}',
          toolCallId: "call-1",
        },
        {
          type: "tool-call",
          toolName: "tool2",
          arguments: '{"b": 2}',
          toolCallId: "call-2",
        },
      ]);
    });

    it("handles empty arguments string", () => {
      const builder = new MemoryBuilderImpl<{}, string, "testTool">();
      builder.toolCall("testTool", "", "call-123");
      const result = builder.build({});
      const toolCall = result.contents[0];
      expect(toolCall.type).toBe("tool-call");
      if (toolCall.type === "tool-call") {
        expect(toolCall.arguments).toBe("");
      }
    });

    it("handles special characters in arguments and toolCallId", () => {
      const builder = new MemoryBuilderImpl<{}, string, "testTool">();
      const specialArgs = '{"emoji": "🚀", "unicode": "ñáéíóú", "symbols": "@#$%^&*()"}';
      const specialId = "call-with-special-chars-🔧-123";
      builder.toolCall("testTool", specialArgs, specialId);
      const result = builder.build({});
      expect(result.contents[0]).toEqual({
        type: "tool-call",
        toolName: "testTool",
        arguments: specialArgs,
        toolCallId: specialId,
      });
    });

    it("returns the builder instance for chaining", () => {
      const builder = new MemoryBuilderImpl<{}, string, "testTool">();
      const returnedBuilder = builder.toolCall("testTool", "{}", "call-123");
      expect(returnedBuilder).toBe(builder);
    });
  });

  describe("toolCallResult method", () => {
    it("adds a tool call result to the memory", () => {
      const builder = new MemoryBuilderImpl();
      builder.toolCallResult("call-123", "Success: operation completed");
      const result = builder.build({});
      expect(result.contents).toEqual([
        {
          type: "tool-call-result",
          toolCallId: "call-123",
          result: "Success: operation completed",
        },
      ]);
    });

    it("handles null result", () => {
      const builder = new MemoryBuilderImpl();
      builder.toolCallResult("call-123", null);
      const result = builder.build({});
      expect(result.contents).toEqual([
        {
          type: "tool-call-result",
          toolCallId: "call-123",
          result: null,
        },
      ]);
    });

    it("handles empty string result", () => {
      const builder = new MemoryBuilderImpl();
      builder.toolCallResult("call-123", "");
      const result = builder.build({});
      const toolCallResult = result.contents[0];
      expect(toolCallResult.type).toBe("tool-call-result");
      if (toolCallResult.type === "tool-call-result") {
        expect(toolCallResult.result).toBe("");
      }
    });

    it("handles multiple tool call results", () => {
      const builder = new MemoryBuilderImpl();
      builder
        .toolCallResult("call-1", "Result 1")
        .toolCallResult("call-2", "Result 2")
        .toolCallResult("call-3", null);
      const result = builder.build({});
      expect(result.contents).toEqual([
        { type: "tool-call-result", toolCallId: "call-1", result: "Result 1" },
        { type: "tool-call-result", toolCallId: "call-2", result: "Result 2" },
        { type: "tool-call-result", toolCallId: "call-3", result: null },
      ]);
    });

    it("returns the builder instance for chaining", () => {
      const builder = new MemoryBuilderImpl();
      const returnedBuilder = builder.toolCallResult("call-123", "result");
      expect(returnedBuilder).toBe(builder);
    });
  });

  describe("append method", () => {
    it("appends memory items to the builder", () => {
      const builder = new MemoryBuilderImpl<{}, "user" | "assistant", "testTool">();
      const memoryItems = [
        { type: "utterance" as const, role: "user" as const, contents: "Hello" },
        { type: "tool-call" as const, toolName: "testTool" as const, arguments: "{}", toolCallId: "call-1" },
        { type: "tool-call-result" as const, toolCallId: "call-1", result: "Done" },
      ];
      builder.append(memoryItems);
      const result = builder.build({});
      expect(result.contents).toEqual(memoryItems);
    });

    it("appends to existing builder content", () => {
      const builder = new MemoryBuilderImpl<{}, "user", "testTool">();
      builder.utterance("user", () => "First message");
      
      const appendItems = [
        { type: "utterance" as const, role: "user" as const, contents: "Appended message" },
        { type: "tool-call" as const, toolName: "testTool" as const, arguments: "{}", toolCallId: "call-1" },
      ];
      builder.append(appendItems);
      
      const result = builder.build({});
      expect(result.contents).toEqual([
        { type: "utterance", role: "user", contents: "First message" },
        { type: "utterance", role: "user", contents: "Appended message" },
        { type: "tool-call", toolName: "testTool", arguments: "{}", toolCallId: "call-1" },
      ]);
    });

    it("handles empty array", () => {
      const builder = new MemoryBuilderImpl();
      builder.utterance("user", () => "Existing message");
      builder.append([]);
      const result = builder.build({});
      expect(result.contents).toEqual([
        { type: "utterance", role: "user", contents: "Existing message" },
      ]);
    });

    it("appends memory items with names", () => {
      const builder = new MemoryBuilderImpl<{}, "user", string>();
      const memoryItems = [
        { type: "utterance" as const, role: "user" as const, name: "Alice", contents: "Hello from Alice" },
        { type: "utterance" as const, role: "user" as const, contents: "Anonymous message" },
      ];
      builder.append(memoryItems);
      const result = builder.build({});
      expect(result.contents).toEqual(memoryItems);
    });

    it("returns the builder instance for chaining", () => {
      const builder = new MemoryBuilderImpl();
      const returnedBuilder = builder.append([]);
      expect(returnedBuilder).toBe(builder);
    });
  });

  describe("complex scenarios and mixed content types", () => {
    it("handles complex conversation flow with all content types", () => {
      type Role = "user" | "assistant" | "system";
      type ToolName = "search" | "calculator";
      const builder = new MemoryBuilderImpl<{ userQuery: string; searchResult: string }, Role, ToolName>();
      
      builder
        .utterance("system", () => "You are a helpful assistant")
        .utterance("user", (d) => d.userQuery)
        .toolCall("search", '{"query": "weather"}', "search-1")
        .toolCallResult("search-1", "Sunny, 25°C")
        .utterance("assistant", (d) => `Based on the search: ${d.searchResult}`);
      
      const result = builder.build({ 
        userQuery: "What's the weather?", 
        searchResult: "Sunny, 25°C" 
      });
      
      expect(result.contents).toEqual([
        { type: "utterance", role: "system", contents: "You are a helpful assistant" },
        { type: "utterance", role: "user", contents: "What's the weather?" },
        { type: "tool-call", toolName: "search", arguments: '{"query": "weather"}', toolCallId: "search-1" },
        { type: "tool-call-result", toolCallId: "search-1", result: "Sunny, 25°C" },
        { type: "utterance", role: "assistant", contents: "Based on the search: Sunny, 25°C" },
      ]);
    });

    it("preserves order of mixed content types", () => {
      const builder = new MemoryBuilderImpl<{}, string, string>();
      builder
        .utterance("user", () => "1")
        .toolCall("tool", "{}", "call-1")
        .utterance("assistant", () => "2")
        .toolCallResult("call-1", "result")
        .utterance("user", () => "3");
      
      const result = builder.build({});
      const types = result.contents.map(item => item.type);
      expect(types).toEqual(["utterance", "tool-call", "utterance", "tool-call-result", "utterance"]);
    });

    it("handles skipped utterances mixed with tool calls", () => {
      const builder = new MemoryBuilderImpl<{ show: boolean }, string, string>();
      builder
        .utterance("user", (d) => d.show ? "Visible" : undefined)
        .toolCall("tool", "{}", "call-1")
        .utterance("assistant", () => null)
        .toolCallResult("call-1", "result")
        .utterance("user", () => "Always visible");
      
      const result = builder.build({ show: false });
      expect(result.contents).toEqual([
        { type: "tool-call", toolName: "tool", arguments: "{}", toolCallId: "call-1" },
        { type: "tool-call-result", toolCallId: "call-1", result: "result" },
        { type: "utterance", role: "user", contents: "Always visible" },
      ]);
    });

    it("handles appended items mixed with builder items", () => {
      const builder = new MemoryBuilderImpl<{}, "user", "tool">();
      builder.utterance("user", () => "Built message");
      
      const appendItems = [
        { type: "tool-call" as const, toolName: "tool" as const, arguments: "{}", toolCallId: "call-1" },
        { type: "utterance" as const, role: "user" as const, contents: "Appended message" },
      ];
      builder.append(appendItems);
      builder.utterance("user", () => "Another built message");
      
      const result = builder.build({});
      expect(result.contents).toEqual([
        { type: "utterance", role: "user", contents: "Built message" },
        { type: "tool-call", toolName: "tool", arguments: "{}", toolCallId: "call-1" },
        { type: "utterance", role: "user", contents: "Appended message" },
        { type: "utterance", role: "user", contents: "Another built message" },
      ]);
    });
  });

  describe("fluent API and chaining behavior", () => {
    it("allows chaining all methods", () => {
      const builder = new MemoryBuilderImpl<{}, "user", "tool">();
      const result = builder
        .utterance("user", () => "Hello")
        .toolCall("tool", "{}", "call-1")
        .toolCallResult("call-1", "result")
        .append([{ type: "utterance", role: "user", contents: "Appended" }])
        .utterance("user", () => "Final");
      
      expect(result).toBe(builder);
    });

    it("maintains builder state across method calls", () => {
      const builder = new MemoryBuilderImpl<{ value: string }, "user", "tool">();
      builder.utterance("user", (d) => `First: ${d.value}`);
      builder.toolCall("tool", "{}", "call-1");
      builder.utterance("user", (d) => `Second: ${d.value}`);
      
      const result = builder.build({ value: "test" });
      expect(result.contents.length).toBe(3);
      const firstItem = result.contents[0];
      const thirdItem = result.contents[2];
      expect(firstItem.type).toBe("utterance");
      expect(thirdItem.type).toBe("utterance");
      if (firstItem.type === "utterance") {
        expect(firstItem.contents).toBe("First: test");
      }
      if (thirdItem.type === "utterance") {
        expect(thirdItem.contents).toBe("Second: test");
      }
    });
  });

  describe("type safety and generics", () => {
    it("works with custom role types", () => {
      type CustomRole = "admin" | "moderator" | "guest";
      const builder = new MemoryBuilderImpl<{}, CustomRole, string>();
      builder
        .utterance("admin", () => "Admin message")
        .utterance("moderator", () => "Moderator message")
        .utterance("guest", () => "Guest message");
      
      const result = builder.build({});
      expect(result.contents.map(c => c.type === "utterance" ? c.role : null).filter(Boolean)).toEqual(["admin", "moderator", "guest"]);
    });

    it("works with custom tool name types", () => {
      type ToolName = "database" | "api" | "cache";
      const builder = new MemoryBuilderImpl<{}, string, ToolName>();
      builder
        .toolCall("database", '{"query": "SELECT *"}', "db-1")
        .toolCall("api", '{"endpoint": "/users"}', "api-1")
        .toolCall("cache", '{"key": "user:123"}', "cache-1");
      
      const result = builder.build({});
      const toolNames = result.contents.map(c => c.type === 'tool-call' ? c.toolName : null).filter(Boolean);
      expect(toolNames).toEqual(["database", "api", "cache"]);
    });

    it("works with complex parameter types", () => {
      interface ComplexParams {
        user: { id: number; name: string };
        config: { debug: boolean; version: string };
        data: string[];
      }
      
      const builder = new MemoryBuilderImpl<ComplexParams, string, string>();
      builder.utterance("user", (d) => `User ${d.user.name} (${d.user.id}) in ${d.config.version}`);
      
      const result = builder.build({
        user: { id: 123, name: "Alice" },
        config: { debug: true, version: "v1.0" },
        data: ["a", "b", "c"]
      });
      
      const firstItem = result.contents[0];
      expect(firstItem.type).toBe("utterance");
      if (firstItem.type === "utterance") {
        expect(firstItem.contents).toBe("User Alice (123) in v1.0");
      }
    });
  });

  describe("edge cases and error handling", () => {
    it("handles build method called multiple times with different data", () => {
      const builder = new MemoryBuilderImpl<{ value: string }, string, string>();
      builder.utterance("user", (d) => `Value: ${d.value}`);
      
      const result1 = builder.build({ value: "first" });
      const result2 = builder.build({ value: "second" });
      
      const item1 = result1.contents[0];
      const item2 = result2.contents[0];
      expect(item1.type).toBe("utterance");
      expect(item2.type).toBe("utterance");
      if (item1.type === "utterance") {
        expect(item1.contents).toBe("Value: first");
      }
      if (item2.type === "utterance") {
        expect(item2.contents).toBe("Value: second");
      }
      expect(result1).not.toBe(result2); // Should be different objects
    });

    it("handles build method with empty parameter object", () => {
      const builder = new MemoryBuilderImpl<{}, string, string>();
      builder.utterance("user", () => "No params needed");
      const result = builder.build({});
      const firstItem = result.contents[0];
      expect(firstItem.type).toBe("utterance");
      if (firstItem.type === "utterance") {
        expect(firstItem.contents).toBe("No params needed");
      }
    });

    it("shares references with appended memory items (expected behavior)", () => {
      const builder = new MemoryBuilderImpl<{}, "user", string>();
      const originalItems = [
        { type: "utterance" as const, role: "user" as const, contents: "Original" },
      ];
      
      builder.append(originalItems);
      const result = builder.build({});
      
      // Modify the original array - this affects the built memory due to shared references
      originalItems[0].contents = "Modified";
      
      // The builder memory reflects the change due to shared object references
      // This is expected behavior for performance reasons - appended items should not be modified
      const firstItem = result.contents[0];
      expect(firstItem.type).toBe("utterance");
      if (firstItem.type === "utterance") {
        expect(firstItem.contents).toBe("Modified");
      }
    });
  });
});
