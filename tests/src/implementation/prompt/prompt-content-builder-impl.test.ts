import { PromptContentBuilderImpl } from "../../../../src/implementation/prompt/prompt-content-builder-impl.js";

describe("PromptContentBuilderImpl", () => {
  describe("Basic functionality", () => {
    it("should build empty prompt with no content", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      const prompt = builder.build({});
      
      expect(prompt).toEqual({
        type: "prompt",
        contents: [],
      });
    });

    it("should build prompt with paragraph using function", () => {
      const builder = new PromptContentBuilderImpl<{ name: string }, string>();
      builder.paragraph((data) => `Hello, ${data.name}!`);
      
      const prompt = builder.build({ name: "World" });
      expect(prompt.type).toBe("prompt");
      expect(prompt.contents).toHaveLength(1);
      expect(prompt.contents[0]).toEqual({
        type: "paragraph",
        content: "Hello, World!",
      });
    });

    it("should build prompt with paragraph using template strings", () => {
      const builder = new PromptContentBuilderImpl<{ name: string }, string>();
      builder.paragraph`Hello, ${"name"}!`;
      
      const prompt = builder.build({ name: "World" });
      expect(prompt.type).toBe("prompt");
      expect(prompt.contents).toHaveLength(1);
      expect(prompt.contents[0]).toEqual({
        type: "paragraph",
        content: "Hello, World!",
      });
    });

    it("should build prompt with list", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      builder.list((l) => l.item(() => "Item 1").item(() => "Item 2"));
      
      const prompt = builder.build({});
      expect(prompt.type).toBe("prompt");
      expect(prompt.contents).toHaveLength(1);
      expect(prompt.contents[0].type).toBe("list");
      
      if (prompt.contents[0].type === "list") {
        expect(prompt.contents[0].items).toHaveLength(2);
        expect(prompt.contents[0].items[0].content.type).toBe("paragraph");
        if (prompt.contents[0].items[0].content.type === "paragraph") {
          expect(prompt.contents[0].items[0].content.content).toBe("Item 1");
        }
      }
    });

    it("should build prompt with table", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      builder.table((t) => 
        t.row((r) => 
          r.cell((c) => c.paragraph(() => "Cell A"))
           .cell((c) => c.paragraph(() => "Cell B"))
        )
      );
      
      const prompt = builder.build({});
      expect(prompt.type).toBe("prompt");
      expect(prompt.contents).toHaveLength(1);
      expect(prompt.contents[0].type).toBe("table");
      
      if (prompt.contents[0].type === "table") {
        expect(prompt.contents[0].rows).toHaveLength(1);
        expect(prompt.contents[0].rows[0].cells).toHaveLength(2);
        expect(prompt.contents[0].rows[0].cells[0].contents[0].type).toBe("paragraph");
      }
    });

    it("should build prompt with regular section", () => {
      const builder = new PromptContentBuilderImpl<{ title: string }, string>();
      builder.section((s) => 
        s.heading`Section: ${"title"}`
         .paragraph(() => "Section content")
      );
      
      const prompt = builder.build({ title: "Test" });
      expect(prompt.type).toBe("prompt");
      expect(prompt.contents).toHaveLength(1);
      expect(prompt.contents[0].type).toBe("section");
      
      if (prompt.contents[0].type === "section") {
        expect(prompt.contents[0].heading).toBe("Section: Test");
        expect(prompt.contents[0].contents).toHaveLength(1);
        expect(prompt.contents[0].contents[0].type).toBe("paragraph");
      }
    });
  });

  describe("Special sections", () => {
    it("should build prompt with memory section", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      const result = builder.memorySection((s) => 
        s.heading`Memory Section`
         .paragraph(() => "Memory content")
      );
      
      // Test that it returns the correct type (PromptContentWoMemoryBuilder)
      expect(result).toBe(builder);
      
      const prompt = builder.build({});
      expect(prompt.type).toBe("prompt");
      expect(prompt.contents).toHaveLength(1);
      expect(prompt.contents[0].type).toBe("section");
      
      if (prompt.contents[0].type === "section") {
        expect(prompt.contents[0].isMemorySection).toBe(true);
        expect(prompt.contents[0].heading).toBe("Memory Section");
        expect(prompt.contents[0].contents).toHaveLength(1);
      }
    });

    it("should build prompt with tools section", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      const result = builder.toolsSection((s) => 
        s.heading`Tools Section`
         .paragraph(() => "Tools content")
      );
      
      // Test that it returns the correct type (PromptContentWoToolsBuilder)
      expect(result).toBe(builder);
      
      const prompt = builder.build({});
      expect(prompt.type).toBe("prompt");
      expect(prompt.contents).toHaveLength(1);
      expect(prompt.contents[0].type).toBe("section");
      
      if (prompt.contents[0].type === "section") {
        expect(prompt.contents[0].isToolsSection).toBe(true);
        expect(prompt.contents[0].heading).toBe("Tools Section");
        expect(prompt.contents[0].contents).toHaveLength(1);
      }
    });

    it("should build prompt with output specs section", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      const result = builder.outputSpecsSection((s) => 
        s.heading`Output Specifications`
         .paragraph(() => "Output specs content")
      );
      
      // Test that it returns the correct type (PromptContentWoOutputSpecsBuilder)
      expect(result).toBe(builder);
      
      const prompt = builder.build({});
      expect(prompt.type).toBe("prompt");
      expect(prompt.contents).toHaveLength(1);
      expect(prompt.contents[0].type).toBe("section");
      
      if (prompt.contents[0].type === "section") {
        expect(prompt.contents[0].isOutputSpecsSection).toBe(true);
        expect(prompt.contents[0].heading).toBe("Output Specifications");
        expect(prompt.contents[0].contents).toHaveLength(1);
      }
    });
  });

  describe("Method chaining and fluent interface", () => {
    it("should support chaining multiple content builders", () => {
      const builder = new PromptContentBuilderImpl<{ name: string; count: number }, string>();
      const result = builder
        .paragraph((data) => `Hello, ${data.name}!`)
        .list((l) => l.item(() => "List item"))
        .table((t) => t.row((r) => r.cell((c) => c.paragraph(() => "Cell"))))
        .section((s) => s.paragraph`Count: ${"count"}`);
      
      expect(result).toBe(builder);
      
      const prompt = builder.build({ name: "Test", count: 42 });
      expect(prompt.contents).toHaveLength(4);
      expect(prompt.contents[0].type).toBe("paragraph");
      expect(prompt.contents[1].type).toBe("list");
      expect(prompt.contents[2].type).toBe("table");
      expect(prompt.contents[3].type).toBe("section");
    });

    it("should support chaining with special sections", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      const result = builder
        .paragraph(() => "Introduction")
        .memorySection((s) => s.heading`Memory`.paragraph(() => "Memory content"))
        .toolsSection((s) => s.heading`Tools`.paragraph(() => "Tools content"))
        .outputSpecsSection((s) => s.heading`Output`.paragraph(() => "Output content"));
      
      expect(result).toBe(builder);
      
      const prompt = builder.build({});
      expect(prompt.contents).toHaveLength(4);
      
      // Check memory section
      if (prompt.contents[1].type === "section") {
        expect(prompt.contents[1].isMemorySection).toBe(true);
      }
      
      // Check tools section  
      if (prompt.contents[2].type === "section") {
        expect(prompt.contents[2].isToolsSection).toBe(true);
      }
      
      // Check output specs section
      if (prompt.contents[3].type === "section") {
        expect(prompt.contents[3].isOutputSpecsSection).toBe(true);
      }
    });
  });

  describe("Complex parameter types", () => {
    it("should work with complex nested parameter types", () => {
      type ComplexParams = {
        user: { name: string; profile: { age: number; active: boolean } };
        metadata: { created: string; tags: string[] };
      };
      
      const builder = new PromptContentBuilderImpl<ComplexParams, string>();
      builder
        .paragraph((data) => `User: ${data.user.name}, Age: ${data.user.profile.age}`)
        .paragraph((data) => `Active: ${data.user.profile.active ? "Yes" : "No"}`)
        .list((l, data) => {
          data.metadata.tags.forEach(tag => {
            l.item(() => `Tag: ${tag}`);
          });
          return l;
        });
      
      const prompt = builder.build({
        user: { 
          name: "John", 
          profile: { age: 30, active: true } 
        },
        metadata: { 
          created: "2023-01-01", 
          tags: ["important", "urgent"] 
        }
      });
      
      expect(prompt.contents).toHaveLength(3);
      if (prompt.contents[0].type === "paragraph") {
        expect(prompt.contents[0].content).toBe("User: John, Age: 30");
      }
      if (prompt.contents[2].type === "list") {
        expect(prompt.contents[2].items).toHaveLength(2);
      }
    });

    it("should handle optional parameters", () => {
      type ParamsWithOptional = { 
        required: string; 
        optional?: string;
        nested?: { value?: number };
      };
      
      const builder = new PromptContentBuilderImpl<ParamsWithOptional, string>();
      builder.paragraph((data) => 
        `Required: ${data.required}, Optional: ${data.optional || "N/A"}, Nested: ${data.nested?.value || "N/A"}`
      );
      
      const prompt1 = builder.build({ required: "test" });
      const prompt2 = builder.build({ 
        required: "test", 
        optional: "provided",
        nested: { value: 42 }
      });
      
      if (prompt1.contents[0].type === "paragraph") {
        expect(prompt1.contents[0].content).toBe("Required: test, Optional: N/A, Nested: N/A");
      }
      if (prompt2.contents[0].type === "paragraph") {
        expect(prompt2.contents[0].content).toBe("Required: test, Optional: provided, Nested: 42");
      }
    });
  });

  describe("Edge cases and error handling", () => {
    it("should filter out null and undefined content", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      builder
        .list(() => null)  // Should be filtered out
        .table(() => undefined)  // Should be filtered out
        .paragraph(() => "Valid content")
        .section(() => null);  // Should be filtered out
      
      const prompt = builder.build({});
      expect(prompt.contents).toHaveLength(1);
      expect(prompt.contents[0].type).toBe("paragraph");
    });

    it("should handle empty template strings", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      builder.paragraph``;
      
      const prompt = builder.build({});
      expect(prompt.contents[0]).toEqual({
        type: "paragraph",
        content: "",
      });
    });

    it("should handle template strings with no parameters", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      builder.paragraph`Fixed text only`;
      
      const prompt = builder.build({});
      expect(prompt.contents[0]).toEqual({
        type: "paragraph", 
        content: "Fixed text only",
      });
    });

    it("should handle multiple parameters in template strings", () => {
      const builder = new PromptContentBuilderImpl<{ 
        first: string; 
        second: string; 
        third: number 
      }, string>();
      builder.paragraph`First: ${"first"}, Second: ${"second"}, Third: ${"third"}`;
      
      const prompt = builder.build({ first: "A", second: "B", third: 3 });
      expect(prompt.contents[0]).toEqual({
        type: "paragraph",
        content: "First: A, Second: B, Third: 3",
      });
    });

    it("should handle special characters in template strings", () => {
      const builder = new PromptContentBuilderImpl<{ value: string }, string>();
      builder.paragraph`Special chars: ${"value"} & more`;
      
      const prompt = builder.build({ value: "test<>&\"'" });
      expect(prompt.contents[0]).toEqual({
        type: "paragraph",
        content: "Special chars: test<>&\"' & more",
      });
    });

    it("should handle function parameters returning empty strings", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      builder.paragraph(() => "");
      
      const prompt = builder.build({});
      expect(prompt.contents[0]).toEqual({
        type: "paragraph",
        content: "",
      });
    });
  });

  describe("Data isolation and immutability", () => {
    it("should maintain data isolation between builds", () => {
      const builder = new PromptContentBuilderImpl<{ value: string }, string>();
      builder.paragraph((data) => `Value: ${data.value}`);
      
      const prompt1 = builder.build({ value: "first" });
      const prompt2 = builder.build({ value: "second" });
      
      if (prompt1.contents[0].type === "paragraph" && prompt2.contents[0].type === "paragraph") {
        expect(prompt1.contents[0].content).toBe("Value: first");
        expect(prompt2.contents[0].content).toBe("Value: second");
      }
    });

    it("should not modify builder state between builds", () => {
      const builder = new PromptContentBuilderImpl<{ counter: number }, string>();
      builder.paragraph((data) => `Count: ${data.counter}`);
      
      const prompt1 = builder.build({ counter: 1 });
      const prompt2 = builder.build({ counter: 2 });
      const prompt3 = builder.build({ counter: 3 });
      
      // All builds should be independent
      expect(prompt1.contents).toHaveLength(1);
      expect(prompt2.contents).toHaveLength(1);
      expect(prompt3.contents).toHaveLength(1);
      
      if (prompt1.contents[0].type === "paragraph" && 
          prompt2.contents[0].type === "paragraph" && 
          prompt3.contents[0].type === "paragraph") {
        expect(prompt1.contents[0].content).toBe("Count: 1");
        expect(prompt2.contents[0].content).toBe("Count: 2");
        expect(prompt3.contents[0].content).toBe("Count: 3");
      }
    });

    it("should support multiple builders with same parameters independently", () => {
      type TestParams = { value: string };
      
      const builder1 = new PromptContentBuilderImpl<TestParams, string>();
      const builder2 = new PromptContentBuilderImpl<TestParams, string>();
      
      builder1.paragraph((data) => `Builder 1: ${data.value}`);
      builder2.paragraph((data) => `Builder 2: ${data.value}`);
      
      const prompt1 = builder1.build({ value: "test" });
      const prompt2 = builder2.build({ value: "test" });
      
      if (prompt1.contents[0].type === "paragraph" && prompt2.contents[0].type === "paragraph") {
        expect(prompt1.contents[0].content).toBe("Builder 1: test");
        expect(prompt2.contents[0].content).toBe("Builder 2: test");
      }
    });
  });

  describe("Integration with nested content", () => {
    it("should build complex nested prompt structure", () => {
      type PromptData = {
        title: string;
        sections: Array<{
          name: string;
          items: string[];
          tableData: Array<{ col1: string; col2: string }>;
        }>;
        memory: string;
        tools: string[];
        outputFormat: string;
      };
      
      const builder = new PromptContentBuilderImpl<PromptData, string>();
      builder
        .paragraph((data) => `Document: ${data.title}`)
        .section((s) => 
          s.heading`Main Sections`
           .list((l, data) => {
             data.sections.forEach(section => {
               l.item(() => section.name)
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
             t.columnHeaders(() => ["Column 1", "Column 2"])
              .row((r) => 
                r.cell((c) => c.paragraph(() => "A1"))
                 .cell((c) => c.paragraph(() => "B1"))
              )
              .row((r) => 
                r.cell((c) => c.paragraph(() => "A2"))
                 .cell((c) => c.paragraph(() => "B2"))
              )
           )
        )
        .memorySection((s) => 
          s.heading`Memory`
           .paragraph((data) => data.memory)
        )
        .toolsSection((s) => 
          s.heading`Available Tools`
           .list((l, data) => {
             data.tools.forEach(tool => {
               l.item(() => tool);
             });
             return l;
           })
        )
        .outputSpecsSection((s) => 
          s.heading`Output Format`
           .paragraph((data) => data.outputFormat)
        );
      
      const prompt = builder.build({
        title: "Complex Document",
        sections: [
          {
            name: "Introduction",
            items: ["Point 1", "Point 2"],
            tableData: [
              { col1: "A1", col2: "B1" },
              { col1: "A2", col2: "B2" }
            ]
          }
        ],
        memory: "Remember this context",
        tools: ["Tool 1", "Tool 2"],
        outputFormat: "JSON format required"
      });
      
      expect(prompt.type).toBe("prompt");
      expect(prompt.contents).toHaveLength(5); // paragraph, section, memory, tools, outputSpecs
      
      // Verify main content
      expect(prompt.contents[0].type).toBe("paragraph");
      expect(prompt.contents[1].type).toBe("section");
      
      // Verify special sections
      if (prompt.contents[2].type === "section") {
        expect(prompt.contents[2].isMemorySection).toBe(true);
      }
      if (prompt.contents[3].type === "section") {
        expect(prompt.contents[3].isToolsSection).toBe(true);
      }
      if (prompt.contents[4].type === "section") {
        expect(prompt.contents[4].isOutputSpecsSection).toBe(true);
      }
    });

    it("should handle deeply nested sections", () => {
      const builder = new PromptContentBuilderImpl<{ depth: number }, string>();
      builder.section((s) => 
        s.heading`Level 1`
         .section((s2) => 
           s2.heading`Level 2`
            .section((s3) => 
              s3.heading`Level 3`
               .paragraph((data) => `Depth: ${data.depth}`)
            )
         )
      );
      
      const prompt = builder.build({ depth: 3 });
      expect(prompt.contents).toHaveLength(1);
      expect(prompt.contents[0].type).toBe("section");
      
      if (prompt.contents[0].type === "section") {
        expect(prompt.contents[0].contents).toHaveLength(1);
        expect(prompt.contents[0].contents[0].type).toBe("section");
        
        if (prompt.contents[0].contents[0].type === "section") {
          expect(prompt.contents[0].contents[0].contents).toHaveLength(1);
          expect(prompt.contents[0].contents[0].contents[0].type).toBe("section");
        }
      }
    });
  });

  describe("Return type consistency", () => {
    it("should return correct types for method chaining", () => {
      const builder = new PromptContentBuilderImpl<{ value: string }, string>();
      
      // Test that all methods return the correct builder type for chaining
      const result1 = builder.paragraph(() => "test");
      const result2 = result1.list(() => null);
      const result3 = result2.table(() => undefined);
      const result4 = result3.section(() => null);
      
      expect(result1).toBe(builder);
      expect(result2).toBe(builder);
      expect(result3).toBe(builder);
      expect(result4).toBe(builder);
    });

    it("should return correct restricted types for special sections", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      
      const memoryResult = builder.memorySection((s) => s.heading`Memory`);
      const toolsResult = memoryResult.toolsSection((s) => s.heading`Tools`);
      const outputResult = toolsResult.outputSpecsSection((s) => s.heading`Output`);
      
      // All should return the same builder instance but with restricted types
      expect(memoryResult).toBe(builder);
      expect(toolsResult).toBe(builder);
      expect(outputResult).toBe(builder);
    });
  });

  describe("Build order consistency", () => {
    it("should produce consistent results regardless of call order", () => {
      const createBuilder = () => {
        const builder = new PromptContentBuilderImpl<{ value: string }, string>();
        builder
          .paragraph((data) => `First: ${data.value}`)
          .list((l) => l.item((data) => `List: ${data.value}`))
          .paragraph((data) => `Second: ${data.value}`)
          .section((s) => s.paragraph((data) => `Section: ${data.value}`));
        return builder;
      };
      
      const builder1 = createBuilder();
      const builder2 = createBuilder();
      
      const prompt1 = builder1.build({ value: "test" });
      const prompt2 = builder2.build({ value: "test" });
      
      expect(prompt1).toEqual(prompt2);
    });

    it("should maintain correct content order after chaining", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      builder
        .paragraph(() => "First paragraph")
        .list((l) => l.item(() => "List item"))
        .paragraph(() => "Second paragraph")
        .table((t) => t.row((r) => r.cell((c) => c.paragraph(() => "Table cell"))))
        .section((s) => s.paragraph(() => "Section paragraph"));
      
      const prompt = builder.build({});
      expect(prompt.contents).toHaveLength(5);
      
      expect(prompt.contents[0].type).toBe("paragraph");
      expect(prompt.contents[1].type).toBe("list");
      expect(prompt.contents[2].type).toBe("paragraph");
      expect(prompt.contents[3].type).toBe("table");
      expect(prompt.contents[4].type).toBe("section");
      
      if (prompt.contents[0].type === "paragraph" && prompt.contents[2].type === "paragraph") {
        expect(prompt.contents[0].content).toBe("First paragraph");
        expect(prompt.contents[2].content).toBe("Second paragraph");
      }
    });
  });
});

