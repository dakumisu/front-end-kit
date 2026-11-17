# Color utils

Small helpers to lighten and clean up CSS color strings. Import them from the `./colors` subpath:

```ts
import { lighten, normalizeColor } from '@dakumisu/utils/colors';
```

| File                | Exports          |
| ------------------- | ---------------- |
| `lighten.ts`        | `lighten`        |
| `normalizeColor.ts` | `normalizeColor` |

## Lighten

`lighten(color, amount = 0.3)` mixes `color` towards white. `amount` is clamped to 0..1: 0 returns the input, 1 gives white.

- Hex input (`#rrggbb`) returns hex.
- `rgb()` and `rgba()` input returns `rgba(...)`. A color with no alpha gets `0.2`.
- Any other input (names, 3-digit hex) is returned unchanged.

```ts
lighten('#000000', 0.5); // '#808080'
lighten('rgb(0, 0, 0)', 0.5); // 'rgba(128, 128, 128, 0.2)'
```

## Normalize

`normalizeColor` turns loose input into a CSS color string.

```ts
normalizeColor('0xff33ee'); // '#ff33ee'
normalizeColor('ff33ee'); // '#ff33ee'
normalizeColor('rgb(49 45 251)'); // 'rgb(49, 45, 251)'
normalizeColor('tomato'); // 'tomato'
```
