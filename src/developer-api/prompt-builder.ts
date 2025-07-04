import { SectionBuilderFunction, SectionBuilderImpl } from './section-builder.js';
import { Section } from './types.js';

export class PromptBuilder<BuilderData extends Record<string, any> = {}> {
  private sectionData: (
    { func: (data: BuilderData) => Section }
  )[];

  constructor() {
    this.sectionData = [];
  }

  section(
    sectionBuilderFunction: SectionBuilderFunction<BuilderData>,
  ): PromptBuilder<BuilderData> {
    const newBuilder = new SectionBuilderImpl<BuilderData>();
    const sectionBuilderOrNull = sectionBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.sectionData.push({
        func: (data) => newBuilder.build(data),
      })
    }
    return this;
  }

  build(data: BuilderData) {
    // FIXME
    return '';
  }
}
