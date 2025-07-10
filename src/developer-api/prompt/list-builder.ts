import { compile } from './string-template-helpers.js';
import { List, ListItem } from './types.js';

export type ListBuilderFunction<Params extends Record<string, any> = {}> =
  (
    listBuilder: ListBuilder<Params>,
    data: Params,
  ) => ListBuilder<Params> | undefined | null;

type ItemsBuilderFunction<Params extends Record<string, any> = {}, T = any> =
  (
    listItemsBuilder: ListBuilder<Params>,
    item: T,
    index: number,
  ) => ListBuilder<Params> | ListBuilder<Params>[] | undefined | null;

/**
 * A builder for creating lists of items or sublists.
 *
 * A list can contain items, which are paragraphs, or sublists.
 *
 * See tests/data/code/list-builder.ts as an example of how to use this builder.
 * 
 * # Iterating to build lists
 *
 * Following examples uses a contextAndSubcontexts array with type
 * ```typescript
 * type ContextAndSubcontexts = [string, string[]][];
 * ```
 * This is the best form to use, because it's very readable.
 * It uses an items call on an items builder, flattening the resulting items
 * into a single list. Note that the string template form of the item function
 * (`.item\`...\``) is not supported here, because it is confusing for the developer,
 * considering we use string expressions to index into the data object in all
 * other cases.
 * ```typescript
 * // ...
 * .list((l, data) => l
 *   .items(data.contextsAndSubcontexts, (i, [context, subcontexts]) => i
 *     .items(subcontexts, (i, subcontext) => i
 *       // The "_" param is a placeholder for the data object
 *       .item(_ => `"${context}", "${subcontext}"`)
 *     )
 *   )
 * )
 * ```
 *
 * This is also possible, and readable with a catch: it transfers i
 * from the outer items to the inner map function, which might be confusing or
 * less readable:
 * ```typescript
 * // ...
 * .items(data.legalContextsAndSubcontexts, (i, [context, subcontexts]) =>
 *   subcontexts.map((subcontext) => i
 *     .item(_ => `"${context}", "${subcontext}"`)
 *   )
 * )
 * ```
 *
 * This is still possible, and the most flexible, but it's not very readable:
 * ```typescript
 * // ...
 * .list((listBuilder, data) => {
 *   data.legalContextsAndSubcontexts.forEach(([context, subcontexts]) => {
 *     subcontexts.forEach((subcontext) => {
 *       listBuilder.item(() => `"${context}", "${subcontext}"`);
 *     });
 *   });
 *   return listBuilder;
 * })
 * ```
 *
 * This is a potential future direction. It might not be possible to align
 * the types dynamically like this here, so it's not attempted in the first
 * pass.
 * If we find a good way of supporting this, it might be more readable.
 * ```typescript
 * // ...
 * .items(data.legalContextsAndSubcontexts, 'contextAndSubcontexts', (i, [_, subcontexts]) => i
 *   .items(subcontexts, 'subcontext', i => i
 *     .item`"${'context'}", "${'subcontext'}"`
 *   )
 * )
 * ```
 */
export class ListBuilder<Params extends Record<string, any> = {}> {
  // We collect builder data and postpone the actual building of ListItems
  // until the `build` method is called.
  // This allows us to pass the user supplied data to the builder functions.
  private listBuilderData: (
    | {
        type: 'item';
        func: (data: Params) => ListItem;
      }
    | {
        type: 'list';
        func: (data: Params) => List | null;
      }
    | {
      type: 'items';
      func: (data: Params) => List | null;
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
    builderFunction: (data: Params) => string,
  ): ListBuilder<Params>;
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
    ...keys: (keyof Params)[]
  ): ListBuilder<Params>;
  /**
   * This is the implementation signature of the item methods. Do not use this directly.
   */
  item(
    stringsOrBuilderFunction:
      | TemplateStringsArray
      | ((data: Params) => string),
    ...keys: (keyof Params)[]
  ): ListBuilder<Params> {
    if (stringsOrBuilderFunction instanceof Function) {
      const func = stringsOrBuilderFunction as (data: Params) => string;
      this.listBuilderData.push({
        type: 'item',
        func: (data: Params) => {
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
        func: (data: Params) => {
          const headingStr = compile<Params>(strings, ...keys);
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
    listBuilderFunction: ListBuilderFunction<Params>,
  ): ListBuilder<Params> {
    this.listBuilderData.push({
      type: 'list',
      func: (data: Params) => {
        const newBuilder = new ListBuilder<Params>();
        const builderOrNull = listBuilderFunction(newBuilder, data);
        if (builderOrNull !== undefined && builderOrNull !== null) {
          return builderOrNull.build(data);
        } else {
          return null;
        }
      },
    });
    return this;
  }

  items<T>(
    itemsIterable: Iterable<T>,
    itemsBuilderFunction: ItemsBuilderFunction<Params, T>,
  ): ListBuilder<Params> {
    this.listBuilderData.push({
      type: 'items',
      func: (data: Params) => {
        const newBuilder = new ListBuilder<Params>();
        let index = 0;
        for (const item of itemsIterable) {
          itemsBuilderFunction(newBuilder, item, index++);
        }
        const builtList = newBuilder.build(data);
        return builtList;
      },
    })
    return this;
  }

  build(data: Params): List {
    return {
      type: 'list',
      items: this.listBuilderData.map((item) => {
        switch (item.type) {
          case 'list':
            // add as a sublist
            const listOrNull = item.func(data);
            return listOrNull === null ? null : {
              content: listOrNull,
            };
          case 'item':
            return item.func(data);
          case 'items':
            // merge the items from the items list to this list
            const itemsOrNull = item.func(data);
            return itemsOrNull === null ? null : itemsOrNull.items;
          default:
            throw new Error(
              `Unknown item type: ${(item as { type: string }).type}`,
            );
        }
      }).filter((item) => item !== null).flat(),
    };
  }
}
