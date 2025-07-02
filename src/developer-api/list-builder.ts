import { compile } from './string-template-helpers.js';
import { List, ListItem } from './types.js';

export type ListBuilderFunction<BuilderData extends Record<string, any> = {}> =
  (
    listBuilder: ListBuilder<BuilderData>,
  ) => ListBuilder<BuilderData> | undefined | null;

/**
 * A builder for creating lists of items or sublists.
 *
 * A list can contain items, which are paragraphs, or sublists.
 *
 * See tests/data/code/list-builder.ts as an example of how to use this builder.
 */
export class ListBuilder<BuilderData extends Record<string, any> = {}> {
  // We collect builder data and postpone the actual building of ListItems
  // until the `build` method is called.
  // This allows us to pass the user supplied data to the builder functions.
  private listBuilderData: (
    | {
        type: 'item';
        func: (data: BuilderData) => ListItem;
      }
    | {
        type: 'list';
        func: (data: BuilderData) => List;
      }
  )[];

  constructor() {
    this.listBuilderData = [];
  }

  /**
   * Adds a list item to the list.
   *
   * To add a sublist as an item, use the `list` method.
   *
   * This is the variant that registers a function that will be called
   * with the data when the list is built using the `build` method.
   *
   * Example:
   * ```typescript
   * const list = new ListBuilder<{ title: string }>();
   * list.item(data => `Item: ${data.title}`);
   * const builtList = list.build({ title: 'Example' });
   * ```
   *
   * @param builderFunction A function that takes the user supplied data
   * and returns a string that will be used as the content of the list item.
   */
  item(
    builderFunction: (data: BuilderData) => string,
  ): ListBuilder<BuilderData>;
  /**
   * Adds a list item to the list.
   *
   * To add a sublist as an item, use the `list` method.
   *
   * This is the variant that registers a template string
   * that will be compiled with the user supplied data when the list is built.
   *
   * Example:
   * ```typescript
   * const list = new ListBuilder<{ title: string }>();
   * list.item`Item: ${'title'}`;
   * const builtList = list.build({ title: 'Example' });
   * ```
   *
   * Note that every expression in the template string must evaluate to a key
   * in the `BuilderData` type. This is different than typical template
   * usage, where the expressions can be any JavaScript expression the
   * result of which is converted to a string and included in the final output.
   *
   * @param strings JavaScript template strings that will be compiled.
   * @param keys The keys of the data to be used in the template strings.
   */
  item(
    strings: TemplateStringsArray,
    ...keys: (keyof BuilderData)[]
  ): ListBuilder<BuilderData>;
  /**
   * This is the implementation signature of the item methods. Do not use this directly.
   */
  item(
    stringsOrBuilderFunction:
      | TemplateStringsArray
      | ((data: BuilderData) => string),
    ...keys: (keyof BuilderData)[]
  ): ListBuilder<BuilderData> {
    if (stringsOrBuilderFunction instanceof Function) {
      const func = stringsOrBuilderFunction as (data: BuilderData) => string;
      this.listBuilderData.push({
        type: 'item',
        func: (data: BuilderData) => {
          const paragraphStr = func(data);
          return {
            content: {
              type: 'paragraph',
              content: paragraphStr,
            },
          };
        },
      });
    } else {
      const strings = stringsOrBuilderFunction as TemplateStringsArray;
      const paragraphBuilderData: Extract<
        (typeof this.listBuilderData)[number],
        { type: 'item' }
      > = {
        type: 'item' as const,
        func: (data: BuilderData) => {
          const headingStr = compile<BuilderData>(strings, ...keys);
          return {
            content: {
              type: 'paragraph' as const,
              content: headingStr(data),
            },
          };
        },
      };
      this.listBuilderData.push(paragraphBuilderData);
    }
    return this;
  }

  list(
    listBuilderFunction: ListBuilderFunction<BuilderData>,
  ): ListBuilder<BuilderData> {
    const newBuilder = new ListBuilder<BuilderData>();
    const builderOrNull = listBuilderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      this.listBuilderData.push({
        type: 'list',
        func: (data: BuilderData) => builderOrNull.build(data),
      });
    }
    return this;
  }

  build(data: BuilderData): List {
    return {
      type: 'list',
      items: this.listBuilderData.map((item) => {
        switch (item.type) {
          case 'list':
            return {
              content: item.func(data),
            };
          case 'item':
            return item.func(data);
          default:
            throw new Error(
              `Unknown item type: ${(item as { type: string }).type}`,
            );
        }
      }),
    };
  }
}
