import {
  ListBuilderFunction,
  PromptContentWoMemoryBuilder,
  Section,
  SectionBuilder,
  SectionBuilderFunction,
  SectionContentBuilder,
  SectionWoSubsectionBuilderFunction,
  TableBuilderFunction,
} from "../../developer-api/index.js";
import {
  ContentBuilderImpl,
  ContentBuilderImplListDatum,
  ContentBuilderImplParagraphDatum,
  ContentBuilderImplTableDatum,
} from "./content-builder-impl.js";
import { compile } from "./string-template-helpers.js";

export type SectionBuilderImplSectionDatum<Params extends Record<string, any>> =
  {
    type: "section";
    func: (data: Params) => Section;
    isMemorySection?: boolean;
    isToolsSection?: boolean;
    isOutputSpecsSection?: boolean;
  };

export type SectionBuilderImplHeadingDatum<Params extends Record<string, any>> =
  {
    type: "heading";
    func: (data: Params) => string;
  };

type SectionBuilderImplDatum<Params extends Record<string, any>> =
  | ContentBuilderImplParagraphDatum<Params>
  | ContentBuilderImplTableDatum<Params>
  | ContentBuilderImplListDatum<Params>
  | SectionBuilderImplSectionDatum<Params>;

export class SectionBuilderImpl<Params extends Record<string, any>, Role extends string>
  implements SectionBuilder<Params>
{
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
      type: "heading",
      func: (data: Params) => {
        const headingStr = compile<Params>(strings, ...keys);
        return headingStr(data);
      },
    };
    return this;
  }

  list: (
    builderFunction: ListBuilderFunction<Params>,
  ) => SectionBuilder<Params> = (builderFunction) =>
    ContentBuilderImpl.defineList<Params, SectionBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      builderFunction,
    );

  table: (
    builderFunction: TableBuilderFunction<Params>,
  ) => SectionBuilder<Params> = (builderFunction) =>
    ContentBuilderImpl.defineTable<Params, SectionBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      builderFunction,
    );

  paragraph(builderFunction: (data: Params) => string): SectionBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionBuilder<Params>;
  paragraph(
    stringsOrBuilderFunction: TemplateStringsArray | ((data: Params) => string),
    ...keys: (keyof Params)[]
  ): SectionBuilder<Params> {
    return ContentBuilderImpl.defineParagraph<Params, SectionBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      stringsOrBuilderFunction,
      ...keys,
    );
  }

  section: (
    builderFunction: SectionBuilderFunction<Params>,
  ) => SectionBuilder<Params> = (builderFunction) =>
    SectionBuilderImpl.defineSection<Params, SectionBuilder<Params>, Role>(
      this,
      this.builderData.push.bind(this.builderData),
      builderFunction,
    );

  build(data: Params): Section {
    const contents = this.builderData
      .map((datum) => datum.func(data))
      .filter((content) => content !== undefined && content !== null);
    return {
      type: "section",
      contents,
      heading:
        this.headingData !== undefined
          ? this.headingData.func(data)
          : undefined,
    };
  }

  static defineSection<
    Params extends Record<string, any>,
    Builder extends SectionBuilder<Params> | SectionContentBuilder<Params> | PromptContentWoMemoryBuilder<Params>,
    Role extends string,
  >(
    builder: Builder,
    pushToBuilderData: (
      builderData: SectionBuilderImplSectionDatum<Params>,
    ) => void,
    builderFunction: SectionBuilderFunction<Params> | SectionWoSubsectionBuilderFunction<Params>,
  ): Builder {
    const newBuilder = new SectionBuilderImpl<Params, Role>();
    const builderOrNull = builderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      pushToBuilderData({
        type: "section",
        func: (data: Params) => newBuilder.build(data),
      });
    }
    return builder;
  }
}
