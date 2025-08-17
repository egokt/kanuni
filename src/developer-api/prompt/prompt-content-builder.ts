import { ListBuilderFunction } from "./list-builder.js";
import { SectionBuilderFunction, SectionContentBuilder, SectionWoSubsectionBuilderFunction } from "./section-builder.js";
import { TableBuilderFunction } from "./table-builder.js";

export type PromptContentBuilderFunction<Params extends Record<string, any> = {}> = (
  promptContentBuilder: PromptContentBuilder<Params>,
) =>
  | PromptContentBuilder<Params>
  | PromptContentWoMemoryBuilder<Params>
  | PromptContentWoToolsBuilder<Params>
  | PromptContentWoOutputSpecsBuilder<Params>
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
  outputSpecsSection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => PromptContentWoOutputSpecsBuilder<Params>;
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
  ) => PromptContentWoMemoryAndToolsBuilder<Params>;
  outputSpecsSection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => PromptContentWoMemoryAndOutputSpecsBuilder<Params>;
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
  ) => PromptContentWoMemoryAndToolsBuilder<Params>;
  outputSpecsSection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => PromptContentWoOutputSpecsAndToolsBuilder<Params>;
}

export interface PromptContentWoOutputSpecsBuilder<Params extends Record<string, any> = {}>
  extends SectionContentBuilder<Params> {
  paragraph(builderFunction: (data: Params) => string): PromptContentWoOutputSpecsBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): PromptContentWoOutputSpecsBuilder<Params>;
  list(builderFunction: ListBuilderFunction<Params>): PromptContentWoOutputSpecsBuilder<Params>;
  table(builderFunction: TableBuilderFunction<Params>): PromptContentWoOutputSpecsBuilder<Params>;
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): PromptContentWoOutputSpecsBuilder<Params>;
  memorySection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => PromptContentWoMemoryAndOutputSpecsBuilder<Params>;
  toolsSection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => PromptContentWoOutputSpecsAndToolsBuilder<Params>;
}

export interface PromptContentWoMemoryAndToolsBuilder<Params extends Record<string, any> = {}>
  extends SectionContentBuilder<Params> {
  paragraph(builderFunction: (data: Params) => string): PromptContentWoMemoryAndToolsBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): PromptContentWoMemoryAndToolsBuilder<Params>;
  list(builderFunction: ListBuilderFunction<Params>): PromptContentWoMemoryAndToolsBuilder<Params>;
  table(builderFunction: TableBuilderFunction<Params>): PromptContentWoMemoryAndToolsBuilder<Params>;
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): PromptContentWoMemoryAndToolsBuilder<Params>;
  outputSpecsSection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => SectionContentBuilder<Params>;
}

export interface PromptContentWoOutputSpecsAndToolsBuilder<Params extends Record<string, any> = {}>
  extends SectionContentBuilder<Params> {
  paragraph(builderFunction: (data: Params) => string): PromptContentWoOutputSpecsAndToolsBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): PromptContentWoOutputSpecsAndToolsBuilder<Params>;
  list(builderFunction: ListBuilderFunction<Params>): PromptContentWoOutputSpecsAndToolsBuilder<Params>;
  table(builderFunction: TableBuilderFunction<Params>): PromptContentWoOutputSpecsAndToolsBuilder<Params>;
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): PromptContentWoOutputSpecsAndToolsBuilder<Params>;
  memorySection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => SectionContentBuilder<Params>;
}

export interface PromptContentWoMemoryAndOutputSpecsBuilder<Params extends Record<string, any> = {}>
  extends SectionContentBuilder<Params> {
  paragraph(builderFunction: (data: Params) => string): PromptContentWoMemoryAndOutputSpecsBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): PromptContentWoMemoryAndOutputSpecsBuilder<Params>;
  list(builderFunction: ListBuilderFunction<Params>): PromptContentWoMemoryAndOutputSpecsBuilder<Params>;
  table(builderFunction: TableBuilderFunction<Params>): PromptContentWoMemoryAndOutputSpecsBuilder<Params>;
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): PromptContentWoMemoryAndOutputSpecsBuilder<Params>;
  toolsSection: (
    builderFunction: SectionWoSubsectionBuilderFunction<Params>,
  ) => SectionContentBuilder<Params>;
}
