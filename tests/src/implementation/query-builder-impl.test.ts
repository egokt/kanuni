import { QueryBuilderImpl } from "../../../src/implementation/query-builder-impl.js";
import { RoleDefault, Tool, ToolRegistry, Memory } from "../../../src/developer-api/index.js";
import { MemoryBuilderImpl } from "../../../src/implementation/memory/index.js";
import { z } from "zod";

// Test types
type TestTool = Tool<"test_tool", { param: string }>;
type TestTools = Tool<"tool1", { a: string }> | Tool<"tool2", { b: number }>;

describe("QueryBuilderImpl", () => {
  it("returns correct prompt contents when only prompt is set", () => {
    const builder = new QueryBuilderImpl<{ foo: string }, RoleDefault, never>();
    builder.prompt((p) => p.paragraph`Prompt: ${"foo"}`);
    const result = builder.build({ foo: "bar" });
    expect(result).toEqual({
      prompt: {
        type: "prompt",
        contents: [
          expect.objectContaining({
            type: "paragraph",
            content: "Prompt: bar",
          }),
        ],
      },
      output: { type: 'output-text' as const },
    });
  });

  it("returns correct prompt and memory when both prompt and memory are set", () => {
    const builder = new QueryBuilderImpl<{ foo: string }, RoleDefault, never>();
    builder.prompt((p) => p.paragraph`Prompt: ${"foo"}`);
    builder.memory((m) => m.utterance("user", (d) => `${d.foo}`));
    const result = builder.build({ foo: "bar" });
    expect(result).toEqual({
      prompt: {
        type: "prompt",
        contents: [
          expect.objectContaining({
            type: "paragraph",
            content: "Prompt: bar",
          }),
        ],
      },
      memory: {
        type: 'memory',
        contents: [
          {
            type: 'utterance',
            role: 'user',
            contents: 'bar',
          },
        ],
      },
      output: { type: 'output-text' as const },
    });
  });

  it("returns empty contents if neither prompt nor memory is set", () => {
    const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
    const result = builder.build({});
    expect(result).toEqual({
      prompt: {
        type: "prompt",
        contents: [],
      },
      output: { type: 'output-text' as const },
    });
  });

  it("uses data parameter correctly in prompt", () => {
    const builder = new QueryBuilderImpl<{ name: string }, RoleDefault, never>();
    builder.prompt((p) => p.paragraph`Hello, ${"name"}`);
    const result = builder.build({ name: "Alice" });
    expect(result.prompt.contents[0]).toEqual(
      expect.objectContaining({ type: "paragraph", content: "Hello, Alice" }),
    );
  });

  it("handles memory builder returning undefined", () => {
    const builder = new QueryBuilderImpl<{ foo: string }, RoleDefault, never>();
    builder.memory((_) => undefined);
    builder.prompt((p) => p.paragraph`Prompt: ${"foo"}`);
    const result = builder.build({ foo: "bar" });
    expect(result.prompt.contents[0]).toEqual(
      expect.objectContaining({ type: "paragraph", content: "Prompt: bar" }),
    );
  });

  it("handles prompt builder returning undefined", () => {
    const builder = new QueryBuilderImpl<{ foo: string }, RoleDefault, never>();
    builder.prompt((_) => undefined);
    const result = builder.build({ foo: "bar" });
    expect(result.prompt.contents).toEqual([]);
  });

  it("is chainable and builds correctly", () => {
    const builder = new QueryBuilderImpl<{ foo: string }, RoleDefault, never>()
      .prompt((p) => p.paragraph`Chainable: ${"foo"}`)
      .memory((m) => m.utterance("assistant", (d) => `Assistant: ${d.foo}`));
    const result = builder.build({ foo: "bar" });
    expect(result.prompt.contents[0]).toEqual(
      expect.objectContaining({ type: "paragraph", content: "Chainable: bar" }),
    );
  });

  describe("JSON Output", () => {
    it("switches to JSON output correctly", () => {
      const builder = new QueryBuilderImpl<{ title: string }, RoleDefault, never>();
      const jsonBuilder = builder.outputJson(z.object({
        result: z.string(),
      }));
      
      jsonBuilder.prompt((p) => p.paragraph`Generate for: ${"title"}`);
      const result = jsonBuilder.build({ title: "test" });
      
      expect(result.output).toEqual({
        type: "output-json",
        schemaName: "response_schema",
        schema: expect.any(Object),
      });
      expect(result.prompt.contents[0]).toEqual(
        expect.objectContaining({ type: "paragraph", content: "Generate for: test" }),
      );
    });

    it("uses custom schema name when provided", () => {
      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      const jsonBuilder = builder.outputJson(
        z.object({ data: z.string() }),
        "custom_schema"
      );
      
      const result = jsonBuilder.build({});
      
      expect(result.output.schemaName).toBe("custom_schema");
    });

    it("can switch back to text output from JSON", () => {
      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      const jsonBuilder = builder.outputJson(z.object({ result: z.string() }));
      const textBuilder = jsonBuilder.outputText();
      
      textBuilder.prompt((p) => p.paragraph`Text output`);
      const result = textBuilder.build({});
      
      expect(result.output).toEqual({ type: "output-text" });
    });

    it("supports method chaining with JSON output", () => {
      const result = new QueryBuilderImpl<{ name: string }, RoleDefault, never>()
        .prompt((p) => p.paragraph`Hello, ${"name"}`)
        .outputJson(z.object({ greeting: z.string() }))
        .memory((m) => m.utterance("user", () => "Hi"))
        .build({ name: "World" });

      expect(result.output.type).toBe("output-json");
      expect(result.memory).toBeDefined();
      expect(result.prompt.contents[0]).toEqual(
        expect.objectContaining({ type: "paragraph", content: "Hello, World" }),
      );
    });
  });

  describe("Tools", () => {
    it("includes tools in query when provided", () => {
      const tools: ToolRegistry<TestTool> = {
        test_tool: {
          name: "test_tool",
          description: "A test tool",
          parameters: z.object({ param: z.string() }),
        },
      };

      const builder = new QueryBuilderImpl<{}, RoleDefault, TestTool>();
      builder.tools(tools);
      const result = builder.build({});

      expect(result.tools).toEqual(tools);
    });

    it("works with multiple tools", () => {
      const tools: ToolRegistry<TestTools> = {
        tool1: {
          name: "tool1",
          description: "First tool",
          parameters: z.object({ a: z.string() }),
        },
        tool2: {
          name: "tool2", 
          description: "Second tool",
          parameters: z.object({ b: z.number() }),
        },
      };

      const builder = new QueryBuilderImpl<{}, RoleDefault, TestTools>();
      builder.tools(tools);
      const result = builder.build({});

      expect(result.tools).toEqual(tools);
    });

    it("can be chained with other methods", () => {
      const tools: ToolRegistry<TestTool> = {
        test_tool: {
          name: "test_tool",
          description: "A test tool",
          parameters: z.object({ param: z.string() }),
        },
      };

      const result = new QueryBuilderImpl<{ msg: string }, RoleDefault, TestTool>()
        .prompt((p) => p.paragraph`Message: ${"msg"}`)
        .tools(tools)
        .memory((m) => m.utterance("user", () => "test"))
        .build({ msg: "hello" });

      expect(result.tools).toEqual(tools);
      expect(result.memory).toBeDefined();
      expect(result.prompt.contents[0]).toEqual(
        expect.objectContaining({ type: "paragraph", content: "Message: hello" }),
      );
    });
  });

  describe("Memory", () => {
    it("supports tool calls in memory", () => {
      const builder = new QueryBuilderImpl<{}, RoleDefault, TestTool>();
      builder.memory((m) => 
        m.utterance("user", () => "Use the tool")
         .toolCall("test_tool", '{"param": "value"}', "call-123")
         .toolCallResult("call-123", "Tool executed successfully")
      );

      const result = builder.build({});

      expect(result.memory?.contents).toEqual([
        {
          type: "utterance",
          role: "user",
          contents: "Use the tool",
        },
        {
          type: "tool-call",
          toolName: "test_tool", 
          arguments: '{"param": "value"}',
          toolCallId: "call-123",
        },
        {
          type: "tool-call-result",
          toolCallId: "call-123",
          result: "Tool executed successfully",
        },
      ]);
    });

    it("supports utterances with names", () => {
      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      builder.memory((m) => 
        m.utterance("assistant", "AI Assistant", () => "Hello!")
      );

      const result = builder.build({});

      expect(result.memory?.contents).toEqual([
        {
          type: "utterance",
          role: "assistant",
          name: "AI Assistant",
          contents: "Hello!",
        },
      ]);
    });

    it("can use MemoryBuilder instance directly", () => {
      const memoryBuilder = new MemoryBuilderImpl<{}, RoleDefault, never>();
      memoryBuilder.utterance("user", () => "Direct builder test");

      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      builder.memory(memoryBuilder);

      const result = builder.build({});

      expect(result.memory?.contents).toEqual([
        {
          type: "utterance",
          role: "user",
          contents: "Direct builder test",
        },
      ]);
    });

    it("handles memory builder function returning null", () => {
      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      builder.memory(() => null);

      const result = builder.build({});

      expect(result.memory).toBeUndefined();
    });

    it("supports appending existing memory items", () => {
      const existingMemory: Memory<RoleDefault, never> = {
        type: "memory",
        contents: [
          {
            type: "utterance",
            role: "user",
            contents: "Previous message",
          },
        ],
      };

      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      builder.memory((m) => 
        m.append(existingMemory.contents)
         .utterance("assistant", () => "New message")
      );

      const result = builder.build({});

      expect(result.memory?.contents).toEqual([
        {
          type: "utterance",
          role: "user",
          contents: "Previous message",
        },
        {
          type: "utterance",
          role: "assistant",
          contents: "New message",
        },
      ]);
    });
  });

  describe("Complex Prompt Content", () => {
    it("supports lists in prompts", () => {
      const builder = new QueryBuilderImpl<{ items: string[] }, RoleDefault, never>();
      builder.prompt((p) => 
        p.paragraph`Items:`
         .list((l) => l.item`First item`.item`Second item`)
      );

      const result = builder.build({ items: ["item1", "item2"] });

      expect(result.prompt.contents).toHaveLength(2);
      expect(result.prompt.contents[0]).toEqual(
        expect.objectContaining({ type: "paragraph", content: "Items:" })
      );
      expect(result.prompt.contents[1]).toEqual(
        expect.objectContaining({ type: "list" })
      );
    });

    it("supports tables in prompts", () => {
      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      builder.prompt((p) => 
        p.table((t) => 
          t.columnHeaders(() => ["Name", "Value"])
           .row((r) => 
             r.cell((c) => c.paragraph`Test`)
              .cell((c) => c.paragraph`123`)
           )
        )
      );

      const result = builder.build({});

      expect(result.prompt.contents).toHaveLength(1);
      expect(result.prompt.contents[0]).toEqual(
        expect.objectContaining({ type: "table" })
      );
    });

    it("supports sections in prompts", () => {
      const builder = new QueryBuilderImpl<{ title: string }, RoleDefault, never>();
      builder.prompt((p) => 
        p.section((s) => 
          s.heading`Section: ${"title"}`
           .paragraph`Content here`
        )
      );

      const result = builder.build({ title: "Test Section" });

      expect(result.prompt.contents).toHaveLength(1);
      expect(result.prompt.contents[0]).toEqual(
        expect.objectContaining({ 
          type: "section",
          heading: "Section: Test Section"
        })
      );
    });
  });

  describe("Edge Cases", () => {
    it("handles prompt builder returning undefined", () => {
      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      builder.prompt((_p) => undefined);

      const result = builder.build({});

      expect(result.prompt.contents).toEqual([]);
    });

    it("handles memory builder returning undefined from function", () => {
      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      builder.memory((_m) => undefined);

      const result = builder.build({});

      expect(result.memory).toBeUndefined();
    });

    it("builds query with all components", () => {
      const tools: ToolRegistry<TestTool> = {
        test_tool: {
          name: "test_tool",
          description: "A test tool",
          parameters: z.object({ param: z.string() }),
        },
      };

      const result = new QueryBuilderImpl<{ name: string }, RoleDefault, TestTool>()
        .prompt((p) => p.paragraph`Hello, ${"name"}`)
        .memory((m) => m.utterance("user", () => "Hi there"))
        .tools(tools)
        .outputJson(z.object({ response: z.string() }))
        .build({ name: "World" });

      expect(result.prompt).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(result.tools).toBeDefined();
      expect(result.output.type).toBe("output-json");
    });

    it("outputText method returns same instance for TextReturningQueryBuilder", () => {
      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      const textBuilder = builder.outputText();
      
      expect(textBuilder).toBe(builder);
    });

    it("handles non-MemoryBuilderImpl memory builders - potential bug", () => {
      // This test exposes a potential type safety issue in the implementation
      const mockMemoryBuilder = {
        utterance: jest.fn().mockReturnThis(),
        toolCall: jest.fn().mockReturnThis(), 
        toolCallResult: jest.fn().mockReturnThis(),
        append: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({
          type: "memory",
          contents: [{ type: "utterance", role: "user", contents: "test" }]
        })
      };

      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      
      // This should work according to the interface but might fail due to the unsafe cast
      // @ts-ignore - We're testing runtime behavior that might not match the type system
      builder.memory(mockMemoryBuilder);
      
      const result = builder.build({});
      
      // If the implementation works correctly, this should pass
      expect(result.memory).toBeDefined();
      expect(mockMemoryBuilder.build).toHaveBeenCalled();
    });

    it("maintains data when switching between output types multiple times", () => {
      const builder = new QueryBuilderImpl<{ msg: string }, RoleDefault, never>();
      
      const textBuilder = builder
        .prompt((p) => p.paragraph`Message: ${"msg"}`)
        .memory((m) => m.utterance("user", (d) => d.msg));
      
      const jsonBuilder = textBuilder.outputJson(z.object({ result: z.string() }));
      const backToTextBuilder = jsonBuilder.outputText();
      
      const result = backToTextBuilder.build({ msg: "test" });
      
      expect(result.output.type).toBe("output-text");
      expect(result.prompt.contents[0]).toEqual(
        expect.objectContaining({ type: "paragraph", content: "Message: test" })
      );
      expect(result.memory?.contents[0]).toEqual(
        expect.objectContaining({ type: "utterance", role: "user", contents: "test" })
      );
    });

    it("works correctly with empty data object", () => {
      const builder = new QueryBuilderImpl<{}, RoleDefault, never>();
      builder.prompt((p) => p.paragraph`Static content`);
      
      const result = builder.build({});
      
      expect(result.prompt.contents[0]).toEqual(
        expect.objectContaining({ type: "paragraph", content: "Static content" })
      );
    });

    it("handles complex data object with nested properties", () => {
      interface ComplexData {
        user: {
          name: string;
          id: number;
        };
        settings: {
          theme: string;
        };
      }
      
      const builder = new QueryBuilderImpl<ComplexData, RoleDefault, never>();
      builder
        .prompt((p) => p.paragraph`User: ${"user"} with theme: ${"settings"}`)
        .memory((m) => m.utterance("user", (d) => `Hello, I'm ${d.user.name}`));
      
      const result = builder.build({
        user: { name: "Alice", id: 123 },
        settings: { theme: "dark" }
      });
      
      // Note: This test may reveal how the template string interpolation works with complex objects
      expect(result.prompt.contents[0]).toEqual(
        expect.objectContaining({ type: "paragraph" })
      );
      expect(result.memory?.contents[0]).toEqual(
        expect.objectContaining({ 
          type: "utterance", 
          role: "user", 
          contents: "Hello, I'm Alice" 
        })
      );
    });
  });
});
