import { TextualMarkdownFormatter } from "../../../../src/implementation/formatters/textual-markdown-formatter.js";
import {
  Paragraph,
  List,
  Section,
  Table,
  TableHeaderCell,
  TableRow,
  TableCell,
  Memory,
  Prompt,
  Query,
  Tool,
  ToolRegistry,
  JsonOutput,
  TextOutput,
  RoleDefault,
} from "../../../../src/developer-api/index.js";
import { z } from "zod";

// Helper types for tests
type TestTool = Tool<"test_tool", { param: string }>;
type TestQuery = Query<string, RoleDefault, TestTool>;
type TestMemory = Memory<RoleDefault, "test_tool">;

describe("TextualMarkdownFormatter.format", () => {
  it("formats a prompt with a single paragraph", () => {
    const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
    const query: TestQuery = {
      prompt: {
        type: "prompt",
        contents: [{ type: "paragraph", content: "Hello world" } as Paragraph],
      } as Prompt,
      output: { type: "output-text" } as TextOutput,
    };
    expect(formatter.format(query)).toBe("Hello world");
  });

  it("formats a prompt with multiple paragraphs", () => {
    const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
    const query: TestQuery = {
      prompt: {
        type: "prompt",
        contents: [
          { type: "paragraph", content: "First" },
          { type: "paragraph", content: "Second" },
        ],
      },
      output: { type: "output-text" } as TextOutput,
    };
    expect(formatter.format(query)).toBe("First\n\nSecond");
  });

  it("formats a prompt with a list including nested lists", () => {
    const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
    const query: TestQuery = {
      prompt: {
        type: "prompt",
        contents: [
          {
            type: "list",
            items: [
              { content: { type: "paragraph", content: "Item 1" } },
              {
                content: {
                  type: "list",
                  items: [
                    { content: { type: "paragraph", content: "Subitem 1" } },
                  ],
                },
              },
            ],
          } as List,
        ],
      },
      output: { type: "output-text" } as TextOutput,
    };
    expect(formatter.format(query)).toContain("- Item 1");
    expect(formatter.format(query)).toContain("-   - Subitem 1");
  });

  it("formats a prompt with a section with heading and contents", () => {
    const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
    const query: TestQuery = {
      prompt: {
        type: "prompt",
        contents: [
          {
            type: "section",
            heading: "Section Heading",
            contents: [{ type: "paragraph", content: "Section content" }],
          } as Section,
        ],
      },
      output: { type: "output-text" } as TextOutput,
    };
    expect(formatter.format(query)).toContain("# Section Heading");
    expect(formatter.format(query)).toContain("Section content");
  });

  it("formats a prompt with a table with headers and rows", () => {
    const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
    const query: TestQuery = {
      prompt: {
        type: "prompt",
        contents: [
          {
            type: "table",
            columnHeaders: [
              {
                contents: { type: "paragraph", content: "Header 1" },
                type: "table-header-cell",
              } as TableHeaderCell,
              {
                contents: { type: "paragraph", content: "Header 2" },
                type: "table-header-cell",
              } as TableHeaderCell,
            ],
            rows: [
              {
                cells: [
                  {
                    contents: [{ type: "paragraph", content: "Cell 1" }],
                    type: "table-cell",
                  } as TableCell,
                  {
                    contents: [{ type: "paragraph", content: "Cell 2" }],
                    type: "table-cell",
                  } as TableCell,
                ],
                type: "table-row",
              } as TableRow,
            ],
          } as Table,
        ],
      },
      output: { type: "output-text" } as TextOutput,
    };
    const output = formatter.format(query);
    expect(output).toContain("<table>");
    expect(output).toContain("<cell columnHeader>\nHeader 1\n</cell>");
    expect(output).toContain("<cell>\nCell 1\n</cell>");
  });

  it("formats a section containing memory", () => {
    const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
    const memory: TestMemory = {
      type: "memory",
      contents: [
        { type: "utterance", role: "user", contents: "User message" },
        { type: "utterance", role: "assistant", contents: "Assistant message" },
      ],
    };
    const query: TestQuery = {
      prompt: {
        type: "prompt",
        contents: [
          {
            type: "section",
            heading: "Chat",
            contents: [],
            isMemorySection: true,
          } as Section,
        ],
      },
      memory,
      output: { type: "output-text" } as TextOutput,
    };
    const output = formatter.format(query);
    expect(output).toContain("History:");
    expect(output).toContain("<user>\nUser message\n</user>");
    expect(output).toContain("<assistant>\nAssistant message\n</assistant>");
  });

  it("handles custom configuration (indentation, list prefix, memory intro text)", () => {
    const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
      indentationString: "--",
      unnumberedListItemPrefix: "* ",
      memoryIntroductionText: "Custom Memory: ",
    });
    const memory: TestMemory = {
      type: "memory",
      contents: [{ type: "utterance", role: "user", contents: "Msg" }],
    };
    const query: TestQuery = {
      prompt: {
        type: "prompt",
        contents: [
          {
            type: "list",
            items: [{ content: { type: "paragraph", content: "Item" } }],
          },
          {
            type: "section",
            heading: "Mem",
            contents: [],
            isMemorySection: true,
          },
        ],
      },
      memory,
      output: { type: "output-text" } as TextOutput,
    };
    const output = formatter.format(query);
    expect(output).toContain("* Item");
    expect(output).toContain("Custom Memory:");
  });

  it("throws on unknown content type", () => {
    const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
    const query: TestQuery = {
      prompt: {
        type: "prompt",
        contents: [{ type: "unknownType" } as any],
      },
      output: { type: "output-text" } as TextOutput,
    };
    expect(() => formatter.format(query)).toThrow(
      "Unknown content type: unknownType",
    );
  });

  it("handles empty prompt contents", () => {
    const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
    const query: TestQuery = {
      prompt: {
        type: "prompt",
        contents: [],
      },
      output: { type: "output-text" } as TextOutput,
    };
    expect(formatter.format(query)).toBe("");
  });

  it("handles deeply nested sections and lists", () => {
    const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
    const query: TestQuery = {
      prompt: {
        type: "prompt",
        contents: [
          {
            type: "section",
            heading: "Top",
            contents: [
              {
                type: "section",
                heading: "Sub",
                contents: [
                  {
                    type: "list",
                    items: [
                      { content: { type: "paragraph", content: "Deep item" } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      output: { type: "output-text" } as TextOutput,
    };
    const output = formatter.format(query);
    expect(output).toContain("# Top");
    expect(output).toContain("## Sub");
    expect(output).toContain("- Deep item");
  });

  describe("memory exclusion", () => {
    it("excludes memory when excludes.memory is set to true", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        excludes: { memory: true },
      });
      const memory: TestMemory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "User message" },
          { type: "utterance", role: "assistant", contents: "Assistant message" },
        ],
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Chat",
              contents: [
                { type: "paragraph", content: "Regular content" }
              ],
              isMemorySection: true,
            } as Section,
          ],
        },
        memory,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).not.toContain("History:");
      expect(output).not.toContain("<user>");
      expect(output).not.toContain("<assistant>");
      expect(output).not.toContain("User message");
      expect(output).not.toContain("Assistant message");
    });

    it("excludes entire section when it only contains memory", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        excludes: { memory: true },
      });
      const memory: TestMemory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "User message" },
        ],
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Memory Only Section",
              contents: [],
              isMemorySection: true,
            } as Section,
          ],
        },
        memory,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toBe("");
    });

    it("excludes entire section when it contains memory (including its content)", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        excludes: { memory: true },
      });
      const memory: TestMemory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "User message" },
        ],
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Mixed Section",
              contents: [
                { type: "paragraph", content: "This should be excluded too" },
                { type: "paragraph", content: "This too" },
              ],
              isMemorySection: true,
            } as Section,
          ],
        },
        memory,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toBe(""); // Entire section is excluded when it has memory
      expect(output).not.toContain("Mixed Section");
      expect(output).not.toContain("This should be excluded too");
      expect(output).not.toContain("History:");
      expect(output).not.toContain("User message");
    });

    it("includes memory when excludes.memory is false (default behavior)", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        excludes: { memory: false },
      });
      const memory: TestMemory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "User message" },
        ],
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Chat",
              contents: [
                { type: "paragraph", content: "Regular content" }
              ],
              isMemorySection: true,
            } as Section,
          ],
        },
        memory,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("# Chat");
      expect(output).toContain("Regular content");
      expect(output).toContain("History:");
      expect(output).toContain("User message");
    });

    it("includes sections without memory when excludes.memory is true", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        excludes: { memory: true },
      });
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "No Memory Section",
              contents: [
                { type: "paragraph", content: "This should be included" },
                { type: "paragraph", content: "This too" },
              ],
            } as Section,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("# No Memory Section");
      expect(output).toContain("This should be included");
      expect(output).toContain("This too");
    });

    it("handles mixed prompt contents with memory exclusion", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        excludes: { memory: true },
      });
      const memory: TestMemory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "Memory content" },
        ],
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            { type: "paragraph", content: "Top level paragraph" },
            {
              type: "section",
              heading: "Section with Memory",
              contents: [
                { type: "paragraph", content: "This will be excluded" }
              ],
              isMemorySection: true,
            } as Section,
            {
              type: "list",
              items: [
                { content: { type: "paragraph", content: "List item" } }
              ],
            } as List,
            {
              type: "section",
              heading: "Section without Memory",
              contents: [
                { type: "paragraph", content: "This will be included" }
              ],
            } as Section,
          ],
        },
        memory,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("Top level paragraph");
      expect(output).not.toContain("Section with Memory");
      expect(output).not.toContain("This will be excluded");
      expect(output).toContain("- List item");
      expect(output).toContain("# Section without Memory");
      expect(output).toContain("This will be included");
      expect(output).not.toContain("Memory content");
    });
  });

  describe("tool sections", () => {
    it("formats tools section with tool definitions", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const tools: ToolRegistry<TestTool> = {
        test_tool: {
          name: "test_tool",
          description: "A test tool for testing",
          parameters: z.object({ param: z.string() }),
        },
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Available Tools",
              contents: [
                { type: "paragraph", content: "Here are the tools:" }
              ],
              isToolsSection: true,
            } as Section,
          ],
        },
        tools,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("# Available Tools");
      expect(output).toContain("Here are the tools:");
      expect(output).toContain("Tools available:");
      expect(output).toContain("test_tool");
      expect(output).toContain("A test tool for testing");
    });

    it("excludes tools when excludes.tools is set to true", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        excludes: { tools: true },
      });
      const tools: ToolRegistry<TestTool> = {
        test_tool: {
          name: "test_tool",
          description: "A test tool for testing",
          parameters: z.object({ param: z.string() }),
        },
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Tools Section",
              contents: [
                { type: "paragraph", content: "Should be excluded" }
              ],
              isToolsSection: true,
            } as Section,
          ],
        },
        tools,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toBe("");
      expect(output).not.toContain("Tools Section");
      expect(output).not.toContain("Should be excluded");
      expect(output).not.toContain("Tools available:");
    });

    it("handles empty tools section gracefully", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Empty Tools",
              contents: [],
              isToolsSection: true,
            } as Section,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toBe(""); // No tools, so section should be empty
    });

    it("customizes tools introduction text", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        toolsIntroductionText: "Custom Tools:",
      });
      const tools: ToolRegistry<TestTool> = {
        test_tool: {
          name: "test_tool",
          description: "A test tool",
          parameters: z.object({ param: z.string() }),
        },
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Tools",
              contents: [],
              isToolsSection: true,
            } as Section,
          ],
        },
        tools,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("Custom Tools:");
      expect(output).not.toContain("Tools available:");
    });
  });

  describe("output specs sections", () => {
    it("formats JSON output specs section", () => {
      const formatter = new TextualMarkdownFormatter<{ result: string }, RoleDefault, TestTool>();
      const outputSpec: JsonOutput<{ result: string }> = {
        type: "output-json",
        schemaName: "TestOutput",
        schema: z.object({ result: z.string() }),
      };
      const query: Query<{ result: string }, RoleDefault, TestTool> = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Response Format",
              contents: [
                { type: "paragraph", content: "Please respond in this format:" }
              ],
              isOutputSpecsSection: true,
            } as Section,
          ],
        },
        output: outputSpec,
      };
      const output = formatter.format(query);
      expect(output).toContain("# Response Format");
      expect(output).toContain("Please respond in this format:");
      expect(output).toContain("JSON schema for response:");
      // The output should contain the JSON schema as a serialized object
      expect(output).toContain("TestOutput");
      expect(output).toContain('"type"'); // Basic schema property
    });

    it("formats text output specs section", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        outputTextIntroductionText: "Respond with plain text",
      });
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Text Response",
              contents: [
                { type: "paragraph", content: "Instructions for text response" }
              ],
              isOutputSpecsSection: true,
            } as Section,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("# Text Response");
      expect(output).toContain("Instructions for text response");
      expect(output).toContain("Respond with plain text");
    });

    it("excludes output specs when excludes.outputSpecs is set to true", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        excludes: { outputSpecs: true },
      });
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Output Section",
              contents: [
                { type: "paragraph", content: "Should be excluded" }
              ],
              isOutputSpecsSection: true,
            } as Section,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toBe("");
    });
  });

  describe("memory formatting", () => {
    it("formats different memory item types", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const memory: TestMemory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "User message" },
          { type: "utterance", role: "assistant", contents: "Assistant response" },
          { 
            type: "tool-call", 
            toolName: "test_tool", 
            toolCallId: "call_123", 
            arguments: '{"param": "value"}' 
          },
          { 
            type: "tool-call-result", 
            toolCallId: "call_123", 
            result: "Tool result" 
          },
        ],
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Chat History",
              contents: [],
              isMemorySection: true,
            } as Section,
          ],
        },
        memory,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      
      expect(output).toContain("<user>\nUser message\n</user>");
      expect(output).toContain("<assistant>\nAssistant response\n</assistant>");
      expect(output).toContain("<tool_call>");
      expect(output).toContain('"toolName": "test_tool"');
      expect(output).toContain('"toolCallId": "call_123"');
      expect(output).toContain("<tool_coll_result>");
      expect(output).toContain('"result": "Tool result"');
    });

    it("handles roles with spaces and special characters", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, "user" | "ai assistant", never>();
      const memory: Memory<"user" | "ai assistant", never> = {
        type: "memory",
        contents: [
          { type: "utterance", role: "ai assistant", contents: "AI response" },
        ],
      };
      const query: Query<string, "user" | "ai assistant", never> = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Chat",
              contents: [],
              isMemorySection: true,
            } as Section,
          ],
        },
        memory,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("<ai_assistant>\nAI response\n</ai_assistant>");
    });

    it("handles empty memory introduction text", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        memoryIntroductionText: "",
      });
      const memory: TestMemory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "Test message" },
        ],
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Chat",
              contents: [],
              isMemorySection: true,
            } as Section,
          ],
        },
        memory,
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).not.toContain("History:");
      expect(output).toContain("<user>\nTest message\n</user>");
    });
  });

  describe("table formatting", () => {
    it("formats table without column headers", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "table",
              rows: [
                {
                  type: "table-row",
                  cells: [
                    {
                      type: "table-cell",
                      contents: [{ type: "paragraph", content: "Cell A" }],
                    } as TableCell,
                  ],
                } as TableRow,
              ],
            } as Table,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("<table>");
      expect(output).toContain("<cell>\nCell A\n</cell>");
      expect(output).toContain("</table>");
    });

    it("formats table with row headers", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "table",
              rows: [
                {
                  type: "table-row",
                  rowHeader: {
                    type: "table-header-cell",
                    contents: { type: "paragraph", content: "Row 1" },
                  } as TableHeaderCell,
                  cells: [
                    {
                      type: "table-cell",
                      contents: [{ type: "paragraph", content: "Data 1" }],
                    } as TableCell,
                  ],
                } as TableRow,
              ],
            } as Table,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("<cell rowHeader>\nRow 1\n</cell>");
      expect(output).toContain("<cell>\nData 1\n</cell>");
    });

    it("formats nested content in table cells", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "table",
              rows: [
                {
                  type: "table-row",
                  cells: [
                    {
                      type: "table-cell",
                      contents: [
                        { type: "paragraph", content: "Paragraph in cell" },
                        {
                          type: "list",
                          items: [
                            { content: { type: "paragraph", content: "List item in cell" } }
                          ],
                        } as List,
                      ],
                    } as TableCell,
                  ],
                } as TableRow,
              ],
            } as Table,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("Paragraph in cell");
      expect(output).toContain("- List item in cell");
    });
  });

  describe("list formatting", () => {
    it("handles deeply nested lists with custom indentation", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>({
        indentationString: "    ", // 4 spaces
        unnumberedListItemPrefix: "• ",
      });
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "list",
              items: [
                { content: { type: "paragraph", content: "Level 1" } },
                {
                  content: {
                    type: "list",
                    items: [
                      { content: { type: "paragraph", content: "Level 2" } },
                      {
                        content: {
                          type: "list",
                          items: [
                            { content: { type: "paragraph", content: "Level 3" } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            } as List,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toContain("• Level 1");
      expect(output).toContain("•     • Level 2"); // Check actual indentation pattern
      expect(output).toContain("•         • Level 3");
    });

    it("throws error for unknown list item content type", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "list",
              items: [
                { content: { type: "unknown" } as any },
              ],
            } as List,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      expect(() => formatter.format(query)).toThrow("Unknown list item content type: unknown");
    });
  });

  describe("section formatting", () => {
    it("formats section without heading", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              contents: [
                { type: "paragraph", content: "Content without heading" }
              ],
            } as Section,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toBe("Content without heading");
      expect(output).not.toContain("#");
    });

    it("handles empty section contents", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Empty Section",
              contents: [],
            } as Section,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toBe("# Empty Section\n\n"); // Include the actual newlines that are added
    });

    it("throws error for subsections in memory sections", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const memory: TestMemory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "Test" },
        ],
      };
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Memory Section",
              contents: [
                {
                  type: "section", // This should cause an error
                  heading: "Nested",
                  contents: [],
                } as Section,
              ],
              isMemorySection: true,
            } as Section,
          ],
        },
        memory,
        output: { type: "output-text" } as TextOutput,
      };
      expect(() => formatter.format(query)).toThrow("Subsections are not allowed in memory sections.");
    });
  });

  describe("error handling", () => {
    it("throws error for unknown section content type", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Test",
              contents: [
                { type: "unknown" } as any,
              ],
            } as Section,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      expect(() => formatter.format(query)).toThrow("Unknown section content type: unknown");
    });

    it("throws error for unknown table cell content type", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "table",
              rows: [
                {
                  type: "table-row",
                  cells: [
                    {
                      type: "table-cell",
                      contents: [{ type: "unknown" } as any],
                    } as TableCell,
                  ],
                } as TableRow,
              ],
            } as Table,
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      expect(() => formatter.format(query)).toThrow("Unknown table cell content type: unknown");
    });

    it("throws error for unknown output spec type", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: any = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Output",
              contents: [],
              isOutputSpecsSection: true,
            } as Section,
          ],
        },
        output: { type: "unknown-output" },
      };
      expect(() => formatter.format(query)).toThrow("Unknown output spec type: unknown-output");
    });
  });

  describe("filtering empty content", () => {
    it("filters out empty strings from formatted content", () => {
      const formatter = new TextualMarkdownFormatter<Record<string, any>, RoleDefault, TestTool>();
      const query: TestQuery = {
        prompt: {
          type: "prompt",
          contents: [
            { type: "paragraph", content: "" }, // Empty paragraph
            { type: "paragraph", content: "Non-empty" },
            { type: "paragraph", content: "   " }, // Whitespace only
            { type: "paragraph", content: "Another non-empty" },
          ],
        },
        output: { type: "output-text" } as TextOutput,
      };
      const output = formatter.format(query);
      expect(output).toBe("Non-empty\n\nAnother non-empty");
    });
  });
});
