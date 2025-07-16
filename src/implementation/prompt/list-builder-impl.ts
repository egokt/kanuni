import {
  ItemsBuilderFunction,
  List,
  ListBuilder,
  ListBuilderFunction,
  ListItem,
} from "../../developer-api/index.js";
import { compile } from "./string-template-helpers.js";

export class ListBuilderImpl<Params extends Record<string, any> = {}> implements ListBuilder<Params> {
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
        const newBuilder = new ListBuilderImpl<Params>();
        const builderOrNull = listBuilderFunction(newBuilder, data);
        if (builderOrNull !== undefined && builderOrNull !== null) {
          return newBuilder.build(data);
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
        const newBuilder = new ListBuilderImpl<Params>();
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
