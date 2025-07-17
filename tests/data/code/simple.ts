import { Kanuni } from '../../../src/index.js';

Kanuni.newQuery<{ title: string }>()
  .prompt(p => p
    .section((s) => s
      .heading`Subsection 1.1`
      .section((s) => s
        .paragraph`some paragraph`
        .heading`some heading`
        // @ts-expect-error
        .heading`another heading for the same section - error`
      )
      .paragraph`This is the introduction ${'title'} section.`
      .paragraph((data) => `This is the introduction ${data.title} section.`)
      .paragraph`It may include a document if the condition is met.`
      .list((l) => l
        .item`List item 1`
        .item`List item 2`
      )
    )
    // section without a paragraph
    .section(s => s
      .paragraph`This is the second section ${'title'}`
    )
  );
