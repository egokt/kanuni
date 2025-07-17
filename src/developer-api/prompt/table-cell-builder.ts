import { ContentBuilder } from "./content-builder.js";
import { ListBuilderFunction } from "./list-builder.js";
import { TableBuilderFunction } from "./table-builder.js";

export type TableCellBuilderFunction<
  BuilderData extends Record<string, any> = {},
> = (
  builder: TableCellBuilder<BuilderData>,
) => TableCellBuilder<BuilderData> | undefined | null;

export interface TableCellBuilder<Params extends Record<string, any> = {}>
  extends ContentBuilder<Params> {
  paragraph(
    builderFunction: (data: Params) => string,
  ): TableCellBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): TableCellBuilder<Params>;
  list(builderFunction: ListBuilderFunction<Params>): TableCellBuilder<Params>;
  table(
    builderFunction: TableBuilderFunction<Params>,
  ): TableCellBuilder<Params>;
}
