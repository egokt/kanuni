import { zodToJsonSchema } from "zod-to-json-schema";
import {
  Formatter,
  List,
  Paragraph,
  Query,
  RoleDefault,
  Section,
  Table,
  TableCell,
  TableHeaderCell,
  TableRow,
  Tool,
} from "../../developer-api/index.js";

type TextualMarkdownFormatterConfig = {
  indentationString?: string;
  unnumberedListItemPrefix?: string;
  memoryIntroductionText?: string;
  outputJsonIntroductionText?: string;
  outputTextIntroductionText?: string;
  toolsIntroductionText?: string;
  excludes?: {
    memory?: boolean; // if set to true, memory will not be included in the formatted output
    outputSpecs?: boolean; // if set to true, output schema description will not be included
    tools?: boolean; // if set to true, tools will not be included in the formatted output
  }
};

type TextualMarkdownFormatterParams = {};

const DEFAULT_INDENTATION_STRING = "  ";
const DEFAULT_UNNUMBERED_LIST_ITEM_PREFIX = "- ";
const DEFAULT_MEMORY_INTRODUCTION_TEXT = "History: ";
const DEFAULT_TOOLS_INTRODUCTION_TEXT = "Tools available: ";
const DEFAULT_OUTPUT_JSON_INTRODUCTION_TEXT = "JSON schema for response: ";
const DEFAULT_OUTPUT_TEXT_INTRODUCTION_TEXT = "";

export class TextualMarkdownFormatter<
  OutputSchema extends Record<string, any> = Record<string, any>,
  Role extends string = RoleDefault,
  ToolsType extends Tool<any, any> = never,
