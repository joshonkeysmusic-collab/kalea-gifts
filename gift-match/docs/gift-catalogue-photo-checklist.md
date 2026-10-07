# Kalea Gifts · Gift Catalogue Photo Checklist

Source: `gift-match/src/engine/catalog.ts` (the recommendation engine's catalogue), 57 entries (55 gifts plus 2 packaging items).
Tick each box when a photo is delivered and approved.

## How the engine picks gifts (read this first)

1. The buyer answers: who it is for, occasion, interests (up to 4), vibes (up to 3), budget, and personalisation level (1 to 3 hearts).
2. Every eligible item is scored: **+3 per matching interest, +2 per matching vibe, +1 occasion boost**, -3 if it matches no interest, -4 if it is romantic and the recipient is a colleague. Personal items add +1.5 per heart level.
3. The box takes the top-scoring items that fit the budget (budget max minus AED 15 wrap), up to 5 gifts, at most 2 per interest, and never two items with the same icon. Small budgets upgrade the cheapest picks so boxes land inside the chosen range.
4. Gift wrap and the handwritten card are always added.
5. A "Shuffle" adds controlled randomness so the same answers can show different matches.

## Photo standards (apply to every item)

- **Two files per item:** (a) clean product on a plain off-white or soft neutral background, and (b) a **transparent-background cut-out PNG** of the same shot. The result screen places items over a spotlight stage, so cut-outs are what get used there.
- Square crop (1:1), product centred with about 10 percent margin, at least 2000 x 2000 px, sharp focus, soft even light, no harsh shadows.
- No people's faces, no visible third-party logos, no price tags, no watermarks, no text added in editing.
- Colour must be true to the product. Where the engine shows a colour tint behind the item, it is only a swatch, so do not tint photos.
- Filenames: `<id>.jpg` and `<id>-cutout.png` using the **ID** shown in each entry.
- Items marked **SAMPLE** show a representative example (a voucher, a personalised piece). We need to show what the buyer receives, not a real customer's order.

---

## Coffee (4)

- [ ] **1. Specialty coffee** · `beans` · AED 65
  - **Category:** Coffee
  - **Trigger / context:** Interest match: Coffee (+3 each). Vibe match: Cozy / Natural (+2 each). Earliest budget tier: Under AED 100 (price AED 65).
  - **Photo needed:** One matte kraft or black coffee bag, front label visible and upright, with a small pile of whole beans spilled in front. No brand logos from other companies.

- [ ] **2. Handmade latte mug** · `mug` · AED 55
  - **Category:** Coffee
  - **Trigger / context:** Interest match: Coffee / Home & calm evenings (+3 each). Vibe match: Cozy / Joyful (+2 each). Earliest budget tier: Under AED 100 (price AED 55).
  - **Photo needed:** One handmade stoneware latte mug, glaze visible, handle to the right, filled with latte art seen at 30 degrees. Plain light surface.

- [ ] **3. Ceramic pour-over set** · `pourover` · AED 140
  - **Category:** Coffee
  - **Trigger / context:** Interest match: Coffee (+3 each). Vibe match: Minimal / Elegant (+2 each). Earliest budget tier: AED 100-200 (price AED 140).
  - **Photo needed:** Ceramic pour-over dripper sitting on its matching carafe or cup, all pieces of the set together, front three-quarter view.

- [ ] **4. Arabic coffee & dates** · `arabic-coffee` · AED 85
  - **Category:** Coffee
  - **Trigger / context:** Interest match: Coffee / Sweet treats (+3 each). Vibe match: Elegant / Cozy (+2 each). Occasion boost (+1): Thank You, Celebration, New Beginning. Earliest budget tier: Under AED 100 (price AED 85).
  - **Photo needed:** Dallah (Arabic coffee pot) and two small finjan cups beside a small bowl of Medjool dates, side view on a plain dark or neutral surface.

## Self-care (4)

- [ ] **5. Body butter** · `body-butter` · AED 70
  - **Category:** Self-care
  - **Trigger / context:** Interest match: Self-care / Beauty (+3 each). Vibe match: Cozy / Natural (+2 each). Earliest budget tier: Under AED 100 (price AED 70).
  - **Photo needed:** Open jar with the lid beside it showing the whipped texture, label facing the camera. Soft light, no hands.

- [ ] **6. Hand cream** · `hand-cream` · AED 45
  - **Category:** Self-care
  - **Trigger / context:** Interest match: Self-care (+3 each). Vibe match: Minimal / Natural (+2 each). Earliest budget tier: Under AED 100 (price AED 45).
  - **Photo needed:** One cream tube standing upright, cap on, label facing front. Optional dab of cream on a clean surface next to it.

- [ ] **7. Mineral bath soak** · `bath-soak` · AED 60
  - **Category:** Self-care
  - **Trigger / context:** Interest match: Self-care / Wellness (+3 each). Vibe match: Cozy / Natural (+2 each). Earliest budget tier: Under AED 100 (price AED 60).
  - **Photo needed:** Glass jar of mineral salts with a wooden scoop, lid off, lavender or rose petals scattered beside it. Label visible.

- [ ] **8. Silk sleep mask** · `silk-mask` · AED 95
  - **Category:** Self-care
  - **Trigger / context:** Interest match: Self-care (+3 each). Vibe match: Elegant / Romantic (+2 each). Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: AED 100-200 (price AED 95).
  - **Photo needed:** Silk sleep mask laid flat in blush or champagne, strap fanned out symmetrically, no creases. Overhead shot.

## Flowers (4)

- [ ] **9. Fresh flowers** · `bouquet` · AED 150
  - **Category:** Flowers
  - **Trigger / context:** Interest match: Flowers (+3 each). Vibe match: Romantic / Joyful / Elegant (+2 each). Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: AED 100-200 (price AED 150).
  - **Photo needed:** Fresh bouquet in kraft or cream paper, soft pastel and blush stems, shot front-on at eye level. Fresh, no wilting.

- [ ] **10. Dried flower posy** · `dried` · AED 85
  - **Category:** Flowers
  - **Trigger / context:** Interest match: Flowers / Home & calm evenings (+3 each). Vibe match: Natural / Minimal (+2 each). Earliest budget tier: Under AED 100 (price AED 85).
  - **Photo needed:** Dried-flower posy (pampas, bunny tails) tied with twine, upright against a plain wall, or lying flat from above.

- [ ] **11. Preserved rose dome** · `rose-dome` · AED 220
  - **Category:** Flowers
  - **Trigger / context:** Interest match: Flowers (+3 each). Vibe match: Romantic / Elegant (+2 each). Only offered when the gift is for: Partner, Family. Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: AED 200-300 (price AED 220).
  - **Photo needed:** Preserved rose under a glass dome on a wooden base, rose perfectly centred, soft side light so the glass does not glare. Show the whole dome.

- [ ] **12. Wildflower seed kit** · `seed-kit` · AED 40
  - **Category:** Flowers
  - **Trigger / context:** Interest match: Flowers / Wellness (+3 each). Vibe match: Natural / Joyful (+2 each). Earliest budget tier: Under AED 100 (price AED 40).
  - **Photo needed:** Seed kit box or packet set: seed packets fanned out, small wooden marker and trowel. Plain light background.

## Beauty (5)

- [ ] **13. Lip & cheek tint** · `tint` · AED 75
  - **Category:** Beauty
  - **Trigger / context:** Interest match: Beauty (+3 each). Vibe match: Joyful / Romantic (+2 each). Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: Under AED 100 (price AED 75).
  - **Photo needed:** Lip & cheek tint tube or pot, open to show colour, with a single swatch smear beside it. Close, sharp, centred.

- [ ] **14. Fragrance discovery set** · `fragrance-set` · AED 160
  - **Category:** Beauty
  - **Trigger / context:** Interest match: Beauty (+3 each). Vibe match: Elegant / Joyful (+2 each). Earliest budget tier: AED 100-200 (price AED 160).
  - **Photo needed:** Six small perfume vials standing in a row with their gift box open behind them. Labels readable, even spacing.

- [ ] **15. Rose quartz roller** · `roller` · AED 65
  - **Category:** Beauty
  - **Trigger / context:** Interest match: Beauty / Self-care (+3 each). Vibe match: Natural / Romantic (+2 each). Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: Under AED 100 (price AED 65).
  - **Photo needed:** Rose quartz facial roller resting on a plain surface, both heads visible, no skin shown.

- [ ] **16. Signature perfume** · `perfume` · AED 420
  - **Category:** Beauty
  - **Trigger / context:** Interest match: Beauty (+3 each). Vibe match: Elegant / Romantic (+2 each). Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: AED 300-500 (price AED 420).
  - **Photo needed:** One perfume bottle standing upright, cap on, next to its box. Dark or deep-neutral background so the glass edges glow.

- [ ] **17. Linen makeup pouch** · `pouch` · AED 55
  - **Category:** Beauty
  - **Trigger / context:** Interest match: Beauty / Travel (+3 each). Vibe match: Minimal / Joyful (+2 each). Earliest budget tier: Under AED 100 (price AED 55).
  - **Photo needed:** Linen makeup pouch standing slightly open with the zip visible; show front and, in a second shot, the inside lining.

## Wellness (5)

- [ ] **18. Herbal tea collection** · `tea` · AED 60
  - **Category:** Wellness
  - **Trigger / context:** Interest match: Wellness / Home & calm evenings (+3 each). Vibe match: Cozy / Natural (+2 each). Earliest budget tier: Under AED 100 (price AED 60).
  - **Photo needed:** Open tea box showing three or more different tea pouches or tins, with one loose-leaf pile and a small cup. Labels readable.

- [ ] **19. Guided gratitude journal** · `journal` · AED 55
  - **Category:** Wellness
  - **Trigger / context:** Interest match: Wellness / Books (+3 each). Vibe match: Minimal / Natural (+2 each). Earliest budget tier: Under AED 100 (price AED 55).
  - **Photo needed:** Guided gratitude journal closed (cover facing front) and a second shot open to a clean page. Ribbon marker visible.

- [ ] **20. Cork yoga mat** · `yoga-mat` · AED 180
  - **Category:** Wellness
  - **Trigger / context:** Interest match: Wellness (+3 each). Vibe match: Natural / Minimal (+2 each). Earliest budget tier: AED 100-200 (price AED 180).
  - **Photo needed:** Cork yoga mat half rolled out so the top surface and a rolled end are both visible, on a plain floor.

- [ ] **21. Ceramic oil diffuser** · `diffuser` · AED 190
  - **Category:** Wellness
  - **Trigger / context:** Interest match: Wellness / Home & calm evenings (+3 each). Vibe match: Natural / Cozy / Minimal (+2 each). Earliest budget tier: AED 200-300 (price AED 190).
  - **Photo needed:** Ceramic oil diffuser standing on a table with light mist rising, small oil bottle beside it.

- [ ] **22. Mini massage gun** · `massager` · AED 260
  - **Category:** Wellness
  - **Trigger / context:** Interest match: Wellness / Tech & gadgets (+3 each). Vibe match: Minimal (+2 each). Earliest budget tier: AED 200-300 (price AED 260).
  - **Photo needed:** Mini massage gun with its carry case open beside it, head attachments laid out in a row.

## Home & calm evenings (4)

- [ ] **23. Scented candle** · `candle` · AED 85
  - **Category:** Home & calm evenings
  - **Trigger / context:** Interest match: Home & calm evenings / Self-care (+3 each). Vibe match: Cozy / Romantic (+2 each). Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: Under AED 100 (price AED 85).
  - **Photo needed:** One scented candle in a glass or ceramic vessel, lit (small steady flame), warm low light, label facing front. Also one unlit clean shot.

- [ ] **24. Soft knit throw** · `throw` · AED 240
  - **Category:** Home & calm evenings
  - **Trigger / context:** Interest match: Home & calm evenings (+3 each). Vibe match: Cozy / Elegant (+2 each). Earliest budget tier: AED 200-300 (price AED 240).
  - **Photo needed:** Knit throw loosely folded and draped over a sofa arm or folded in a neat stack, texture of the knit clearly visible.

- [ ] **25. Ceramic bud vase** · `vase` · AED 70
  - **Category:** Home & calm evenings
  - **Trigger / context:** Interest match: Home & calm evenings / Flowers (+3 each). Vibe match: Minimal / Natural (+2 each). Earliest budget tier: Under AED 100 (price AED 70).
  - **Photo needed:** Ceramic bud vase with one single stem in it, front-on, plain wall behind.

- [ ] **26. Lavender pillow spray** · `pillow-spray` · AED 50
  - **Category:** Home & calm evenings
  - **Trigger / context:** Interest match: Home & calm evenings / Wellness (+3 each). Vibe match: Cozy / Natural (+2 each). Earliest budget tier: Under AED 100 (price AED 50).
  - **Photo needed:** Spray bottle standing upright with a sprig of dried lavender beside it, label front. White or pale surface.

## Books (4)

- [ ] **27. A novel we think they will love** · `novel` · AED 60
  - **Category:** Books
  - **Trigger / context:** Interest match: Books (+3 each). Vibe match: Cozy / Minimal (+2 each). Earliest budget tier: Under AED 100 (price AED 60).
  - **Photo needed:** One hardback or paperback novel standing with its cover facing the camera, plus a stack of two or three others beside it. Decision needed: pick covers Kalea has rights to show.

- [ ] **28. Poetry collection** · `poetry` · AED 55
  - **Category:** Books
  - **Trigger / context:** Interest match: Books (+3 each). Vibe match: Romantic / Elegant (+2 each). Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: Under AED 100 (price AED 55).
  - **Photo needed:** Slim poetry collection held open flat to a page with short lines, soft side light, cover shown in a second shot.

- [ ] **29. Leather bookmark** · `bookmark` · AED 35
  - **Category:** Books
  - **Trigger / context:** Interest match: Books (+3 each). Vibe match: Elegant / Minimal (+2 each). Earliest budget tier: Under AED 100 (price AED 35).
  - **Photo needed:** Leather bookmark lying on an open book, stitching and edge finish visible, close crop.

- [ ] **30. Warm reading light** · `book-light` · AED 70
  - **Category:** Books
  - **Trigger / context:** Interest match: Books / Home & calm evenings (+3 each). Vibe match: Cozy / Minimal (+2 each). Earliest budget tier: Under AED 100 (price AED 70).
  - **Photo needed:** Clip-on reading light attached to an open book, switched on with a warm glow on the pages.

## Sweet treats (5)

- [ ] **31. Artisan chocolates** · `chocolates` · AED 90
  - **Category:** Sweet treats
  - **Trigger / context:** Interest match: Sweet treats (+3 each). Vibe match: Romantic / Joyful / Elegant (+2 each). Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: AED 100-200 (price AED 90).
  - **Photo needed:** Open box of artisan chocolates (pistachio, rose, salted caramel), lid leaning behind, overhead. Clean, no melted marks.

- [ ] **32. Brown-butter cookies** · `cookies` · AED 45
  - **Category:** Sweet treats
  - **Trigger / context:** Interest match: Sweet treats (+3 each). Vibe match: Cozy / Joyful (+2 each). Earliest budget tier: Under AED 100 (price AED 45).
  - **Photo needed:** Stack of three brown-butter cookies on a plate, one broken in half to show the inside, plus the branded box or bag.

- [ ] **33. Macaron box** · `macarons` · AED 75
  - **Category:** Sweet treats
  - **Trigger / context:** Interest match: Sweet treats (+3 each). Vibe match: Joyful / Elegant (+2 each). Earliest budget tier: Under AED 100 (price AED 75).
  - **Photo needed:** Open box of twelve macarons in pastel colours, evenly lined up, overhead. Branded lid beside it.

- [ ] **34. Raw honey trio** · `honey` · AED 70
  - **Category:** Sweet treats
  - **Trigger / context:** Interest match: Sweet treats / Wellness (+3 each). Vibe match: Natural / Cozy (+2 each). Earliest budget tier: Under AED 100 (price AED 70).
  - **Photo needed:** Three small honey jars (sidr, wildflower, acacia) in a row with different colours showing, wooden dipper in front.

- [ ] **35. Stuffed dates platter** · `dates-platter` · AED 120
  - **Category:** Sweet treats
  - **Trigger / context:** Interest match: Sweet treats (+3 each). Vibe match: Elegant (+2 each). Occasion boost (+1): Thank You, Celebration, New Beginning. Earliest budget tier: AED 100-200 (price AED 120).
  - **Photo needed:** Stuffed dates arranged on a serving tray, overhead, plain dark or neutral background. Show variety of fillings.

## Tech & gadgets (5)

- [ ] **36. Desk tidy & phone grip** · `cable-kit` · AED 45
  - **Category:** Tech & gadgets
  - **Trigger / context:** Interest match: Tech & gadgets (+3 each). Vibe match: Minimal / Joyful (+2 each). Earliest budget tier: Under AED 100 (price AED 45).
  - **Photo needed:** Desk tidy and phone grip laid out together, plus one shot of the grip attached to a phone. Neutral desk surface.

- [ ] **37. Wireless charging stand** · `charger` · AED 150
  - **Category:** Tech & gadgets
  - **Trigger / context:** Interest match: Tech & gadgets / Home & calm evenings (+3 each). Vibe match: Minimal / Elegant (+2 each). Earliest budget tier: AED 100-200 (price AED 150).
  - **Photo needed:** Wireless charging stand holding a phone, wood or fabric finish visible, cable tidy.

- [ ] **38. Mini Bluetooth speaker** · `speaker` · AED 160
  - **Category:** Tech & gadgets
  - **Trigger / context:** Interest match: Tech & gadgets (+3 each). Vibe match: Joyful (+2 each). Earliest budget tier: AED 100-200 (price AED 160).
  - **Photo needed:** Mini Bluetooth speaker standing front-on, controls visible, small and large scale cue (a hand or coin nearby).

- [ ] **39. Instant camera** · `instant-camera` · AED 420
  - **Category:** Tech & gadgets
  - **Trigger / context:** Interest match: Tech & gadgets / Travel (+3 each). Vibe match: Joyful / Romantic (+2 each). Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: AED 300-500 (price AED 420).
  - **Photo needed:** Instant camera front-on at eye level, lens centred, with two or three developed photos fanned beside it.

- [ ] **40. Wireless earbuds** · `earbuds` · AED 380
  - **Category:** Tech & gadgets
  - **Trigger / context:** Interest match: Tech & gadgets (+3 each). Vibe match: Minimal (+2 each). Earliest budget tier: AED 300-500 (price AED 380).
  - **Photo needed:** Earbuds resting in their open charging case, case lid up, pair clearly visible. Plain neutral background.

## Travel (4)

- [ ] **41. Travel candle tin** · `candle-tin` · AED 45
  - **Category:** Travel
  - **Trigger / context:** Interest match: Travel / Home & calm evenings (+3 each). Vibe match: Cozy (+2 each). Earliest budget tier: Under AED 100 (price AED 45).
  - **Photo needed:** Closed travel candle tin and a second shot with the lid off showing the wax and wick. Label front.

- [ ] **42. Leather passport holder** · `passport` · AED 140
  - **Category:** Travel
  - **Trigger / context:** Interest match: Travel (+3 each). Vibe match: Elegant / Minimal (+2 each). Earliest budget tier: AED 100-200 (price AED 140).
  - **Photo needed:** Leather passport holder closed, shown at an angle, with a passport peeking from the top. Visible stitching and grain.

- [ ] **43. Scratch-off world map** · `world-map` · AED 110
  - **Category:** Travel
  - **Trigger / context:** Interest match: Travel (+3 each). Vibe match: Joyful (+2 each). Earliest budget tier: AED 100-200 (price AED 110).
  - **Photo needed:** Scratch-off world map hung or leaning flat, with a few countries already scratched to show the colour beneath, coin beside it.

- [ ] **44. Canvas weekender bag** · `weekender` · AED 290
  - **Category:** Travel
  - **Trigger / context:** Interest match: Travel (+3 each). Vibe match: Minimal / Natural (+2 each). Earliest budget tier: AED 300-500 (price AED 290).
  - **Photo needed:** Canvas weekender bag standing upright on a plain floor, handles up, and one shot of it open and half packed.

## Experiences & vouchers (4)

- [ ] **45. Barista masterclass** · `coffee-class` · AED 280 **SAMPLE**
  - **Category:** Experiences & vouchers
  - **Trigger / context:** Interest match: Coffee (+3 each). Vibe match: Joyful (+2 each). Earliest budget tier: AED 200-300 (price AED 280).
  - **Photo needed:** Branded gift-voucher card, flat and square-on, reading "Barista masterclass". Optional second shot: latte art being poured in a real class, hands only.

- [ ] **46. Spa afternoon voucher** · `spa` · AED 350 **SAMPLE**
  - **Category:** Experiences & vouchers
  - **Trigger / context:** Interest match: Self-care / Wellness (+3 each). Vibe match: Elegant / Cozy (+2 each). Earliest budget tier: AED 300-500 (price AED 350).
  - **Photo needed:** Branded gift-voucher card flat and square-on reading "Spa afternoon". Optional: rolled white towel, orchid and stones styled beside it.

- [ ] **47. Pottery class for two** · `pottery` · AED 300 **SAMPLE**
  - **Category:** Experiences & vouchers
  - **Trigger / context:** Interest match: Home & calm evenings / Wellness (+3 each). Vibe match: Joyful / Natural (+2 each). Only offered when the gift is for: Partner, Friend, Family. Earliest budget tier: AED 300-500 (price AED 300).
  - **Photo needed:** Branded voucher for "Pottery class for two" laid flat. Optional second shot of two pairs of hands shaping clay at a wheel.

- [ ] **48. Dinner for two voucher** · `dinner` · AED 450 **SAMPLE**
  - **Category:** Experiences & vouchers
  - **Trigger / context:** Interest match: Sweet treats / Travel (+3 each). Vibe match: Romantic / Elegant (+2 each). Only offered when the gift is for: Partner. Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: AED 300-500 (price AED 450).
  - **Photo needed:** Branded voucher for "Dinner for two" in an envelope, with two candlelit table settings or wine glasses styled behind. We need agreed partner-restaurant permission.

## Personalised ("Personal" tag) (7)

- [ ] **49. Monogrammed mug** · `mono-mug` · AED 70 **SAMPLE**
  - **Category:** Personalised ("Personal" tag)
  - **Trigger / context:** Interest match: Coffee / Home & calm evenings (+3 each). Vibe match: Cozy / Minimal (+2 each). Unlocks at heart level 2+ ("Personal"); scores higher the deeper the level. Earliest budget tier: Under AED 100 (price AED 70).
  - **Photo needed:** Latte mug with a hand-painted initial facing the camera. Use a sample initial (S or K), glaze and brush strokes visible.

- [ ] **50. Framed photo print** · `photo-print` · AED 90 **SAMPLE**
  - **Category:** Personalised ("Personal" tag)
  - **Trigger / context:** Interest match: Home & calm evenings (+3 each). Vibe match: Cozy / Romantic / Minimal (+2 each). Unlocks at heart level 2+ ("Personal"); scores higher the deeper the level. Only offered if the buyer uploaded a photo. Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: AED 100-200 (price AED 90).
  - **Photo needed:** Framed photo print on a plain wall or shelf, frame edge and archival paper visible. Use a licensed placeholder photo of two people, never a real customer.

- [ ] **51. "Reasons I love you" jar** · `reasons-jar` · AED 60 **SAMPLE**
  - **Category:** Personalised ("Personal" tag)
  - **Trigger / context:** No interest tag; it is chosen by the personalisation level and vibe only. Vibe match: Romantic / Joyful (+2 each). Only offered when the gift is for: Partner. Unlocks at heart level 2+ ("Personal"); scores higher the deeper the level. Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: Under AED 100 (price AED 60).
  - **Photo needed:** Glass jar full of rolled or folded paper notes tied with ribbon, a handwritten tag reading "Reasons I love you", one note unrolled.

- [ ] **52. Memory letter** · `memory-letter` · AED 40 **SAMPLE**
  - **Category:** Personalised ("Personal" tag)
  - **Trigger / context:** Interest match: Books (+3 each). Vibe match: Romantic / Natural / Elegant (+2 each). Only offered when the gift is for: Partner, Friend, Family. Unlocks at heart level 3+ ("Made for Them"); scores higher the deeper the level. At level 3 the box always leads with one personal item. Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: Under AED 100 (price AED 40).
  - **Photo needed:** Handwritten letter on cream paper beside its envelope, wax seal or ribbon, text blurred or generic. Show it folded and unfolded.

- [ ] **53. Engraved initial necklace** · `name-necklace` · AED 280 **SAMPLE**
  - **Category:** Personalised ("Personal" tag)
  - **Trigger / context:** Interest match: Beauty (+3 each). Vibe match: Elegant / Romantic / Minimal (+2 each). Only offered when the gift is for: Partner, Friend, Family. Unlocks at heart level 3+ ("Made for Them"); scores higher the deeper the level. At level 3 the box always leads with one personal item. Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: AED 200-300 (price AED 280).
  - **Photo needed:** Gold-plated necklace with one engraved initial, laid flat on neutral velvet or paper, initial in sharp focus. Show chain and clasp too.

- [ ] **54. Custom illustrated portrait** · `portrait` · AED 250 **SAMPLE**
  - **Category:** Personalised ("Personal" tag)
  - **Trigger / context:** Interest match: Home & calm evenings (+3 each). Vibe match: Joyful / Romantic / Elegant (+2 each). Only offered when the gift is for: Partner, Friend, Family. Unlocks at heart level 3+ ("Made for Them"); scores higher the deeper the level. At level 3 the box always leads with one personal item. Only offered if the buyer uploaded a photo. Pushed down for colleagues (romantic vibe, -4). Earliest budget tier: AED 200-300 (price AED 250).
  - **Photo needed:** Framed illustrated portrait of two people (sample commission, with permission from the artist), shown straight-on, with the original photo beside it for reference.

- [ ] **55. Desk plant with name tag** · `desk-plant` · AED 65 **SAMPLE**
  - **Category:** Personalised ("Personal" tag)
  - **Trigger / context:** Interest match: Wellness / Home & calm evenings (+3 each). Vibe match: Natural / Minimal / Joyful (+2 each). Unlocks at heart level 2+ ("Personal"); scores higher the deeper the level. Earliest budget tier: Under AED 100 (price AED 65).
  - **Photo needed:** Small potted desk plant with a wooden tag showing a name, front-on, pot rim and leaves fully in frame.

## Packaging (in every box) (2)

- [ ] **56. Gift wrap & ribbon** · `wrap` · AED 15
  - **Category:** Packaging (in every box)
  - **Trigger / context:** Added automatically to every box (AED 15). Never scored, never left out.
  - **Photo needed:** Finished wrapped box: matte blush-pink or kraft box, wide satin ribbon in a neat bow on top, three-quarter angle. Also one flat-lay of the ribbon roll.

- [ ] **57. Handwritten card** · `card` · AED 0
  - **Category:** Packaging (in every box)
  - **Trigger / context:** Added automatically to every box (free). Carries the buyer's personal message from the "Make it personal" step.
  - **Photo needed:** Cream folded card standing open at 45 degrees, blank inside, hand-lettered "For you" on the front. Show a pen beside it.

---

## Gaps and decisions for the team

- **No cakes and no custom candles exist in the catalogue today.** The nearest items are "Scented candle", "Travel candle tin", "Macaron box", "Brown-butter cookies" and "Monogrammed mug". If cakes or custom (name or message) candles should be recommended, they have to be added to the catalogue first, with trigger rules, before photos can be sourced.
- **There are no gaming items in the catalogue.** "Gaming" is not one of the interests the app asks about (the ten are Coffee, Self-care, Flowers, Beauty, Wellness, Home / calm evenings, Books, Sweet treats, Tech & gadgets, Travel).
- Items that the buyer sees only as a **voucher** (Barista masterclass, Spa afternoon, Pottery class for two, Dinner for two) need a partner agreement before real branded photos can be used.
- "A novel we think they will love" is a placeholder for a title we choose; confirm which books we will actually stock.
