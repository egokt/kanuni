import { TableCellBuilderImpl } from '../../../../src/developer-api/prompt/table-cell-builder.js';
import { expect, describe, it } from '@jest/globals';

describe('TableCellBuilderImpl', () => {
  it('builds a cell with a single paragraph', () => {
    const builder = new TableCellBuilderImpl<{ foo: string }>();
    builder.paragraph(data => `Hello ${data.foo}`);
    const result = builder.build({ foo: 'World' });
    expect(result).toEqual({
      type: 'table-cell',
      contents: [
        { type: 'paragraph', content: 'Hello World' }
      ]
    });
  });

  it('builds a cell with multiple paragraphs', () => {
    const builder = new TableCellBuilderImpl<{ bar: string }>();
    builder.paragraph(data => `First: ${data.bar}`);
    builder.paragraph(data => `Second: ${data.bar}`);
    const result = builder.build({ bar: 'Test' });
    expect(result.contents.length).toBe(2);
    expect(result.contents[0]).toEqual({ type: 'paragraph', content: 'First: Test' });
    expect(result.contents[1]).toEqual({ type: 'paragraph', content: 'Second: Test' });
  });

  it('builds a cell with a list', () => {
    const builder = new TableCellBuilderImpl<{ item: string }>();
    builder.list(l => l
      .item(data => `Item: ${data.item}`)
      .item(data => `Another: ${data.item}`)
    );
    const result = builder.build({ item: 'X' });
    const list = result.contents.find(c => c.type === 'list');
    expect(list).toBeDefined();
    if (list && list.type === 'list') {
      expect(list.items.length).toBe(2);
      expect(list.items[0].content).toEqual({ type: 'paragraph', content: 'Item: X' });
      expect(list.items[1].content).toEqual({ type: 'paragraph', content: 'Another: X' });
    }
  });

  it('builds a cell with a nested table', () => {
    const builder = new TableCellBuilderImpl<{ val: string }>();
    builder.table(t => t
      .row(r => r
        .cell(c => c.paragraph(data => `Cell: ${data.val}`))
      )
    );
    const result = builder.build({ val: 'Y' });
    const table = result.contents.find(c => c.type === 'table');
    expect(table).toBeDefined();
    if (table && table.type === 'table') {
      expect(table.rows.length).toBe(1);
      expect(table.rows[0].cells[0].contents[0]).toEqual({ type: 'paragraph', content: 'Cell: Y' });
    }
  });

  it('builds a cell with mixed content', () => {
    const builder = new TableCellBuilderImpl<{ foo: string }>();
    builder.paragraph(data => `P: ${data.foo}`);
    builder.list(l => l.item(data => `L: ${data.foo}`));
    builder.table(t => t.row(r => r.cell(c => c.paragraph(data => `T: ${data.foo}`))));
    const result = builder.build({ foo: 'Z' });
    expect(result.contents.length).toBe(3);
    expect(result.contents[0]).toEqual({ type: 'paragraph', content: 'P: Z' });
    expect(result.contents[1].type).toBe('list');
    expect(result.contents[2].type).toBe('table');
  });
});
