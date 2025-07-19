import { QueryBuilderImpl } from "../../../src/implementation/query-builder-impl.js";

describe("QueryBuilderImpl", () => {
  it("returns correct prompt contents when only prompt is set", () => {
    const builder = new QueryBuilderImpl<{ foo: string }>();
    builder.prompt((p) => p.paragraph`Prompt: ${"foo"}`);
    const result = builder.build({ foo: "bar" });
    expect(result).toEqual({
      prompt: {
        type: "prompt",
        contents: [
          expect.objectContaining({
            type: "paragraph",
            content: "Prompt: bar",
          }),
        ],
      },
    });
  });

  it("returns correct prompt and memory when both prompt and memory are set", () => {
    const builder = new QueryBuilderImpl<{ foo: string }>();
    builder.prompt((p) => p.paragraph`Prompt: ${"foo"}`);
    builder.memory((m) => m.message("user", (d) => `${d.foo}`));
    const result = builder.build({ foo: "bar" });
    expect(result).toEqual({
      prompt: {
        type: "prompt",
        contents: [
          expect.objectContaining({
            type: "paragraph",
            content: "Prompt: bar",
          }),
        ],
      },
      memory: {
        type: 'memory',
        contents: [
          {
            type: 'utterance',
            role: 'user',
            contents: 'bar',
          },
        ],
      },
    });
  });

  it("returns empty contents if neither prompt nor memory is set", () => {
    const builder = new QueryBuilderImpl<{}>();
    const result = builder.build({});
    expect(result).toEqual({
      prompt: {
        type: "prompt",
        contents: [],
      },
    });
  });

  it("uses data parameter correctly in prompt", () => {
    const builder = new QueryBuilderImpl<{ name: string }>();
    builder.prompt((p) => p.paragraph`Hello, ${"name"}`);
    const result = builder.build({ name: "Alice" });
    expect(result.prompt.contents[0]).toEqual(
      expect.objectContaining({ type: "paragraph", content: "Hello, Alice" }),
    );
  });

  it("handles memory builder returning undefined", () => {
    const builder = new QueryBuilderImpl<{ foo: string }>();
    builder.memory((_) => undefined);
    builder.prompt((p) => p.paragraph`Prompt: ${"foo"}`);
    const result = builder.build({ foo: "bar" });
    expect(result.prompt.contents[0]).toEqual(
      expect.objectContaining({ type: "paragraph", content: "Prompt: bar" }),
    );
  });

  it("handles prompt builder returning undefined", () => {
    const builder = new QueryBuilderImpl<{ foo: string }>();
    builder.prompt((_) => undefined);
    const result = builder.build({ foo: "bar" });
    expect(result.prompt.contents).toEqual([]);
  });

  it("is chainable and builds correctly", () => {
    const builder = new QueryBuilderImpl<{ foo: string }>()
      .prompt((p) => p.paragraph`Chainable: ${"foo"}`)
      .memory((m) => m.message("assistant", (d) => `Assistant: ${d.foo}`));
    const result = builder.build({ foo: "bar" });
    expect(result.prompt.contents[0]).toEqual(
      expect.objectContaining({ type: "paragraph", content: "Chainable: bar" }),
    );
  });
});
