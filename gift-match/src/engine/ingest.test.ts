import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatIssues, parseCsv, productsFromCsv, productsFromJson, type IngestResult } from './ingest';
import { BUDGET_ORDER } from './budgets';
import { CATEGORY_IDS, INTERESTS, OCCASIONS, RELATIONSHIPS, VIBES } from './product';

const read = (f: string) => readFileSync(new URL(`../../catalog/${f}`, import.meta.url), 'utf8');
const HEAD = 'id,title,blurb,price,category,image_url,tags,interests,vibes,occasions,recipients,min_budget,unlock_hearts,unlock_photo,active\n';
const row = (over: Record<string, string>) => {
  const base: Record<string, string> = { id: '', title: 'Rose candle', blurb: 'A rose candle.', price: '90', category: 'candles', image_url: '', tags: '', interests: '', vibes: '', occasions: '', recipients: '', min_budget: '', unlock_hearts: '', unlock_photo: '', active: '' };
  const m = { ...base, ...over };
  return `${Object.values(m).map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',')}\n`;
};
const errors = (r: Pick<IngestResult, 'issues'>) => r.issues.filter((i) => i.level === 'error');

describe('templates', () => {
  it('the CSV and JSON templates are valid and describe the same products', () => {
    const csv = productsFromCsv(read('products.template.csv'));
    const json = productsFromJson(read('products.template.json'));
    expect(errors(csv)).toEqual([]);
    expect(errors(json)).toEqual([]);
    expect(csv.products).toHaveLength(6);
    expect(csv.products).toEqual(json.products);
  });

  it('the JSON Schema lists exactly the values the code accepts', () => {
    const props = JSON.parse(read('product.schema.json')).properties;
    expect(props.category.enum).toEqual(CATEGORY_IDS);
    expect(props.interests.items.enum).toEqual(INTERESTS);
    expect(props.vibes.items.enum).toEqual(VIBES);
    expect(props.occasions.items.enum).toEqual(OCCASIONS);
    expect(props.recipients.items.enum).toEqual(RELATIONSHIPS);
    expect(props.minBudget.enum).toEqual(BUDGET_ORDER);
  });
});

describe('CSV parsing', () => {
  it('handles quotes, commas, doubled quotes and newlines inside cells', () => {
    expect(parseCsv('a,b\n"x, y","say ""hi""\nthere"\n')).toEqual([['a', 'b'], ['x, y', 'say "hi"\nthere']]);
  });
  it('reads semicolon-separated files and a byte-order mark', () => {
    const r = productsFromCsv(`﻿title;price;category\nRose candle;90;candles\n`);
    expect(errors(r)).toEqual([]);
    expect(r.products[0]).toMatchObject({ title: 'Rose candle', price: 90, category: 'candles' });
  });
  it('skips blank rows and # comment rows but keeps spreadsheet row numbers', () => {
    const r = productsFromCsv(`${HEAD}\n# a note\n${row({ price: 'abc' })}`);
    expect(r.issues.find((i) => i.level === 'error')).toMatchObject({ row: 4, field: 'price' });
  });
});

