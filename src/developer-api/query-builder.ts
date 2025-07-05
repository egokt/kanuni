import { PromptBuilderFunction, PromptBuilderImpl } from "./prompt/prompt-builder.js";
import { Prompt } from "./prompt/types.js";

export interface QueryBuilder<Params extends Record<string, any> = {}> {
  prompt(
    promptBuilderFunction: PromptBuilderFunction<Params>,
  ): QueryBuilder<Params>;
}

export class QueryBuilderImpl<Params extends Record<string, any> = {}> implements QueryBuilder<Params> {
  private promptData: ((data: Params) => Prompt) | null;

  constructor() {
    this.promptData = null;
  }

  prompt(
    promptBuilderFunction: PromptBuilderFunction<Params>,
  ): QueryBuilder<Params> {
    const newBuilder = new PromptBuilderImpl<Params>();
    const sectionBuilderOrNull = promptBuilderFunction(newBuilder);
    if (sectionBuilderOrNull !== undefined && sectionBuilderOrNull !== null) {
      this.promptData = (data) => newBuilder.build(data);
    }
    return this;

  }

  build(data: Params) {
    // FIXME
    return '';
  }
}
