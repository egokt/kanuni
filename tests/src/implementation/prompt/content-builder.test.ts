import { Paragraph } from "../../../../src/developer-api/prompt/types.js";
import { ContentBuilderImpl } from "../../../../src/implementation/prompt/context-builder-impl.js";

describe("content-builder", () => {
  it("should build a paragraph using a function", () => {
    const builder = new ContentBuilderImpl<{ name: string }>();
    builder.paragraph((data: { name: string }) => `Hello, ${data.name}!`);
    const section = builder.build({ name: "World" });
    expect(section.contents[0]).toEqual({
      type: "paragraph",
      content: "Hello, World!",
    });
  });

  it("should build a paragraph using template strings", () => {
    const builder = new ContentBuilderImpl<{ name: string }>();
    builder.paragraph`Hello, ${"name"}!`;
    const section = builder.build({ name: "World" });
    expect(section.contents[0]).toEqual({
      type: "paragraph",
      content: "Hello, World!",
    });
  });

  it("should build a list", () => {
    const builder = new ContentBuilderImpl<{}>();
    builder.list((l) => l.item(() => "Item 1"));
    const section = builder.build({});
    expect(section.contents[0].type).toBe("list");
    if (section.contents[0].type === "list") {
      expect(section.contents[0].items[0].content.type).toBe("paragraph");
      if (section.contents[0].items[0].content.type === "paragraph") {
        expect(section.contents[0].items[0].content.content).toBe("Item 1");
      }
    }
  });

  it("should build a table", () => {
    const builder = new ContentBuilderImpl<{}>();
    builder.table((t) => t.row((r) => r.cell((c) => c.paragraph`B`)));
    const section = builder.build({});
    expect(section.contents[0].type).toBe("table");
    if (section.contents[0].type === "table") {
      expect(section.contents[0].rows[0].cells[0].type).toBe("table-cell");
      expect(section.contents[0].rows[0].cells[0].contents[0].type).toBe(
        "paragraph",
      );
      expect(
        (section.contents[0].rows[0].cells[0].contents[0] as Paragraph).content,
      ).toBe("B");
    }
  });

  it("should chain multiple builders", () => {
    const builder = new ContentBuilderImpl<{ name: string }>();
    builder
      .paragraph((data: { name: string }) => `Hi, ${data.name}`)
      .list((l) => l.item(() => "Item"))
      .table((t) => t.row((r) => r.cell((c) => c.paragraph`X`)));
    const section = builder.build({ name: "Test" });
    expect(section.contents.length).toBe(3);
  });

  it("should not add content for null/undefined builder functions", () => {
    const builder = new ContentBuilderImpl<{}>();
    builder.list(() => null);
    builder.table(() => undefined);
    const section = builder.build({});
    expect(section.contents.length).toBe(0);
  });

  it("should work with custom parameter types", () => {
    type Params = { foo: string; bar: number };
    const builder = new ContentBuilderImpl<Params>();
    builder.paragraph((data) => `${data.foo} ${data.bar}`);
    const section = builder.build({ foo: "baz", bar: 42 });
    expect(section.contents[0].type).toBe("paragraph");
    if (section.contents[0].type === "paragraph") {
      expect(section.contents[0].content).toBe("baz 42");
    }
  });
});
