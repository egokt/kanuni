import { TableRowBuilderImpl } from "../../../../src/implementation/prompt/table-row-builder-impl.js";

describe("TableRowBuilderImpl build method", () => {
  const data = { title: "Test Title", value: 42 };

  it("builds a row with a single cell", () => {
    const row: TableRowBuilderImpl<typeof data> = new TableRowBuilderImpl<
      typeof data
    >();
    row.cell((c) => c.paragraph((d: typeof data) => `Cell: ${d.title}`));
    const result = row.build(data);
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0].contents[0]).toEqual({
      type: "paragraph",
      content: "Cell: Test Title",
    });
    expect(result.rowHeader).toBeUndefined();
  });

  it("builds a row with multiple cells", () => {
    const row: TableRowBuilderImpl<typeof data> = new TableRowBuilderImpl<
      typeof data
    >();
    row
      .cell((c) => c.paragraph((d) => `Cell 1: ${d.title}`))
      .cell((c) => c.paragraph((d) => `Cell 2: ${d.value}`));
    const result = row.build(data);
    expect(result.cells).toHaveLength(2);
    expect(result.cells[0].contents[0]).toEqual({
      type: "paragraph",
      content: "Cell 1: Test Title",
    });
    expect(result.cells[1].contents[0]).toEqual({
      type: "paragraph",
      content: "Cell 2: 42",
    });
  });

  it("builds a row with a header (function overload)", () => {
    const row = new TableRowBuilderImpl<typeof data>();
    row.header((d: typeof data) => `Header: ${d.title}`);
    const result = row.build(data);
    expect(result.rowHeader).toBeDefined();
    expect(result.rowHeader?.contents).toEqual({
      type: "paragraph",
      content: "Header: Test Title",
    });
    expect(result.cells).toHaveLength(0);
  });

  it("builds a row with a header (template string overload)", () => {
    const row = new TableRowBuilderImpl<typeof data>();
    row.header`Header: ${"title"}`;
    const result = row.build(data);
    expect(result.rowHeader).toBeDefined();
    expect(result.rowHeader?.contents).toEqual({
      type: "paragraph",
      content: "Header: Test Title",
    });
  });

  it("builds a row with both header and cells", () => {
    const row = new TableRowBuilderImpl<typeof data>();
    row
      .header((d: typeof data) => `Header: ${d.value}`)
      .cell((c: any) => c.paragraph((d: typeof data) => `Cell: ${d.title}`));
    const result = row.build(data);
    expect(result.rowHeader).toBeDefined();
    expect(result.cells).toHaveLength(1);
    expect(result.rowHeader?.contents.content).toBe("Header: 42");
    expect(result.cells[0].contents[0]).toEqual({
      type: "paragraph",
      content: "Cell: Test Title",
    });
  });

  it("does not include undefined/null cells", () => {
    const row = new TableRowBuilderImpl<typeof data>();
    row
      .cell(() => undefined)
      .cell((c: any) => c.paragraph((d: typeof data) => `Cell: ${d.title}`))
      .cell(() => null);
    const result = row.build(data);
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0].contents[0]).toEqual({
      type: "paragraph",
      content: "Cell: Test Title",
    });
  });

  it("does not include undefined/null header", () => {
    // This is not directly possible with the current API, but we can check that no header is present if not set
    const row = new TableRowBuilderImpl<typeof data>();
    row.cell((c: any) => c.paragraph((d: typeof data) => `Cell: ${d.title}`));
    const result = row.build(data);
    expect(result.rowHeader).toBeUndefined();
  });

  it("handles empty row (no cells, no header)", () => {
    const row = new TableRowBuilderImpl<typeof data>();
    const result = row.build(data);
    expect(result.cells).toHaveLength(0);
    expect(result.rowHeader).toBeUndefined();
  });

  it("header content is built with correct data", () => {
    const row = new TableRowBuilderImpl<typeof data>();
    row.header((d: typeof data) => `Header: ${d.value}`);
    const result = row.build({ title: "X", value: 123 });
    expect(result.rowHeader?.contents.content).toBe("Header: 123");
  });

  it("cell content is built with correct data", () => {
    const row = new TableRowBuilderImpl<typeof data>();
    row.cell((c: any) => c.paragraph((d: typeof data) => `Cell: ${d.value}`));
    const result = row.build({ title: "Y", value: 999 });
    expect(result.cells[0].contents[0]).toEqual({
      type: "paragraph",
      content: "Cell: 999",
    });
  });

  it("multiple calls to build produce consistent results", () => {
    const row = new TableRowBuilderImpl<typeof data>();
    row
      .header((d: typeof data) => `Header: ${d.title}`)
      .cell((c: any) => c.paragraph((d: typeof data) => `Cell: ${d.value}`));
    const result1 = row.build({ title: "A", value: 1 });
    const result2 = row.build({ title: "A", value: 1 });
    expect(result1).toEqual(result2);
  });

  it("cell order is preserved", () => {
    const row = new TableRowBuilderImpl<typeof data>();
    row
      .cell((c: any) => c.paragraph((d: typeof data) => `Cell1: ${d.title}`))
      .header((d: typeof data) => `Header: ${d.value}`)
      .cell((c: any) => c.paragraph((d: typeof data) => `Cell2: ${d.value}`));
    const result = row.build({ title: "B", value: 7 });
    // Cells should be in the order they were added
    expect(result.cells[0].contents[0]).toEqual({
      type: "paragraph",
      content: "Cell1: B",
    });
    expect(result.cells[1].contents[0]).toEqual({
      type: "paragraph",
      content: "Cell2: 7",
    });
    // Header should be correct
    expect(result.rowHeader?.contents.content).toBe("Header: 7");
  });
});
