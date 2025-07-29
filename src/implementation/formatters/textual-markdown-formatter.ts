import {
  Formatter,
  List,
  Memory,
  Paragraph,
  Prompt,
  Query,
  RoleDefault,
  Section,
  Table,
  TableCell,
  TableHeaderCell,
  TableRow,
} from "../../developer-api/index.js";

type TextualMarkdownFormatterConfig = {
  indentationString?: string;
  unnumberedListItemPrefix?: string;
  memoryIntroductionText?: string;
  excludes?: {
    memory?: boolean; // if set to true, memory will not be included in the formatted output

    // TODO: use the following line when output schema description is implemented
    // outputSchema?: boolean; // if set to true, output schema description will not be included

    // TODO: add tools here later
  }
};

type TextualMarkdownFormatterParams = {};

const DEFAULT_INDENTATION_STRING = "  ";
const DEFAULT_UNNUMBERED_LIST_ITEM_PREFIX = "- ";
const DEFAULT_MEMORY_INTRODUCTION_TEXT = "History: ";

export class TextualMarkdownFormatter<
  OutputSchema extends Record<string, any> = Record<string, any>,
  Role extends string = RoleDefault
> implements Formatter<TextualMarkdownFormatterParams, string, OutputSchema, Role>
{
  private indentationString: string;
  private unnumberedListItemPrefix: string;
  private memoryIntroductionText: string;
  private excludes: NonNullable<TextualMarkdownFormatterConfig["excludes"]>;

  constructor({
    indentationString = DEFAULT_INDENTATION_STRING,
    unnumberedListItemPrefix = DEFAULT_UNNUMBERED_LIST_ITEM_PREFIX,
    memoryIntroductionText = DEFAULT_MEMORY_INTRODUCTION_TEXT,
    excludes = {},
  }: TextualMarkdownFormatterConfig = {}) {
    this.indentationString = indentationString;
    this.unnumberedListItemPrefix = unnumberedListItemPrefix;
    this.memoryIntroductionText = memoryIntroductionText;
    this.excludes = excludes;
  }

  // TODO: Future work: this currently does not support output schema description for json text output.
  format(query: Query<any, Role>, _params?: TextualMarkdownFormatterParams): string {
    const prompt = this.formatPrompt(query.prompt);
    return prompt;
  }

  private formatPrompt(prompt: Prompt): string {
    const str = prompt.contents
      .map((content) => {
        switch (content.type) {
          case "paragraph":
            return this.formatParagraph(content);
          case "list":
            return this.formatList(content);
          case "section":
            return this.formatSection(content);
          case "table":
            return this.formatTable(content);
          default:
            throw new Error(
              `Unknown content type: ${(content as { type: string }).type}`,
            );
        }
      })
      .join("\n\n");

    return str;
  }

  private formatParagraph(paragraph: Paragraph): string {
    return paragraph.content;
  }

  private formatList(list: List, indentationLevel: number = 0): string {
    const indentation = this.indentationString.repeat(indentationLevel);
    const str = list.items
      .map((item) => {
        const itemContent = item.content;
        switch (itemContent.type) {
          case "paragraph":
            return `${indentation}${this.unnumberedListItemPrefix}${this.formatParagraph(itemContent)}`;
          case "list":
            return `${indentation}${this.unnumberedListItemPrefix}${this.formatList(itemContent, indentationLevel + 1)}`;
          default:
            throw new Error(
              `Unknown list item content type: ${(itemContent as { type: string }).type}`,
            );
        }
      })
      .join("\n");

    return str;
  }

  private formatSection(section: Section, level = 0): string {
    if (this.excludes.memory && section.memory) {
      return '';
    }

    let str = section.heading
      ? `${"#".repeat(level + 1)} ${section.heading}`
      : "";

    str += section.contents
      .map((content) => {
        switch (content.type) {
          case "paragraph":
            return this.formatParagraph(content);
          case "list":
            return this.formatList(content, level + 1);
          case "section":
            return this.formatSection(content, level + 1);
          case "table":
            return this.formatTable(content);
          default:
            throw new Error(
              `Unknown section content type: ${(content as { type: string }).type}`,
            );
        }
      })
      .filter(content => content.trim() !== '') // filter out empty strings
      .join("\n\n");

    if (section.memory) {
      str += `\n\n${this.formatMemory(section.memory)}`;
    }

    return str;
  }

  private formatTable(table: Table): string {
    let str = "<table>\n";

    if (table.columnHeaders) {
      str += "\n<row>\n";
      for (const header of table.columnHeaders) {
        str += this.formatTableHeaderCell(header, "columnHeader");
      }
      str += "\n</row>\n";
    }

    str += table.rows.map((row) => this.formatTableRow(row)).join("\n");
    str += "\n</table>";
    return str;
  }

  private formatTableHeaderCell(
    tableHeaderCell: TableHeaderCell,
    columnOrRow: "columnHeader" | "rowHeader",
  ): string {
    return `<cell ${columnOrRow}>\n${this.formatParagraph(tableHeaderCell.contents)}\n</cell>`;
  }

  private formatTableCell(tableCell: TableCell): string {
    let str = "<cell>\n";

    str += tableCell.contents
      .map((content) => {
        switch (content.type) {
          case "paragraph":
            return this.formatParagraph(content);
          case "list":
            return this.formatList(content);
          case "table":
            return this.formatTable(content);
          default:
            throw new Error(
              `Unknown table cell content type: ${(content as { type: string }).type}`,
            );
        }
      })
      .join("\n\n");

    str += "\n</cell>";
    return str;
  }

  private formatTableRow(tableRow: TableRow): string {
    let str = "<row>\n";
    if (tableRow.rowHeader) {
      str += this.formatTableHeaderCell(tableRow.rowHeader, "rowHeader");
    }
    str += tableRow.cells.map((cell) => this.formatTableCell(cell)).join("\n");
    str += "</row>";
    return str;
  }

  private formatMemory(memory: Memory): string {
    let str =
      this.memoryIntroductionText.length === 0
        ? ""
        : this.memoryIntroductionText + "\n\n";

    str += memory.contents
      .map((item) => {
        const snakeCaseRole = item.role.replaceAll(" ", "_").toLowerCase();
        const openingTag = `<${snakeCaseRole}>`;
        const closingTag = `</${snakeCaseRole}>`;
        return `${openingTag}\n${item.contents}\n${closingTag}`;
      })
      .join("\n");

    return str;
  }
}
