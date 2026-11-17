# Convert utils

Turn loose values (form fields, data attributes, CSS strings) into numbers and booleans, with a fallback. Import them from the `./convert` subpath:

```ts
import { float, boolean } from '@dakumisu/utils/convert';
```

| Export      | Returns          | Fallback when the value does not convert |
| ----------- | ---------------- | ---------------------------------------- |
| `float`     | `number`         | `defaultValue`                           |
| `nullFloat` | `number \| null` | `null`                                   |
| `integer`   | `number`         | `defaultValue`                           |
| `boolean`   | `boolean`        | `defaultValue`                           |

Every function takes `unknown`, and numbers or booleans pass through unchanged.

- `float` strips `px` and treats an empty string as not convertible: `float('12px', 0)` is `12`, `float('', 7)` is `7`.
- `nullFloat` has no `px` handling and reads an empty string as `0`.
- `integer` parses strings with `parseInt`, so `integer('4.9', 0)` is `4`.
- `boolean` reads `'true'` and `'false'` in any case, and any number above 0 as `true`.

```ts
float('1.5', 0); // 1.5
nullFloat('abc'); // null
boolean('TRUE', false); // true
```
