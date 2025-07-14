import { ListBuilder, ListBuilderFunction } from './list-builder.js';
import { SectionBuilder, SectionContentBuilder } from './section-builder.js';
import { compile } from './string-template-helpers.js';
import { TableBuilderFunction, TableBuilderImpl } from './table-builder.js';
import { TableRowBuilder } from './table-row-builder.js';
import { List, Paragraph, Section, Table } from './types.js';

export type ContentBuilderFunction<
  BuilderData extends Record<string, any>,
> = (
  builder: ContentBuilder<BuilderData>,
) => ContentBuilder<BuilderData> | undefined | null;

export interface ContentBuilder<Params extends Record<string, any> = {}> {
  paragraph(
    builderFunction: (data: Params) => string,
  ): ContentBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): ContentBuilder<Params>;
  list(
    builderFunction: ListBuilderFunction<Params>,
  ): ContentBuilder<Params>;
  table(
    builderFunction: TableBuilderFunction<Params>,
  ): ContentBuilder<Params>;
}

export type ContentBuilderImplParagraphDatum<Params extends Record<string, any>> = {
  type: 'paragraph';
  func: (data: Params) => Paragraph;
};

export type ContentBuilderImplTableDatum<Params extends Record<string, any>> = {
  type: 'table';
  func: (data: Params) => Table;
};

export type ContentBuilderImplListDatum<Params extends Record<string, any>> = {
  type: 'list';
  func: (data: Params) => List | null;
};

type ContentBuilderImplDatum<Params extends Record<string, any>> =
  | ContentBuilderImplParagraphDatum<Params>
  | ContentBuilderImplTableDatum<Params>
  | ContentBuilderImplListDatum<Params>;

export class ContentBuilderImpl<Params extends Record<string, any> = {}> implements ContentBuilder<Params> {
  private builderData: ContentBuilderImplDatum<Params>[];

  constructor() {
    this.builderData = [];
  }

  paragraph(
    builderFunction: (data: Params) => string,
  ): ContentBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): ContentBuilder<Params>;
  paragraph(
    stringsOrBuilderFunction:
      | TemplateStringsArray
      | ((data: Params) => string),
    ...keys: (keyof Params)[]
  ): ContentBuilder<Params> {
    return ContentBuilderImpl.defineParagraph<Params, ContentBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      stringsOrBuilderFunction,
      ...keys
    );
  }

  list: (
    builderFunction: ListBuilderFunction<Params>,
  ) => ContentBuilder<Params> =
    (builderFunction) =>
      ContentBuilderImpl.defineList<Params, ContentBuilder<Params>>(
        this,
        this.builderData.push.bind(this.builderData),
        builderFunction,
      );

  table: (
    builderFunction: TableBuilderFunction<Params>,
  ) => ContentBuilder<Params> =
    (builderFunction) =>
      ContentBuilderImpl.defineTable<Params, ContentBuilder<Params>>(
        this,
        this.builderData.push.bind(this.builderData),
        builderFunction,
      );

  build(data: Params): Section {
    const contents = this.builderData
      .map((datum) => {
        switch (datum.type) {
          case 'paragraph':
            return datum.func(data);
          case 'list': {
            const list = datum.func(data);
            return list ? list : null;
          }
          case 'table':
            return datum.func(data);
          default:
            return null;
        }
      })
      .filter((item) => item !== null);
    return {
      type: 'section',
      contents
    };
  }

  static defineList<Params extends Record<string, any>, Builder extends (SectionBuilder<Params> | SectionContentBuilder<Params> | ContentBuilder<Params>)>(
    builder: Builder,
    pushToBuilderData: (builderData: ContentBuilderImplListDatum<Params>) => void,
    listBuilderFunction: ListBuilderFunction<Params>,
  ): Builder {
    pushToBuilderData({
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
    })
    return builder;
    // const newBuilder = new ListBuilder<Params>();
    // const builderOrNull = listBuilderFunction(newBuilder, data);
    // if (builderOrNull !== undefined && builderOrNull !== null) {
    //   pushToBuilderData({
    //     type: 'list',
    //     func: (data: Params) => builderOrNull.build(data),
    //   });
    // }
    // return builder;
  }

  static defineTable<Params extends Record<string, any>, Builder extends (SectionBuilder<Params> | SectionContentBuilder<Params> | ContentBuilder<Params>)>(
    builder: Builder,
    pushToBuilderData: (builderData: ContentBuilderImplTableDatum<Params>) => void,
    tableBuilderFunction: TableBuilderFunction<Params>,
  ): Builder {
    const newBuilder = new TableBuilderImpl<Params>();
    const builderOrNull = tableBuilderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      pushToBuilderData({
        type: 'table',
        func: (data: Params) => newBuilder.build(data),
      });
    }
    return builder;
  }

  static defineParagraph<Params extends Record<string, any>, Builder extends (SectionBuilder<Params> | SectionContentBuilder<Params> | ContentBuilder<Params> | TableRowBuilder<Params>)>(
    builder: Builder,
    pushToBuilderData: (builderData: ContentBuilderImplParagraphDatum<Params>) => void,
    stringsOrBuilderFunction:
      | TemplateStringsArray
      | ((data: Params) => string),
    ...keys: (keyof Params)[]
  ): Builder {
    if (stringsOrBuilderFunction instanceof Function) {
      const func = stringsOrBuilderFunction as (data: Params) => string;
      pushToBuilderData({
        type: 'paragraph',
        func: (data: Params) => {
          const paragraphStr = func(data);
          return { type: 'paragraph', content: paragraphStr } as Paragraph;
        },
      });
    } else {
      const strings = stringsOrBuilderFunction as TemplateStringsArray;
      const paragraphBuilderData: ContentBuilderImplParagraphDatum<Params> = {
        type: 'paragraph' as const,
        func: (data: Params) => {
          const headingStr = compile<Params>(strings, ...keys);
          return {
            type: 'paragraph' as const,
            content: headingStr(data),
          };
        },
      };
      pushToBuilderData(paragraphBuilderData);
    }
    return builder;
  }
}

