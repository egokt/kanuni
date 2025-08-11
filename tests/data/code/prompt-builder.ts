import { TextualMarkdownFormatter } from "../../../src/index.js";
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
      .heading`Another memory section isn't allowed`
    )
  )
  .build({});

new TextualMarkdownFormatter().format(q1);

// Should not allow two memory sections in the same prompt when tools section is present
// prettier-ignore
const q2 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .memorySection(s => s
      .heading`Your memory`
      .paragraph`Remember this.`
      // @ts-expect-error
      .section(s => s
        .paragraph`A subsection in a memory section isn't allowed`
      )
    )
    .toolsSection(ts => ts
      .heading`Tools section`
    )
    // @ts-expect-error
    .memorySection(s => s
      .heading`Another memory section isn't allowed`
    )
  )
  .build({});

new TextualMarkdownFormatter().format(q2);

// Should not allow two memory sections in the same prompt when tools and output specs sections are present
// prettier-ignore
const q2_1 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .memorySection(s => s
      .heading`Your memory`
      .paragraph`Remember this.`
      // @ts-expect-error
      .section(s => s
        .paragraph`A subsection in a memory section isn't allowed`
      )
    )
    .toolsSection(ts => ts
      .heading`Tools`
    )
    .outputSpecsSection(os => os
      .heading`Output specifications`
    )
    // @ts-expect-error
    .memorySection(s => s
      .heading`Another memory section isn't allowed`
    )
  )
  .build({});

new TextualMarkdownFormatter().format(q2_1);

// Should not allow two tools sections in the same prompt
// prettier-ignore
const q3 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .toolsSection(ts => ts
      .heading`Tools section`
      .paragraph`Here are the tools`
      // @ts-expect-error
      .heading`A second heading isn't allowed`
    )
    .paragraph`Another paragraph`
    // @ts-expect-error
    .toolsSection(s => s
      .heading`Another tools section isn't allowed`
    )
  )
  .build({});

new TextualMarkdownFormatter().format(q3);

// Should not allow two tools sections in the same prompt when memory section is present
// prettier-ignore
const q4 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .toolsSection(ts => ts
      .heading`Tools section`
      .paragraph`Here are the tools`
      // @ts-expect-error
      .section(s => s
        .paragraph`A subsection in a tools section isn't allowed`
      )
    )
    .memorySection(ms => ms
      .heading`Memory section`
    )
    // @ts-expect-error
    .toolsSection(ts => ts
      .heading`Another tools section isn't allowed`
    )
  )
  .build({});

new TextualMarkdownFormatter().format(q4);

// Should not allow two tools sections in the same prompt when memory and output specs sections are present
// prettier-ignore
const q4_1 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .toolsSection(ts => ts
      .heading`Tools section`
      .paragraph`Here are the tools`
      // @ts-expect-error
      .section(s => s
        .paragraph`A subsection in a tools section isn't allowed`
      )
    )
    .memorySection(ms => ms
      .heading`Memory section`
    )
    .outputSpecsSection(os => os
      .heading`Output Specifications`
    )
    // @ts-expect-error
    .toolsSection(ts => ts
      .heading`Another tools section isn't allowed`
    )
  )
  .build({});

new TextualMarkdownFormatter().format(q4_1);

// Should allow heading, paragraph, list, and table in tools, output specs, and memory sections
// prettier-ignore
const q5 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .memorySection(ms => ms
      .heading`Memory Section`
      .paragraph`This is a paragraph in memory section.`
      .list(l => l
        .item`An item`
        .item`Another item`
      )
      .table(t => t
        .row(r => r
          .cell(c => c
            .paragraph`Cell content`
          )
        )
      )
    )
    .toolsSection(ts => ts
      .heading`Tools Section`
      .paragraph`This is a paragraph in tools section.`
      .list(l => l
        .item`An item`
        .item`Another item`
      )
      .table(t => t
        .row(r => r
          .cell(c => c
            .paragraph`Cell content`
          )
        )
      )
    )
    .outputSpecsSection(os => os
      .heading`Output Specifications Section`
      .paragraph`This is a paragraph in output specs section.`
      .list(l => l
        .item`An item`
        .item`Another item`
      )
      .table(t => t
        .row(r => r
          .cell(c => c
            .paragraph`Cell content`
          )
        )
      )
    )
  )
  .build({});

new TextualMarkdownFormatter().format(q5);

// Should not allow two output specs sections in the same prompt
// prettier-ignore
const q6 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .outputSpecsSection(os => os
      .heading`Output Specifications`
      .paragraph`Here are the output specifications`
      // @ts-expect-error
      .heading`A second heading isn't allowed`
    )
    .paragraph`Another paragraph`
    // @ts-expect-error
    .outputSpecsSection(s => s
      .heading`Another output specs section isn't allowed`
    )
  )
  .build({});

new TextualMarkdownFormatter().format(q6);

// Should not allow two output specs sections in the same prompt when memory section is present
// prettier-ignore
const q7 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .outputSpecsSection(s => s
      .heading`Output Specifications`
      .paragraph`Here are the output specs`
      // @ts-expect-error
      .section(s => s
        .paragraph`A subsection in a output specs section isn't allowed`
      )
    )
    .memorySection(ms => ms
      .heading`Memory section`
    )
    // @ts-expect-error
    .outputSpecsSection(s => s
      .heading`Another output specs section isn't allowed`
    )
  )
  .build({});

new TextualMarkdownFormatter().format(q7);

// Should not allow two output specs sections in the same prompt when memory and tools sections are present
// prettier-ignore
const q8 = Kanuni.newQuery<{}>()
  .prompt(p => p
    .paragraph`Hello`
    .outputSpecsSection(s => s
      .heading`Output Specifications`
      .paragraph`Here are the output specs`
      // @ts-expect-error
      .section(s => s
        .paragraph`A subsection in a output specs section isn't allowed`
      )
    )
    .memorySection(ms => ms
      .heading`Memory section`
    )
    .toolsSection(ts => ts
      .heading`Toolss`
    )
    // @ts-expect-error
    .outputSpecsSection(os => os
      .heading`Another output specs section isn't allowed`
    )
  )
  .build({});

new TextualMarkdownFormatter().format(q8);

