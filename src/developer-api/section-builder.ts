import { ListBuilderFunction } from './list-builder.js';
import {
  SectionContentBuilder,
} from './section-content-builder.js';
import { compile } from './string-template-helpers.js';
import { Section } from './types.js';

export type SectionBuilderFunction<
  BuilderData extends Record<string, any> = {},
> = (
  sectionBuilder: SectionBuilder<BuilderData>,
) => SectionBuilder<BuilderData> | SectionContentBuilder<BuilderData> | undefined | null;

export class SectionBuilder<BuilderData extends Record<string, any> = {}> extends SectionContentBuilder<BuilderData> {
  // partialSection: Partial<Section>;
  // builderData: Partial<{
  //   [K in keyof Section]:
  //     | { type: 'value'; value: Section[K] }
  //     | { type: 'builder'; func: (data: BuilderData) => Section[K] };
  // }>;

  private headingData: ((data: BuilderData) => string) | null;

  constructor() {
    // this.partialSection = {};
    super();
    this.headingData = null;
  }

  // heading<T extends Record<string, any>>(strings: TemplateStringsArray, ...keys: (keyof T)[]): SectionBuilder<BuilderData> {
  heading(
    strings: TemplateStringsArray,
    ...keys: (keyof BuilderData)[]
  ): SectionContentBuilder<BuilderData> {
    this.headingData = (data: BuilderData) => {
      const headingStr = compile<BuilderData>(strings, ...keys);
      return headingStr(data);
    };
    return this;
  }

  list: (
    builderFunction: ListBuilderFunction<BuilderData>,
  ) => SectionBuilder<BuilderData> =
    (builderFunction) =>
      this.defineList<BuilderData, SectionBuilder<BuilderData>>(
        this, builderFunction
      );

  paragraph(
    builderFunction: (data: BuilderData) => string,
  ): SectionBuilder<BuilderData>;
  paragraph(
    strings: TemplateStringsArray,
    ...keys: (keyof BuilderData)[]
  ): SectionBuilder<BuilderData>;
  paragraph(
    stringsOrBuilderFunction:
      | TemplateStringsArray
      | ((data: BuilderData) => string),
    ...keys: (keyof BuilderData)[]
  ): SectionBuilder<BuilderData> {
    return this.defineParagraph<BuilderData, SectionBuilder<BuilderData>>(
      this,
      stringsOrBuilderFunction,
      ...keys
    );
  }


  // heading<T>: CompileFunction<T extends Record<string, any>> = (strings, ...keys) => {
  //   return compile<T>(strings, ...keys);
  // }

  // headingOld(heading: string): SectionBuilder {
  //   this.partialSection.heading = heading;
  //   return this;
  // }

  // content(contentBuilder: (SegmentsBuilderFunction | SectionBuilderFunction)): SectionBuilder {
  //   this.partialSection.content = content;
  //   return this;
  // }

  // segment(
  //   segmentPartsBuilderFunction: SectionContentBuilderFunction<BuilderData>,
  // ): SectionBuilder<BuilderData> {
  //   if (!this.partialSection.content) {
  //     this.partialSection.content = [];
  //   }
  //   const segmentPartsBuilder = new SectionContentBuilder<BuilderData>();
  //   const segmentPartsBuilderOrNull =
  //     segmentPartsBuilderFunction(segmentPartsBuilder);
  //   if (
  //     segmentPartsBuilderOrNull !== undefined &&
  //     segmentPartsBuilderOrNull !== null
  //   ) {
  //     this.partialSection.content.push(segmentPartsBuilder.build());
  //   }
  //   return this;
  // }

  build(data: BuilderData): Section {
    return { contents: [] };
    // if (!this.partialSection.heading || !this.partialSection.content) {
    //   throw new Error('Section must have a heading and content');
    // }
    // return this.partialSection as Section;
  }
}
