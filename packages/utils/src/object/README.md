# Object utils

Read, write and delete nested properties with a dot-separated path. Import them from the `./object` subpath:

```ts
import { ddv, dlv, dsv } from '@dakumisu/utils/object';
```

| Export | What it does                                                                       |
| ------ | ---------------------------------------------------------------------------------- |
| `dlv`  | Reads a value at a path, or returns the default (`null` when you pass none).       |
| `dsv`  | Sets a value at a path and creates the objects on the way. `undefined` deletes it. |
| `ddv`  | Deletes the property at a path. Returns `true` when it existed, `false` otherwise. |

```ts
const obj = { a: { b: { c: 42 } } };

dlv(obj, 'a.b.c'); // 42
dlv(obj, 'a.b.x', 'none'); // 'none'
dlv<number>(obj, 'a.b.c'); // typed as number

dsv(obj, 'a.d.e', 1); // obj.a.d.e is 1
ddv(obj, 'a.d.e'); // true
```

`dlv` returns the type you give it as `T`. Nothing checks that the value at the path really has that type.

Paths are plain `split('.')`, so a key that contains a dot cannot be addressed. `dlv` is based on [developit/dlv](https://github.com/developit/dlv).
