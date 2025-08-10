import { Kanuni } from "../../../src/kanuni.js";

// Should not allow two memory sections in the same prompt
// prettier-ignore
const q1 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .memorySection(s => s
      .heading`Your memory`
      .paragraph`Remember this.`
      // @ts-expect-error
      .heading`Not another heading`
    )
    .paragraph`Another paragraph`
    // @ts-expect-error
    .memorySection(s => s
      .heading`This isn't allowed`
    )
  )
  .build({});

// Should not allow two tools sections in the same prompt
// prettier-ignore
const q2 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .toolsSection(ts => ts
      .heading`Tools section`
    )
    .paragraph`Another paragraph`
    // @ts-expect-error
    .toolsSection(s => s
      .heading`This isn't allowed`
    )
  )