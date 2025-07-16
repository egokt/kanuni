import {
  ListBuilderFunction,
  Memory,
  Section,
  SectionBuilder,
  SectionBuilderFunction,
  SectionContentBuilder,
  TableBuilderFunction,
} from "../../developer-api/index.js";
import { ContentBuilderImpl, ContentBuilderImplListDatum, ContentBuilderImplParagraphDatum, ContentBuilderImplTableDatum } from "./context-builder-impl.js";
import { compile } from "./string-template-helpers.js";

export type SectionBuilderImplSectionDatum<Params extends Record<string, any>> = {
  type: 'section';
  func: (data: Params) => Section;
  isMemorySection?: boolean;
};

export type SectionBuilderImplHeadingDatum<Params extends Record<string, any>> = {
  type: 'heading';
  func: (data: Params) => string;
};

type SectionBuilderImplDatum<Params extends Record<string, any>> =
  | ContentBuilderImplParagraphDatum<Params>
  | ContentBuilderImplTableDatum<Params>
  | ContentBuilderImplListDatum<Params>
  | SectionBuilderImplSectionDatum<Params>;

export class SectionBuilderImpl<Params extends Record<string, any> = {}> implements SectionBuilder<Params> {
  private builderData: SectionBuilderImplDatum<Params>[];
  private headingData?: SectionBuilderImplHeadingDatum<Params>;

  constructor() {
    this.builderData = [];
  }

  heading(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionContentBuilder<Params> {
    this.headingData = {
      type: 'heading',
      func: (data: Params) => {
        const headingStr = compile<Params>(strings, ...keys);
        return headingStr(data);
      },
    };
    return this;
  }

  list: (
    builderFunction: ListBuilderFunction<Params>,
  ) => SectionBuilder<Params> =
    (builderFunction) =>
      ContentBuilderImpl.defineList<Params, SectionBuilder<Params>>(
        this,
        this.builderData.push.bind(this.builderData),
        builderFunction
      );

  table: (
    builderFunction: TableBuilderFunction<Params>,
  ) => SectionBuilder<Params> =
    (builderFunction) =>
      ContentBuilderImpl.defineTable<Params, SectionBuilder<Params>>(
        this,
        this.builderData.push.bind(this.builderData),
        builderFunction
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
  ): SectionBuilder<Params> {
    return ContentBuilderImpl.defineParagraph<Params, SectionBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      stringsOrBuilderFunction,
      ...keys
    );
  }

  section: (
    builderFunction: SectionBuilderFunction<Params>,
  ) => SectionBuilder<Params> =
    (builderFunction) =>
      SectionBuilderImpl.defineSection<Params, SectionBuilder<Params>>(
        this,
        this.builderData.push.bind(this.builderData),
        builderFunction,
      );

  // Note: it will be checked at the query builder level that there is only
  // one memory section in the query. So we allow multiple memory sections
  // in this builder.
  memorySection: (
    builderFunction: SectionBuilderFunction<Params>,
  ) => SectionBuilder<Params> =
    (builderFunction) =>
      SectionBuilderImpl.defineSection<Params, SectionBuilder<Params>>(
        this,
        builderData => this.builderData.push({
          type: builderData.type,
          func: builderData.func,
          isMemorySection: true,
        }),
        builderFunction,
        true,
      );

  build(data: Params, memory?: Memory): Section {
    const contents = this.builderData
      .map(datum => {
        if (datum.type === 'section' && datum.isMemorySection) {
          const sectionData = datum.func(data);
          return {
            type: 'section',
            contents: sectionData.contents,
            heading: sectionData.heading,
            memory: memory ? memory : {
              type: 'memory',
              contents: [],
            },
          } as Section;
        } else {
          return datum.func(data);
        }
      })
      .filter(content => content !== undefined && content !== null);
    return {
      type: 'section',
      contents,
      heading: this.headingData !== undefined ? this.headingData.func(data) : undefined,
    };
  }

  static defineSection<Params extends Record<string, any>, Builder extends (SectionBuilder<Params> | SectionContentBuilder<Params>)> (
    builder: Builder,
    pushToBuilderData: (builderData: SectionBuilderImplSectionDatum<Params>) => void,
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
}