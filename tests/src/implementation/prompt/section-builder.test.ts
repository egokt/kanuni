import { Section } from '../../../../src/developer-api/prompt/types.js';
import { SectionBuilderImpl } from '../../../../src/implementation/prompt/section-builder-impl.js';

describe('SectionBuilderImpl.build', () => {
  it('builds a section with heading and paragraph', () => {
    const builder = new SectionBuilderImpl<{ title: string }>();
    builder.heading`Test Heading`;
    builder.paragraph`Test paragraph`;
    const section = builder.build({ title: 'ignored' });
    expect(section.type).toBe('section');
    expect(section.heading).toBe('Test Heading');
    expect(section.contents[0].type).toBe('paragraph');
    expect((section.contents[0] as { content: string }).content).toBe('Test paragraph');
  });

  it('builds nested sections', () => {
    const builder = new SectionBuilderImpl<{ title: string }>();
    builder.heading`Parent`;
    builder.section(s => s.heading`Child`.paragraph`Child paragraph`);
    const section = builder.build({ title: 'ignored' });
    expect(section.contents[0].type).toBe('section');
    const child = section.contents[0] as Section;
    expect(child.heading).toBe('Child');
    expect(child.contents[0].type).toBe('paragraph');
  });

  it('builds section with paragraphs, lists, and tables', () => {
    const builder = new SectionBuilderImpl<{ title: string }>();
    builder.heading`Mix`;
    builder.paragraph`A paragraph`;
    builder.list(l => l.item`Item 1`.item`Item 2`);
    builder.table(t => t.row(r => r.cell(c => c.paragraph`Cell 1`).cell(c => c.paragraph`Cell 2`)));
    const section = builder.build({ title: 'ignored' });
    expect(section.contents.some(c => c.type === 'paragraph')).toBe(true);
    expect(section.contents.some(c => c.type === 'list')).toBe(true);
    expect(section.contents.some(c => c.type === 'table')).toBe(true);
  });

  it('interpolates template strings with params', () => {
    const builder = new SectionBuilderImpl<{ title: string }>();
    builder.heading`Title: ${'title'}`;
    builder.paragraph`Paragraph: ${'title'}`;
    const section = builder.build({ title: 'Dynamic' });
    expect(section.heading).toBe('Title: Dynamic');
    expect((section.contents[0] as { content: string }).content).toBe('Paragraph: Dynamic');
  });

  it('builds lists and nested lists', () => {
    const builder = new SectionBuilderImpl<{}>();
    builder.list(l => l.item`Item 1`.list(l => l.item`Subitem 1`));
    const section = builder.build({});
    const list = section.contents[0];
    expect(list.type).toBe('list');
    const items = (list as any).items;
    expect(items[0].content.type).toBe('paragraph');
    expect(items[1].content.type).toBe('list');
  });

  it('builds section without paragraphs', () => {
    const builder = new SectionBuilderImpl<{}>();
    builder.list(l => l.item`Only list`);
    const section = builder.build({});
    expect(section.contents.length).toBe(1);
    expect(section.contents[0].type).toBe('list');
  });

  it('builds section with memorySection', () => {
    const builder = new SectionBuilderImpl<{}>();
    builder.heading`With memory`;
    builder.memorySection(s => s.heading`Memory heading`);
    const section = builder.build({});
    expect(section.contents[0].type).toBe('section');
    expect((section.contents[0] as Section).heading).toBe('Memory heading');
    expect((section.contents[0] as Section).memory).toBeDefined();
    expect((section.contents[0] as Section).memory!.contents.length).toBe(0);
  });

  it('handles multiple memory sections', () => {
    const builder = new SectionBuilderImpl<{}>();
    builder.memorySection(s => s.heading`First`);
    builder.memorySection(s => s.heading`Second`);
    const section = builder.build({});
    const memorySections = section.contents.filter(c => (c as Section).heading === 'First' || (c as Section).heading === 'Second');

    // we check here that both memory sections are preserved, so that
    // query builder can check for errors
    expect(memorySections.length).toBe(2);
  });

  it('passes data param to all builder functions', () => {
    const builder = new SectionBuilderImpl<{ title: string }>();
    builder.heading`Heading: ${'title'}`;
    builder.paragraph(data => `Para: ${data.title}`);
    const section = builder.build({ title: 'DataTest' });
    expect(section.heading).toBe('Heading: DataTest');
    expect((section.contents[0] as { content: string }).content).toBe('Para: DataTest');
  });

  it('builds an empty section', () => {
    const builder = new SectionBuilderImpl<{}>();
    const section = builder.build({});
    expect(section.type).toBe('section');
    expect(section.contents.length).toBe(0);
  });
});
