import { OutputSchemaDescription } from "../developer-api/index.js";

/**
 * This is a helper function for passing structured metadata about the output schema.
 * 
 * Example usage:
 * ```typescript
 * const query = Kanuni.newQuery<{ title: string }>()
 *   .prompt(p => p
 *     ...
 *   )
 *   .output(o => o.json({
 *     reasoning: z.string().describe(withDescription({
 *       title: 'Reasoning',
 *       description: 'The reasoning behind the assistant\'s response.',
 *     })),
 *     type: z.string().describe(withDescription({
 *       title: 'Type',
 *       description: 'The type of the response, e.g. "text", "image"',
 *       exampleValues: ['text', 'image'],
 *     })),
 *     result: z.string(),
 *   }));
 * ```
 * 
 * @param description - An object containing metadata about the output schema.
 * @param description.title - The title of the output schema.
 * @param description.description - A description of the output schema.
 * @param description.exampleValues - An array of example values for the output schema.
 * @returns A JSON string representation of the description object that can be
 *   passed to ZodSchema.describe function. Kanuni formatters should parse this
 *   string and set the description of the output schema accordingly.
 */
export function withDescription(description: OutputSchemaDescription): string {
  return JSON.stringify(description);
}
