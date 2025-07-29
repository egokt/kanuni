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
} from "../../../../src/developer-api/index.js";

describe("TextualMarkdownFormatter.format", () => {
  it("formats a prompt with a single paragraph", () => {
    const formatter = new TextualMarkdownFormatter();
    const query: Query = {
      prompt: {
        type: "prompt",
        contents: [{ type: "paragraph", content: "Hello world" } as Paragraph],
      } as Prompt,
    } as Query;
    expect(formatter.format(query)).toBe("Hello world");
  });

  it("formats a prompt with multiple paragraphs", () => {
    const formatter = new TextualMarkdownFormatter();
    const query: Query = {
      prompt: {
        type: "prompt",
        contents: [
          { type: "paragraph", content: "First" },
          { type: "paragraph", content: "Second" },
        ],
      },
    } as Query;
    expect(formatter.format(query)).toBe("First\n\nSecond");
  });

  it("formats a prompt with a list including nested lists", () => {
    const formatter = new TextualMarkdownFormatter();
    const query: Query = {
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
    } as Query;
    expect(formatter.format(query)).toContain("- Item 1");
    expect(formatter.format(query)).toContain("-   - Subitem 1");
  });

  it("formats a prompt with a section with heading and contents", () => {
    const formatter = new TextualMarkdownFormatter();
    const query: Query = {
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
    } as Query;
    expect(formatter.format(query)).toContain("# Section Heading");
    expect(formatter.format(query)).toContain("Section content");
  });

  it("formats a prompt with a table with headers and rows", () => {
    const formatter = new TextualMarkdownFormatter();
    const query: Query = {
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
                  } as TableCell,
                  {
                    contents: [{ type: "paragraph", content: "Cell 2" }],
                  } as TableCell,
                ],
                type: "table-row",
              } as TableRow,
            ],
          } as Table,
        ],
      },
    } as Query;
    const output = formatter.format(query);
    expect(output).toContain("<table>");
    expect(output).toContain("<cell columnHeader>\nHeader 1\n</cell>");
    expect(output).toContain("<cell>\nCell 1\n</cell>");
  });

  it("formats a section containing memory", () => {
    const formatter = new TextualMarkdownFormatter();
    const memory: Memory = {
      type: "memory",
      contents: [
        { type: "utterance", role: "user", contents: "User message" },
        { type: "utterance", role: "assistant", contents: "Assistant message" },
      ],
    };
    const query: Query = {
      prompt: {
        type: "prompt",
        contents: [
          {
            type: "section",
            heading: "Chat",
            contents: [],
            memory,
          } as Section,
        ],
      },
    } as Query;
    const output = formatter.format(query);
    expect(output).toContain("History:");
    expect(output).toContain("<user>\nUser message\n</user>");
    expect(output).toContain("<assistant>\nAssistant message\n</assistant>");
  });

  it("handles custom configuration (indentation, list prefix, memory intro text)", () => {
    const formatter = new TextualMarkdownFormatter({
      indentationString: "--",
      unnumberedListItemPrefix: "* ",
      memoryIntroductionText: "Custom Memory: ",
    });
    const memory: Memory = {
      type: "memory",
      contents: [{ type: "utterance", role: "user", contents: "Msg" }],
    };
    const query: Query = {
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
            memory,
          },
        ],
      },
    } as Query;
    const output = formatter.format(query);
    expect(output).toContain("* Item");
    expect(output).toContain("Custom Memory:");
  });

  it("throws on unknown content type", () => {
    const formatter = new TextualMarkdownFormatter();
    const query: Query = {
      prompt: {
        type: "prompt",
        contents: [{ type: "unknownType" } as any],
      },
    } as Query;
    expect(() => formatter.format(query)).toThrow(
      "Unknown content type: unknownType",
    );
  });

  it("handles empty prompt contents", () => {
    const formatter = new TextualMarkdownFormatter();
    const query: Query = {
      prompt: {
        type: "prompt",
        contents: [],
      },
      output: { type: 'output-text' as const },
    } as Query;
    expect(formatter.format(query)).toBe("");
  });

  it("handles deeply nested sections and lists", () => {
    const formatter = new TextualMarkdownFormatter();
    const query: Query = {
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
    } as Query;
    const output = formatter.format(query);
    expect(output).toContain("# Top");
    expect(output).toContain("## Sub");
    expect(output).toContain("- Deep item");
  });

  describe("memory exclusion", () => {
    it("excludes memory when excludes.memory is set to true", () => {
      const formatter = new TextualMarkdownFormatter({
        excludes: { memory: true },
      });
      const memory: Memory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "User message" },
          { type: "utterance", role: "assistant", contents: "Assistant message" },
        ],
      };
      const query: Query = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Chat",
              contents: [
                { type: "paragraph", content: "Regular content" }
              ],
              memory,
            } as Section,
          ],
        },
      } as Query;
      const output = formatter.format(query);
      expect(output).not.toContain("History:");
      expect(output).not.toContain("<user>");
      expect(output).not.toContain("<assistant>");
      expect(output).not.toContain("User message");
      expect(output).not.toContain("Assistant message");
    });

    it("excludes entire section when it only contains memory", () => {
      const formatter = new TextualMarkdownFormatter({
        excludes: { memory: true },
      });
      const memory: Memory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "User message" },
        ],
      };
      const query: Query = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Memory Only Section",
              contents: [],
              memory,
            } as Section,
          ],
        },
      } as Query;
      const output = formatter.format(query);
      expect(output).toBe("");
    });

    it("excludes entire section when it contains memory (including its content)", () => {
      const formatter = new TextualMarkdownFormatter({
        excludes: { memory: true },
      });
      const memory: Memory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "User message" },
        ],
      };
      const query: Query = {
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
              memory,
            } as Section,
          ],
        },
      } as Query;
      const output = formatter.format(query);
      expect(output).toBe(""); // Entire section is excluded when it has memory
      expect(output).not.toContain("Mixed Section");
      expect(output).not.toContain("This should be excluded too");
      expect(output).not.toContain("History:");
      expect(output).not.toContain("User message");
    });

    it("includes memory when excludes.memory is false (default behavior)", () => {
      const formatter = new TextualMarkdownFormatter({
        excludes: { memory: false },
      });
      const memory: Memory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "User message" },
        ],
      };
      const query: Query = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Chat",
              contents: [
                { type: "paragraph", content: "Regular content" }
              ],
              memory,
            } as Section,
          ],
        },
      } as Query;
      const output = formatter.format(query);
      expect(output).toContain("# Chat");
      expect(output).toContain("Regular content");
      expect(output).toContain("History:");
      expect(output).toContain("User message");
    });

    it("excludes child sections with memory while keeping parent section", () => {
      const formatter = new TextualMarkdownFormatter({
        excludes: { memory: true },
      });
      const memory: Memory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "Nested user message" },
        ],
      };
      const query: Query = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Parent Section",
              contents: [
                { type: "paragraph", content: "Parent content" },
                {
                  type: "section",
                  heading: "Child Section",
                  contents: [
                    { type: "paragraph", content: "Child content" }
                  ],
                  memory,
                } as Section,
              ],
            } as Section,
          ],
        },
      } as Query;
      const output = formatter.format(query);
      expect(output).toContain("# Parent Section");
      expect(output).toContain("Parent content");
      expect(output).not.toContain("## Child Section");
      expect(output).not.toContain("Child content");
      expect(output).not.toContain("History:");
      expect(output).not.toContain("Nested user message");
    });

    it("handles multiple sections - excludes only those with memory", () => {
      const formatter = new TextualMarkdownFormatter({
        excludes: { memory: true },
      });
      const memory1: Memory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "First memory" },
        ],
      };
      const memory2: Memory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "assistant", contents: "Second memory" },
        ],
      };
      const query: Query = {
        prompt: {
          type: "prompt",
          contents: [
            {
              type: "section",
              heading: "Section 1",
              contents: [
                { type: "paragraph", content: "Content 1" }
              ],
              memory: memory1,
            } as Section,
            {
              type: "section",
              heading: "Section 2",
              contents: [
                { type: "paragraph", content: "Content 2" }
              ],
              memory: memory2,
            } as Section,
            {
              type: "section",
              heading: "Section 3",
              contents: [
                { type: "paragraph", content: "Content 3" }
              ],
            } as Section,
          ],
        },
      } as Query;
      const output = formatter.format(query);
      // Sections with memory are excluded entirely
      expect(output).not.toContain("# Section 1");
      expect(output).not.toContain("Content 1");
      expect(output).not.toContain("# Section 2");
      expect(output).not.toContain("Content 2");
      // Section without memory is included
      expect(output).toContain("# Section 3");
      expect(output).toContain("Content 3");
      expect(output).not.toContain("First memory");
      expect(output).not.toContain("Second memory");
      expect(output).not.toContain("History:");
    });

    it("includes sections without memory when excludes.memory is true", () => {
      const formatter = new TextualMarkdownFormatter({
        excludes: { memory: true },
      });
      const query: Query = {
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
      } as Query;
      const output = formatter.format(query);
      expect(output).toContain("# No Memory Section");
      expect(output).toContain("This should be included");
      expect(output).toContain("This too");
    });

    it("handles mixed prompt contents with memory exclusion", () => {
      const formatter = new TextualMarkdownFormatter({
        excludes: { memory: true },
      });
      const memory: Memory = {
        type: "memory",
        contents: [
          { type: "utterance", role: "user", contents: "Memory content" },
        ],
      };
      const query: Query = {
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
              memory,
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
      } as Query;
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
});
