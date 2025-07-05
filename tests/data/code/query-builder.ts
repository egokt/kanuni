import { Kanuni } from "../../../src";

Kanuni.newQuery<{ title: string }>()
  .prompt(p => p
    .section(s => s
      .heading`Section ${'title'}`
      .paragraph`This is a simple paragraph with title: ${'title'}`
    )
    // this is a placeholder for the section that will include the chat history
    // it is optional, mainly to be used for customizing the heading when
    // formatting as a single text prompt
    .memorySection(c => c
      .heading`Chat history Section`
    )
  )
  .memory<'user' | 'assistant'>(m => m
    .message('user', (data) => 'This is a user message')
    .message('assistant', (data) => 'This is an assistant message')
    .toolInvocation(
      'toolName',
      { param1: 'value1', param2: 'value2' }, // jsonRPC?
      'The output of the tool', // should this be in json or just a string?
    )
  )
