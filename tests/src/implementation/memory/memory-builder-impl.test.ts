import { MemoryBuilderImpl } from "../../../../src/implementation/memory/index.js";

describe("MemoryBuilder implementation", () => {
  it("returns a memory object with correct type and contents for multiple messages", () => {
    const builder = new MemoryBuilderImpl<{ foo: string }>();
    builder
      .utterance("user", (d) => `User: ${d.foo}`)
      .utterance("assistant", (d) => `Assistant: ${d.foo}`);
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
      .utterance("user", (d) => (d.show ? "Visible" : undefined))
      .utterance("assistant", () => null);
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
      .utterance("user", () => "first")
      .utterance("assistant", () => "second")
      .utterance("user", () => "third");
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
      .utterance("system", () => "System message")
      .utterance("bot", () => "Bot message");
    const result = builder.build({});
    expect(result.contents[0].role).toBe("system");
    expect(result.contents[1].role).toBe("bot");
  });

  it("passes the correct data to message builder functions", () => {
    const builder = new MemoryBuilderImpl<{ value: number }>();
    builder.utterance("user", (d) => `Value is ${d.value}`);
    const result = builder.build({ value: 42 });
    expect(result.contents[0].contents).toBe("Value is 42");
  });

  it("handles messages with empty string (should include them)", () => {
    const builder = new MemoryBuilderImpl<{}>();
    builder.utterance("user", () => "");
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
      .utterance("user", () => "valid")
      .utterance("assistant", () => undefined)
      .utterance("user", () => null)
      .utterance("assistant", () => "also valid");
    const result = builder.build({});
    expect(result.contents).toEqual([
      { type: "utterance", role: "user", contents: "valid" },
      { type: "utterance", role: "assistant", contents: "also valid" },
    ]);
  });

  describe("utterance with name parameter", () => {
    it("correctly handles utterance with name and message function", () => {
      const builder = new MemoryBuilderImpl<{ value: string }>();
      builder.utterance("user", "John", (d) => `Hello from ${d.value}`);
      const result = builder.build({ value: "test" });
      expect(result.contents).toEqual([
        {
          type: "utterance",
          role: "user",
          name: "John",
          contents: "Hello from test",
        },
      ]);
    });

    it("throws error when name is provided but message function is missing", () => {
      const builder = new MemoryBuilderImpl<{}>();
      expect(() => {
        builder.utterance("user", "John");
      }).toThrow("Message builder function must be provided when name is specified.");
    });

    it("does not include name field when only message function is provided", () => {
      const builder = new MemoryBuilderImpl<{}>();
      builder.utterance("user", () => "Hello");
      const result = builder.build({});
      expect(result.contents).toEqual([
        {
          type: "utterance",
          role: "user",
          contents: "Hello",
        },
      ]);
      expect(result.contents[0]).not.toHaveProperty("name");
    });

    it("handles multiple utterances with mixed named and unnamed messages", () => {
      const builder = new MemoryBuilderImpl<{ value: string }>();
      builder
        .utterance("user", "Alice", (d) => `Named: ${d.value}`)
        .utterance("assistant", (d) => `Unnamed: ${d.value}`)
        .utterance("user", "Bob", (d) => `Another named: ${d.value}`);
      const result = builder.build({ value: "test" });
      expect(result.contents).toEqual([
        { type: "utterance", role: "user", name: "Alice", contents: "Named: test" },
        { type: "utterance", role: "assistant", contents: "Unnamed: test" },
        { type: "utterance", role: "user", name: "Bob", contents: "Another named: test" },
      ]);
    });

    it("skips named utterances whose builder function returns undefined or null", () => {
      const builder = new MemoryBuilderImpl<{ show: boolean }>();
      builder
        .utterance("user", "Alice", (d) => (d.show ? "Visible" : undefined))
        .utterance("assistant", "Bot", () => null)
        .utterance("user", "Bob", () => "Always visible");
      const result = builder.build({ show: false });
      expect(result.contents).toEqual([
        { type: "utterance", role: "user", name: "Bob", contents: "Always visible" },
      ]);
    });

    it("handles empty string name", () => {
      const builder = new MemoryBuilderImpl<{}>();
      builder.utterance("user", "", () => "Hello");
      const result = builder.build({});
      expect(result.contents).toEqual([
        {
          type: "utterance",
          role: "user",
          contents: "Hello",
        },
      ]);
    });

    it("supports custom roles with names", () => {
      type CustomRole = "system" | "bot";
      const builder = new MemoryBuilderImpl<{}, CustomRole>();
      builder
        .utterance("system", "Config", () => "System configuration")
        .utterance("bot", "Assistant", () => "Bot response");
      const result = builder.build({});
      expect(result.contents).toEqual([
        { type: "utterance", role: "system", name: "Config", contents: "System configuration" },
        { type: "utterance", role: "bot", name: "Assistant", contents: "Bot response" },
      ]);
    });

    it("passes correct data to named message builder functions", () => {
      const builder = new MemoryBuilderImpl<{ count: number; prefix: string }>();
      builder.utterance("user", "Counter", (d) => `${d.prefix}: ${d.count}`);
      const result = builder.build({ count: 5, prefix: "Value" });
      expect(result.contents[0]).toEqual({
        type: "utterance",
        role: "user",
        name: "Counter",
        contents: "Value: 5",
      });
    });

    it("preserves order of named and unnamed utterances", () => {
      const builder = new MemoryBuilderImpl<{}>();
      builder
        .utterance("user", "First", () => "1")
        .utterance("assistant", () => "2")
        .utterance("user", "Third", () => "3")
        .utterance("assistant", () => "4")
        .utterance("user", "Fifth", () => "5");
      const result = builder.build({});
      const expectedOrder = ["1", "2", "3", "4", "5"];
      expect(result.contents.map(c => c.contents)).toEqual(expectedOrder);
      
      // Check specific names where expected
      expect(result.contents[0].name).toBe("First");
      expect(result.contents[1]).not.toHaveProperty("name");
      expect(result.contents[2].name).toBe("Third");
      expect(result.contents[3]).not.toHaveProperty("name");
      expect(result.contents[4].name).toBe("Fifth");
    });
  });
});
