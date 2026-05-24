# Sprite Animation (UV Manipulation)

For the player or unique entities, animate by shifting the offset of the texture UVs.

```TS
// columns = 4, rows = 4
texture.repeat.set(1 / columns, 1 / rows);

const updateAnimation = (delta, state) => {
  // Calculate current frame offset
  const uOffset = currentFrame / columns;
  const vOffset = 1 - (currentRow + 1) / rows;

  texture.offset.set(uOffset, vOffset);
};
```