describe('validation', () => {
  it('names the row and column of each problem and keeps the good rows', () => {
    const csv = HEAD + row({ title: 'Good one' }) + row({ title: 'Bad price', price: 'free' }) + row({ title: 'Bad category', category: 'gadgets' }) +
      row({ title: 'Bad image', image_url: 'javascript:alert(1)' }) + row({ title: 'Bad interest', interests: 'sport' });
    const r = productsFromCsv(csv);
    expect(r.ok).toBe(false);
    expect(r.products.map((p) => p.title)).toEqual(['Good one']);
    expect(errors(r).map((e) => [e.row, e.field])).toEqual([[3, 'price'], [4, 'category'], [5, 'image_url'], [6, 'interests']]);
    expect(formatIssues(errors(r))).toMatch(/ERROR\s+row 3 · price/);
  });

  it('rejects unsafe or malformed image links but accepts https and site paths', () => {
    for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAAA', '//evil.example/x.png', 'http://x.example/a.png', 'ftp://x']) {
      expect(errors(productsFromCsv(HEAD + row({ image_url: bad }))).length, bad).toBe(1);
    }
    for (const good of ['https://cdn.example/a.jpg', '/products/a.jpg']) {
      expect(errors(productsFromCsv(HEAD + row({ image_url: good }))), good).toEqual([]);
    }
  });

  it('is forgiving about how people write things', () => {
    const r = productsFromCsv(HEAD + row({ category: 'Candle', interests: 'Self-care | Sweet treats', occasions: 'Thank You|new beginning', min_budget: 'AED 100-200', unlock_hearts: 'Personal', unlock_photo: 'Yes', price: 'AED 1,200' }));
    expect(errors(r)).toEqual([]);
    expect(r.products[0]).toMatchObject({ category: 'candles', interests: ['selfcare', 'treats'], occasions: ['thankyou', 'newbeginning'], minBudget: '100-200', unlock: { hearts: 2, photo: true }, price: 1200 });
    expect(productsFromCsv(HEAD + row({ min_budget: 'Under 100' })).products[0].minBudget).toBe('u100');
  });

  it('generates ids from titles and keeps them unique', () => {
    const r = productsFromCsv(HEAD + row({ title: 'Crème brûlée cake', category: 'cakes' }) + row({ title: 'Crème brûlée cake', category: 'cakes' }) + row({ title: 'Wrap', id: 'wrap' }));
    expect(r.products.map((p) => p.id)).toEqual(['creme-brulee-cake', 'creme-brulee-cake-2']);
    expect(errors(r)[0]).toMatchObject({ row: 4, field: 'id' });
    expect(errors(productsFromCsv(HEAD + row({ id: 'a-b' }) + row({ id: 'a-b' }))).map((e) => e.row)).toEqual([3]);
  });

  it('warns about things it fixed or filled in', () => {
    const r = productsFromCsv(HEAD + row({ price: '94.6', blurb: '' }), { existingIds: ['rose-candle'] });
    expect(r.ok).toBe(true);
    expect(r.products[0]).toMatchObject({ price: 95 });
    const w = r.issues.map((i) => i.message).join(' ');
    expect(w).toMatch(/rounded to 95/);
    expect(w).toMatch(/No blurb/);
    expect(w).toMatch(/Replaces the existing product "rose-candle"/);
  });

  it('enforces length limits and requires the essentials', () => {
    expect(errors(productsFromCsv(HEAD + row({ title: 'x'.repeat(61) })))[0].field).toBe('title');
    expect(errors(productsFromCsv(HEAD + row({ blurb: 'x'.repeat(141) })))[0].field).toBe('blurb');
    expect(errors(productsFromCsv(HEAD + row({ title: '', price: '', category: '' }))).map((e) => e.field)).toEqual(['title', 'price', 'category']);
    expect(productsFromCsv('').ok).toBe(false);
    expect(productsFromCsv('name\nx\n').issues.some((i) => i.field === 'title')).toBe(false); // "name" is accepted for title
  });

  it('passes generator warnings through', () => {
    const r = productsFromCsv(HEAD + row({ category: 'experiences', title: 'Mystery voucher' }));
    expect(r.ok).toBe(true);
    expect(r.issues.some((i) => /No interest matched/.test(i.message))).toBe(true);
  });
});

describe('JSON', () => {
  it('accepts a list or an object with products', () => {
    const one = { title: 'Rose candle', price: 90, category: 'candles', unlock: { hearts: 2 } };
    expect(productsFromJson(JSON.stringify([one])).products[0].unlock).toEqual({ hearts: 2 });
    expect(productsFromJson(JSON.stringify({ products: [one] })).products).toHaveLength(1);
  });
  it('reports bad JSON and wrong shapes without throwing', () => {
    expect(productsFromJson('{oops').issues[0].message).toMatch(/Not valid JSON/);
    expect(productsFromJson('{"a":1}').ok).toBe(false);
    const r = productsFromJson('[{"title":"A","price":5,"category":"candles","colour":"red"}, 7]');
    expect(r.issues.some((i) => /unknown field "colour"/.test(i.message))).toBe(true);
    expect(errors(r)).toHaveLength(3); // row 2 is not an object: title, price and category missing
  });
});