> implements Formatter<TextualMarkdownFormatterParams, string, OutputSchema, Role, ToolsType>
{
  private indentationString: string;
  private unnumberedListItemPrefix: string;
  private memoryIntroductionText: string;
  private outputJsonIntroductionText: string;
  private outputTextIntroductionText: string;
  private toolsIntroductionText: string;
  private excludes: NonNullable<TextualMarkdownFormatterConfig["excludes"]>;

  constructor({
    indentationString = DEFAULT_INDENTATION_STRING,
    unnumberedListItemPrefix = DEFAULT_UNNUMBERED_LIST_ITEM_PREFIX,
    memoryIntroductionText = DEFAULT_MEMORY_INTRODUCTION_TEXT,
    outputJsonIntroductionText = DEFAULT_OUTPUT_JSON_INTRODUCTION_TEXT,
    outputTextIntroductionText = DEFAULT_OUTPUT_TEXT_INTRODUCTION_TEXT,
    toolsIntroductionText = DEFAULT_TOOLS_INTRODUCTION_TEXT,
    excludes = {},
  }: TextualMarkdownFormatterConfig = {}) {
    this.indentationString = indentationString;
    this.unnumberedListItemPrefix = unnumberedListItemPrefix;
    this.memoryIntroductionText = memoryIntroductionText;
    this.outputJsonIntroductionText = outputJsonIntroductionText;
    this.outputTextIntroductionText = outputTextIntroductionText;
    this.toolsIntroductionText = toolsIntroductionText;
    this.excludes = excludes;
  }

  format(
    query: Query<any, Role, ToolsType>,
    _params?: TextualMarkdownFormatterParams
  ): string {
    const str = query.prompt.contents
      .map((content) => {
        switch (content.type) {
          case "paragraph":
            return this.formatParagraph(content);
          case "list":
            return this.formatList(content);
          case "section":
            if (content.isMemorySection) {
              return this.formatMemorySection(content, query.memory);
            } else if (content.isToolsSection) {
              return this.formatToolsSection(content, query.tools);
            } else if (content.isOutputSpecsSection) {
              return this.formatOutputSpecsSection(content, query.output);
            } else {
              return this.formatSection(content);
            }
          case "table":
            return this.formatTable(content);
          default:
            throw new Error(
              `Unknown content type: ${(content as { type: string }).type}`,
            );
        }
      })
      .filter(content => content.trim() !== '') // filter out empty strings
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

  private formatMemorySection(
    section: Section,
    memory: Query<any, Role, ToolsType>['memory'],
  ): string {
    if (!section.isMemorySection) {
      throw new Error('Something is wrong: trying to format a section that is' +
        ' not marked as a memory section as if it is a memory section.');
    }

    if (this.excludes.memory) {
      return '';
    }

    if (memory === undefined) {
      // TODO: we might add a config param for throwing an error instead of
      // silently skipping rendering the memory section
      return '';
    }

    let str = this.formatMemoryOrToolsSectionContent(section);

    // Now format and add the memory
    str += "\n\n";
    str += this.formatMemory(memory);
    return str;
  }

  private formatToolsSection(
    section: Section,
    tools: Query<any, Role, ToolsType>['tools'],
  ): string {
    if (!section.isToolsSection) {
      throw new Error('Something is wrong: trying to format a section that is' +
        ' not marked as a tools section as if it is a tools section.');
    }

    if (this.excludes.tools) {
      return '';
    }

    if (tools === undefined || Object.keys(tools).length === 0) {
      // TODO: we might add a config param for throwing an error instead of
      // silently skipping rendering the tools section
      return '';
    }

    let str = this.formatMemoryOrToolsSectionContent(section);

    // Now format and add the tools
    str += "\n\n";
    str += this.formatTools(tools);
    return str;
  }

  private formatOutputSpecsSection(
    section: Section,
    outputSpecs: Query<any, Role, ToolsType>['output'],
  ): string {
    if (!section.isOutputSpecsSection) {
      throw new Error('Something is wrong: trying to format a section that is' +
        ' not marked as an output specs section as if it is an output specs ' +
        'section.');
    }

    if (this.excludes.outputSpecs) {
      return '';
    }

    let str = this.formatMemoryOrToolsSectionContent(section);

    switch (outputSpecs.type) {
      case 'output-text':
        if (this.outputTextIntroductionText.length > 0) {
          return str + `\n\n${this.outputTextIntroductionText}`;
        } else {
          return str;
        }
      case 'output-json':
        // Now format and add the tools
        str += `\n\n${this.outputJsonIntroductionText}\n\n`;
        str += JSON.stringify(zodToJsonSchema(
          outputSpecs.schema,
          { name: outputSpecs.schemaName }
        ), null, 2);
        return str;
      default:
        throw new Error(`Unknown output spec type: ${(outputSpecs as { type: string; }).type}`)
    }
  }


  private formatTools(tools: NonNullable<Query<any, Role, ToolsType>['tools']>): string {
    let toolStrArray = Object.values(tools).map(tool => JSON.stringify({
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.parameters),
    }, null, 2));
    let str =
      this.toolsIntroductionText.length === 0
        ? ""
        : this.toolsIntroductionText + "\n\n";
    str += `[\n\n${toolStrArray.join("\n\n")}\n\n]`;
    return str;
  }

  private formatMemoryOrToolsSectionContent(
    section: Section,
  ): string {
    let str = section.heading
      ? `# ${section.heading}\n`
      : "";

    str += section.contents
      .map((content) => {
        switch (content.type) {
          case "paragraph":
            return this.formatParagraph(content);
          case "list":
            return this.formatList(content);
          case "section":
            throw new Error('Subsections are not allowed in memory sections.');
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
 
    return str;
  }

  private formatSection(section: Section, level = 0): string {
    let str = section.heading
      ? `${"#".repeat(level + 1)} ${section.heading}\n\n`
      : "";

    str += section.contents
      .map((content) => {
        switch (content.type) {
          case "paragraph":
            return this.formatParagraph(content);
          case "list":
            return this.formatList(content, 1);
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

  private formatMemory(memory: NonNullable<Query<any, Role, ToolsType>['memory']>): string {
    let str =
      this.memoryIntroductionText.length === 0
        ? ""
        : this.memoryIntroductionText + "\n\n";

    str += memory.contents
      .map((item) => {
        switch (item.type) {
          case 'utterance':
            const snakeCaseRole = item.role.replaceAll(" ", "_").toLowerCase();
            const openingTag = `<${snakeCaseRole}>`;
            const closingTag = `</${snakeCaseRole}>`;
            return `${openingTag}\n${item.contents}\n${closingTag}`;
          case 'tool-call':
            const toolCallData = {
              toolCallId: item.toolCallId,
              toolName: item.toolName,
              arguments: item.arguments,
            };
            return `<tool_call>\n${JSON.stringify(toolCallData, null, 2)}\n</tool_call>`;
          case 'tool-call-result':
            const toolCallResultData = {
              toolCallId: item.toolCallId,
              result: item.result,
            };
            return `<tool_coll_result>\n${JSON.stringify(toolCallResultData, null, 2)}\n</tool_call_result>`
          default:
            return null;
        }
      })
      .filter(itemStringOrNull => itemStringOrNull !== null)
      .join("\n");

    return str;
  }
}
