import { List, Paragraph } from "../../../../src/developer-api/index.js";
import { ListBuilderImpl } from "../../../../src/implementation/prompt/list-builder-impl.js";

describe("ListBuilder", () => {
  it("builds a list with a single item", () => {
    const builder = new ListBuilderImpl<{ title: string }>();
    builder.item((data) => `Item: ${data.title}`);
    const result = builder.build({ title: "Example" });
    expect(result).toEqual({
      type: "list",
      items: [
        {
          content: {
            type: "paragraph",
            content: "Item: Example",
          },
        },
      ],
    });
  });

  it("builds a list with multiple items in order", () => {
    const testStrings = ["foo", "bar"];
    const builder = new ListBuilderImpl<{ a: string; b: string }>();
    builder.item((data) => data.a).item((data) => data.b);
    const result = builder.build({ a: testStrings[0], b: testStrings[1] });
    result.items.forEach((item, index) => {
      expect(item.content.type).toBe("paragraph");
      if (item.content.type === "paragraph") {
        expect(item.content.content).toEqual(testStrings[index]);
      }
    });
  });

  it("builds a list with template string item", () => {
    const builder = new ListBuilderImpl<{ name: string }>();
    builder.item`Hello, ${"name"}`;
    const result = builder.build({ name: "World" });
    if (result.items[0].content.type === "paragraph") {
      expect(result.items[0].content.content).toBe("Hello, World");
    }
  });

  it("builds a nested list with .list()", () => {
    const builder = new ListBuilderImpl<{ outer: string; inner: string }>();
    builder.item((data) => data.outer);
    builder.list((l) => l.item((data) => data.inner));
    const result = builder.build({ outer: "A", inner: "B" });
    expect(result.items.length).toBe(2);
    if (result.items[0].content.type === "paragraph") {
      expect(result.items[0].content.content).toBe("A");
    }
    expect(result.items[1].content.type).toBe("list");
    expect(
      ((result.items[1].content as List).items[0].content as Paragraph).content,
    ).toBe("B");
  });

  it("builds a deeply nested list", () => {
    const builder = new ListBuilderImpl<{ a: string; b: string; c: string }>();
    builder.list((l) => l.list((l) => l.item((d) => d.c)));
    const result = builder.build({ a: "x", b: "y", c: "z" });
    expect(result.items[0].content.type).toBe("list");
    expect((result.items[0].content as List).items[0].content.type).toBe(
      "list",
    );
    expect(
      (
        ((result.items[0].content as List).items[0].content as List).items[0]
          .content as Paragraph
      ).content,
    ).toBe("z");
  });

  it("builds a list with .items() from an array", () => {
    const builder = new ListBuilderImpl<{ arr: string[] }>();
    builder.items(["a", "b", "c"], (i, item: string) => i.item((_) => item));
    const result = builder.build({ arr: [] });
    expect(result.items.map((i: any) => i.content.content)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("builds a list with .items() from an empty array", () => {
    const builder = new ListBuilderImpl<{}>();
    builder.items([], (i, item) => i.item((_) => String(item)));
    const result = builder.build({});
    expect(result.items).toEqual([]);
  });

  it("builds a list with mixed .item(), .list(), and .items()", () => {
    const builder = new ListBuilderImpl<{ arr: string[] }>();
    builder.item((_data: any) => "first");
    builder.list((l) => l.item((_) => "sub"));
    builder.items(["x", "y"], (i, item) => i.item((_) => item));
    const result = builder.build({ arr: [] });
    expect((result.items[0].content as Paragraph).content).toBe("first");
    expect(result.items[1].content.type).toBe("list");
    expect(
      ((result.items[1].content as List).items[0].content as Paragraph).content,
    ).toBe("sub");
    expect((result.items[2].content as Paragraph).content).toBe("x");
    expect((result.items[3].content as Paragraph).content).toBe("y");
  });

  it("omits null or undefined items", () => {
    const builder = new ListBuilderImpl<{}>();
    builder.list(() => null);
    builder.items([1], () => null);
    builder.item(() => "ok");
    const result = builder.build({});
    expect(result.items.length).toBe(1);
    expect((result.items[0].content as Paragraph).content).toBe("ok");
  });

  it("flattens the final items array", () => {
    const builder = new ListBuilderImpl<{}>();
    builder.items([1, 2], (i, n: number) => i.item((_) => String(n)));
    const result = builder.build({});
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBe(2);
    expect((result.items[0].content as Paragraph).content).toBe("1");
    expect((result.items[1].content as Paragraph).content).toBe("2");
  });

  it("passes data through all builder functions", () => {
    const builder = new ListBuilderImpl<{ foo: string }>();
    builder.item((data) => data.foo);
    builder.list((l) => l.item((data) => data.foo + "!"));
    const result = builder.build({ foo: "bar" });
    expect((result.items[0].content as Paragraph).content).toBe("bar");
    expect(
      ((result.items[1].content as List).items[0].content as Paragraph).content,
    ).toBe("bar!");
  });
});
