import { ContentBuilder } from "./content-builder.js";
import { ListBuilderFunction } from "./list-builder.js";
import { TableBuilderFunction } from "./table-builder.js";

export type SectionBuilderFunction<
  Params extends Record<string, any> = {},
> = (
  sectionBuilder: SectionBuilder<Params>,
) => SectionBuilder<Params> | SectionContentBuilder<Params> | undefined | null;

export type SectionWoSubsectionBuilderFunction<
  Params extends Record<string, any> = {},
> = (
  sectionContentWoSubsectionBuilder: SectionWoSubsectionBuilder<Params>,
) => SectionWoSubsectionBuilder<Params> | SectionWoSubsectionContentBuilder<Params> | undefined | null;

export interface SectionBuilder<
  Params extends Record<string, any> = {},
> extends SectionContentBuilder<Params> {
  heading(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionContentBuilder<Params>;
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
}

export interface SectionContentBuilder<
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

export interface SectionWoSubsectionBuilder<
  Params extends Record<string, any> = {},
> extends SectionWoSubsectionContentBuilder<Params> {
  heading(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionWoSubsectionContentBuilder<Params>;
  paragraph(
    builderFunction: (data: Params) => string,
  ): SectionWoSubsectionBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionWoSubsectionBuilder<Params>;
  list(
    builderFunction: ListBuilderFunction<Params>,
  ): SectionWoSubsectionBuilder<Params>;
  table(
    builderFunction: TableBuilderFunction<Params>,
  ): SectionWoSubsectionBuilder<Params>;
}

export interface SectionWoSubsectionContentBuilder<
  Params extends Record<string, any> = {},
> extends ContentBuilder<Params> {
  paragraph(
    builderFunction: (data: Params) => string,
  ): SectionWoSubsectionContentBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): SectionWoSubsectionContentBuilder<Params>;
  list(
    builderFunction: ListBuilderFunction<Params>,
  ): SectionWoSubsectionContentBuilder<Params>;
  table(
    builderFunction: TableBuilderFunction<Params>,
  ): SectionWoSubsectionContentBuilder<Params>;
}

