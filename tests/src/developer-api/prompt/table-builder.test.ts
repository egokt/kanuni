import { TableBuilderImpl } from '../../../../src/developer-api/prompt/table-builder.js';
import { Paragraph, Table } from '../../../../src/developer-api/prompt/types.js';

describe('TableBuilderImpl', () => {
  it('builds a basic table with rows and cells', () => {
    const builder = new TableBuilderImpl<{ foo: string }>();
    builder.row(r => r.cell(c => c.paragraph(data => `cell: ${data.foo}`)));
    const table = builder.build({ foo: 'bar' });
    expect(table.type).toBe('table');
    expect(table.rows.length).toBe(1);
    expect(table.rows[0].cells.length).toBe(1);
    const para = table.rows[0].cells[0].contents[0];
    expect(para.type).toBe('paragraph');
    expect((para as Paragraph).content).toBe('cell: bar');
  });

  it('sets column headers if provided', () => {
    const builder = new TableBuilderImpl<{ foo: string }>();
    builder.columnHeaders(data => [`Header 1: ${data.foo}`, 'Header 2']);
    builder.row(r => r.cell(c => c.paragraph`cell1`).cell(c => c.paragraph`cell2`));
    const table = builder.build({ foo: 'baz' });
    expect(table.columnHeaders).toBeDefined();
    expect(table.columnHeaders!.length).toBe(2);
    expect(table.columnHeaders![0].contents.content).toBe('Header 1: baz');
    expect(table.columnHeaders![1].contents.content).toBe('Header 2');
  });

  it('does not set columnHeaders if not provided', () => {
    const builder = new TableBuilderImpl<{}>();
    builder.row(r => r.cell(c => c.paragraph`cell`));
    const table = builder.build({});
    expect(table.columnHeaders).toBeUndefined();
  });

  it('supports row headers', () => {
    const builder = new TableBuilderImpl<{ foo: string }>();
    builder.row(r => r.header(data => `row header: ${data.foo}`).cell(c => c.paragraph`cell`));
    const table = builder.build({ foo: 'rowfoo' });
    expect(table.rows[0].rowHeader).toBeDefined();
    expect(table.rows[0].rowHeader!.contents.content).toBe('row header: rowfoo');
  });

  it('does not set rowHeader if not provided', () => {
    const builder = new TableBuilderImpl<{}>();
    builder.row(r => r.cell(c => c.paragraph`cell`));
    const table = builder.build({});
    expect(table.rows[0].rowHeader).toBeUndefined();
  });

  it('supports nested tables and lists in cells', () => {
    const builder = new TableBuilderImpl<{ foo: string }>();
    builder.row(r => r.cell(c =>
      c.paragraph`outer cell`
       .list(l => l.item`item1`.item`item2`)
       .table(t => t
         .columnHeaders(() => ['A'])
         .row(r2 => r2.cell(c2 => c2.paragraph`nested cell`))
       )
    ));
    const table = builder.build({ foo: 'bar' });
    const cellContents = table.rows[0].cells[0].contents;
    expect(cellContents.some(x => x.type === 'paragraph')).toBe(true);
    expect(cellContents.some(x => x.type === 'list')).toBe(true);
    expect(cellContents.some(x => x.type === 'table')).toBe(true);
    const nestedTable = cellContents.find(x => x.type === 'table') as Table;
    expect(nestedTable.rows.length).toBe(1);
    expect(nestedTable.columnHeaders![0].contents.content).toBe('A');
  });

  it('parameterizes data for dynamic content', () => {
    const builder = new TableBuilderImpl<{ foo: string, bar: string }>();
    builder.columnHeaders(data => [`${data.foo}`, `${data.bar}`]);
    builder.row(r => r.header(data => `row: ${data.foo}`).cell(c => c.paragraph(data => data.bar)));
    const table = builder.build({ foo: 'f', bar: 'b' });
    expect(table.columnHeaders![0].contents.content).toBe('f');
    expect(table.columnHeaders![1].contents.content).toBe('b');
    expect(table.rows[0].rowHeader!.contents.content).toBe('row: f');
    const para = table.rows[0].cells[0].contents[0];
    expect(para.type).toBe('paragraph');
    expect((para as Paragraph).content).toBe('b');
  });

  it('returns an empty table if no rows or headers are added', () => {
    const builder = new TableBuilderImpl<{}>();
    const table = builder.build({});
    expect(table.type).toBe('table');
    expect(table.rows.length).toBe(0);
    expect(table.columnHeaders).toBeUndefined();
  });

  it('uses only the first set of column headers if multiple are added', () => {
    const builder = new TableBuilderImpl<{ foo: string }>();
    builder.columnHeaders(() => ['A', 'B']);
    builder.columnHeaders(() => ['C', 'D']);
    builder.row(r => r.cell(c => c.paragraph`cell`));
    const table = builder.build({ foo: 'bar' });
    expect(table.columnHeaders![0].contents.content).toBe('A');
    expect(table.columnHeaders![1].contents.content).toBe('B');
  });

  it('handles rows with no cells gracefully', () => {
    const builder = new TableBuilderImpl<{}>();
    builder.row(r => r);
    const table = builder.build({});
    expect(table.rows.length).toBe(1);
    expect(table.rows[0].cells.length).toBe(0);
  });

  it('preserves the order of rows and cells', () => {
    const builder = new TableBuilderImpl<{}>();
    builder
      .row(r => r.cell(c => c.paragraph`cell1`).cell(c => c.paragraph`cell2`))
      .row(r => r.cell(c => c.paragraph`cell3`));
    const table = builder.build({});
    expect(table.rows.length).toBe(2);
    const cell1 = table.rows[0].cells[0].contents[0];
    const cell2 = table.rows[0].cells[1].contents[0];
    const cell3 = table.rows[1].cells[0].contents[0];
    expect(cell1.type).toBe('paragraph');
    expect((cell1 as Paragraph).content).toBe('cell1');
    expect(cell2.type).toBe('paragraph');
    expect((cell2 as Paragraph).content).toBe('cell2');
    expect(cell3.type).toBe('paragraph');
    expect((cell3 as Paragraph).content).toBe('cell3');
  });
});