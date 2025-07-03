import { TableCellBuilder } from "./table-cell-builder.js";
import { TableCell, TableRow } from "./types.js";

export type TableRowBuilderFunction<
  BuilderData extends Record<string, any> = {},
> = (
  builder: TableRowBuilder<BuilderData>,
) => TableRowBuilder<BuilderData> | undefined | null;

export class TableRowBuilder<BuilderData extends Record<string, any> = {}> {
  private builderData: (
    { func: (data: BuilderData) => TableCell }
  )[];

  constructor() {
    this.builderData = [];
  }

  cell(
    builderFunction: (builder: TableCellBuilder<BuilderData>) => TableCellBuilder<BuilderData> | undefined | null,
  ): TableRowBuilder<BuilderData> {
    const newBuilder = new TableCellBuilder<BuilderData>();
    const builderOrNull = builderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      this.builderData.push({
        func: (data: BuilderData) => builderOrNull.build(data),
      });
    }
    return this;
  }

  build(data: BuilderData): TableRow {
    return {
      type: 'table-row',
      // FIXME
      cells: [],
    };
  }
}
 