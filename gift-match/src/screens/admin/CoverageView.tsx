import { AlertTriangle, CheckCircle2, CircleAlert, Info } from 'lucide-react';
import { BUDGET_ORDER, BUDGETS } from '../../engine/budgets';
import { COVERAGE_DEFAULTS, type CoverageAlert, type CoverageReport } from '../../engine/coverage';
import { CATEGORY_IDS, INTERESTS } from '../../engine/product';
import { CATEGORIES } from '../../engine/rules';
import { INTEREST_WORDS } from '../../engine/words';
import type { BudgetId } from '../../engine/types';

const BAND_LABEL: Record<BudgetId, string> = { u100: '<100', '100-200': '100+', '200-300': '200+', '300-500': '300+', '500+': '500+' };

type Status = 'empty' | 'low' | 'ok';
const status = (n: number, min: number): Status => (n === 0 ? 'empty' : n < min ? 'low' : 'ok');
const STATUS_TEXT: Record<Status, string> = { empty: 'Empty', low: 'Low', ok: 'Good' };

export function CoverageView({ report }: { report: CoverageReport }) {
  const critical = report.alerts.filter((a) => a.severity === 'critical').length;
  const warnings = report.alerts.filter((a) => a.severity === 'warning').length;
  const empty = CATEGORY_IDS.filter((c) => report.byCategory[c] === 0).length;
  const maxCat = Math.max(COVERAGE_DEFAULTS.minPerCategory * 2, ...CATEGORY_IDS.map((c) => report.byCategory[c]));
  const maxBand = Math.max(1, ...BUDGET_ORDER.map((t) => report.availableByTier[t]));

  return (
    <div className="cov">
      <div className="cov-tiles">
        <Tile value={report.total} label="Gifts" />
        <Tile value={critical} label="Critical" tone={critical ? 'bad' : 'good'} />
        <Tile value={warnings} label="Warnings" tone={warnings ? 'warn' : 'good'} />
        <Tile value={empty} label="Empty categories" tone={empty ? 'bad' : 'good'} />
      </div>

      <div className={`cov-banner ${report.ok ? 'good' : critical ? 'bad' : 'warn'}`} role="status">
        {report.ok ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}
        <span>
          {report.ok
            ? 'Balanced. No gaps found.'
            : `${critical + warnings} thing${critical + warnings === 1 ? '' : 's'} to fix before launch${critical ? `, ${critical} critical` : ''}.`}
        </span>
      </div>

      <section className="panel">
        <h3>Categories</h3>
        <div className="cov-head" aria-hidden>
          <span className="micro">GIFTS PER PRICE BAND, AED</span>
          <span className="cov-cells">{BUDGET_ORDER.map((t) => <i key={t}>{BAND_LABEL[t]}</i>)}</span>
        </div>
        <ul className="cov-rows">
          {CATEGORY_IDS.map((c) => {
            const n = report.byCategory[c];
            const min = COVERAGE_DEFAULTS.minPerCategory;
            const st = status(n, min);
            return (
              <li key={c} className={`cov-row ${st}`}>
                <span className="cov-name">
                  {CATEGORIES[c].label}
                  {st !== 'ok' && <span className={`cov-flag ${st}`}>{STATUS_TEXT[st]}</span>}
                </span>
                <span className="cov-cells" aria-label="items per price band">
                  {BUDGET_ORDER.map((t) => (
                    <i key={t} className={report.matrix[c][t] ? 'has' : ''}>{report.matrix[c][t] || '·'}</i>
                  ))}
                </span>
                <span className="cov-barline">
                  <span className="cov-bar" role="img" aria-label={`${n} items, ${STATUS_TEXT[st].toLowerCase()}`}>
                    <span style={{ width: `${(n / maxCat) * 100}%` }} />
                  </span>
                  <b>{n}</b>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="fineprint tight">Each category should have at least {COVERAGE_DEFAULTS.minPerCategory} gifts, spread over more than one price band.</p>
      </section>

      <section className="panel">
        <h3>Price points</h3>
        <ul className="cov-rows">
          {BUDGET_ORDER.map((t) => {
            const avail = report.availableByTier[t];
            const st = status(avail, COVERAGE_DEFAULTS.minPerTier);
            return (
              <li key={t} className={`cov-row ${st}`}>
                <span className="cov-name">
                  {BUDGETS[t].label}
                  {st !== 'ok' && <span className={`cov-flag ${st}`}>{STATUS_TEXT[st]}</span>}
                </span>
                <span className="cov-sub">{report.byPriceBand[t]} priced in this band</span>
                <span className="cov-barline">
                  <span className="cov-bar" role="img" aria-label={`${avail} gifts can be shown, ${report.byPriceBand[t]} priced in this band`}>
                    <span style={{ width: `${(avail / maxBand) * 100}%` }} />
                  </span>
                  <b>{avail}</b>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="fineprint tight">The bar shows how many gifts a buyer with that budget can be shown. Aim for at least {COVERAGE_DEFAULTS.minPerTier}.</p>
      </section>

      <section className="panel">
        <h3>What buyers pick</h3>
        <ul className="cov-chips">
          {INTERESTS.map((i) => {
            const n = report.byInterest[i];
            return (
              <li key={i} className={status(n, COVERAGE_DEFAULTS.minPerInterest)}>
                {INTEREST_WORDS[i].label}<b>{n}</b>
              </li>
            );
          })}
        </ul>
        <p className="fineprint tight">Gifts matching each interest. Fewer than {COVERAGE_DEFAULTS.minPerInterest} means buyers see repeats.</p>
      </section>

      <section className="panel">
        <h3>Gaps and what to do</h3>
        {report.alerts.length === 0 ? (
          <p className="cov-none"><CheckCircle2 size={18} /> Nothing to fix.</p>
        ) : (
          <ul className="cov-alerts">
            {report.alerts.map((a, i) => <AlertRow key={`${a.scope}-${a.key ?? ''}-${i}`} a={a} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tile({ value, label, tone }: { value: number; label: string; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <div className={`cov-tile ${tone ?? ''}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function AlertRow({ a }: { a: CoverageAlert }) {
  const Icon = a.severity === 'critical' ? CircleAlert : a.severity === 'warning' ? AlertTriangle : Info;
  return (
    <li className={`cov-alert ${a.severity}`}>
      <span className="cov-alert-icon"><Icon size={18} /></span>
      <span>
        <strong><em>{a.severity}</em> {a.message}</strong>
        <small>{a.tip}</small>
      </span>
    </li>
  );
}
