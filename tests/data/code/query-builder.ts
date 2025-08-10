import z from "zod";
import { Kanuni, RoleDefault, TextualMarkdownFormatter, withDescription } from "../../../src/index.js";
import { Tool } from "../../../src/developer-api/types.js";

// *****************************************************************************
// Should be ok without memory and output
// prettier-ignore
const q1 = Kanuni.newQuery<{ title: string }>()
  .prompt(p => p.paragraph`Hello`)
  .build({ title: '123' });

new TextualMarkdownFormatter().format(q1);


// *****************************************************************************
// Should be ok with memory and output
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
  .memory(m => m
    .utterance('user', () => 'This is a user message')
    .utterance('assistant', 'Milou AI', () => 'This is an assistant message')
    // This design is in progress.
    // .toolInvocation(
    //   'toolName',
    //   { param1: 'value1', param2: 'value2' }, // jsonRPC?
    //   'The output of the tool', // should this be in json or just a string?
    //   'success', // TODO: result status, e.g. 'success' or 'error', - add error message if status is 'error' (optional?)
    // )
  )
  .outputJson(z.strictObject({
    reasoning: z.string().describe(withDescription({
      title: 'Reasoning',
      description: 'The reasoning behind the assistant\'s response.',
    })),
    type: z.string().describe(withDescription({
      title: 'Type',
      description: 'The type of the response, e.g. "text", "image"',
      exampleValues: ['text', 'image'],
    })),
    result: z.string(),
  }))
  .build({ title: 'My Title' })

new TextualMarkdownFormatter().format(query);


// *****************************************************************************
// Should align tools and tools type param
// prettier-ignore
const q3 = Kanuni.newQuery<{}, RoleDefault, Tool<'tool1', { a: string; }> | Tool<'tool2', {}>>()
  .prompt(p => p
    .paragraph`Hello`
  )
  .tools({
    tool1: {
      name: 'tool1',
      description: 'something',
      parameters: z.strictObject({ a: z.string() })
    }
  })
  .build({});

new TextualMarkdownFormatter().format(q3);