describe("Advanced test cases", () => {
  describe("Special section combinations", () => {
    it("should handle all three special sections in one prompt", () => {
      const builder = new PromptContentBuilderImpl<{ title: string }, string>();
      builder
        .paragraph((data) => `Title: ${data.title}`)
        .memorySection((s) => 
          s.heading`Memory`
           .paragraph(() => "Remember this")
           .list((l) => l.item(() => "Memory item"))
        )
        .paragraph(() => "Between sections")
        .toolsSection((s) => 
          s.heading`Tools`
           .paragraph(() => "Available tools")
           .table((t) => 
             t.row((r) => r.cell((c) => c.paragraph(() => "Tool 1")))
           )
        )
        .outputSpecsSection((s) => 
          s.heading`Output Format`
           .paragraph(() => "JSON required")
        );

      const prompt = builder.build({ title: "Test Document" });
      
      expect(prompt.contents).toHaveLength(5);
      expect(prompt.contents[0].type).toBe("paragraph");
      
      // Memory section
      expect(prompt.contents[1].type).toBe("section");
      if (prompt.contents[1].type === "section") {
        expect(prompt.contents[1].isMemorySection).toBe(true);
        expect(prompt.contents[1].isToolsSection).toBeUndefined();
        expect(prompt.contents[1].isOutputSpecsSection).toBeUndefined();
        expect(prompt.contents[1].heading).toBe("Memory");
        expect(prompt.contents[1].contents).toHaveLength(2); // paragraph + list
      }
      
      expect(prompt.contents[2].type).toBe("paragraph");
      
      // Tools section  
      expect(prompt.contents[3].type).toBe("section");
      if (prompt.contents[3].type === "section") {
        expect(prompt.contents[3].isToolsSection).toBe(true);
        expect(prompt.contents[3].isMemorySection).toBeUndefined();
        expect(prompt.contents[3].isOutputSpecsSection).toBeUndefined();
        expect(prompt.contents[3].heading).toBe("Tools");
        expect(prompt.contents[3].contents).toHaveLength(2); // paragraph + table
      }
      
      // Output specs section
      expect(prompt.contents[4].type).toBe("section");
      if (prompt.contents[4].type === "section") {
        expect(prompt.contents[4].isOutputSpecsSection).toBe(true);
        expect(prompt.contents[4].isMemorySection).toBeUndefined();
        expect(prompt.contents[4].isToolsSection).toBeUndefined();
        expect(prompt.contents[4].heading).toBe("Output Format");
        expect(prompt.contents[4].contents).toHaveLength(1); // paragraph
      }
    });

    it("should handle empty special sections", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      builder
        .memorySection(() => null)
        .toolsSection(() => undefined)
        .outputSpecsSection((s) => s.heading`Output`);

      const prompt = builder.build({});
      expect(prompt.contents).toHaveLength(1); // Only the output specs section
      expect(prompt.contents[0].type).toBe("section");
      if (prompt.contents[0].type === "section") {
        expect(prompt.contents[0].isOutputSpecsSection).toBe(true);
      }
    });
  });

  describe("Mixed content types", () => {
    it("should handle alternating content types correctly", () => {
      const builder = new PromptContentBuilderImpl<{ items: string[] }, string>();
      builder
        .paragraph(() => "Intro paragraph")
        .list((l, data) => {
          data.items.forEach(item => {
            l.item(() => item);
          });
          return l;
        })
        .paragraph(() => "Middle paragraph")
        .table((t) => 
          t.columnHeaders(() => ["Col1", "Col2"])
           .row((r) => 
             r.cell((c) => c.paragraph(() => "A"))
              .cell((c) => c.paragraph(() => "B"))
           )
        )
        .paragraph(() => "End paragraph")
        .section((s) => 
          s.heading`Regular Section`
           .paragraph(() => "Section content")
        );

      const prompt = builder.build({ items: ["Item 1", "Item 2"] });
      
      expect(prompt.contents).toHaveLength(6);
      expect(prompt.contents[0].type).toBe("paragraph");
      expect(prompt.contents[1].type).toBe("list");
      expect(prompt.contents[2].type).toBe("paragraph");
      expect(prompt.contents[3].type).toBe("table");
      expect(prompt.contents[4].type).toBe("paragraph");
      expect(prompt.contents[5].type).toBe("section");
      
      // Check list content
      if (prompt.contents[1].type === "list") {
        expect(prompt.contents[1].items).toHaveLength(2);
      }
      
      // Check table content
      if (prompt.contents[3].type === "table") {
        expect(prompt.contents[3].columnHeaders).toHaveLength(2);
        expect(prompt.contents[3].rows).toHaveLength(1);
      }
      
      // Check regular section (should not have special flags)
      if (prompt.contents[5].type === "section") {
        expect(prompt.contents[5].isMemorySection).toBeUndefined();
        expect(prompt.contents[5].isToolsSection).toBeUndefined();
        expect(prompt.contents[5].isOutputSpecsSection).toBeUndefined();
        expect(prompt.contents[5].heading).toBe("Regular Section");
      }
    });
  });

  describe("Parameter handling edge cases", () => {
    it("should handle null/undefined parameter values gracefully", () => {
      type NullableParams = { 
        name?: string | null; 
        count?: number | null;
        items?: string[] | null;
      };
      
      const builder = new PromptContentBuilderImpl<NullableParams, string>();
      builder
        .paragraph((data) => `Name: ${data.name || "Unknown"}`)
        .paragraph((data) => `Count: ${data.count ?? 0}`)
        .list((l, data) => {
          const items = data.items || [];
          items.forEach(item => {
            if (item) {
              l.item(() => item);
            }
          });
          return l;
        });

      const prompt = builder.build({ 
        name: null, 
        count: undefined,
        items: null
      });
      
      expect(prompt.contents).toHaveLength(3);
      if (prompt.contents[0].type === "paragraph") {
        expect(prompt.contents[0].content).toBe("Name: Unknown");
      }
      if (prompt.contents[1].type === "paragraph") {
        expect(prompt.contents[1].content).toBe("Count: 0");
      }
      if (prompt.contents[2].type === "list") {
        expect(prompt.contents[2].items).toHaveLength(0);
      }
    });

    it("should handle functions that throw errors gracefully", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      
      // This test verifies that errors in user functions propagate correctly
      expect(() => {
        builder.paragraph(() => {
          throw new Error("User function error");
        });
        builder.build({});
      }).toThrow("User function error");
    });

    it("should handle very large parameter objects", () => {
      type LargeParams = {
        data: Record<string, any>;
        largeArray: number[];
        nestedObject: { level1: { level2: { level3: string } } };
      };

      const builder = new PromptContentBuilderImpl<LargeParams, string>();
      builder
        .paragraph((data) => `Array length: ${data.largeArray.length}`)
        .paragraph((data) => `Nested: ${data.nestedObject.level1.level2.level3}`)
        .list((l, data) => {
          // Only show first 3 items to keep test reasonable
          data.largeArray.slice(0, 3).forEach(num => {
            l.item(() => `Number: ${num}`);
          });
          return l;
        });

      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const prompt = builder.build({
        data: { /* large object */ },
        largeArray,
        nestedObject: { level1: { level2: { level3: "deep value" } } }
      });

      expect(prompt.contents).toHaveLength(3);
      if (prompt.contents[0].type === "paragraph") {
        expect(prompt.contents[0].content).toBe("Array length: 1000");
      }
      if (prompt.contents[1].type === "paragraph") {
        expect(prompt.contents[1].content).toBe("Nested: deep value");
      }
      if (prompt.contents[2].type === "list") {
        expect(prompt.contents[2].items).toHaveLength(3);
      }
    });
  });

  describe("Performance and memory considerations", () => {
    it("should handle multiple builds without memory leaks", () => {
      const builder = new PromptContentBuilderImpl<{ iteration: number }, string>();
      builder
        .paragraph((data) => `Iteration: ${data.iteration}`)
        .list((l, data) => {
          for (let i = 0; i < data.iteration; i++) {
            l.item(() => `Item ${i}`);
          }
          return l;
        });

      // Build multiple times with different parameters
      for (let i = 1; i <= 10; i++) {
        const prompt = builder.build({ iteration: i });
        expect(prompt.contents).toHaveLength(2);
        
        if (prompt.contents[1].type === "list") {
          expect(prompt.contents[1].items).toHaveLength(i);
        }
      }
    });

    it("should handle builder reuse correctly", () => {
      const builder = new PromptContentBuilderImpl<{ value: string }, string>();
      builder.paragraph((data) => `Value: ${data.value}`);

      const prompt1 = builder.build({ value: "first" });
      const prompt2 = builder.build({ value: "second" });
      const prompt3 = builder.build({ value: "third" });

      // Each build should be independent
      if (prompt1.contents[0].type === "paragraph" && 
          prompt2.contents[0].type === "paragraph" && 
          prompt3.contents[0].type === "paragraph") {
        expect(prompt1.contents[0].content).toBe("Value: first");
        expect(prompt2.contents[0].content).toBe("Value: second");
        expect(prompt3.contents[0].content).toBe("Value: third");
      }

      // Original builder should be unchanged
      const prompt4 = builder.build({ value: "fourth" });
      if (prompt4.contents[0].type === "paragraph") {
        expect(prompt4.contents[0].content).toBe("Value: fourth");
      }
    });
  });

  describe("Fluent API behavior verification", () => {
    it("should maintain fluent interface contracts", () => {
      const builder = new PromptContentBuilderImpl<{}, string>();
      
      // Test that each method returns the correct type for continued chaining
      const step1 = builder.paragraph(() => "test");
      expect(step1).toBe(builder);
      
      const step2 = step1.list((l) => l.item(() => "item"));
      expect(step2).toBe(builder);
      
      const step3 = step2.table((t) => t.row((r) => r.cell((c) => c.paragraph(() => "cell"))));
      expect(step3).toBe(builder);
      
      const step4 = step3.section((s) => s.paragraph(() => "section"));
      expect(step4).toBe(builder);
      
      // Special sections should return same instance but with type restrictions
      const memoryBuilder = step4.memorySection((s) => s.heading`Memory`);
      expect(memoryBuilder).toBe(builder);
      
      const toolsBuilder = memoryBuilder.toolsSection((s) => s.heading`Tools`);
      expect(toolsBuilder).toBe(builder);
      
      const outputBuilder = toolsBuilder.outputSpecsSection((s) => s.heading`Output`);
      expect(outputBuilder).toBe(builder);
      
      // Final build should work
      const prompt = (outputBuilder as any).build({});
      expect(prompt.type).toBe("prompt");
      expect(prompt.contents).toHaveLength(7);
    });

    it("should support method chaining in any order", () => {
      const builder1 = new PromptContentBuilderImpl<{ value: string }, string>();
      builder1
        .section((s) => s.heading`First Section`.paragraph((data) => `Section: ${data.value}`))
        .paragraph((data) => `Paragraph: ${data.value}`)
        .list((l) => l.item((data) => `List item: ${data.value}`))
        .memorySection((s) => s.heading`Memory`.paragraph((data) => `Memory: ${data.value}`))
        .table((t) => t.row((r) => r.cell((c) => c.paragraph((data) => `Table: ${data.value}`))))
        .toolsSection((s) => s.heading`Tools`.paragraph((data) => `Tools: ${data.value}`))
        .outputSpecsSection((s) => s.heading`Output`.paragraph((data) => `Output: ${data.value}`));

      const builder2 = new PromptContentBuilderImpl<{ value: string }, string>();
      builder2
        .section((s) => s.heading`First Section`.paragraph((data) => `Section: ${data.value}`))
        .paragraph((data) => `Paragraph: ${data.value}`)
        .list((l) => l.item((data) => `List item: ${data.value}`))
        .memorySection((s) => s.heading`Memory`.paragraph((data) => `Memory: ${data.value}`))
        .table((t) => t.row((r) => r.cell((c) => c.paragraph((data) => `Table: ${data.value}`))))
        .toolsSection((s) => s.heading`Tools`.paragraph((data) => `Tools: ${data.value}`))
        .outputSpecsSection((s) => s.heading`Output`.paragraph((data) => `Output: ${data.value}`));
      
      const prompt1 = builder1.build({ value: "test1" });
      const prompt2 = builder2.build({ value: "test2" });
      
      // Both should have same structure
      expect(prompt1.contents).toHaveLength(7);
      expect(prompt2.contents).toHaveLength(7);
      
      // But different content
      expect(prompt1).not.toEqual(prompt2);
    });
  });
});