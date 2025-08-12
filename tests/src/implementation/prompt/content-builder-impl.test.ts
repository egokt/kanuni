import { Paragraph } from "../../../../src/developer-api/prompt/types.js";
import { ContentBuilderImpl } from "../../../../src/implementation/prompt/content-builder-impl.js";

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

  // Additional comprehensive test cases

  describe("template string edge cases", () => {
    it("should handle empty template strings", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.paragraph``;
      const section = builder.build({});
      expect(section.contents[0]).toEqual({
        type: "paragraph",
        content: "",
      });
    });

    it("should handle template strings with no parameters", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.paragraph`Fixed text only`;
      const section = builder.build({});
      expect(section.contents[0]).toEqual({
        type: "paragraph",
        content: "Fixed text only",
      });
    });

    it("should handle multiple parameters in template strings", () => {
      const builder = new ContentBuilderImpl<{ first: string; second: string; third: number }>();
      builder.paragraph`First: ${"first"}, Second: ${"second"}, Third: ${"third"}`;
      const section = builder.build({ first: "A", second: "B", third: 3 });
      expect(section.contents[0]).toEqual({
        type: "paragraph",
        content: "First: A, Second: B, Third: 3",
      });
    });

    it("should handle special characters in template strings", () => {
      const builder = new ContentBuilderImpl<{ value: string }>();
      builder.paragraph`Special chars: ${"value"} & more`;
      const section = builder.build({ value: "test<>&\"'" });
      expect(section.contents[0]).toEqual({
        type: "paragraph",
        content: "Special chars: test<>&\"' & more",
      });
    });
  });

  describe("return type consistency", () => {
    it("should return same builder instance for chaining", () => {
      const builder = new ContentBuilderImpl<{ name: string }>();
      const result1 = builder.paragraph(() => "test");
      const result2 = result1.paragraph`Another ${"name"}`;
      const result3 = result2.list(() => null);
      
      expect(result1).toBe(builder);
      expect(result2).toBe(builder);
      expect(result3).toBe(builder);
    });
  });

  describe("complex nested structures", () => {
    it("should build nested lists correctly", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.list((l) => 
        l.item(() => "Item 1")
         .list((sublist) => 
           sublist.item(() => "Nested item 1")
                  .item(() => "Nested item 2")
         )
         .item(() => "Item 2")
      );
      
      const section = builder.build({});
      expect(section.contents[0].type).toBe("list");
      if (section.contents[0].type === "list") {
        expect(section.contents[0].items).toHaveLength(3); // Item 1, nested list, Item 2
        expect(section.contents[0].items[1].content.type).toBe("list");
        if (section.contents[0].items[1].content.type === "list") {
          expect(section.contents[0].items[1].content.items).toHaveLength(2);
        }
      }
    });

    it("should build tables with multiple rows and cells", () => {
      const builder = new ContentBuilderImpl<{ data: string[][] }>();
      builder.table((t) => 
        t.row((r) => 
          r.cell((c) => c.paragraph(() => "Header 1"))
           .cell((c) => c.paragraph(() => "Header 2"))
        )
        .row((r) => 
          r.cell((c) => c.paragraph(() => "Cell 1,1"))
           .cell((c) => c.paragraph(() => "Cell 1,2"))
        )
        .row((r) => 
          r.cell((c) => c.paragraph(() => "Cell 2,1"))
           .cell((c) => c.paragraph(() => "Cell 2,2"))
        )
      );
      
      const section = builder.build({ data: [] });
      expect(section.contents[0].type).toBe("table");
      if (section.contents[0].type === "table") {
        expect(section.contents[0].rows).toHaveLength(3);
        expect(section.contents[0].rows[0].cells).toHaveLength(2);
        expect(section.contents[0].rows[1].cells).toHaveLength(2);
        expect(section.contents[0].rows[2].cells).toHaveLength(2);
      }
    });

    it("should build table cells with multiple content types", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.table((t) => 
        t.row((r) => 
          r.cell((c) => 
            c.paragraph(() => "First paragraph")
             .list((l) => l.item(() => "List item"))
             .paragraph(() => "Second paragraph")
          )
        )
      );
      
      const section = builder.build({});
      expect(section.contents[0].type).toBe("table");
      if (section.contents[0].type === "table") {
        const cell = section.contents[0].rows[0].cells[0];
        expect(cell.contents).toHaveLength(3);
        expect(cell.contents[0].type).toBe("paragraph");
        expect(cell.contents[1].type).toBe("list");
        expect(cell.contents[2].type).toBe("paragraph");
      }
    });
  });

  describe("edge cases and error conditions", () => {
    it("should handle empty build data", () => {
      const builder = new ContentBuilderImpl<{}>();
      const section = builder.build({});
      expect(section).toEqual({
        type: "section",
        contents: [],
      });
    });

    it("should filter out null list items", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.list((l) => {
        l.item(() => "Valid item");
        return null; // This should cause the list to not be added
      });
      
      const section = builder.build({});
      expect(section.contents).toHaveLength(0);
    });

    it("should handle undefined table builder functions", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.table(() => undefined);
      
      const section = builder.build({});
      expect(section.contents).toHaveLength(0);
    });

    it("should handle functions that return empty strings", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.paragraph(() => "");
      
      const section = builder.build({});
      expect(section.contents[0]).toEqual({
        type: "paragraph",
        content: "",
      });
    });
  });

  describe("parameter type safety", () => {
    it("should work with complex parameter types", () => {
      type ComplexParams = {
        user: { name: string; age: number };
        items: string[];
        config: { enabled: boolean };
      };
      
      const builder = new ContentBuilderImpl<ComplexParams>();
      builder.paragraph((data) => `User: ${data.user.name}, Age: ${data.user.age}`);
      
      const section = builder.build({
        user: { name: "John", age: 30 },
        items: ["a", "b", "c"],
        config: { enabled: true }
      });
      
      expect(section.contents[0]).toEqual({
        type: "paragraph",
        content: "User: John, Age: 30",
      });
    });

    it("should work with optional parameters", () => {
      type ParamsWithOptional = { required: string; optional?: string };
      
      const builder = new ContentBuilderImpl<ParamsWithOptional>();
      builder.paragraph((data) => `Required: ${data.required}, Optional: ${data.optional || "N/A"}`);
      
      const section = builder.build({ required: "test" });
      expect(section.contents[0]).toEqual({
        type: "paragraph",
        content: "Required: test, Optional: N/A",
      });
    });
  });

  describe("build order independence", () => {
    it("should produce consistent results regardless of build order", () => {
      const createBuilder = () => {
        const builder = new ContentBuilderImpl<{ value: string }>();
        builder
          .paragraph((data) => `First: ${data.value}`)
          .list((l) => l.item((data) => `List: ${data.value}`))
          .paragraph((data) => `Second: ${data.value}`);
        return builder;
      };

      const builder1 = createBuilder();
      const builder2 = createBuilder();
      
      const section1 = builder1.build({ value: "test" });
      const section2 = builder2.build({ value: "test" });
      
      expect(section1).toEqual(section2);
    });
  });

  describe("integration scenarios", () => {
    it("should build complex document structure", () => {
      type DocumentData = {
        title: string;
        sections: Array<{
          heading: string;
          items: string[];
          metadata: { author: string; date: string };
        }>;
      };

      const builder = new ContentBuilderImpl<DocumentData>();
      builder
        .paragraph((data) => `Document: ${data.title}`)
        .list((l, data) => {
          data.sections.forEach(section => {
            l.item(() => section.heading)
             .list((sublist) => {
               section.items.forEach(item => {
                 sublist.item(() => item);
               });
               return sublist;
             });
          });
          return l;
        })
        .table((t) => 
          t.row((r) => 
            r.cell((c) => c.paragraph(() => "Author"))
             .cell((c) => c.paragraph(() => "Date"))
          )
          .row((r) => 
            r.cell((c) => c.paragraph((data) => data.sections[0]?.metadata.author || "Unknown"))
             .cell((c) => c.paragraph((data) => data.sections[0]?.metadata.date || "Unknown"))
          )
        );

      const section = builder.build({
        title: "Test Document",
        sections: [
          {
            heading: "Introduction",
            items: ["Point 1", "Point 2"],
            metadata: { author: "John Doe", date: "2023-01-01" }
          }
        ]
      });

      expect(section.contents).toHaveLength(3); // paragraph, list, table
      expect(section.contents[0].type).toBe("paragraph");
      expect(section.contents[1].type).toBe("list");
      expect(section.contents[2].type).toBe("table");
    });
  });

  describe("list items() functionality", () => {
    it("should build list using items() with array", () => {
      const builder = new ContentBuilderImpl<{ names: string[] }>();
      builder.list((l, data) => 
        l.items(data.names, (itemBuilder, name) => 
          itemBuilder.item(() => `Name: ${name}`)
        )
      );

      const section = builder.build({ names: ["Alice", "Bob", "Charlie"] });
      expect(section.contents[0].type).toBe("list");
      if (section.contents[0].type === "list") {
        expect(section.contents[0].items).toHaveLength(3);
        expect((section.contents[0].items[0].content as any).content).toBe("Name: Alice");
        expect((section.contents[0].items[1].content as any).content).toBe("Name: Bob");
        expect((section.contents[0].items[2].content as any).content).toBe("Name: Charlie");
      }
    });

    it("should handle empty arrays in items()", () => {
      const builder = new ContentBuilderImpl<{ names: string[] }>();
      builder.list((l, data) => 
        l.items(data.names, (itemBuilder, name) => 
          itemBuilder.item(() => `Name: ${name}`)
        )
      );

      const section = builder.build({ names: [] });
      expect(section.contents[0].type).toBe("list");
      if (section.contents[0].type === "list") {
        expect(section.contents[0].items).toHaveLength(0);
      }
    });

    it("should provide correct index in items()", () => {
      const builder = new ContentBuilderImpl<{ values: string[] }>();
      builder.list((l, data) => 
        l.items(data.values, (itemBuilder, value, index) => 
          itemBuilder.item(() => `${index}: ${value}`)
        )
      );

      const section = builder.build({ values: ["A", "B", "C"] });
      expect(section.contents[0].type).toBe("list");
      if (section.contents[0].type === "list") {
        expect((section.contents[0].items[0].content as any).content).toBe("0: A");
        expect((section.contents[0].items[1].content as any).content).toBe("1: B");
        expect((section.contents[0].items[2].content as any).content).toBe("2: C");
      }
    });

    it("should handle nested items() calls", () => {
      const builder = new ContentBuilderImpl<{ 
        groups: Array<{ name: string; items: string[] }> 
      }>();
      
      builder.list((l, data) => 
        l.items(data.groups, (groupBuilder, group) => 
          groupBuilder
            .item(() => `Group: ${group.name}`)
            .items(group.items, (itemBuilder, item) => 
              itemBuilder.item(() => `- ${item}`)
            )
        )
      );

      const section = builder.build({
        groups: [
          { name: "Fruits", items: ["Apple", "Banana"] },
          { name: "Colors", items: ["Red", "Blue"] }
        ]
      });

      expect(section.contents[0].type).toBe("list");
      if (section.contents[0].type === "list") {
        expect(section.contents[0].items).toHaveLength(6); // 2 group headers + 4 items
      }
    });
  });

  describe("table column headers functionality", () => {
    it("should build table with column headers", () => {
      const builder = new ContentBuilderImpl<{ headers: string[] }>();
      builder.table((t) => 
        t.columnHeaders((data) => data.headers)
         .row((r) => 
           r.cell((c) => c.paragraph(() => "Cell 1"))
            .cell((c) => c.paragraph(() => "Cell 2"))
         )
      );

      const section = builder.build({ headers: ["Header 1", "Header 2"] });
      expect(section.contents[0].type).toBe("table");
      if (section.contents[0].type === "table") {
        expect(section.contents[0].columnHeaders).toHaveLength(2);
        expect(section.contents[0].columnHeaders![0].type).toBe("table-header-cell");
        expect(section.contents[0].columnHeaders![0].contents.content).toBe("Header 1");
        expect(section.contents[0].columnHeaders![1].contents.content).toBe("Header 2");
      }
    });

    it("should handle null column headers", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.table((t) => 
        t.columnHeaders(() => null)
         .row((r) => 
           r.cell((c) => c.paragraph(() => "Cell 1"))
         )
      );

      const section = builder.build({});
      expect(section.contents[0].type).toBe("table");
      if (section.contents[0].type === "table") {
        expect(section.contents[0].columnHeaders).toBeUndefined();
      }
    });

    it("should handle undefined column headers", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.table((t) => 
        t.columnHeaders(() => undefined)
         .row((r) => 
           r.cell((c) => c.paragraph(() => "Cell 1"))
         )
      );

      const section = builder.build({});
      expect(section.contents[0].type).toBe("table");
      if (section.contents[0].type === "table") {
        expect(section.contents[0].columnHeaders).toBeUndefined();
      }
    });
  });

  describe("table row headers functionality", () => {
    it("should build table with row headers using function", () => {
      const builder = new ContentBuilderImpl<{ rowName: string }>();
      builder.table((t) => 
        t.row((r) => 
          r.header((data) => `Row: ${data.rowName}`)
           .cell((c) => c.paragraph(() => "Cell content"))
        )
      );

      const section = builder.build({ rowName: "First Row" });
      expect(section.contents[0].type).toBe("table");
      if (section.contents[0].type === "table") {
        expect(section.contents[0].rows[0].rowHeader?.type).toBe("table-header-cell");
        expect(section.contents[0].rows[0].rowHeader?.contents.content).toBe("Row: First Row");
      }
    });

    it("should build table with row headers using template strings", () => {
      const builder = new ContentBuilderImpl<{ rowName: string }>();
      builder.table((t) => 
        t.row((r) => 
          r.header`Row: ${"rowName"}`
           .cell((c) => c.paragraph(() => "Cell content"))
        )
      );

      const section = builder.build({ rowName: "Template Row" });
      expect(section.contents[0].type).toBe("table");
      if (section.contents[0].type === "table") {
        expect(section.contents[0].rows[0].rowHeader?.type).toBe("table-header-cell");
        expect(section.contents[0].rows[0].rowHeader?.contents.content).toBe("Row: Template Row");
      }
    });

    it("should handle rows without headers", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.table((t) => 
        t.row((r) => 
          r.cell((c) => c.paragraph(() => "Cell content"))
        )
      );

      const section = builder.build({});
      expect(section.contents[0].type).toBe("table");
      if (section.contents[0].type === "table") {
        expect(section.contents[0].rows[0].rowHeader).toBeUndefined();
      }
    });
  });

  describe("error handling and edge cases", () => {
    it("should handle null/undefined cell builder functions", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.table((t) => 
        t.row((r) => 
          r.cell(() => null)
           .cell(() => undefined)
           .cell((c) => c.paragraph(() => "Valid cell"))
        )
      );

      const section = builder.build({});
      expect(section.contents[0].type).toBe("table");
      if (section.contents[0].type === "table") {
        expect(section.contents[0].rows[0].cells).toHaveLength(1); // Only the valid cell
      }
    });

    it("should handle null/undefined row builder functions", () => {
      const builder = new ContentBuilderImpl<{}>();
      builder.table((t) => 
        t.row(() => null)
         .row(() => undefined)
         .row((r) => r.cell((c) => c.paragraph(() => "Valid row")))
      );

      const section = builder.build({});
      expect(section.contents[0].type).toBe("table");
      if (section.contents[0].type === "table") {
        expect(section.contents[0].rows).toHaveLength(1); // Only the valid row
      }
    });

    it("should handle list template strings with complex data", () => {
      const builder = new ContentBuilderImpl<{ prefix: string; suffix: string }>();
      builder.list((l) => 
        l.item`${"prefix"} middle ${"suffix"}`
      );

      const section = builder.build({ prefix: "start", suffix: "end" });
      expect(section.contents[0].type).toBe("list");
      if (section.contents[0].type === "list") {
        expect((section.contents[0].items[0].content as any).content).toBe("start middle end");
      }
    });

    it("should maintain data isolation between builds", () => {
      const builder = new ContentBuilderImpl<{ value: string }>();
      builder.paragraph((data) => `Value: ${data.value}`);

      const section1 = builder.build({ value: "first" });
      const section2 = builder.build({ value: "second" });

      expect((section1.contents[0] as any).content).toBe("Value: first");
      expect((section2.contents[0] as any).content).toBe("Value: second");
    });
  });
});
