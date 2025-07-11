import { Kanuni } from '../../../src/index.js';

Kanuni.newQuery<{ title: string, exampleItems: [string, string[]][] }>()
  .prompt(p => p
    .list((l, data) => l
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
      .items(data.exampleItems, (i, [context, subcontexts]) => i
        .items(subcontexts, (i, subcontext) => i
          .item(_ => `"${context}", "${subcontext}"`)
        )
      )
      .items(data.exampleItems, (i, [context, subcontexts]) =>
        subcontexts.map((subcontext) => i
          .item(_ => `"${context}", "${subcontext}"`)
        )
      )
    )
    .list((listBuilder, data) => {
      data.exampleItems.forEach(([context, subcontexts]) => {
        subcontexts.forEach((subcontext) => {
          listBuilder.item(() => `"${context}", "${subcontext}"`);
        });
      });
      return listBuilder;
      })
  );