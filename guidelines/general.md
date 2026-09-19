## App

HTML + JavaScript (jQuery-style). **Tailwind CSS** for layout and styling. Clean, simple UI—minimal chrome, readable type, clear primary actions.

## User story

The user pastes JSON defining a set of sentence items. The app renders every item on one page. **Check answers** at the bottom grades all blanks at once; incorrect blanks show the expected value beside the input.

## UI

Show all items vertically on one page. Render each `missingWord` as a compact inline text input matching the sentence typography. Keep generous spacing between sentences. At the bottom, place one prominent **Check answers** button. After checking, mark each blank correct or incorrect and reveal corrections beside incorrect answers.

## JSON

Root: `{ "items": [...] }`, non-empty. Each item needs `id` (non-empty string), `problem`, and `solution`.

`problem` is an ordered array of fragments: literal strings and blank placeholders. A placeholder is `{ "type": "missingWord", "id": "<blank_id>" }` with a non-empty `id` unique within that item.

`solution` maps each blank `id` to the expected string (exact match, including case and umlauts).

```json
{
  "items": [
    {
      "id": "1",
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
      "id": "2",
      "problem": [
        { "type": "missingWord", "id": "blank_1" },
        " Mann gibt ",
        { "type": "missingWord", "id": "blank_2" },
        " Kind ",
        { "type": "missingWord", "id": "blank_3" },
        " Apfel."
      ],
      "solution": {
        "blank_1": "Der",
        "blank_2": "dem",
        "blank_3": "einen"
      }
    },
    {
      "id": "3",
      "problem": [
        "Wir gehen mit ",
        { "type": "missingWord", "id": "blank_1" },
        " Freunden in ",
        { "type": "missingWord", "id": "blank_2" },
        " neuen Park."
      ],
      "solution": {
        "blank_1": "unseren",
        "blank_2": "den"
      }
    },
    {
      "id": "4",
      "problem": [
        { "type": "missingWord", "id": "blank_1" },
        " Frau stellt ",
        { "type": "missingWord", "id": "blank_2" },
        " Tasse auf ",
        { "type": "missingWord", "id": "blank_3" },
        " Tisch."
      ],
      "solution": {
        "blank_1": "Die",
        "blank_2": "die",
        "blank_3": "den"
      }
    }
  ]
}
```
