import { Section } from "../../../../src/developer-api/prompt/types.js";
import { SectionBuilderImpl } from "../../../../src/implementation/prompt/section-builder-impl.js";

describe("SectionBuilderImpl.build", () => {
  it("builds a section with heading and paragraph", () => {
    const builder = new SectionBuilderImpl<{ title: string }, "user">();
    builder.heading`Test Heading`;
    builder.paragraph`Test paragraph`;
    const section = builder.build({ title: "ignored" });
    expect(section.type).toBe("section");
    expect(section.heading).toBe("Test Heading");
    expect(section.contents[0].type).toBe("paragraph");
    expect((section.contents[0] as { content: string }).content).toBe(
      "Test paragraph",
    );
  });

  it("builds nested sections", () => {
    const builder = new SectionBuilderImpl<{ title: string }, "user">();
    builder.heading`Parent`;
    builder.section((s) => s.heading`Child`.paragraph`Child paragraph`);
    const section = builder.build({ title: "ignored" });
    expect(section.contents[0].type).toBe("section");
    const child = section.contents[0] as Section;
    expect(child.heading).toBe("Child");
    expect(child.contents[0].type).toBe("paragraph");
  });

  it("builds section with paragraphs, lists, and tables", () => {
    const builder = new SectionBuilderImpl<{ title: string }, "user">();
    builder.heading`Mix`;
    builder.paragraph`A paragraph`;
    builder.list((l) => l.item`Item 1`.item`Item 2`);
    builder.table((t) =>
      t.row((r) =>
        r.cell((c) => c.paragraph`Cell 1`).cell((c) => c.paragraph`Cell 2`),
      ),
    );
    const section = builder.build({ title: "ignored" });
    expect(section.contents.some((c) => c.type === "paragraph")).toBe(true);
    expect(section.contents.some((c) => c.type === "list")).toBe(true);
    expect(section.contents.some((c) => c.type === "table")).toBe(true);
  });

  it("interpolates template strings with params", () => {
    const builder = new SectionBuilderImpl<{ title: string }, "user">();
    builder.heading`Title: ${"title"}`;
    builder.paragraph`Paragraph: ${"title"}`;
    const section = builder.build({ title: "Dynamic" });
    expect(section.heading).toBe("Title: Dynamic");
    expect((section.contents[0] as { content: string }).content).toBe(
      "Paragraph: Dynamic",
    );
  });

  it("builds lists and nested lists", () => {
    const builder = new SectionBuilderImpl<{}, "user">();
    builder.list((l) => l.item`Item 1`.list((l) => l.item`Subitem 1`));
    const section = builder.build({});
    const list = section.contents[0];
    expect(list.type).toBe("list");
    const items = (list as any).items;
    expect(items[0].content.type).toBe("paragraph");
    expect(items[1].content.type).toBe("list");
  });

  it("builds section without paragraphs", () => {
    const builder = new SectionBuilderImpl<{}, "user">();
    builder.list((l) => l.item`Only list`);
    const section = builder.build({});
    expect(section.contents.length).toBe(1);
    expect(section.contents[0].type).toBe("list");
  });

  it("passes data param to all builder functions", () => {
    const builder = new SectionBuilderImpl<{ title: string }, "user">();
    builder.heading`Heading: ${"title"}`;
    builder.paragraph((data) => `Para: ${data.title}`);
    const section = builder.build({ title: "DataTest" });
    expect(section.heading).toBe("Heading: DataTest");
    expect((section.contents[0] as { content: string }).content).toBe(
      "Para: DataTest",
    );
  });

  it("builds an empty section", () => {
    const builder = new SectionBuilderImpl<{}, "user">();
    const section = builder.build({});
    expect(section.type).toBe("section");
    expect(section.contents.length).toBe(0);
  });

  it("builds section without heading", () => {
    const builder = new SectionBuilderImpl<{}, "user">();
    builder.paragraph`Just a paragraph`;
    const section = builder.build({});
    expect(section.type).toBe("section");
    expect(section.heading).toBeUndefined();
    expect(section.contents.length).toBe(1);
    expect(section.contents[0].type).toBe("paragraph");
  });

  it("handles multiple paragraphs", () => {
    const builder = new SectionBuilderImpl<{}, "user">();
    builder.paragraph`First paragraph`;
    builder.paragraph`Second paragraph`;
    builder.paragraph`Third paragraph`;
    const section = builder.build({});
    expect(section.contents.length).toBe(3);
    expect(section.contents.every(c => c.type === "paragraph")).toBe(true);
  });

  it("handles paragraph function builder", () => {
    const builder = new SectionBuilderImpl<{ name: string }, "user">();
    builder.paragraph((data) => `Hello ${data.name}!`);
    const section = builder.build({ name: "World" });
    expect(section.contents.length).toBe(1);
    expect((section.contents[0] as { content: string }).content).toBe("Hello World!");
  });

  it("handles multiple nested sections", () => {
    const builder = new SectionBuilderImpl<{}, "user">();
    builder.heading`Main Section`;
    builder.section((s) => s.heading`First Child`.paragraph`First content`);
    builder.section((s) => s.heading`Second Child`.paragraph`Second content`);
    const section = builder.build({});
    expect(section.contents.length).toBe(2);
    expect(section.contents.every(c => c.type === "section")).toBe(true);
    const firstChild = section.contents[0] as Section;
    const secondChild = section.contents[1] as Section;
    expect(firstChild.heading).toBe("First Child");
    expect(secondChild.heading).toBe("Second Child");
  });

  it("handles complex nested structure", () => {
    const builder = new SectionBuilderImpl<{ title: string }, "user">();
    builder.heading`Main: ${"title"}`;
    builder.paragraph`Introduction`;
    builder.section((s) => s
      .heading`Subsection`
      .paragraph`Subsection content`
      .list((l) => l.item`Sub item 1`.item`Sub item 2`)
    );
    builder.table((t) => t.row((r) => r.cell((c) => c.paragraph`Table cell`)));
    const section = builder.build({ title: "Test" });
    expect(section.heading).toBe("Main: Test");
    expect(section.contents.length).toBe(3); // paragraph, section, table
    expect(section.contents[0].type).toBe("paragraph");
    expect(section.contents[1].type).toBe("section");
    expect(section.contents[2].type).toBe("table");
  });

  it("filters out undefined and null content", () => {
    const builder = new SectionBuilderImpl<{}, "user">();
    // Simulate content that might return undefined/null
    builder.paragraph`Valid content`;
    // Add a mock datum that returns undefined
    (builder as any).builderData.push({
      type: "mock",
      func: () => undefined
    });
    (builder as any).builderData.push({
      type: "mock",
      func: () => null
    });
    builder.paragraph`Another valid content`;
    const section = builder.build({});
    expect(section.contents.length).toBe(2);
    expect(section.contents.every(c => c.type === "paragraph")).toBe(true);
  });

  it("handles section builder returning null from function", () => {
    const builder = new SectionBuilderImpl<{}, "user">();
    builder.section(() => null);
    builder.paragraph`Valid content`;
    const section = builder.build({});
    expect(section.contents.length).toBe(1);
    expect(section.contents[0].type).toBe("paragraph");
  });

  it("handles section builder returning undefined from function", () => {
    const builder = new SectionBuilderImpl<{}, "user">();
    builder.section(() => undefined);
    builder.paragraph`Valid content`;
    const section = builder.build({});
    expect(section.contents.length).toBe(1);
    expect(section.contents[0].type).toBe("paragraph");
  });

  it("builds tables with multiple rows and cells", () => {
    const builder = new SectionBuilderImpl<{}, "user">();
    builder.table((t) => t
      .row((r) => r
        .cell((c) => c.paragraph`Row 1 Cell 1`)
        .cell((c) => c.paragraph`Row 1 Cell 2`)
      )
      .row((r) => r
        .cell((c) => c.paragraph`Row 2 Cell 1`)
        .cell((c) => c.paragraph`Row 2 Cell 2`)
      )
    );
    const section = builder.build({});
    expect(section.contents.length).toBe(1);
    expect(section.contents[0].type).toBe("table");
  });

  it("maintains builder method chaining", () => {
    const builder = new SectionBuilderImpl<{ name: string }, "user">();
    const result = builder
      .heading`Section: ${"name"}`
      .paragraph`Intro paragraph`
      .list((l) => l.item`Item 1`)
      .table((t) => t.row((r) => r.cell((c) => c.paragraph`Cell`)))
      .section((s) => s.heading`Nested`);
    
    expect(result).toBe(builder); // Should return the same instance for chaining
    const section = builder.build({ name: "Test" });
    expect(section.contents.length).toBe(4); // paragraph, list, table, section
  });
});
