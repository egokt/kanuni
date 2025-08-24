# Kanuni

**The Prompt-Builder Library for LLM Context Management**

Kanuni is a TypeScript library designed to help developers build structured, type-safe prompts and manage conversation context for Large Language Model (LLM) interactions. It provides a fluent API for creating complex prompts with memory, tools, and structured output specifications.

## Table of Contents

- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Quick Start](#quick-start)
- [Building Prompts](#building-prompts)
- [Managing Memory](#managing-memory)
- [Working with Tools](#working-with-tools)
- [Output Formats](#output-formats)
- [Built-in Formatters](#built-in-formatters)
- [Query Serialization](#query-serialization)
- [Advanced Examples](#advanced-examples)

## Installation

```bash
npm install kanuni
```

## Core Concepts

### Query

A **Query** is the main structure that contains everything needed for an LLM call:

- **Prompt**: The structured content sent to the LLM
- **Memory**: Conversation history and context
- **Tools**: Available functions the LLM can call
- **Output**: Specification for text or JSON responses

Queries can be serialized to JSON strings for storage, transmission, or caching using `Kanuni.serializeQuery()` and restored with `Kanuni.deserializeQuery()`.

### Memory

**Memory** stores conversation history including:

- User and assistant utterances
- Tool calls and their results
- Custom roles and participants

### Prompt Content

Prompts support rich content types:

- Paragraphs with template strings
- Lists and nested lists
- Tables with headers and structured data
- Sections with headings and nested content

### Formatter

**Formatters** convert Kanuni queries into the specific format required by different LLM provider APIs. The core Kanuni library provides the structure and types, while separate packages like `kanuni-openai` provide formatter implementations for specific providers (OpenAI, Anthropic, etc.). Formatters handle the translation between Kanuni's structured format and each provider's expected API format, including prompt formatting, message structure, tool definitions, and response parsing.

## Quick Start

```typescript
import { Kanuni } from "kanuni";
import { z } from "zod";

// Define your data structure
interface MyData {
  userQuestion: string;
  context: string;
}

// Create a simple query
const query = Kanuni.newQuery<MyData>()
  .prompt(
    (p) =>
      p.paragraph`Context: ${"context"}`.paragraph`Question: ${"userQuestion"}`
        .paragraph`Please provide a helpful response.`
  )
  .build({
    userQuestion: "What is TypeScript?",
    context: "The user is learning programming",
  });

console.log(query.prompt);
```

## Building Prompts

### Basic Content Types

#### Paragraphs

```typescript
const query = Kanuni.newQuery<{ name: string; age: number }>()
  .prompt((p) =>
    p.paragraph`Hello, ${"name"}! You are ${"age"} years old.`.paragraph(
      (data) => `Welcome, ${data.name}!`
    )
  )
  .build({ name: "Alice", age: 30 });
```

#### Lists

```typescript
const query = Kanuni.newQuery<{ items: string[] }>()
  .prompt(p =>
    p.paragraph`Shopping list:`
     .list(l =>
       l.item`Buy milk`
        .item`Buy bread`
        .item((data) => `Buy ${data.items[0]}`)
     )
  )
  .build({ items: ["apples"] });

// Using items() to create dynamic lists from arrays
const dynamicQuery = Kanuni.newQuery<{ tasks: string[] }>()
  .prompt(p =>
    p.paragraph`Today's tasks:`
     .list((l, data) =>
       l.items(data.tasks, (i, task) =>
         i.item(_ => task)
     )
  )
  .build({ tasks: ["Review code", "Write tests", "Deploy to production"] });
```

#### Tables

```typescript
const query = Kanuni.newQuery<{
  users: Array<{ name: string; role: string }>;
}>()
  .prompt((p) =>
    p.paragraph`User Information:`.table((t) =>
      t
        .columnHeaders(() => ["Name", "Role"])
        .row((r) =>
          r.cell((c) => c.paragraph`Alice`).cell((c) => c.paragraph`Admin`)
        )
        .row((r) =>
          r.cell((c) => c.paragraph`Bob`).cell((c) => c.paragraph`User`)
        )
    )
  )
  .build({ users: [] });
```

#### Sections

```typescript
const query = Kanuni.newQuery<{ title: string }>()
  .prompt((p) =>
    p.section((s) =>
      s.heading`Instructions for ${"title"}`
        .paragraph`Please follow these steps:`.list(
        (l) =>
          l.item`Step 1: Read the documentation`
            .item`Step 2: Practice with examples`
      )
    )
  )
  .build({ title: "Learning Kanuni" });
```

## Managing Memory

### Basic Memory Usage

```typescript
const query = Kanuni.newQuery<{ userName: string }>()
  .prompt((p) => p.paragraph`How can I help you today?`)
  .memory((m) =>
    m
      .utterance("user", (data) => `Hi, my name is ${data.userName}`)
      .utterance(
        "assistant",
        () => "Hello! Nice to meet you. How can I assist you?"
      )
  )
  .build({ userName: "Alice" });
```

### Tool Calls in Memory

```typescript
type WeatherTool = Tool<"get_weather", { location: string }>;

const query = Kanuni.newQuery<{}, RoleDefault, WeatherTool>()
  .memory((m) =>
    m
      .utterance("user", () => "What's the weather in London?")
      .toolCall("get_weather", '{"location": "London"}', "call-123")
      .toolCallResult("call-123", "Sunny, 22°C")
      .utterance(
        "assistant",
        () => "The weather in London is sunny with a temperature of 22°C."
      )
  )
  .build({});
```

### Memory with Names

```typescript
const query = Kanuni.newQuery()
  .memory((m) =>
    m
      .utterance("user", "Customer", () => "I need help with my order")
      .utterance(
        "assistant",
        "Support Agent",
        () => "I'd be happy to help you with your order"
      )
  )
  .build({});
```

### Reusing Memory

```typescript
// Build memory separately
const memoryBuilder = Kanuni.newMemory<{ prevContext: string }>().utterance(
  "user",
  (data) => `Previous context: ${data.prevContext}`
);

// Extract memory from a previous query
const previousMemory = Kanuni.extractMemoryFromQuery(previousQuery);

// Use in new query
const newQuery = Kanuni.newQuery<{ newInput: string }>()
  .prompt((p) => p.paragraph`New input: ${"newInput"}`)
  .memory((m) =>
    m
      .append(previousMemory?.contents || [])
      .utterance("user", (data) => data.newInput)
  )
  .build({ newInput: "Continue the conversation" });
```

## Working with Tools

### Defining Tools

```typescript
import { z } from "zod";

type SearchTool = Tool<"search", { query: string; limit?: number }>;
type CalculatorTool = Tool<"calculate", { expression: string }>;
type MyTools = SearchTool | CalculatorTool;

const tools: ToolRegistry<MyTools> = {
  search: {
    name: "search",
    description: "Search for information online",
    parameters: {
      query: z.string().describe("The search query"),
      limit: z.number().optional().describe("Maximum number of results"),
    },
  },
  calculate: {
    name: "calculate",
    description: "Perform mathematical calculations",
    parameters: {
      expression: z.string().describe("Mathematical expression to evaluate"),
    },
  },
};
```

### Using Tools in Queries

```typescript
const query = Kanuni.newQuery<{ question: string }, RoleDefault, MyTools>()
  .prompt((p) => p.paragraph`Question: ${"question"}`)
  .tools(tools)
  .memory((m) => m.utterance("user", (data) => data.question))
  .build({ question: "What is 15 * 24?" });
```

## Output Formats

### Text Output (Default)

```typescript
const query = Kanuni.newQuery<{ topic: string }>()
  .prompt((p) => p.paragraph`Explain ${"topic"} in simple terms.`)
  .outputText() // Optional - this is the default
  .build({ topic: "quantum computing" });
```

### JSON Output

```typescript
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  skills: z.array(z.string()),
});

const query = Kanuni.newQuery<{ resume: string }>()
  .prompt(
    (p) =>
      p.paragraph`Extract person information from this resume:`
        .paragraph`${"resume"}`
  )
  .outputJson(PersonSchema, "person_info")
  .build({
    resume: "John Doe, 30 years old, skilled in TypeScript and Python",
  });
```

### Switching Output Formats

```typescript
const baseQuery = Kanuni.newQuery<{ data: string }>().prompt(
  (p) => p.paragraph`Process: ${"data"}`
);

// Text version
const textQuery = baseQuery.outputText().build({ data: "some data" });

// JSON version
const jsonQuery = baseQuery
  .outputJson(z.object({ result: z.string() }))
  .build({ data: "some data" });
```

## Built-in Formatters

### TextualMarkdownFormatter

Kanuni includes a `TextualMarkdownFormatter` that converts queries into human-readable markdown text. This is useful for debugging, logging, or when working with text-based LLM APIs.

```typescript
import { Kanuni, TextualMarkdownFormatter } from "kanuni";

const query = Kanuni.newQuery<{ topic: string }>()
  .prompt((p) =>
    p.paragraph`Explain ${"topic"} in simple terms.`.list(
      (l) => l.item`Use clear examples`.item`Avoid jargon`
    )
  )
  .memory((m) =>
    m.utterance("user", (data) => `I want to learn about ${data.topic}`)
  )
  .build({ topic: "machine learning" });

// Format as markdown text
const formattedText = TextualMarkdownFormatter.format(query);
console.log(formattedText);
```

#### Configuration Options

The formatter can be customized with various options:

```typescript
const formatter = new TextualMarkdownFormatter({
  indentationString: "    ", // Custom indentation (default: "  ")
  unnumberedListItemPrefix: "* ", // List item prefix (default: "- ")
  memoryIntroductionText: "Conversation History: ", // Memory section intro
  toolsIntroductionText: "Available Functions: ", // Tools section intro
  outputJsonIntroductionText: "Expected Response Format: ", // JSON output intro
  excludes: {
    memory: false, // Set to true to exclude memory from output
    tools: false, // Set to true to exclude tools from output
    outputSpecs: false, // Set to true to exclude output specifications
  },
});

const customFormatted = formatter.format(query);
```

#### Special Sections

The formatter handles special sections automatically:

- **Memory sections** render conversation history with role-based tags
- **Tools sections** include JSON schema definitions for available tools
- **Output specification sections** show expected JSON response schemas

```typescript
const complexQuery = Kanuni.newQuery<{ task: string }>()
  .prompt((p) => p.paragraph`Task: ${"task"}`)
  .memorySection(
    (s) =>
      s.heading`Previous Conversation`
        .paragraph`Reference the conversation history below`
  )
  .toolsSection(
    (s) =>
      s.heading`Available Tools`
        .paragraph`You can use these functions to complete the task`
  )
  .outputSpecsSection(
    (s) =>
      s.heading`Response Format`
        .paragraph`Respond using the specified JSON structure`
  )
  .memory((m) =>
    m
      .utterance("user", () => "Hello, I need help")
      .utterance("assistant", () => "I'm here to help!")
  )
  .tools(myTools)
  .outputJson(
    z.object({
      result: z.string(),
      confidence: z.number(),
    })
  )
  .build({ task: "Complete analysis" });

const formatted = TextualMarkdownFormatter.format(complexQuery);
// Produces markdown with sections for prompt, memory, tools, and output schema
```

## Query Serialization

Kanuni provides built-in support for serializing and deserializing queries, allowing you to store, transmit, or persist query objects as JSON strings. This is particularly useful for caching, database storage, or sending queries across network boundaries.

### Serializing Queries

Use `Kanuni.serializeQuery()` to convert any Query object into a JSON string:

```typescript
import { Kanuni, Tool, ToolRegistry } from "kanuni";
import { z } from "zod";

const query = Kanuni.newQuery<{ topic: string }>()
  .prompt((p) =>
    p.paragraph`Analyze the topic: ${"topic"}`.list(
      (l) =>
        l.item`Identify key themes`.item`Extract important details`
          .item`Provide recommendations`
    )
  )
  .memory((m) =>
    m.utterance("user", (data) => `I want to learn about ${data.topic}`)
  )
  .outputJson(
    z.object({
      themes: z.array(z.string()),
      details: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
    "analysis_result"
  )
  .build({ topic: "machine learning" });

// Serialize the query to JSON string
const serializedQuery = Kanuni.serializeQuery(query);

// Store in localStorage, send over network, save to database, etc.
localStorage.setItem("analysisQuery", serializedQuery);
```

### Deserializing Queries

Use `Kanuni.deserializeQuery()` to convert a serialized JSON string back into a functional Query object:

```typescript
// Retrieve the serialized query
const storedQuery = localStorage.getItem("analysisQuery");

if (storedQuery) {
  // Deserialize back to a Query object
  const restoredQuery = Kanuni.deserializeQuery<{ topic: string }>(storedQuery);

  // The restored query is fully functional
  console.log(restoredQuery.prompt.type); // 'prompt'
  console.log(restoredQuery.output.type); // 'output-json'
  console.log(restoredQuery.memory?.contents.length); // 1

  // You can use it just like the original query
  // Note: You'll need to format it with a provider-specific formatter
}
```

### Working with Tools in Serialization

Queries with tools are automatically handled during serialization. Zod schemas for tool parameters are converted to JSON Schema format:

```typescript
import { z } from "zod";

// Define tool types for the examples
type SearchTool = Tool<"search", { query: string; limit?: number }>;
type AnalysisTool = Tool<
  "analyze",
  { data: string; type: "sentiment" | "keywords" | "summary" }
>;

const tools: ToolRegistry<SearchTool | AnalysisTool> = {
  search: {
    name: "search",
    description: "Search for information",
    parameters: {
      query: z.string().describe("Search query"),
      limit: z.number().optional().describe("Max results"),
    },
  },
  analyze: {
    name: "analyze",
    description: "Analyze data",
    parameters: {
      data: z.string().describe("Data to analyze"),
      type: z.enum(["sentiment", "keywords", "summary"]),
    },
  },
};

const queryWithTools = Kanuni.newQuery<{ task: string }>()
  .prompt((p) => p.paragraph`Task: ${"task"}`)
  .tools(tools)
  .outputJson(z.object({ result: z.string() }))
  .build({ task: "Analyze user feedback" });

// Serialize and deserialize
const serialized = Kanuni.serializeQuery(queryWithTools);
const restored = Kanuni.deserializeQuery(serialized);

// Tools are preserved and functional
console.log(Object.keys(restored.tools!)); // ['search', 'analyze']
```

### Practical Use Cases

#### 1. Query Templates and Caching

```typescript
// Create reusable query templates
const createAnalysisQuery = (analysisType: string) => {
  return Kanuni.newQuery<{ data: string }>()
    .prompt((p) => p.paragraph`Perform ${analysisType} analysis on: ${"data"}`)
    .outputJson(
      z.object({
        analysis_type: z.string(),
        results: z.array(z.string()),
        confidence: z.number(),
      })
    )
    .build({ data: "" }); // Template with empty data
};

// Serialize templates for reuse
const templates = {
  sentiment: Kanuni.serializeQuery(createAnalysisQuery("sentiment")),
  keyword: Kanuni.serializeQuery(createAnalysisQuery("keyword")),
  summary: Kanuni.serializeQuery(createAnalysisQuery("summary")),
};

// Later, deserialize and use with actual data
const sentimentQuery = Kanuni.deserializeQuery(templates.sentiment);
// Update with actual data by rebuilding or using a formatter
```

#### 2. Database Storage

```typescript
interface StoredQuery {
  id: string;
  name: string;
  description: string;
  query_json: string;
  created_at: Date;
}

// Save query to database
const saveQuery = async (
  name: string,
  description: string,
  query: Query<any, any, any>
) => {
  const serialized = Kanuni.serializeQuery(query);

  await database.queries.create({
    id: generateId(),
    name,
    description,
    query_json: serialized,
    created_at: new Date(),
  });
};

// Load and use query from database
const loadQuery = async (queryId: string) => {
  const stored = await database.queries.findById(queryId);
  if (stored) {
    return Kanuni.deserializeQuery(stored.query_json);
  }
  return null;
};
```

#### 3. API Communication

```typescript
// Client side - send query to server
const clientQuery = Kanuni.newQuery<{ userInput: string }>()
  .prompt((p) => p.paragraph`Process: ${"userInput"}`)
  .build({ userInput: "User's request" });

const response = await fetch("/api/process-query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: Kanuni.serializeQuery(clientQuery),
    metadata: { userId: "user123" },
  }),
});

// Server side - receive and process query
app.post("/api/process-query", (req, res) => {
  const { query: serializedQuery, metadata } = req.body;

  // Deserialize the query
  const query = Kanuni.deserializeQuery(serializedQuery);

  // Process with your LLM provider
  const result = await processWithLLM(query);

  res.json({ result });
});
```

### Important Considerations

- **Schema Conversion**: Zod schemas are converted to JSON Schema during serialization and back to Zod during deserialization. The functional behavior is preserved, but object identity is not.
- **Security**: Deserialization uses `eval()` for schema reconstruction. Only deserialize trusted input.
- **Performance**: Serialization is fast, but deserializing complex schemas may have some overhead due to schema reconstruction.
- **Compatibility**: Serialized queries are forward-compatible but may not be backward-compatible across major Kanuni versions.

## Advanced Examples

### Complex Multi-Section Prompt

```typescript
interface AnalysisRequest {
  document: string;
  requirements: string[];
  previousFindings: string;
  outputFormat: string;
}

const query = Kanuni.newQuery<AnalysisRequest>()
  .prompt((p) =>
    p.paragraph`Document Analysis Request`

      .section((s) => s.heading`Document Content`.paragraph`${"document"}`)

      .section((s) =>
        s.heading`Analysis Requirements`.list((l, data) => {
          data.requirements.forEach((req) => {
            l.item(() => req);
          });
          return l;
        })
      )
  )
  .memorySection(
    (s) => s.heading`Previous Context`.paragraph`${"previousFindings"}`
  )
  .toolsSection(
    (s) =>
      s.heading`Available Analysis Tools`
        .paragraph`Use the document_analyzer tool for detailed analysis`
  )
  .outputSpecsSection(
    (s) => s.heading`Output Requirements`.paragraph`Format: ${"outputFormat"}`
  )
  .outputJson(
    z.object({
      summary: z.string(),
      keyFindings: z.array(z.string()),
      confidence: z.number().min(0).max(1),
    })
  )
  .build({
    document: "Long document content...",
    requirements: [
      "Extract key themes",
      "Identify risks",
      "Suggest improvements",
    ],
    previousFindings: "Previous analysis showed...",
    outputFormat: "Structured JSON with summary and findings",
  });
```

### Dynamic Content Generation

```typescript
interface ReportData {
  title: string;
  sections: Array<{
    heading: string;
    content: string;
    data: Array<{ label: string; value: string }>;
  }>;
  conclusions: string[];
}

const query = Kanuni.newQuery<ReportData>()
  .prompt((p) => {
    const builder = p.paragraph`Report: ${"title"}`;

    return builder.section((s, data) => {
      let sectionBuilder = s.heading`Executive Summary`;

      data.sections.forEach((section) => {
        sectionBuilder = sectionBuilder.section((subsection) =>
          subsection
            .heading(() => section.heading)
            .paragraph(() => section.content)
            .table((t) => {
              let tableBuilder = t.columnHeaders(() => ["Metric", "Value"]);
              section.data.forEach((row) => {
                tableBuilder = tableBuilder.row((r) =>
                  r
                    .cell((c) => c.paragraph(() => row.label))
                    .cell((c) => c.paragraph(() => row.value))
                );
              });
              return tableBuilder;
            })
        );
      });

      return sectionBuilder.section((conclusionSection) =>
        conclusionSection.heading`Conclusions`.list((l, data) => {
          data.conclusions.forEach((conclusion) => {
            l.item(() => conclusion);
          });
          return l;
        })
      );
    });
  })
  .build({
    title: "Q4 Performance Report",
    sections: [
      {
        heading: "Sales Performance",
        content: "Sales exceeded expectations...",
        data: [
          { label: "Revenue", value: "$1.2M" },
          { label: "Growth", value: "15%" },
        ],
      },
    ],
    conclusions: [
      "Strong performance in Q4",
      "Revenue targets exceeded",
      "Positive outlook for Q1",
    ],
  });
```

### Conversation Flow with Memory Management

```typescript
interface ConversationState {
  currentMessage: string;
  userPreferences: {
    responseStyle: string;
    topics: string[];
  };
}

// First interaction
const initialQuery = Kanuni.newQuery<ConversationState>()
  .prompt(
    (p) =>
      p.paragraph`You are a helpful assistant. Respond in ${"userPreferences"} style.`
        .paragraph`User preferences: ${"userPreferences"}`
  )
  .memory((m) => m.utterance("user", (data) => data.currentMessage))
  .build({
    currentMessage: "Hello, I'm interested in learning about TypeScript",
    userPreferences: {
      responseStyle: "friendly and detailed",
      topics: ["programming", "web development"],
    },
  });

// Continue conversation by extracting memory
const previousMemory = Kanuni.extractMemoryFromQuery(initialQuery);

const followUpQuery = Kanuni.newQuery<ConversationState>()
  .prompt(
    (p) =>
      p.paragraph`Continue the conversation, maintaining the same helpful tone.`
  )
  .memory((m) =>
    m
      .append(previousMemory?.contents || [])
      .utterance(
        "assistant",
        () =>
          "I'd be happy to help you learn TypeScript! TypeScript is a strongly typed programming language..."
      )
      .utterance("user", (data) => data.currentMessage)
  )
  .build({
    currentMessage: "Can you show me some examples?",
    userPreferences: {
      responseStyle: "friendly and detailed",
      topics: ["programming", "web development"],
    },
  });
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
