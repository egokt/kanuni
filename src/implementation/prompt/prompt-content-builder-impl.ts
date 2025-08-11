import {
  ListBuilderFunction,
  Memory,
  Prompt,
  PromptContentBuilder,
  PromptContentWoMemoryBuilder,
  PromptContentWoToolsBuilder,
  SectionBuilderFunction,
  SectionWoSubsectionBuilderFunction,
  TableBuilderFunction,
  Tool,
  ToolRegistry,
} from "../../developer-api/index.js";
import {
  ContentBuilderImpl,
  ContentBuilderImplListDatum,
  ContentBuilderImplParagraphDatum,
  ContentBuilderImplTableDatum,
} from "./content-builder-impl.js";
import {
  SectionBuilderImpl,
  SectionBuilderImplSectionDatum
} from "./section-builder-impl.js";

type PromptContentBuilderImplDatum<Params extends Record<string, any>> =
  | ContentBuilderImplParagraphDatum<Params>
  | ContentBuilderImplTableDatum<Params>
  | ContentBuilderImplListDatum<Params>
  | SectionBuilderImplSectionDatum<Params>;

export class PromptContentBuilderImpl<
  Params extends Record<string, any>,
  Role extends string,
  ToolsType extends Tool<any, any>,
>
  implements PromptContentBuilder<Params> {
  private builderData: PromptContentBuilderImplDatum<Params>[];

  constructor() {
    this.builderData = [];
  }

  paragraph(builderFunction: (data: Params) => string): PromptContentBuilder<Params>;
  paragraph(strings: TemplateStringsArray, ...keys: (keyof Params)[]): PromptContentBuilder<Params>;
  paragraph(
    stringsOrBuilderFunction: TemplateStringsArray | ((data: Params) => string),
    ...keys: (keyof Params)[]
  ): PromptContentBuilder<Params> {
    return ContentBuilderImpl.defineParagraph<Params, PromptContentBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      stringsOrBuilderFunction,
      ...keys,
    );
  }

  list(builderFunction: ListBuilderFunction<Params>): PromptContentBuilder<Params> {
    return ContentBuilderImpl.defineList<Params, PromptContentBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      builderFunction,
    );
  }

  table(builderFunction: TableBuilderFunction<Params>): PromptContentBuilder<Params> {
    return ContentBuilderImpl.defineTable<Params, PromptContentBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      builderFunction,
    );
  }

  section(builderFunction: SectionBuilderFunction<Params>): PromptContentBuilder<Params> {
    return SectionBuilderImpl.defineSection<Params, PromptContentBuilder<Params>, Role>(
      this,
      this.builderData.push.bind(this.builderData),
      builderFunction,
    );
  }

  memorySection(
    builderFunction: SectionWoSubsectionBuilderFunction<Params>
  ): PromptContentWoMemoryBuilder<Params> {
    return SectionBuilderImpl
      .defineSection<
        Params,
        PromptContentWoMemoryBuilder<Params>,
        Role
      >(
        this,
        (builderData) =>
          this.builderData.push({
            type: builderData.type,
            func: builderData.func,
            isMemorySection: true,
          }),
        builderFunction,
        true,
      );
  }

  toolsSection(
    builderFunction: SectionWoSubsectionBuilderFunction<Params>
  ): PromptContentWoToolsBuilder<Params> {
    return SectionBuilderImpl
      .defineSection<
        Params,
        PromptContentWoToolsBuilder<Params>,
        Role
      >(
        this,
        (builderData) =>
          this.builderData.push({
            type: builderData.type,
            func: builderData.func,
            isToolsSection: true,
          }),
        builderFunction,
      );
  }

  build(data: Params): Prompt {
    const contents = this.builderData
      .map((datum) => datum.func(data))
      .filter((content) => content !== undefined && content !== null);
    return {
      type: "prompt",
      contents,
    };
  }
}
