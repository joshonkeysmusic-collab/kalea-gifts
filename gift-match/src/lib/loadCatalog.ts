import { getCatalog } from '../engine/catalog';
import { auditCatalog, formatCoverage } from '../engine/coverage';
import { formatIssues, productsFromJson } from '../engine/ingest';
import type { Product } from '../engine/product';
import { initCatalog } from './adminStore';

/**
 * Load Katya's products from /catalog.custom.json and add them to the built-in catalogue.
 * Never throws and never blocks for long: if the file is missing, slow or invalid, the app runs on the
 * built-in gifts. Rows that fail validation are skipped and reported in the console.
 * Returns the number of products loaded.
 */
export async function loadCustomCatalog(url = '/catalog.custom.json', timeoutMs = 1500): Promise<number> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let published: Product[] = [];
  try {
    const res = await fetch(url, { signal: ctl.signal, cache: 'no-cache' });
    if (res.ok) {
      const { products, issues } = productsFromJson(await res.text());
      if (issues.some((i) => i.level === 'error')) console.warn(`catalog.custom.json has problems:\n${formatIssues(issues, 'item')}`);
      published = products;
    }
  } catch {
    /* offline, blocked or timed out: carry on with the built-in gifts */
  } finally {
    clearTimeout(timer);
  }
  // Also applies any drafts saved in this browser from the admin panel.
  initCatalog(published);
  if (import.meta.env.DEV) {
    const report = auditCatalog(getCatalog());
    if (!report.ok) console.info(formatCoverage(report));
  }
  return published.length;
}
