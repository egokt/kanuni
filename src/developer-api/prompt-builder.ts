import { SectionBuilder, SectionBuilderFunction } from './section-builder.js';
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
    const newSectionBuilder = new SectionBuilder<BuilderData>();
    const sectionBuilderOrNull = sectionBuilderFunction(newSectionBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.sectionData.push({
        func: (data) => sectionBuilderOrNull.build(data),
      })
    }
    return this;
  }

  build(data: BuilderData) {
    // FIXME
    return '';
  }
}
