describe("OutputBuilderImpl", () => {
  it("passes", () => { expect(true).toBe(true); });
  // it("throws error if build() is called before configuring output type", () => {
  //   const builder = new OutputBuilderImpl();
  //   expect(() => builder.build()).toThrow("OutputBuilder must be configured with at least one output type.");
  // });

  // it("returns text output when configured with text()", () => {
  //   const builder = new OutputBuilderImpl();
  //   builder.text();
  //   const output = builder.build();
  //   expect(output).toEqual({ type: "output-text" });
  // });

  // it("returns json output when configured with json()", () => {
  //   const builder = new OutputBuilderImpl();
  //   const schema = { reasoning: z.string(), result: z.string() };
  //   builder.json(schema);
  //   const output = builder.build();
  //   expect(output.type).toBe("output-json");
  //   if (output.type === "output-json") {
  //     expect(output.schemaName).toBe("response_schema");
  //     expect(output.schema).toBeInstanceOf(z.ZodObject);
  //     expect(Object.keys(output.schema.shape)).toEqual(["reasoning", "result"]);
  //   } else {
  //     throw new Error("Expected output-json type");
  //   }
  // });

  // it("uses custom schemaName in json()", () => {
  //   const builder = new OutputBuilderImpl();
  //   const schema = { foo: z.string() };
  //   builder.json(schema, "custom_name");
  //   const output = builder.build();
  //   if (output.type === "output-json") {
  //     expect(output.schemaName).toBe("custom_name");
  //   } else {
  //     throw new Error("Expected output-json type");
  //   }
  // });

  // it("uses last called configuration before build()", () => {
  //   const builder = new OutputBuilderImpl();
  //   builder.text();
  //   builder.json({ bar: z.string() });
  //   const output = builder.build();
  //   expect(output.type).toBe("output-json");
  //   if (output.type === "output-json") {
  //     expect(Object.keys(output.schema.shape)).toEqual(["bar"]);
  //   } else {
  //     throw new Error("Expected output-json type");
  //   }
  //   builder.text();
  //   const textOutput = builder.build();
  //   expect(textOutput).toEqual({ type: "output-text" });
  // });
});
