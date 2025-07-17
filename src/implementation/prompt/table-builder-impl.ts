import {
  Paragraph,
  Table,
  TableBuilder,
  TableBuilderWoColumnHeaders,
  TableHeaderCell,
  TableRow,
  TableRowBuilderFunction,
} from "../../developer-api/index.js";
import { TableRowBuilderImpl } from "./table-row-builder-impl.js";

type TableBuilderImplRowDatum<Params extends Record<string, any>> = {
  type: "row";
  func: (data: Params) => TableRow;
};

type TableBuilderImplColumnHeaders<Params extends Record<string, any>> = {
  type: "columnHeaders";
  func: (data: Params) => string[] | null;
};

export class TableBuilderImpl<Params extends Record<string, any> = {}>
  implements TableBuilder<Params>, TableBuilderWoColumnHeaders<Params>
{
  private builderData: (
    | TableBuilderImplRowDatum<Params>
    | TableBuilderImplColumnHeaders<Params>
  )[];

  constructor() {
    this.builderData = [];
  }

  row(builderFunction: TableRowBuilderFunction<Params>): TableBuilder<Params> {
    const newBuilder = new TableRowBuilderImpl<Params>();
    const builderOrNull = builderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      this.builderData.push({
        type: "row",
        func: (data: Params) => newBuilder.build(data),
      });
    }
    return this;
  }

  columnHeaders(
    func: (data: Params) => string[] | undefined | null,
  ): TableBuilderWoColumnHeaders<Params> {
    this.builderData.push({
      type: "columnHeaders",
      func: (data: Params) => {
        const headers = func(data);
        return headers !== undefined && headers !== null ? headers : null;
      },
    });
    return this;
  }

  build(data: Params): Table {
    const rows = this.builderData
      .filter((d) => d.type === "row")
      .map((d) => d.func(data))
      .filter((row) => row !== undefined && row !== null);
    const columnHeaders = this.builderData
      .filter((d) => d.type === "columnHeaders")
      .map((d) => d.func(data))
      .find((headers) => headers !== undefined && headers !== null)
      ?.map(
        (header) =>
          ({
            type: "table-header-cell",
            contents: {
              type: "paragraph",
              content: header,
            } as Paragraph,
          }) as TableHeaderCell,
      );
    return {
      type: "table",
      rows,
      columnHeaders,
    };
  }
}
