import { Copy, Download, FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { formatIssues, productsFromCsv, productsFromJson, type IngestResult } from '../../engine/ingest';
import { addDrafts, clearDrafts, getAllProducts, getDrafts, getPublished } from '../../lib/adminStore';
import { ConfirmButton } from './ConfirmButton';

export function PublishView({ onToast }: { onToast: (m: string) => void }) {
  const drafts = getDrafts().length;
  const live = getPublished().length;
  const json = `${JSON.stringify(getAllProducts(), null, 2)}\n`;
  const file = useRef<HTMLInputElement>(null);
  const [imported, setImported] = useState<{ name: string; result: IngestResult } | null>(null);

  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog.custom.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onToast('Download started. If nothing happens (some previews block downloads), use Copy JSON instead.');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      onToast('Copied. Paste it into public/catalog.custom.json');
    } catch {
      onToast('Copy was blocked. Open "Show the file" below and copy it by hand.');
    }
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    const text = await f.text();
    const existingIds = getAllProducts().map((p) => p.id);
    const result = /\.json$/i.test(f.name) ? productsFromJson(text, { existingIds }) : productsFromCsv(text, { existingIds });
    setImported({ name: f.name, result });
    if (file.current) file.current.value = '';
  };

  const errors = new Set(imported?.result.issues.filter((i) => i.level === 'error').map((i) => i.row)).size; // rows, not messages
  const count = imported?.result.products.length ?? 0;

  return (
    <div className="pubv">
      <section className="panel">
        <h3>Publish</h3>
        <p className="pub-p">
          Products you add here are saved <strong>on this device</strong> so you can test them. To make them live for everyone, download the file and replace
          <code> public/catalog.custom.json </code> in the project, then deploy.
        </p>
        <div className="pub-stats">
          <span><b>{drafts}</b> draft{drafts === 1 ? '' : 's'} on this device</span>
          <span><b>{live}</b> live product{live === 1 ? '' : 's'}</span>
        </div>
        <div className="pub-actions">
          <button type="button" className="btn btn-dark" onClick={download}>Download catalog.custom.json <Download size={18} /></button>
          <button type="button" className="btn btn-outline" onClick={copy}>Copy JSON <Copy size={16} /></button>
        </div>
        <details className="pub-json">
          <summary>Show the file</summary>
          <textarea readOnly rows={8} value={json} aria-label="catalog.custom.json contents" onFocus={(e) => e.currentTarget.select()} />
        </details>
      </section>

      <section className="panel">
        <h3>Add many at once</h3>
        <p className="pub-p">Upload a spreadsheet saved as CSV (or a JSON file). Every row is checked first, and good rows are added as drafts.</p>
        <input ref={file} type="file" accept=".csv,.tsv,.txt,.json,text/csv,application/json" hidden onChange={(e) => onFile(e.target.files?.[0])} data-testid="catalog-file" />
        <button type="button" className="btn btn-outline" onClick={() => file.current?.click()}>Choose a CSV or JSON file <FileUp size={16} /></button>

        {imported && (
          <div className="pub-result" role="status">
            <strong>{imported.name}: {count} valid product{count === 1 ? '' : 's'}{errors ? `, ${errors} row${errors === 1 ? '' : 's'} with problems` : ''}</strong>
            {imported.result.issues.length > 0 && (
              <pre>{formatIssues(imported.result.issues.slice(0, 25), /\.json$/i.test(imported.name) ? 'item' : 'row')}{imported.result.issues.length > 25 ? '\n…and more' : ''}</pre>
            )}
            {count > 0 && (
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => {
                  addDrafts(imported.result.products);
                  onToast(`Added ${count} draft${count === 1 ? '' : 's'}.`);
                  setImported(null);
                }}
              >
                Add {count} {errors ? 'valid ' : ''}product{count === 1 ? '' : 's'} as drafts
              </button>
            )}
          </div>
        )}
        <p className="fineprint tight">A blank template is in <code>catalog/products.template.csv</code>.</p>
      </section>

      {drafts > 0 && (
        <section className="panel">
          <h3>Start over</h3>
          <p className="pub-p">Remove every draft from this device. Live products and built-in gifts are not affected.</p>
          <ConfirmButton label={`Discard ${drafts} draft${drafts === 1 ? '' : 's'}`} onConfirm={() => { clearDrafts(); onToast('Drafts discarded.'); }} />
        </section>
      )}
    </div>
  );
}
