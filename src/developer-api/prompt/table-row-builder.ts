import { TableCellBuilder } from "./table-cell-builder.js";

export type TableRowBuilderFunction<Params extends Record<string, any> = {}> = (
  builder: TableRowBuilder<Params>,
) => TableRowBuilderWoHeader<Params> | undefined | null;

export interface TableRowBuilder<Params extends Record<string, any> = {}> {
  cell(
    builderFunction: (
      builder: TableCellBuilder<Params>,
    ) => TableCellBuilder<Params> | undefined | null,
  ): TableRowBuilder<Params>;
  header(
    builderFunction: (data: Params) => string,
  ): TableRowBuilderWoHeader<Params>;
  header(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): TableRowBuilderWoHeader<Params>;
}

export interface TableRowBuilderWoHeader<
  Params extends Record<string, any> = {},
> {
  cell(
    builderFunction: (
      builder: TableCellBuilder<Params>,
    ) => TableCellBuilder<Params> | undefined | null,
  ): TableRowBuilderWoHeader<Params>;
}
