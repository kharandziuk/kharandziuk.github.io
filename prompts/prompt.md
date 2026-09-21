# Exercise generation prompt

Produce one JSON object `{ "exercises": … }` for a **34-item** German B1–B2 exercise set.

**Return valid JSON only.** Out of scope: commentary, explanations, markdown wrappers, and any keys or tuple shapes not shown below.

**Task:** Generate exactly **34** tuples in `exercises`, in the fixed order under **Required counts**.

**Audience:** Generation agent.

**Output:** `{ "exercises": [ … ] }` — no markdown, no prose.

**Steps:** (1) Draft all tuples per block rules. (2) Run the pre-flight checklist. (3) Emit conforming JSON.

Keep vocabulary and syntax at approximately B1–B2 level.

### Required counts

| Block | Tag | Count | Notes |
| ----- | --- | ----- | ----- |
| A | `fill` | 7 | Parenthetical determiner hints on the **last** segment only |
| B | `order` | 7 | Full-sentence word order; `indices` is a complete permutation of `tokens` |
| C | `fill` | 7 | Adjective **endings only** in `answers` |
| D | `order` | 10 | Three prepositions in `tokens`; one integer in `indices` |
| E | `assign` | 3 | Five `[lead, trail]` pairs per tuple |

The `exercises` array has exactly **34** tuples in order: A, B, C, D, E (7 + 7 + 7 + 10 + 3).

### Tuple shapes

Do not add fields, wrapper objects, or tags other than `fill`, `order`, `assign`.

**`fill`** — `["fill", segments, answers]`

* `segments`: array of **at least two** strings. Blanks lie **between** consecutive segments: `segments.length − 1` blanks.
* `answers`: one string per blank; `answers[k]` belongs after `segments[k]`.
* No blank placeholders, ids, or underscores in strings.

**`order`** — `["order", lead, trail, tokens, indices]`

* `lead` / `trail`: strings (either may be `""`).
* `tokens`: non-empty array of strings.
* `indices`: 0-based indexes into `tokens`.

**Block B — word order:** `indices` has the same length as `tokens`; each integer `0 … tokens.length − 1` appears exactly once. Built sentence: `lead` + `tokens[indices[0]]` + … + `tokens[indices[n−1]]` + `trail`.

**Block D — preposition choice:** See **Block D** (three prepositions in `tokens`, one integer in `indices`; only `tokens[indices[0]]` is inserted; other `tokens` are distractors).

**`assign`** — `["assign", frames, prepositions, indices]`

* `frames`: exactly five entries, each `[lead, trail]` (strings; either may be `""`).
* `prepositions`: exactly five **distinct** strings (correct answers only; no distractors).
* `indices`: length 5; `indices[k]` selects `prepositions[indices[k]]` for `frames[k]`; each index 0…4 used exactly once.

### Global rules

* Correct forms appear only in `answers` (`fill`), `tokens` / `indices` (`order`), or `prepositions` / `indices` (`assign`); do not spell out filled gaps in segment or frame text.
* Block D: insert only `tokens[indices[0]]` between `lead` and `trail`; remaining `tokens` are distractors and do not appear in the sentence.
* No duplicated discourse relation in one sentence (e.g. `Deshalb …, weil …` for the same cause).
* Before emitting, rebuild each full sentence (insert `answers` between `segments`; block B as above; block D as one preposition; assign as `frames[k]` with `prepositions[indices[k]]`); verify grammar, case, gender, number, word order, punctuation, and capitalization.

### Block A — Articles and article-like determiners (`fill`, ×7)

**Goal:** Definite, indefinite, and possessive determiners in varied genders, cases (Nominativ, Akkusativ, Dativ, occasionally Genitiv), number, and structures.

* 1–3 blanks per tuple (2–4 segments); each blank grammatically unique.
* No inflected target forms in segment text.
* Last segment only: parenthetical hint listing blanks in order (base forms, e.g. `(ein, mein)` for `ein` / `meine`).

```json
["fill", ["Ich kaufe ", " neues Auto für ", " Familie. (ein, mein)"], ["ein", "meine"]]
```

### Block B — Word order (`order`, ×7)

**Goal:** B1–B2 sentences from a token bank; varied clause patterns.

* Reorderable material only in `tokens`; frame in `lead` / `trail`.
* Built sentence: `lead` + `tokens[indices[0]]` + … + `tokens[indices[n−1]]` + `trail` → one idiomatic sentence.
* Subordinates (`weil`, `dass`, `obwohl`, `wenn`): finite verb or cluster final where natural; modals/Ersatzinfinitiv when idiomatic.
* Adverbial inversion: fronted adverbial + finite verb + subject (e.g. `Deshalb fahre ich …`).
* No ambiguous token orders; seven distinct patterns across the block.
* Across the seven tuples, include at least one each of: `weil`, `dass`, `obwohl`, `wenn`, adverbial inversion, stacked final-verb construction, plus one further distinct pattern (overlap allowed).

