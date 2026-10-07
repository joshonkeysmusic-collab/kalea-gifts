# Kalea Gifts 🎁

A mobile-first web app that predicts the best gift for someone you love in under a minute, then lets
them say whether you got it right. See [PLAN.md](PLAN.md) for the product plan and the 15-user launch week.

## Run it

```bash
cd gift-match
npm install
npm run dev        # http://localhost:5173
npm test           # engine, insights & API unit tests
npm run e2e        # Playwright journeys on an iPhone viewport (writes screenshots/)
```

## Catalogue

Add gifts from a spreadsheet and check the catalogue is balanced: see [docs/catalogue-admin.md](docs/catalogue-admin.md).

```bash
npm run catalog:import -- catalog/products.template.csv --check   # validate a file
npm run catalog:import -- yourfile.csv                            # write public/catalog.custom.json
npm run catalog:audit                                             # coverage by category, interest and price
```

## Routes

| URL | What it is |
|-----|------------|
| `/` | The Gift Match flow (welcome → 7 questions → match → intent → share) |
| `/?from=Name` | Same flow, with "Name challenged you" (Loop B) |
| `/#/r/<payload>` | Recipient reveal and rating (Loop A). The gift lives in the link |
| `/#/founder` | Founder insights. Live with the founder key, otherwise this device's data only |

## Deploy (Vercel)

1. Import the repo in Vercel, set **Root Directory = `gift-match`** (framework: Vite).
2. Storage → add **Upstash for Redis** (free tier) to the project. It injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`.
3. Settings → Environment Variables → add `FOUNDER_KEY` (any secret phrase).
4. Redeploy. Open `/#/founder` and enter the key.

Without step 2 the app still works fully; events just aren't collected centrally.

## Structure

- `src/engine`: catalog (~55 items), scoring and box builder, copy. Pure and unit-tested.
- `src/screens`: one file per stage of the journey.
- `src/lib`: analytics (`track`), share-link encoding, insights aggregation (shared with the API).
- `api/`: Vercel functions: `POST /api/event`, `GET /api/insights?key=…`.
