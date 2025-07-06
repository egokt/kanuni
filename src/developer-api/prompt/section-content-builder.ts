import { ContentBuilder, ContentBuilderImpl, ContentBuilderImplListDatum, ContentBuilderImplParagraphDatum, ContentBuilderImplTableDatum } from './content-builder.js';
import { ListBuilderFunction } from './list-builder.js';
import { SectionBuilder, SectionBuilderFunction, SectionBuilderImpl } from './section-builder.js';
import { TableBuilderFunction } from './table-builder.js';
import { Section } from './types.js';

export type SectionContentBuilderFunction<
  BuilderData extends Record<string, any>,
> = (
  builder: SectionContentBuilder<BuilderData>,
) => SectionContentBuilder<BuilderData> | undefined | null;

export interface SectionContentBuilder<Params extends Record<string, any> = {}> extends ContentBuilder<Params> {
  paragraph(
    builderFunction: (data: Params) => string,
  ): SectionContentBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionContentBuilder<Params>;
  list(
    builderFunction: ListBuilderFunction<Params>,
  ): SectionContentBuilder<Params>;
  table(
    builderFunction: TableBuilderFunction<Params>,
  ): SectionContentBuilder<Params>;
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): SectionContentBuilder<Params>;
  memorySection: (
    builderFunction: SectionBuilderFunction<Params>,
  ) => SectionContentBuilder<Params>;
}

export type SectionContentBuilderImplSectionDatum<Params extends Record<string, any>> = {
  type: 'section';
  func: (data: Params) => Section;
  isMemorySection?: boolean;
};

type SectionContentBuilderImplDatum<Params extends Record<string, any>> =
  | ContentBuilderImplParagraphDatum<Params>
  | ContentBuilderImplTableDatum<Params>
  | ContentBuilderImplListDatum<Params>
  | SectionContentBuilderImplSectionDatum<Params>;

export class SectionContentBuilderImpl<Params extends Record<string, any> = {}> {
  private builderData: SectionContentBuilderImplDatum<Params>[];

  constructor() {
    this.builderData = [];
  }

  list: (
    builderFunction: ListBuilderFunction<Params>,
  ) => SectionContentBuilder<Params> =
    (builderFunction) =>
      ContentBuilderImpl.defineList<Params, SectionContentBuilder<Params>>(
        this, this.builderData.push, builderFunction
      );

  table: (
    builderFunction: TableBuilderFunction<Params>,
  ) => SectionContentBuilder<Params> =
    (builderFunction) =>
      ContentBuilderImpl.defineTable<Params, SectionContentBuilder<Params>>(
        this, this.builderData.push, builderFunction
      );

  paragraph(
    builderFunction: (data: Params) => string,
  ): SectionContentBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionContentBuilder<Params>;
  paragraph(
    stringsOrBuilderFunction:
      | TemplateStringsArray
      | ((data: Params) => string),
    ...keys: (keyof Params)[]
  ): SectionContentBuilder<Params> {
    return ContentBuilderImpl.defineParagraph<Params, SectionContentBuilder<Params>>(
      this,
      this.builderData.push,
      stringsOrBuilderFunction,
      ...keys
    );
  }

  section: (
    builderFunction: SectionBuilderFunction<Params>,
  ) => SectionContentBuilder<Params> =
    (builderFunction) =>
      SectionContentBuilderImpl.defineSection<Params, SectionContentBuilder<Params>>(
        this,
        this.builderData.push,
        builderFunction,
      );

  memorySection: (
    builderFunction: SectionBuilderFunction<Params>,
  ) => SectionContentBuilder<Params> =
    (builderFunction) =>
      SectionContentBuilderImpl.defineSection<Params, SectionContentBuilder<Params>>(
        this,
        this.builderData.push,
        builderFunction,
        true,
      );

  static defineSection<Params extends Record<string, any>, Builder extends (SectionBuilder<Params> | SectionContentBuilder<Params>)> (
    builder: Builder,
    pushToBuilderData: (builderData: SectionContentBuilderImplSectionDatum<Params>) => void,
    builderFunction: SectionBuilderFunction<Params>,
    isMemorySection?: boolean,
  ): Builder {
    const newBuilder = new SectionBuilderImpl<Params>();
    const builderOrNull = builderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      pushToBuilderData({
        type: 'section',
        func: (data: Params) => newBuilder.build(data),
        isMemorySection,
      });
    }
    return builder;
  }

  build(data: Params): Section {
    return { contents: [] };
  }
}

