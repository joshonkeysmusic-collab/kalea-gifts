# Adding gifts to Kalea Gifts

You add gifts with a spreadsheet. The app works out when to recommend each one, and a coverage check tells you what is still missing.

## The 5-minute version

1. Copy `catalog/products.template.csv` and open it in Excel or Google Sheets. It has six example rows (candles, cakes, sweets). Delete them and add your own.
2. Fill in **title, price and category** for every gift. Everything else is optional.
3. Save as CSV, then run `npm run catalog:import -- yourfile.csv`.
   - Problems are listed by row and column (for example `row 4 · price`). Nothing is saved until every row is clean.
   - Add `--append` to add to what you uploaded before instead of replacing it.
   - Add `--check` to test a file without saving.
4. Read the coverage dashboard it prints and fix any `CRITICAL` or `WARNING` lines.
5. Deploy the app. Your gifts are live.

## The columns

| Column | Required | What to put | Example |
|---|---|---|---|
| `title` | yes | Name shown to buyers, max 60 characters | `Custom name candle` |
| `price` | yes | Whole AED, gift wrap not included | `120` |
| `category` | yes | One of the categories below | `candles` |
| `blurb` | no, but add one | One short line, max 140 characters | `Hand-poured, with their name on the label.` |
| `image_url` | no | `https://` link, or a path such as `/products/rose.jpg` | `https://cdn.example/rose.jpg` |
| `tags` | no | Words that set the rules for you. Separate with `\|` | `custom\|romantic\|birthday` |
| `id` | no | Leave blank; it is made from the title | |
| `interests` `vibes` `occasions` `recipients` | no | Override the generated rules. Separate with `\|` | `home\|selfcare` |
| `min_budget` | no | Hide below this budget: `u100`, `100-200`, `200-300`, `300-500`, `500+` | `200-300` |
| `unlock_hearts` | no | Show only at this personalisation level: 1, 2 or 3 | `2` |
| `unlock_photo` | no | `yes` if the buyer must upload a photo first | `yes` |
| `active` | no | `no` hides a gift (also hides a built-in gift with the same id) | `no` |

Spreadsheet tip: Excel can turn `100-200` into a date. Format the `min_budget` column as **Text** before you type in it.

## Categories

`coffee`, `selfcare`, `flowers`, `beauty`, `wellness`, `home`, `books`, `treats`, `tech`, `travel`, plus yours: **`candles`**, **`cakes`**, **`sweets`**, `experiences` (classes, vouchers), `personalised` (made for one person).

## How the app decides when to recommend a gift

Buyers choose who it is for, the occasion, up to 4 interests, up to 3 vibes, a budget and how personal it should be. Each gift is scored: **+3 for every interest it matches, +2 for every vibe, +1 if it fits the occasion**, and personalised gifts get more points the more personal the buyer wants to go. The best-scoring gifts that fit the budget go in the box.

You do not set scores. You set the **category** and **tags**, and the app fills in the interests, vibes, occasions and limits:

| Tag | What it does |
|---|---|
| `candle`, `soy-wax`, `scented` | Matches Home and Self-care, cozy and romantic |
| `cake`, `cupcake`, `bakery` | Matches Sweet treats, joyful and elegant, birthday and celebration |
| `dessert`, `baklava`, `chocolate`, `mithai` | Matches Sweet treats |
| `birthday`, `anniversary`, `wedding`, `thank-you`, `housewarming`, `new-baby`, `graduation`, `celebration`, `just-because` | Gets the +1 boost for that occasion |
| `eid`, `ramadan` | Boost for Celebration and Thank You |
| `luxury`, `minimal`, `natural`, `vegan`, `cozy`, `fun`, `romantic` | Sets the vibe |
| `couple`, `for-two`, `date-night` | Only offered when the gift is for a partner |
| `corporate`, `office`, `team` | Only offered when the gift is for a colleague |
| `custom`, `personalised`, `engraved`, `name`, `message` | Only appears at the "Personal" levels (2 and 3) |
| `bespoke`, `made-to-order` | Only appears at "Made for Them" (level 3) |
| `photo`, `portrait` | Only appears when the buyer uploaded a photo |