```json
["order", "Ich bleibe heute zu Hause, ", ".", ["weil", "ich", "gestern", "länger", "arbeiten", "musste"], [0, 1, 2, 3, 4, 5]]
```

### Block C — Adjective endings (`fill`, ×7)

**Goal:** Endings only; adjective stems remain in segments.

* 1–3 blanks; attributive adjectives before nouns only (not `Das Auto ist neu`).
* `answers`: endings only (`e`, `en`, `er`, `es`, `em`, …), never full adjectives.
* No parenthetical hints.
* Mixed determiners (definite, indefinite, possessive, `kein`, plural, at least one without article); weak, mixed, strong declension; balanced genders and cases.

```json
["fill", ["Ich habe einen interessant", " Artikel über die deutsch", " Wirtschaft gelesen."], ["en", "e"]]
```

### Block D — Preposition choice (`order`, ×10)

**Goal:** One correct preposition per frame; verb–preposition government (e.g. *warten auf* + Akk., *teilnehmen an* + Dat., *sich interessieren für* + Akk., *abhängen von* + Dat.).

* Fixed `lead` / `trail`; exactly **three** preposition strings in `tokens`; **one** integer in `indices` (index of the correct preposition).
* Sentence: `lead` + `tokens[indices[0]]` + `trail`; other `tokens` are plausible distractors only.
* Object case visible in `lead` or `trail`.
* No repeated verb–preposition pair within the ten tuples.

```json
["order", "Ich warte schon seit zehn Minuten ", " dich.", ["auf", "für", "mit"], [0]]
```

### Block E — Preposition assignment (`assign`, ×3)

**Goal:** Five frames per tuple share one five-word preposition bank (3 tuples → 15 sentences); same government focus as block D.

* Five `[lead, trail]` frames per tuple.
* Five distinct prepositions in the bank, each used once per tuple.
* Across all **15** sentences: varied verbs; no repeated verb–preposition pair; objects show required case.

```json
["assign", [
  ["Ich warte schon zehn Minuten ", " den Bus."],
  ["Wir diskutieren heute ", " eine Lösung."],
  ["Achte bitte ", " die Schreibweise."],
  ["Mein Gehalt hängt ", " meiner Erfahrung ab."],
  ["Sie interessiert sich stark ", " digitale Medien."]
], ["auf", "über", "an", "von", "für"], [0, 1, 2, 3, 4]]
```

### Canonical example (one tuple per block — not length-complete)

Production output MUST have **34** tuples in block order (see **Required counts**). The JSON below shows **one sample tuple per block** only; do not emit a five-item array.

```json
{
  "exercises": [
    ["fill", ["Ich kaufe ", " neues Auto für ", " Familie. (ein, mein)"], ["ein", "meine"]],
    ["order", "Ich bleibe heute zu Hause, ", ".", ["weil", "ich", "gestern", "länger", "arbeiten", "musste"], [0, 1, 2, 3, 4, 5]],
    ["fill", ["Ich habe einen interessant", " Artikel über die deutsch", " Wirtschaft gelesen."], ["en", "e"]],
    ["order", "Ich warte schon seit zehn Minuten ", " dich.", ["auf", "für", "mit"], [0]],
    ["assign", [
      ["Ich warte schon zehn Minuten ", " den Bus."],
      ["Wir diskutieren heute ", " eine Lösung."],
      ["Achte bitte ", " die Schreibweise."],
      ["Mein Gehalt hängt ", " meiner Erfahrung ab."],
      ["Sie interessiert sich stark ", " digitale Medien."]
    ], ["auf", "über", "an", "von", "für"], [0, 1, 2, 3, 4]]
  ]
}
```

### Pre-flight checklist

1. `{ "exercises": [ … ] }`, length 34; order and counts match **Required counts**; tuple shapes match **Tuple shapes**.
2. All completed sentences: correct, coherent, natural contemporary German.
3. No awkward redundancy; no duplicate causal/concessive marking unless idiomatic.
4. Reconstruct and verify every sentence (grammar, case, gender, number, articles, endings, order, punctuation, capitalization).
5. Vary vocabulary, structures, genders, cases, and patterns.
6. Block A: unambiguous blanks; hint base forms only; `answers` yield one natural sentence.
7. Block B: satisfies **Block B** rules (permutation `indices`, subordinate/inversion, pattern list).
8. Block C: endings only in `answers`; stem + ending = correct adjective; no predicate-adjective items; balanced declension.
9. Block D: satisfies **Block D** rules; unique verb–preposition pairs across ten tuples.
10. Block E: three tuples; five frames, five prepositions, five indices each; no duplicate verb–preposition pair across all 15 sentences.
