import { Kanuni } from '../../../src/index.js';

const p = Kanuni.newQuery<{ title: string }>()
  .prompt(p => p
    .table((t) => t
      .row((r) => r
        .cell((c) => c
          .paragraph`Cell 1 with title: ${'title'}` // This will work
          .paragraph((data) => `Cell 1 with title: ${data.title}`) // This will also work
          //@ts-expect-error
          .paragraph`Cell 1 with title: ${'somethingElse'}` // This will cause an error because 'somethingElse' is not defined in the data
          .list(l => l
            .item((data) => `List item 1 with title: ${data.title}`)
            .item((data) => `List item 2 with title: ${data.title}`)
          )
          .table(t => t
            // should not expose build function here
            //@ts-expect-error
            .build(data => ({ title: 'title' }))
          )
          .table(t => t
            .row(r => r
              // should not expose build function here
              //@ts-expect-error
              .build(data => ({ title: 'title' }))
            )
          )
          .table(t => t
            .row(r => r
              .cell(c => c
                // should not expose build function here
                //@ts-expect-error
                .build(data => ({ title: 'title' }))
              )
            )
          )
          .table(t => t
            .row(r => r
              .cell(c => c
                .paragraph`Nested Cell 1 with title: ${'title'}`
                .paragraph((data) => `Nested Cell 1 with title: ${data.title}`)
              )
            )
            .row(r => r
              .cell(c => c
                .paragraph`Nested Cell 2 with title: ${'title'}`
              )
            )
          )
        )
      )
    )
  );
