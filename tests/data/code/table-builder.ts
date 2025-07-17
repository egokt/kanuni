import { Kanuni } from "../../../src/index.js";

// prettier-ignore
Kanuni.newQuery<{ title: string }>()
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
            .columnHeaders((data) => [
              `Column Header 1 with title: ${data.title}`,
              `Column Header 2 with title: ${data.title}`,
            ])
            .row(r => r
              .header`Row header with title: ${'title'}`
              .cell(c => c
                .paragraph`Nested Cell 1 with title: ${'title'}`
                .paragraph((data) => `Nested Cell 1 with title: ${data.title}`)
              )
              // should not allow a second call to header in the same row
              //@ts-expect-error
              .header`Row header with title: ${'title'}`
            )
            // row header can come last
            .row(r => r
              .cell(c => c
                .paragraph`Nested Cell 2 with title: ${'title'}`
              )
              .header`Row header with title: ${'title'}`
              //@ts-expect-error
              .header`Row header with title: ${'title'}`
            )
            // row header can come first
            .row(r => r
              .header`Row header with title: ${'title'}`
              .cell(c => c
                .paragraph`Nested Cell 2 with title: ${'title'}`
              )
              //@ts-expect-error
              .header`Row header with title: ${'title'}`
            )
            // row header can come in between cells
            .row(r => r
              .cell(c => c
                .paragraph`Nested Cell 2 with title: ${'title'}`
              )
              .header`Row header with title: ${'title'}`
              .cell(c => c
                .paragraph`Nested Cell 2 with title: ${'title'}`
              )
              //@ts-expect-error
              .header`Row header with title: ${'title'}`
            )
          )
        )
      )
    )
  );
