## App

HTML + JavaScript (jQuery-style). **Tailwind CSS** for layout and styling. Clean, simple UI—minimal chrome, readable type, clear primary actions.

## User story

The user pastes JSON defining one or more exercise pages. The app renders every item on each page. **Check answers** at the bottom grades all items at once; incorrect answers show the expected value or order.

## UI

Show all items vertically on one page per JSON `pages` entry. Keep generous spacing between items. At the bottom, place one prominent **Check answers** button. After checking, mark each item correct or incorrect and reveal corrections where needed.

### Fill in gaps (`fill-in`)

Render each `missingWord` as a compact inline text input matching the sentence typography. The app shows *Ergänze die fehlenden Wörter.* once at the top of fill-in pages. Mark each blank correct or incorrect and reveal corrections beside incorrect answers.

### Order words (`word-order`)

Per **Order words** in `exercises.md`: the app shows a fixed German instruction for the page type once at the top (or `page.instruction` when set). Do not show the full target sentence or per-item prompts—that would reveal the answer. Each item is an answer line with drop targets; optional fixed `lead` / `trail` text stays on that line. Shuffled `tokens` sit in a bank below the item. Place a token by dragging it onto the answer line or clicking it to append; return it to the bank by dragging back or clicking the placed token. Both gestures are always available. Show the expected token order when wrong.

**Preposition sets** (multi-frame `word-order`): one item has `frames` (array of `{ "lead"?, "trail"? }`, one gap per frame), one shared `tokens` bank (typically five distinct prepositions), and `solution` as an ordered list of token ids—one per frame, each token used once. Clicking a bank token fills the first empty slot; drag-and-drop targets a specific slot. Do not combine item-level `lead`/`trail` with `frames`.

Fill-in pages use their own fixed instruction from the app (not in JSON).

## JSON

Root: `{ "pages": [...] }`, non-empty. Each page needs `type` and a non-empty `items` array. Supported types: `"fill-in"`, `"word-order"`. Optional `instruction` on a page overrides the app’s default German instruction for that page type.

### `fill-in`

Each item needs `problem` and `solution`. Do not add an item-level `id`; order is defined by the `items` array.

`problem` is an ordered array of fragments: literal strings and blank placeholders. A placeholder is `{ "type": "missingWord", "id": "<blank_id>" }` with a non-empty `id` unique within that item.

`solution` maps each blank `id` to the expected string (exact match, including case and umlauts).

### `word-order`

Each item needs `tokens` and `solution`. Do not add an item-level `id`. Do not put the completed sentence in JSON fields shown to the learner—encode it only in `lead`, `trail`, `frames`, `tokens`, and `solution`. Page instructions are defined in the app by `type` unless `page.instruction` is set.

`tokens` is a non-empty array of `{ "id", "text" }`; bank order is arbitrary. For a single-gap item, optional `lead` and `trail` flank one answer line. For a preposition set, use `frames` instead of item-level `lead`/`trail`: each frame has its own `lead`/`trail` and one slot. Only clause-critical chunks need to appear in `tokens` on word-order pages—e.g. subordinate clauses with *weil*, *dass*, *obwohl*, *wenn*, adverbial inversion, stacked final verbs; on preposition-set pages, `tokens` are prepositions only.

`solution` is either an ordered array of token `id`s or one string: the joined correct sequence. For `frames`, the solution array has one id per frame in order; each token id appears exactly once. Grade by exact match (same rules as fill-in for case and umlauts).

### Example (two page types)

```json
{
  "pages": [
    {
      "type": "fill-in",
      "items": [
        {
          "problem": [
            "Ich kaufe ",
            { "type": "missingWord", "id": "blank_1" },
            " neues Auto für ",
            { "type": "missingWord", "id": "blank_2" },
            " Familie."
          ],
          "solution": {
            "blank_1": "ein",
            "blank_2": "meine"
          }
        },
        {
          "problem": [
            "Ich lege ",
            { "type": "missingWord", "id": "blank_1" },
            " Schlüssel auf ",
            { "type": "missingWord", "id": "blank_2" },
            " Tisch."
          ],
          "solution": {
            "blank_1": "meinen",
            "blank_2": "den"
          }
        }
      ]
    },
    {
      "type": "word-order",
      "items": [
        {
          "lead": "Ich bleibe heute zu Hause, ",
          "trail": ".",
          "tokens": [
            { "id": "w1", "text": "musste" },
            { "id": "w2", "text": "weil" },
            { "id": "w3", "text": "gestern" },
            { "id": "w4", "text": "ich" },
            { "id": "w5", "text": "länger" },
            { "id": "w6", "text": "arbeiten" }
          ],
          "solution": ["w2", "w4", "w3", "w5", "w6", "w1"]
        },
        {
          "lead": "Ich weiß, ",
          "trail": ".",
          "tokens": [
            { "id": "w1", "text": "dass" },
            { "id": "w2", "text": "du" },
            { "id": "w3", "text": "morgen" },
            { "id": "w4", "text": "früher" },
            { "id": "w5", "text": "aufstehen" },
            { "id": "w6", "text": "musst" }
          ],
          "solution": ["w1", "w2", "w3", "w4", "w5", "w6"]
        }
      ]
    }
  ]
}
```
