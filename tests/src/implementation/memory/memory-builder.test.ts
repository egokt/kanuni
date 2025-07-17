import { MemoryBuilderImpl } from "../../../../src/implementation/memory/index.js";

describe("MemoryBuilder implementation", () => {
  it("returns a memory object with correct type and contents for multiple messages", () => {
    const builder = new MemoryBuilderImpl<{ foo: string }>();
    builder
      .message("user", (d) => `User: ${d.foo}`)
      .message("assistant", (d) => `Assistant: ${d.foo}`);
    const result = builder.build({ foo: "bar" });
    expect(result).toEqual({
      type: "memory",
      contents: [
        { type: "utterance", role: "user", contents: "User: bar" },
        { type: "utterance", role: "assistant", contents: "Assistant: bar" },
      ],
    });
  });

  it("skips messages whose builder function returns undefined or null", () => {
    const builder = new MemoryBuilderImpl<{ show: boolean }>();
    builder
      .message("user", (d) => (d.show ? "Visible" : undefined))
      .message("assistant", () => null);
    const result = builder.build({ show: false });
    expect(result.contents.length).toBe(0);
  });

  it("handles empty memory (no messages added)", () => {
    const builder = new MemoryBuilderImpl<{}>();
    const result = builder.build({});
    expect(result).toEqual({ type: "memory", contents: [] });
  });

  it("preserves the order of messages", () => {
    const builder = new MemoryBuilderImpl<{}>();
    builder
      .message("user", () => "first")
      .message("assistant", () => "second")
      .message("user", () => "third");
    const result = builder.build({});
    expect(result.contents.map((c) => c.contents)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("supports custom roles", () => {
    type CustomRole = "system" | "bot";
    const builder = new MemoryBuilderImpl<{}, CustomRole>();
    builder
      .message("system", () => "System message")
      .message("bot", () => "Bot message");
    const result = builder.build({});
    expect(result.contents[0].role).toBe("system");
    expect(result.contents[1].role).toBe("bot");
  });

  it("passes the correct data to message builder functions", () => {
    const builder = new MemoryBuilderImpl<{ value: number }>();
    builder.message("user", (d) => `Value is ${d.value}`);
    const result = builder.build({ value: 42 });
    expect(result.contents[0].contents).toBe("Value is 42");
  });

  it("handles messages with empty string (should include them)", () => {
    const builder = new MemoryBuilderImpl<{}>();
    builder.message("user", () => "");
    const result = builder.build({});
    // Should include empty string
    expect(result.contents.length).toBe(1);
    expect(result.contents[0]).toEqual({
      type: "utterance",
      role: "user",
      contents: "",
    });
  });

  it("handles mixed valid and skip (undefined/null) message outputs", () => {
    const builder = new MemoryBuilderImpl<{}>();
    builder
      .message("user", () => "valid")
      .message("assistant", () => undefined)
      .message("user", () => null)
      .message("assistant", () => "also valid");
    const result = builder.build({});
    expect(result.contents).toEqual([
      { type: "utterance", role: "user", contents: "valid" },
      { type: "utterance", role: "assistant", contents: "also valid" },
    ]);
  });
});
