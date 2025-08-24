import z from "zod";

// Basic content types
const paragraphSchema = z.object({
  type: z.literal('paragraph'),
  content: z.string(),
});

const tableHeaderCellSchema = z.object({
  type: z.literal('table-header-cell'),
  contents: paragraphSchema,
});

// List types
const listItemSchema: z.ZodType<any> = z.lazy(() => z.object({
  content: z.union([paragraphSchema, listSchema]),
}));

const listSchema = z.object({
  type: z.literal('list'),
  items: z.array(listItemSchema),
});

// Table types
const tableCellSchema: z.ZodType<any> = z.lazy(() => z.object({
  type: z.literal('table-cell'),
  contents: z.array(contentPartSchema),
}));

const tableRowSchema = z.object({
  type: z.literal('table-row'),
  rowHeader: tableHeaderCellSchema.optional(),
  cells: z.array(tableCellSchema),
});

const tableSchema = z.object({
  type: z.literal('table'),
  columnHeaders: z.array(tableHeaderCellSchema).optional(),
  rows: z.array(tableRowSchema),
});

// Content part schema (used in circular references)
const contentPartSchema: z.ZodType<any> = z.lazy(() => z.union([
  paragraphSchema,
  tableSchema,
  listSchema,
]));

// Section schema
const sectionSchema: z.ZodType<any> = z.lazy(() => z.object({
  type: z.literal('section'),
  heading: z.string().optional(),
  contents: z.array(z.union([contentPartSchema, sectionSchema])),
  isMemorySection: z.boolean().optional(),
  isToolsSection: z.boolean().optional(),
  isOutputSpecsSection: z.boolean().optional(),
}));

// Prompt schema
const promptSchema = z.object({
  type: z.literal('prompt'),
  contents: z.array(z.union([contentPartSchema, sectionSchema])),
});

// Memory types
const utteranceSchema = z.object({
  type: z.literal('utterance'),
  role: z.string(),
  name: z.string().optional(),
  contents: z.string(),
});

const toolCallSchema = z.object({
  type: z.literal('tool-call'),
  toolName: z.string(),
  arguments: z.string(),
  toolCallId: z.string(),
});

const toolCallResultSchema = z.object({
  type: z.literal('tool-call-result'),
  toolCallId: z.string(),
  result: z.string().nullable(),
});

const memoryItemSchema = z.union([
  utteranceSchema,
  toolCallSchema,
  toolCallResultSchema,
]);

const memorySchema = z.object({
  type: z.literal('memory'),
  contents: z.array(memoryItemSchema),
});

// Output types
const textOutputSchema = z.object({
  type: z.literal('output-text'),
});

const jsonOutputSchema = z.object({
  type: z.literal('output-json'),
  schemaName: z.string(),
  schema: z.any(), // ZodType schema - using z.any() since we can't represent the generic type constraint
});

const outputSchema = z.union([textOutputSchema, jsonOutputSchema]);

// Tool types
const toolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()), // Record of ZodType parameters
});

const toolRegistrySchema = z.record(toolSchema);

// Complete query schema
export const querySchema = z.object({
  prompt: promptSchema,
  memory: memorySchema.optional(),
  tools: toolRegistrySchema.optional(),
  output: outputSchema,
});

// Export individual schemas for potential reuse
export {
  paragraphSchema,
  tableHeaderCellSchema,
  tableCellSchema,
  tableRowSchema,
  tableSchema,
  listSchema,
  listItemSchema,
  contentPartSchema,
  sectionSchema,
  promptSchema,
  utteranceSchema,
  toolCallSchema,
  toolCallResultSchema,
  memoryItemSchema,
  memorySchema,
  textOutputSchema,
  jsonOutputSchema,
  outputSchema,
  toolSchema,
  toolRegistrySchema,
};
