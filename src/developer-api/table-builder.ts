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

  build(data: BuilderData): Table {
    return {
      type: 'table',
      // FIXME
      rows: [],
    };
  }
}
 