import { ContentBuilderImpl } from "./content-builder.js";
import { TableCellBuilder, TableCellBuilderImpl } from "./table-cell-builder.js";
import { Paragraph, TableCell, TableRow } from "./types.js";

export type TableRowBuilderFunction<
  Params extends Record<string, any> = {},
> = (
  builder: TableRowBuilder<Params>,
) => TableRowBuilderWoHeader<Params> | undefined | null;

export interface TableRowBuilder<Params extends Record<string, any> = {}> {
  cell(
      builderFunction: (builder: TableCellBuilder<Params>) => TableCellBuilder<Params> | undefined | null,
  ): TableRowBuilder<Params>;
  header(
    builderFunction: (data: Params) => string,
  ): TableRowBuilderWoHeader<Params>;
  header(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): TableRowBuilderWoHeader<Params>;
}

export interface TableRowBuilderWoHeader<Params extends Record<string, any> = {}> {
  cell(
      builderFunction: (builder: TableCellBuilder<Params>) => TableCellBuilder<Params> | undefined | null,
  ): TableRowBuilderWoHeader<Params>;
};

type TableRowBuilderImplCellDatum<Params extends Record<string, any>> = {
  type: 'cell';
  func: (data: Params) => TableCell;
};

type TableRowBuilderImplHeaderDatum<Params extends Record<string, any>> = {
  type: 'header';
  func: (data: Params) => Paragraph;
};

export class TableRowBuilderImpl<Params extends Record<string, any> = {}> implements TableRowBuilder<Params>, TableRowBuilderWoHeader<Params> {
  private builderData: (
    | TableRowBuilderImplCellDatum<Params>
    | TableRowBuilderImplHeaderDatum<Params>
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
        type: 'cell',
        func: (data: Params) => newBuilder.build(data),
      });
    }
    return this;
  }

  header(
    builderFunction: (data: Params) => string,
  ): TableRowBuilder<Params>;
  header(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): TableRowBuilder<Params>;
  header(
    stringsOrBuilderFunction:
      | TemplateStringsArray
      | ((data: Params) => string),
    ...keys: (keyof Params)[]
  ): TableRowBuilder<Params> {
    return ContentBuilderImpl.defineParagraph<Params, TableRowBuilder<Params>>(
      this,
      (paragraphData) => this.builderData.push({
        type: 'header',
        func: paragraphData.func,
      }),
      stringsOrBuilderFunction,
      ...keys
    );
  }

  build(data: Params): TableRow {
    const cells = this.builderData
      .filter((datum) => datum.type === 'cell')
      .map((datum) => datum.func(data))
      .filter((datum) => datum !== undefined && datum !== null);
    const maybeHeader = this.builderData
      .find((datum) => datum.type === 'header');
    return {
      type: 'table-row',
      cells,
      rowHeader: maybeHeader
        ? {
          type: 'table-header-cell',
          contents: maybeHeader.func(data),
        }
        : undefined,
    };
  }
}
 