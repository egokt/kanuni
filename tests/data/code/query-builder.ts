import z from "zod";
import { Kanuni, TextualMarkdownFormatter } from "../../../src/index.js";


// Should be ok without memory and output
Kanuni.newQuery<{ title: string }>()
  .prompt(p => p.paragraph`This is a simple paragraph with title: ${'title'}`)
  .build({ title: 'My Title' });

// Larger example with memory and output
// prettier-ignore
const query = Kanuni.newQuery<{ title: string }>()
  .prompt(p => p
    .paragraph`This is a simple paragraph with title: ${'title'}`
    // this is a placeholder for the section that will include the chat history
    // it is optional, mainly to be used for customizing the heading when
    // formatting as a single text prompt
    .memorySection(c => c
      .heading`Chat history Section`
      .paragraph`Here are the things you can find in the chat history...`
    )
    // prompt is like a section, but it does not support a heading
    //@ts-expect-error
    .heading`Section ${'title'}`
  )
  .memory<'user' | 'assistant'>(m => m
    .message('user', () => 'This is a user message')
    .message('assistant', () => 'This is an assistant message')
    // This design is in progress.
    // .toolInvocation(
    //   'toolName',
    //   { param1: 'value1', param2: 'value2' }, // jsonRPC?
    //   'The output of the tool', // should this be in json or just a string?
    //   'success', // TODO: result status, e.g. 'success' or 'error', - add error message if status is 'error' (optional?)
    // )
  )
  .output(o => o.json({
    reasoning: z.string(),
    result: z.string(),
  }))
  .build({ title: 'My Title' })

new TextualMarkdownFormatter().format(query);
