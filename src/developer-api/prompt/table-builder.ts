import { TableRowBuilderFunction } from "./table-row-builder.js";

export type TableBuilderFunction<
  BuilderData extends Record<string, any> = {},
> = (
  builder: TableBuilder<BuilderData>,
) => TableBuilderWoColumnHeaders<BuilderData> | undefined | null;

export interface TableBuilder<Params extends Record<string, any> = {}> {
  row(
    builderFunction: TableRowBuilderFunction<Params>,
  ): TableBuilder<Params>;
  columnHeaders(
    func: (data: Params) => string[] | undefined | null,
  ): TableBuilderWoColumnHeaders<Params>;
};

export interface TableBuilderWoColumnHeaders<Params extends Record<string, any> = {}> {
  row(
    builderFunction: TableRowBuilderFunction<Params>,
  ): TableBuilderWoColumnHeaders<Params>;
};
