import { PromptBuilder } from '../../../src/index.js';

const p = new PromptBuilder<{ title: string }>()
  .section((s) => s
    .table((t) => t
      .row((r) => r
        .cell((c) => c
        )
      )
    )
  );
