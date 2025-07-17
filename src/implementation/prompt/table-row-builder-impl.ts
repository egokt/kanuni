import {
  Paragraph,
  TableCell,
  TableCellBuilder,
  TableRow,
  TableRowBuilder,
  TableRowBuilderWoHeader,
} from "../../developer-api/index.js";
import { ContentBuilderImpl } from "./context-builder-impl.js";
import { TableCellBuilderImpl } from "./table-cell-builder-impl.js";

type TableRowBuilderImplCellDatum<Params extends Record<string, any>> = {
  type: "cell";
  func: (data: Params) => TableCell;
};

type TableRowBuilderImplHeaderDatum<Params extends Record<string, any>> = {
  type: "header";
  func: (data: Params) => Paragraph;
};

export class TableRowBuilderImpl<Params extends Record<string, any> = {}>
  implements TableRowBuilder<Params>, TableRowBuilderWoHeader<Params>
{
  private builderData: (
    | TableRowBuilderImplCellDatum<Params>
    | TableRowBuilderImplHeaderDatum<Params>
  )[];

  constructor() {
    this.builderData = [];
  }

  cell(
    builderFunction: (
      builder: TableCellBuilder<Params>,
    ) => TableCellBuilder<Params> | undefined | null,
  ): TableRowBuilder<Params> {
    const newBuilder = new TableCellBuilderImpl<Params>();
    const builderOrNull = builderFunction(newBuilder);
    if (builderOrNull !== undefined && builderOrNull !== null) {
      this.builderData.push({
        type: "cell",
        func: (data: Params) => newBuilder.build(data),
      });
    }
    return this;
  }

  header(builderFunction: (data: Params) => string): TableRowBuilder<Params>;
  header(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): TableRowBuilder<Params>;
  header(
    stringsOrBuilderFunction: TemplateStringsArray | ((data: Params) => string),
    ...keys: (keyof Params)[]
  ): TableRowBuilder<Params> {
    return ContentBuilderImpl.defineParagraph<Params, TableRowBuilder<Params>>(
      this,
      (paragraphData) =>
        this.builderData.push({
          type: "header",
          func: paragraphData.func,
        }),
      stringsOrBuilderFunction,
      ...keys,
    );
  }

  build(data: Params): TableRow {
    const cells = this.builderData
      .filter((datum) => datum.type === "cell")
      .map((datum) => datum.func(data))
      .filter((datum) => datum !== undefined && datum !== null);
    const maybeHeader = this.builderData.find(
      (datum) => datum.type === "header",
    );
    return {
      type: "table-row",
      cells,
      rowHeader: maybeHeader
        ? {
            type: "table-header-cell",
            contents: maybeHeader.func(data),
          }
        : undefined,
    };
  }
}
