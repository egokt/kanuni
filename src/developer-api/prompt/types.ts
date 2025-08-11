import { Memory } from "../memory/types.js";
import { Tool, ToolRegistry } from "../types.js";

// This is one part in the prompt
export type Section = {
  type: "section";
  heading?: string;
  contents: (ContentPart | Section)[];
  isMemorySection?: boolean;
  isToolsSection?: boolean;
};

export type ContentPart = Paragraph | Table | List;

// // A segment is a series of paragraphs, tables, or lists
// // Tables and lists may include nested paragraphs, tables or lists
// export type Segment = {
//   content: SegmentPart[];
// };

// export type SegmentPart = Paragraph | Table | List;

export type Paragraph = {
  type: "paragraph"; // this is needed for use in discriminated unions
  content: string; // TODO: how about emphasis, tags, etc in the text?
};

export type Table = {
  type: "table"; // this is needed for use in discriminated unions
  columnHeaders?: TableHeaderCell[];
  rows: TableRow[];
};

export type TableHeaderCell = {
  type: "table-header-cell";
  contents: Paragraph;
};

export type TableRow = {
  type: "table-row";
  rowHeader?: TableHeaderCell;
  cells: TableCell[];
};

export type TableCell = {
  type: "table-cell";
  contents: ContentPart[];
};

export type List = {
  type: "list"; // this is needed for use in discriminated unions
  items: ListItem[];
};

export type ListItem = {
  content: Paragraph | List;
};

export type Prompt = {
  type: "prompt";
  contents: (ContentPart | Section)[];
};
