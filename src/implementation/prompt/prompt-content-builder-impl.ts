import {
  ListBuilderFunction,
  Memory,
  PromptContentBuilder,
  PromptContentWoMemoryBuilder,
  Section,
  SectionBuilderFunction,
  SectionWoSubsectionBuilderFunction,
  TableBuilderFunction,
} from "../../developer-api/index.js";
import { PromptContentWoToolsBuilder } from "../../developer-api/prompt/prompt-content-builder.js";
import {
  ContentBuilderImpl,
  ContentBuilderImplListDatum,
  ContentBuilderImplParagraphDatum,
  ContentBuilderImplTableDatum,
} from "./content-builder-impl.js";
import { SectionBuilderImpl } from "./section-builder-impl.js";

export type PromptContentBuilderImplSectionDatum<Params extends Record<string, any>, Role extends string, ToolName extends string> =
  {
    type: "section";
    func: (data: Params) => Section<Role, ToolName>;
    isMemorySection?: boolean;
  };

type PromptContentBuilderImplDatum<Params extends Record<string, any>, Role extends string, ToolName extends string> =
  | ContentBuilderImplParagraphDatum<Params>
  | ContentBuilderImplTableDatum<Params>
  | ContentBuilderImplListDatum<Params>
  | PromptContentBuilderImplSectionDatum<Params, Role, ToolName>;

export class PromptContentBuilderImpl<
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string
>
  implements PromptContentBuilder<Params>
{
  private builderData: PromptContentBuilderImplDatum<Params, Role, ToolName>[];

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
    return SectionBuilderImpl.defineSection<Params, PromptContentBuilder<Params>, Role, ToolName>(
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
        Role,
        ToolName
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
        Role,
        ToolName
      >(
        this,
        (builderData) =>
          this.builderData.push({
            type: builderData.type,
            func: builderData.func,
            isMemorySection: false,
          }),
        builderFunction,
      );
  }

  build(data: Params, memory?: Memory<Role, ToolName>): Section<Role, ToolName> {
    const contents = this.builderData
      .map((datum) => {
        if (datum.type === "section" && datum.isMemorySection) {
          const sectionData = datum.func(data);
          return {
            type: "section",
            contents: sectionData.contents,
            heading: sectionData.heading,
            memory: memory
              ? memory
              : {
                  type: "memory",
                  contents: [],
                },
          } as Section<Role, ToolName>;
        } else {
          return datum.func(data);
        }
      })
      .filter((content) => content !== undefined && content !== null);
    return {
      type: "section",
      contents,
    };
  }
}
