import { ListBuilderFunction } from './list-builder.js';
import { TableBuilderFunction } from './table-builder.js';

export type ContentBuilderFunction<
  BuilderData extends Record<string, any>,
> = (
  builder: ContentBuilder<BuilderData>,
) => ContentBuilder<BuilderData> | undefined | null;

export interface ContentBuilder<Params extends Record<string, any> = {}> {
  paragraph(
    builderFunction: (data: Params) => string,
  ): ContentBuilder<Params>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof Params)[]
  ): ContentBuilder<Params>;
  list(
    builderFunction: ListBuilderFunction<Params>,
  ): ContentBuilder<Params>;
  table(
    builderFunction: TableBuilderFunction<Params>,
  ): ContentBuilder<Params>;
}
