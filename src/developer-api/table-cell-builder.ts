import { ContentBuilder, ContentBuilderImpl, ContentBuilderImplListDatum, ContentBuilderImplParagraphDatum, ContentBuilderImplTableDatum } from "./content-builder.js";
import { ListBuilderFunction } from "./list-builder.js";
import { TableBuilderFunction } from "./table-builder.js";
import { TableCell } from "./types.js";

export type TableCellBuilderFunction<
  BuilderData extends Record<string, any> = {},
> = (
  builder: TableCellBuilder<BuilderData>,
) => TableCellBuilder<BuilderData> | undefined | null;

export interface TableCellBuilder<Params extends Record<string, any> = {}> extends ContentBuilder<Params> {
  paragraph(
    builderFunction: (data: Params) => string,
  ): TableCellBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): TableCellBuilder<Params>;
  list(
    builderFunction: ListBuilderFunction<Params>,
  ): TableCellBuilder<Params>;
  table(
    builderFunction: TableBuilderFunction<Params>,
  ): TableCellBuilder<Params>;
}

type TableCellBuilderImplDatum<Params extends Record<string, any>> =
  | ContentBuilderImplParagraphDatum<Params>
  | ContentBuilderImplTableDatum<Params>
  | ContentBuilderImplListDatum<Params>;

export class TableCellBuilderImpl<Params extends Record<string, any> = {}> implements TableCellBuilder<Params> {
  private builderData: TableCellBuilderImplDatum<Params>[];

  constructor() {
    this.builderData = [];
  }

  paragraph(
    builderFunction: (data: Params) => string,
  ): ContentBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): ContentBuilder<Params>;
  paragraph(
    stringsOrBuilderFunction:
      | TemplateStringsArray
      | ((data: Params) => string),
    ...keys: (keyof Params)[]
  ): ContentBuilder<Params> {
    return ContentBuilderImpl.defineParagraph<Params, ContentBuilder<Params>>(
      this,
      this.builderData.push,
      stringsOrBuilderFunction,
      ...keys
    );
  }

  list: (
    builderFunction: ListBuilderFunction<Params>,
  ) => ContentBuilder<Params> =
    (builderFunction) =>
      ContentBuilderImpl.defineList<Params, ContentBuilder<Params>>(
        this, this.builderData.push, builderFunction
      );

  table: (
    builderFunction: TableBuilderFunction<Params>,
  ) => ContentBuilder<Params> =
    (builderFunction) =>
      ContentBuilderImpl.defineTable<Params, ContentBuilder<Params>>(
        this, this.builderData.push, builderFunction
      );

  build(data: Params): TableCell {
    return {
      type: 'table-cell',
      // FIXME
    };
  }
}
 