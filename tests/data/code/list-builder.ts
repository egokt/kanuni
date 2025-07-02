import { PromptBuilder } from '../../../src/index.js';

const p = new PromptBuilder<{ title: string }>()
  .section((s) => s
    .list((l) => l
      .item`List item 1 with title: ${'title'}`
      .item((data) => `List item 2 with title: ${data.title}`)
      //@ts-expect-error
      .item`List item 3 with title: ${'somethingElse'}` // This will cause an error because 'somethingElse' is not defined in the data
      //@ts-expect-error
      .item((data) => `List item 4 with title: ${data.somethingElse}`) // This will also cause an error
      .list((l) => l
        .item`List item 1 with title: ${'title'}`
        .item((data) => `List item 2 with title: ${data.title}`)
        //@ts-expect-error
        .item`List item 3 with title: ${'somethingElse'}` // This will cause an error because 'somethingElse' is not defined in the data
        //@ts-expect-error
        .item((data) => `List item 4 with title: ${data.somethingElse}`) // This will also cause an error
      )
    )
  );