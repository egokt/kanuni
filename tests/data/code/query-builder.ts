import { Kanuni } from "../../../src/index.js";

Kanuni.newQuery<{ title: string }>()
  .prompt(p => p
    .heading`Section ${'title'}`
    .paragraph`This is a simple paragraph with title: ${'title'}`
    // this is a placeholder for the section that will include the chat history
    // it is optional, mainly to be used for customizing the heading when
    // formatting as a single text prompt
    .memorySection(c => c
      .heading`Chat history Section`
      .paragraph`Here are the things you can find in the chat history...`
    )
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
