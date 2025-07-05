import { SectionBuilderFunction, SectionBuilderImpl } from './section-builder.js';
import { Prompt, Section } from './types.js';

export type PromptBuilderFunction<
  Params extends Record<string, any> = {},
> = (
  builder: PromptBuilder<Params>,
) => PromptBuilder<Params> | undefined | null;

export interface PromptBuilder<Params extends Record<string, any> = {}> {
  section(
    builderFunction: SectionBuilderFunction<Params>,
  ): PromptBuilder<Params>;
}

export class PromptBuilderImpl<Params extends Record<string, any> = {}> {
  private sectionData: (
    { func: (data: Params) => Section }
  )[];

  constructor() {
    this.sectionData = [];
  }

  section(
    sectionBuilderFunction: SectionBuilderFunction<Params>,
  ): PromptBuilder<Params> {
    const newBuilder = new SectionBuilderImpl<Params>();
    const sectionBuilderOrNull = sectionBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.sectionData.push({
        func: (data) => newBuilder.build(data),
      })
    }
    return this;
  }

  build(data: Params): Prompt {
    // FIXME
    return {
      type: 'prompt',
      contents: [],
    }
  }
}
