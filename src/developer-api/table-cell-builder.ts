import { TableRowBuilder } from "./table-row-builder.js";
import { TableCell } from "./types.js";

export type TableCellBuilderFunction<
  BuilderData extends Record<string, any> = {},
> = (
  builder: TableCellBuilder<BuilderData>,
) => TableCellBuilder<BuilderData> | undefined | null;

export class TableCellBuilder<BuilderData extends Record<string, any> = {}> {
  private builderData: (
    { func: (data: BuilderData) => TableCell }
  )[];

  constructor() {
    this.builderData = [];
  }

  build(data: BuilderData): TableCell {
    return {
      type: 'table-cell',
      // FIXME
    };
  }
}
 