import { TableRowBuilder } from "./table-row-builder.js";
import { Table, TableRow } from "./types.js";

export type TableBuilderFunction<
  BuilderData extends Record<string, any> = {},
> = (
  builder: TableBuilder<BuilderData>,
) => TableBuilder<BuilderData> | undefined | null;

export class TableBuilder<BuilderData extends Record<string, any> = {}> {
  private builderData: (
    { func: (data: BuilderData) => TableRow }
  )[];

  constructor() {
    this.builderData = [];
  }

  row(
    builderFunction: (builder: TableRowBuilder<BuilderData>) => TableRowBuilder<BuilderData> | undefined | null,
  ): TableBuilder<BuilderData> {
    const newBuilder = new TableRowBuilder<BuilderData>();
    const builderOrNull = builderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      this.builderData.push({
        func: (data: BuilderData) => builderOrNull.build(data),
      });
    }
    return this;
  }

  build(data: BuilderData): Table {
    return {
      type: 'table',
      // FIXME
      rows: [],
    };
  }
}
 