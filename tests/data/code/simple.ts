import { PromptBuilder } from '../../../src/index.js';

const p = new PromptBuilder<{ title: string }>()
  .section((s) => s
    .heading`Section ${'title'}`
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
      ),
    ),
  );

// const p = new PromptBuilder<{ introIncludeDocument: boolean } }>(p => p
//   .section(s => s
//     .heading`Introduction ${'introIncludeDocument' ? 'with Document' : ''}`
//     .content(c => c
//       .paragraph`This is the introduction section.`
//       .paragraph`It may include a document if the condition is met.`
//       .list(l => l
//         .item`List item 1`
//         .item`List item 2`
//       )
//     )
//   )
//   .section(s => s
//     .heading`Conclusion`
//     .content(c => c
//       .paragraph`This is the conclusion section.`
//     )
//   )
// ).build({
//   introIncludeDocument: true,
// })
