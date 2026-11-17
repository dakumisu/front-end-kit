# Distribution utils

Scatter boxes over a rectangle so they keep their distance. It uses seeded dart-throwing, with no DOM and no three. Import it from the `./distribution` subpath:

```ts
import { createRandom, distribute } from '@dakumisu/utils/distribution';
```

| Export         | What it does                                                            |
| -------------- | ----------------------------------------------------------------------- |
| `createRandom` | Seeded random numbers in [0, 1), the same sequence for the same seed.   |
| `distribute`   | Places each item's centre, or gives `null` when the item found no room. |

`distribute(items, options)` throws darts for each item in the given order, so put the tightest items first. A dart lands when `accept(x, y, item)` passes and it keeps `spacing` mean sizes from every placed item. After `missesPerRelax` misses the spacing shrinks by `relax`. Below `minSpacing`, an item that still has no room after `maxDarts` more darts is dropped.

An item's size is the diagonal of its `width` and `height`. `bleed` lets a centre land past an edge, as a share of the item's own width and height.

```ts
const items = [
    { width: 200, height: 120 },
    { width: 80, height: 80 },
];

const { points, spacing } = distribute(items, {
    random: createRandom(42),
    width: 1200,
    height: 800,
    bleed: 0.25,
    accept: (x, y) => !(x > 500 && x < 700 && y > 300 && y < 500), // keep the middle clear
});
// points[i] is { x, y } for items[i], or null when it was dropped
```

`spacing` in the result is the lowest value any item relaxed to.
