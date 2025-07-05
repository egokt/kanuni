import { ContentBuilderImpl, ContentBuilderImplListDatum, ContentBuilderImplParagraphDatum, ContentBuilderImplTableDatum } from './content-builder.js';
import { ListBuilderFunction } from './list-builder.js';
import {
  SectionContentBuilder,
  SectionContentBuilderImpl,
  SectionContentBuilderImplSectionDatum,
} from './section-content-builder.js';
import { compile } from './string-template-helpers.js';
import { TableBuilderFunction } from './table-builder.js';
import { Section } from './types.js';

export type SectionBuilderFunction<
  Params extends Record<string, any> = {},
> = (
  sectionBuilder: SectionBuilder<Params>,
) => SectionBuilder<Params> | SectionContentBuilder<Params> | undefined | null;

export interface SectionBuilder<Params extends Record<string, any> = {}> extends SectionContentBuilder<Params> {
  paragraph(
    builderFunction: (data: Params) => string,
  ): SectionBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionBuilder<Params>;
  list(
    builderFunction: ListBuilderFunction<Params>,
  ): SectionBuilder<Params>;
  table(
    builderFunction: TableBuilderFunction<Params>,
  ): SectionBuilder<Params>;
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): SectionBuilder<Params>;
  heading(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionContentBuilder<Params>;
}

export type SectionBuilderImplHeadingDatum<Params extends Record<string, any>> = {
  type: 'heading';
  func: (data: Params) => string;
};

type SectionBuilderImplDatum<Params extends Record<string, any>> =
  | ContentBuilderImplParagraphDatum<Params>
  | ContentBuilderImplTableDatum<Params>
  | ContentBuilderImplListDatum<Params>
  | SectionContentBuilderImplSectionDatum<Params>
  | SectionBuilderImplHeadingDatum<Params>;

export class SectionBuilderImpl<Params extends Record<string, any> = {}> implements SectionBuilder<Params> {
  private builderData: SectionBuilderImplDatum<Params>[];

  constructor() {
    this.builderData = [];
  }

  heading(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionContentBuilder<Params> {
    this.builderData.push({
      type: 'heading',
      func: (data: Params) => {
        const headingStr = compile<Params>(strings, ...keys);
        return headingStr(data);
      },
    });
    return this;
  }

  list: (
    builderFunction: ListBuilderFunction<Params>,
  ) => SectionBuilder<Params> =
    (builderFunction) =>
      ContentBuilderImpl.defineList<Params, SectionBuilder<Params>>(
        this, this.builderData.push, builderFunction
      );

  table: (
    builderFunction: TableBuilderFunction<Params>,
  ) => SectionBuilder<Params> =
    (builderFunction) =>
      ContentBuilderImpl.defineTable<Params, SectionBuilder<Params>>(
        this, this.builderData.push, builderFunction
      );

  paragraph(
    builderFunction: (data: Params) => string,
  ): SectionBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionBuilder<Params>;
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
  ) => SectionBuilder<Params> =
    (builderFunction) =>
      SectionContentBuilderImpl.defineSection<Params, SectionBuilder<Params>>(
        this,
        this.builderData.push,
        builderFunction,
      );

  build(data: Params): Section {
    return { contents: [] };
  }
}
