import { ListBuilderFunction } from "./list-builder.js";
import { SectionBuilderFunction, SectionContentBuilder, SectionWoSubsectionBuilderFunction } from "./section-builder.js";
import { TableBuilderFunction } from "./table-builder.js";

export type PromptContentBuilderFunction<Params extends Record<string, any> = {}> = (
  promptContentBuilder: PromptContentBuilder<Params>,
) =>
  | PromptContentBuilder<Params>
  | PromptContentWoMemoryBuilder<Params>
  | PromptContentWoToolsBuilder<Params>
  | SectionContentBuilder<Params>
  | undefined
  | null;

export interface PromptContentBuilder<Params extends Record<string, any> = {}>
  extends SectionContentBuilder<Params> {
  paragraph(builderFunction: (data: Params) => string): PromptContentBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): PromptContentBuilder<Params>;
  list(builderFunction: ListBuilderFunction<Params>): PromptContentBuilder<Params>;
  table(builderFunction: TableBuilderFunction<Params>): PromptContentBuilder<Params>;
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): PromptContentBuilder<Params>;
  memorySection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => PromptContentWoMemoryBuilder<Params>;
  toolsSection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => PromptContentWoToolsBuilder<Params>;
}

export interface PromptContentWoMemoryBuilder<Params extends Record<string, any> = {}>
  extends SectionContentBuilder<Params> {
  paragraph(builderFunction: (data: Params) => string): PromptContentWoMemoryBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): PromptContentWoMemoryBuilder<Params>;
  list(builderFunction: ListBuilderFunction<Params>): PromptContentWoMemoryBuilder<Params>;
  table(builderFunction: TableBuilderFunction<Params>): PromptContentWoMemoryBuilder<Params>;
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): PromptContentWoMemoryBuilder<Params>;
  toolsSection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => SectionContentBuilder<Params>;
}

export interface PromptContentWoToolsBuilder<Params extends Record<string, any> = {}>
  extends SectionContentBuilder<Params> {
  paragraph(builderFunction: (data: Params) => string): PromptContentWoToolsBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): PromptContentWoToolsBuilder<Params>;
  list(builderFunction: ListBuilderFunction<Params>): PromptContentWoToolsBuilder<Params>;
  table(builderFunction: TableBuilderFunction<Params>): PromptContentWoToolsBuilder<Params>;
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): PromptContentWoToolsBuilder<Params>;
  memorySection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => SectionContentBuilder<Params>;
}
