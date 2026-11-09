# Orbo Muse: explainable beauty recommendations

A recommendation engine and demo UI built for the Orbo AI technical assignment. The UI is a single HTML file; the engine is a standalone module (`engine.js`) that the UI inlines, so tests and the demo run the same code.

## Repository layout
`index.html` (demo UI) · `engine.js` (recommendation engine) · `engine.test.js` (tests + labelled evaluation) · `server.js` (REST API) · `data/catalog.json` (synthetic catalogue with a `source_url` field for a real one) · `.github/workflows/pages.yml` (CI + deploy)

## Run
- Demo: open `index.html` in a browser (no build step).
- Tests: `npm test` (Node 16+, no dependencies).
- API: `npm start`, then `curl -X POST localhost:3000/recommend -H 'Content-Type: application/json' -d '{"tone":3,"type":"o","under":"warm","concerns":["acne"],"budget":1200,"climate":"humid"}'`. Also `GET /health` and `GET /catalog`. Invalid input returns 422 with the reasons.

## Deploy (public link for evaluators)
1. Create a public GitHub repo and push these files to `main`.
2. In Settings > Pages, set Source to "GitHub Actions". The workflow runs the tests, then publishes the site at `https://<user>.github.io/<repo>/`.
3. Alternative: drag the folder onto Netlify. For the API, any Node host (Render, Railway) works with `npm start`.

## How it recommends
1. **Hard budget filter.** Only in-budget products are ranked. If fewer than 3 exist, items up to 25% over budget are added and flagged "stretch". If nothing qualifies, the closest match is shown and flagged.
2. **Scoring.** Skincare: concern match 0.46, skin-type fit 0.28, popularity 0.10, climate 0.06, value 0.10. Foundation: shade similarity 0.55 (CIEDE2000 in CIELAB), undertone 0.20, skin fit 0.12, popularity 0.06, value 0.07.
3. **Diversity.** Maximal Marginal Relevance (lambda 0.75) within each category, plus a small brand-repeat penalty across the routine.
4. **Safety.** Retinal is excluded for sensitive skin. Each pick is checked against earlier picks for ingredient conflicts (retinal with vitamin C, salicylic acid or AHA) and a routine safety check is shown.
5. **Explanations.** Every card shows its score components and reasons.

## Evaluation
`engine.test.js` runs 11 checks (colour maths against the Sharma CIEDE2000 reference pair, budget rules, safety, MMR, determinism) and a labelled ranking evaluation (P@3, R@3, NDCG@3, MAP@3) against a popularity baseline, plus a seeded 300-profile stress test.

## Known limitations
- The catalogue (26 products, fictional brands, invented ingredient lists) is synthetic. Use a licensed catalogue in production.
- Evaluation labels were written by the project owner on a small set and are in-sample, so scores are optimistic.
- "Ask Muse" is keyword matching, not an LLM. The face visuals are a simulation, not real skin analysis.
- No backend, accounts or feedback loop yet. Conflict rules are a small demo set, not medical advice.
- The brand-repeat penalty can override the best match when options are scarce (see the 600 budget profile).

## Orbo context and sources
Orbo's own claims (48% basket size, 2.5x conversion, 12% fewer returns) come from https://www.orbo.ai/ and https://www.orbo.ai/beautygpt-api-for-beauty-brands/. They are Orbo's claims, not results of this project.

## Next
Python/FastAPI port of the API, real catalogue with images and ingredients, LLM-based intent extraction, expert-labelled test set, click feedback and learning-to-rank.

## Images
The photos in the demo are stock placeholders supplied by the author and are not licensed for redistribution. Replace them with licensed images before publishing.
