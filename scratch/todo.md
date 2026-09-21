# TODO

- [ ] **Replace exercise JSON schema** — Migrate from id-keyed blanks (`blank_N`), object `solution` maps, and `{ id, text }` tokens to the simplified shape: bare `missingWord` placeholders, array `solution` values, string token banks, and index-based word-order `solution`. Update `prompts/prompt.md`, `guidelines/general.md`, and `index.html` validation/rendering together. Preserve the five-page inventory and item counts; document tradeoffs (positional coupling, weaker structural validation).
