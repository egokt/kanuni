import { SectionBuilder, SectionBuilderFunction } from './section-builder.js';
import { SectionContentBuilderFunction } from './section-content-builder.js';
import { Section } from './types.js';

export class PromptBuilder<BuilderData extends Record<string, any> = {}> {
  // private sections: Section[];
  private sectionData: (
    { func: (data: BuilderData) => Section }
  )[];

  constructor({ sections }: { sections?: Section[] } = {}) {
    // this.sections = sections || [];
    this.sectionData = [];
  }

  section(
    sectionBuilderFunction: SectionBuilderFunction<BuilderData> | SectionContentBuilderFunction<BuilderData>,
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
