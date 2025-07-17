import { ContentBuilder } from "./content-builder.js";
import { ListBuilderFunction } from "./list-builder.js";
import { TableBuilderFunction } from "./table-builder.js";

export type SectionBuilderFunction<Params extends Record<string, any> = {}> = (
  sectionBuilder: SectionBuilder<Params>,
) => SectionBuilder<Params> | SectionContentBuilder<Params> | undefined | null;

export type SectionBuilderWoMemoryFunction<
  Params extends Record<string, any> = {},
> = (
  sectionBuilder: SectionContentWoMemoryBuilder<Params>,
) => SectionContentWoMemoryBuilder<Params> | undefined | null;

export interface SectionBuilder<Params extends Record<string, any> = {}>
  extends SectionContentBuilder<Params> {
  paragraph(builderFunction: (data: Params) => string): SectionBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionBuilder<Params>;
  list(builderFunction: ListBuilderFunction<Params>): SectionBuilder<Params>;
  table(builderFunction: TableBuilderFunction<Params>): SectionBuilder<Params>;
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): SectionBuilder<Params>;
  heading(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionContentBuilder<Params>;
  memorySection: (
    builderFunction: SectionBuilderFunction<Params>,
  ) => SectionBuilder<Params>;
}

export interface SectionContentBuilder<Params extends Record<string, any> = {}>
  extends SectionContentWoMemoryBuilder<Params> {
  memorySection: (
    builderFunction: SectionBuilderFunction<Params>,
  ) => SectionContentBuilder<Params>;
}

export interface SectionContentWoMemoryBuilder<
  Params extends Record<string, any> = {},
> extends ContentBuilder<Params> {
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
}
