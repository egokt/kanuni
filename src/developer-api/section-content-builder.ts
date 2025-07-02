import { ListBuilder, ListBuilderFunction } from './list-builder.js';
import { SectionBuilder, SectionBuilderFunction } from './section-builder.js';
import { compile } from './string-template-helpers.js';
import { List, Paragraph, Section, Table } from './types.js';

export type SectionContentBuilderFunction<
  BuilderData extends Record<string, any>,
> = (
  builder: SectionContentBuilder<BuilderData>,
) => SectionContentBuilder<BuilderData> | undefined | null;

export class SectionContentBuilder<BuilderData extends Record<string, any> = {}> {
  private builderData: (
    | {
      type: 'paragraph';
      func: (data: BuilderData) => Paragraph;
    }
    | {
      type: 'table';
      func: (data: BuilderData) => Table;
    }
    | {
      type: 'list';
      func: (data: BuilderData) => List;
    }
    | {
      type: 'section';
      func: (data: BuilderData) => Section;
    }
  )[];

  constructor() {
    this.builderData = [];
  }

  section(
    builderFunction: SectionBuilderFunction<BuilderData>,
  ): SectionBuilder<BuilderData> {
    const newBuilder = new SectionBuilder<BuilderData>();
    const builderOrNull = builderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      this.builderData.push({
        type: 'section',
        func: (data: BuilderData) => builderOrNull.build(data),
      });
    }
    return newBuilder;
  }

  paragraph(
    builderFunction: (data: BuilderData) => string,
  ): SectionContentBuilder<BuilderData>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof BuilderData)[]
  ): SectionContentBuilder<BuilderData>;
  paragraph(
    stringsOrBuilderFunction:
      | TemplateStringsArray
      | ((data: BuilderData) => string),
    ...keys: (keyof BuilderData)[]
  ): SectionContentBuilder<BuilderData> {
    return this.defineParagraph<BuilderData, SectionContentBuilder<BuilderData>>(
      this,
      stringsOrBuilderFunction,
      ...keys
    );
    // if (stringsOrBuilderFunction instanceof Function) {
    //   const func = stringsOrBuilderFunction as (data: BuilderData) => string;
    //   this.builderData.push({
    //     type: 'paragraph',
    //     func: (data: BuilderData) => {
    //       const paragraphStr = func(data);
    //       return { type: 'paragraph', content: paragraphStr };
    //     },
    //   });
    // } else {
    //   const strings = stringsOrBuilderFunction as TemplateStringsArray;
    //   const paragraphBuilderData: Extract<
    //     (typeof this.builderData)[number],
    //     { type: 'paragraph'; }
    //   > = {
    //     type: 'paragraph' as const,
    //     func: (data: BuilderData) => {
    //       const headingStr = compile<BuilderData>(strings, ...keys);
    //       return {
    //         type: 'paragraph' as const,
    //         content: headingStr(data),
    //       };
    //     },
    //   };
    //   this.builderData.push(paragraphBuilderData);
    // }
    // return this;
  }

  table(): SectionContentBuilder<BuilderData> {
    // this.segments.push(table);
    return this;
  }

  list: (
    builderFunction: ListBuilderFunction<BuilderData>,
  ) => SectionContentBuilder<BuilderData> =
    (builderFunction) =>
      this.defineList<BuilderData, SectionContentBuilder<BuilderData>>(
        this, builderFunction
      );
  

  // list(
  //   listBuilderFunction: ListBuilderFunction<BuilderData>,
  // ): SectionContentBuilder<BuilderData> {
  //   const newBuilder = new ListBuilder<BuilderData>();
  //   const builderOrNull = listBuilderFunction(newBuilder);
  //   if (builderOrNull !== undefined && builderOrNull !== null) {
  //     this.builderData.push({
  //       type: 'list',
  //       func: (data: BuilderData) => builderOrNull.build(data),
  //     });
  //   }
  //   return this;
  // }

  build(data: BuilderData): Section {
    return { contents: [] };
  }

  // defineList<Builder extends (SectionBuilder<BuilderData> | SectionContentBuilder<BuilderData>)>(
  //   listBuilderFunction: ListBuilderFunction<BuilderData>,
  // ): Builder {
  //     const newBuilder = new ListBuilder<BuilderData>();
  //     const builderOrNull = listBuilderFunction(newBuilder);
  //     if (builderOrNull !== undefined && builderOrNull !== null) {
  //       this.builderData.push({
  //         type: 'list',
  //         func: (data: BuilderData) => builderOrNull.build(data),
  //       });
  //     }
  //     return this;
  // }

  protected defineList<BuilderData extends Record<string, any>, Builder extends (SectionBuilder<BuilderData> | SectionContentBuilder<BuilderData>)>(
    builder: Builder,
    listBuilderFunction: ListBuilderFunction<BuilderData>,
  ): Builder {
      const newBuilder = new ListBuilder<BuilderData>();
      const builderOrNull = listBuilderFunction(newBuilder);
      if (builderOrNull !== undefined && builderOrNull !== null) {
        builder.builderData.push({
          type: 'list',
          func: (data: BuilderData) => builderOrNull.build(data),
        });
      }
      return builder;
  }

  protected defineParagraph<BuilderData extends Record<string, any>, Builder extends (SectionBuilder<BuilderData> | SectionContentBuilder<BuilderData>)>(
    builder: Builder,
    stringsOrBuilderFunction:
      | TemplateStringsArray
      | ((data: BuilderData) => string),
    ...keys: (keyof BuilderData)[]
  ): Builder {
    if (stringsOrBuilderFunction instanceof Function) {
      const func = stringsOrBuilderFunction as (data: BuilderData) => string;
      builder.builderData.push({
        type: 'paragraph',
        func: (data: BuilderData) => {
          const paragraphStr = func(data);
          return { type: 'paragraph', content: paragraphStr } as Paragraph;
        },
      });
    } else {
      const strings = stringsOrBuilderFunction as TemplateStringsArray;
      const paragraphBuilderData: Extract<
        (typeof builder.builderData)[number],
        { type: 'paragraph'; }
      > = {
        type: 'paragraph' as const,
        func: (data: BuilderData) => {
          const headingStr = compile<BuilderData>(strings, ...keys);
          return {
            type: 'paragraph' as const,
            content: headingStr(data),
          };
        },
      };
      builder.builderData.push(paragraphBuilderData);
    }
    return builder;
  }


}