Tags the app does not know are kept and do no harm. If you fill in `interests`, `vibes`, `occasions`, `recipients`, `unlock_hearts` or `unlock_photo`, your value replaces the generated one.

## Keeping the catalogue balanced

Run `npm run catalog:audit` any time. It counts gifts by category, by interest and by price, and warns you when:

- **A category has no gifts.** Buyers who want that kind of gift see nothing relevant. This is a `CRITICAL` alert.
- **A category or interest has fewer than 2 or 3 gifts.** Buyers keep seeing the same gift. Warning.
- **A budget has fewer than 8 gifts that fit.** Boxes for that budget look samey. Warning.
- **No gift is priced in a band.** Boxes in that budget will look under-spent. Warning.
- **A gift costs more than AED 785.** It fits no budget, so it is never shown.

`npm run catalog:audit -- --strict` stops with an error when any gap exists, so you can use it as a pre-launch gate.

**Today's gaps:** the built-in gifts have **no cakes** and **nothing priced for the AED 500+ band**.

### Tips

1. **Stock every category**, at least 2 gifts each and 3 or more for popular ones.
2. **Mix prices inside each category:** a small treat under AED 85, a mid-range gift around AED 100-180, and one premium piece.
3. **Keep plenty under AED 85.** Only those can appear for "Under AED 100" buyers.
4. **Add one or two hero gifts at AED 350 or more.** Big-budget boxes fill up with them first.
5. **Tag cakes and sweets with an occasion** (`birthday`, `celebration`, `eid`) so they rise when a buyer picks it.
6. **Use `custom` for made-to-order pieces.** They stay hidden from buyers who chose the lightest personalisation, so they do not look out of place.
7. **Use a clean photo on a plain background,** square, at least 1000 px. Without a photo the gift shows its category icon.
8. **Re-run the audit after every upload** and fix critical alerts first.

## For developers

- Schema and rule generator: `src/engine/product.ts`, `src/engine/rules.ts`. Admin products compile to the same `CatalogItem` the scoring engine already used, so `scoreItem` and `buildBox` are unchanged apart from honouring `minBudget`.
- Coverage: `src/engine/coverage.ts` exports `auditCatalog` (report), `assertCoverage` (throws `CoverageError`) and `formatCoverage`.
- Ingestion: `src/engine/ingest.ts` (`productsFromCsv`, `productsFromJson`). JSON Schema for admin forms: `catalog/product.schema.json`. JSON template: `catalog/products.template.json`.
- The app loads `public/catalog.custom.json` at start-up and falls back to the built-in gifts if it is missing or invalid. Persisting uploads from a browser admin screen needs a small API (for example `POST /api/catalog` backed by the same Redis store as analytics); the schema and validators are ready for it.

## Admin panel (in the app)

Click the **kalea** logo on the welcome screen (or open `/#/admin`). Enter the admin password to unlock three tabs:

- **Coverage** – gifts per category and price band, interest coverage, and gap alerts (critical / warning / info).
- **Products** – search, add, edit, overwrite or delete. Built-in gifts sit in the same list (badge *Built-in*): saving an edit overwrites that gift with your version, *Undo my edits* brings the original back, and *Delete this gift* removes it from the app (it moves to the *Deleted* filter, where *Restore this gift* brings it back). The form previews the auto-generated trigger rules and shows how the change moves coverage before you save.
- **Publish** – download or copy `catalog.custom.json`, import CSV/JSON as drafts, discard drafts.

**Password.** Set `VITE_ADMIN_PASSWORD` at build time. Without it the placeholder `kalea-admin` is used and the panel shows a warning banner. This is a convenience lock that keeps casual visitors out. It is not real security: the value ships in the client bundle. Five wrong tries lock the form for 30 seconds.

**Where edits live.** Edits are saved as drafts in this browser (`localStorage`) and applied on top of the published catalogue, so you can test the real gift flow immediately. To make them live for everyone: Publish → download/copy the JSON → replace `public/catalog.custom.json` → redeploy. Sharing drafts between devices needs a small API, which is not built yet.
