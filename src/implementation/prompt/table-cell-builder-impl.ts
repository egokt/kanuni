import {
  ContentBuilder,
  ListBuilderFunction,
  TableBuilderFunction,
  TableCell,
  TableCellBuilder,
} from "../../developer-api/index.js";
import {
  ContentBuilderImpl,
  ContentBuilderImplListDatum,
  ContentBuilderImplParagraphDatum,
  ContentBuilderImplTableDatum,
} from "./content-builder-impl.js";

type TableCellBuilderImplDatum<Params extends Record<string, any>> =
  | ContentBuilderImplParagraphDatum<Params>
  | ContentBuilderImplTableDatum<Params>
  | ContentBuilderImplListDatum<Params>;

export class TableCellBuilderImpl<Params extends Record<string, any> = {}>
  implements TableCellBuilder<Params>
{
  private builderData: TableCellBuilderImplDatum<Params>[];

  constructor() {
    this.builderData = [];
  }

  paragraph(builderFunction: (data: Params) => string): ContentBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): ContentBuilder<Params>;
  paragraph(
    stringsOrBuilderFunction: TemplateStringsArray | ((data: Params) => string),
    ...keys: (keyof Params)[]
  ): ContentBuilder<Params> {
    return ContentBuilderImpl.defineParagraph<Params, ContentBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      stringsOrBuilderFunction,
      ...keys,
    );
  }

  list: (
    builderFunction: ListBuilderFunction<Params>,
  ) => ContentBuilder<Params> = (builderFunction) =>
    ContentBuilderImpl.defineList<Params, ContentBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      builderFunction,
    );

  table: (
    builderFunction: TableBuilderFunction<Params>,
  ) => ContentBuilder<Params> = (builderFunction) =>
    ContentBuilderImpl.defineTable<Params, ContentBuilder<Params>>(
      this,
      this.builderData.push.bind(this.builderData),
      builderFunction,
    );

  build(data: Params): TableCell {
    const contents = this.builderData
      .map((datum) => datum.func(data))
      .filter((datum) => datum !== undefined && datum !== null);
    return {
      type: "table-cell",
      contents,
    };
  }
}
