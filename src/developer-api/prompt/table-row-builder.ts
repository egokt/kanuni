import { TableCellBuilder, TableCellBuilderImpl } from "./table-cell-builder.js";
import { TableCell, TableRow } from "./types.js";

export type TableRowBuilderFunction<
  BuilderData extends Record<string, any> = {},
> = (
  builder: TableRowBuilder<BuilderData>,
) => TableRowBuilder<BuilderData> | undefined | null;

export interface TableRowBuilder<Params extends Record<string, any> = {}> {
  cell(
      builderFunction: (builder: TableCellBuilder<Params>) => TableCellBuilder<Params> | undefined | null,
  ): TableRowBuilder<Params>;
}

export class TableRowBuilderImpl<Params extends Record<string, any> = {}> implements TableRowBuilder<Params> {
  private builderData: (
    { func: (data: Params) => TableCell }
  )[];

  constructor() {
    this.builderData = [];
  }

  cell(
    builderFunction: (builder: TableCellBuilder<Params>) => TableCellBuilder<Params> | undefined | null,
  ): TableRowBuilder<Params> {
    const newBuilder = new TableCellBuilderImpl<Params>();
    const builderOrNull = builderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      this.builderData.push({
        func: (data: Params) => newBuilder.build(data),
      });
    }
    return this;
  }

  build(data: Params): TableRow {
    // FIXME
    data;
    return {
      type: 'table-row',
      // FIXME
      cells: [],
    };
  }
}
 