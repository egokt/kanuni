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

describe("TextualFormatter.format", () => {
  it("formats a prompt with a single paragraph", () => {
    const formatter = new TextualMarkdownFormatter();
    const query: Query = {
      prompt: {
        type: "prompt",
        contents: [
          { type: "paragraph", content: "Hello world" } as Paragraph,
        ],
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
              { content: { type: "list", items: [
                { content: { type: "paragraph", content: "Subitem 1" } },
              ] } },
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
            contents: [
              { type: "paragraph", content: "Section content" },
            ],
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
              { contents: { type: "paragraph", content: "Header 1" }, type: "table-header-cell" } as TableHeaderCell,
              { contents: { type: "paragraph", content: "Header 2" }, type: "table-header-cell" } as TableHeaderCell,
            ],
            rows: [
              {
                cells: [
                  { contents: [{ type: "paragraph", content: "Cell 1" }] } as TableCell,
                  { contents: [{ type: "paragraph", content: "Cell 2" }] } as TableCell,
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
      contents: [
        { type: "utterance", role: "user", contents: "Msg" },
      ],
    };
    const query: Query = {
      prompt: {
        type: "prompt",
        contents: [
          {
            type: "list",
            items: [
              { content: { type: "paragraph", content: "Item" } },
            ],
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
        contents: [
          { type: "unknownType" } as any,
        ],
      },
    } as Query;
    expect(() => formatter.format(query)).toThrow("Unknown content type: unknownType");
  });

  it("handles empty prompt contents", () => {
    const formatter = new TextualMarkdownFormatter();
    const query: Query = {
      prompt: {
        type: "prompt",
        contents: [],
      },
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
});
