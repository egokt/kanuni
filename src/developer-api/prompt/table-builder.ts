import { TableRowBuilder, TableRowBuilderImpl } from "./table-row-builder.js";
import { Table, TableRow } from "./types.js";

export type TableBuilderFunction<
  BuilderData extends Record<string, any> = {},
> = (
  builder: TableBuilder<BuilderData>,
) => TableBuilder<BuilderData> | undefined | null;

export interface TableBuilder<Params extends Record<string, any> = {}> {
  row(
    builderFunction: (builder: TableRowBuilder<Params>) => TableRowBuilder<Params> | undefined | null,
  ): TableBuilder<Params>;
}

export class TableBuilderImpl<Params extends Record<string, any> = {}> implements TableBuilder<Params> {
  private builderData: (
    { func: (data: Params) => TableRow }
  )[];

  constructor() {
    this.builderData = [];
  }

  row(
    builderFunction: (builder: TableRowBuilder<Params>) => TableRowBuilder<Params> | undefined | null,
  ): TableBuilder<Params> {
    const newBuilder = new TableRowBuilderImpl<Params>();
    const builderOrNull = builderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      this.builderData.push({
        func: (data: Params) => newBuilder.build(data),
      });
    }
    return this;
  }

  build(data: Params): Table {
    // FIXME
    data;
    return {
      type: 'table',
      // FIXME
      rows: [],
    };
  }
}
 