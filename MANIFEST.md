# Depthoptica manifest: `depth.json`

The fields depthoptica adds to the common manifest ([core/MANIFEST.md](../core/MANIFEST.md)). The JSON Schema is [`manifest.schema.json`](manifest.schema.json).

An acquisition is one stacked image and its height map. Its `id` is also the id of the image in the API.

```jsonc
{
  "id": "x25", "size": { ... }, "pixelSize": [0.0117, 0.0185],   // pixelSize is required
  "image":     { "file": "x25_color.png" },
  "heightmap": { "file": "x25_depth.png", "zMin": -5.938, "zMax": 0 },
  "mask":      { "file": "x25_mask.png" },                                     // optional
  "edges":     { "file": "x25_sobel.png", "thresholds": { "light": 5, "strong": 25 } }  // optional
}
```

- **heightmap**: a gray image (8 or 16 bits) of the size of the image. Value 0 is `zMin` and the highest value of the type (255 or 65535) is `zMax`, linearly in between. A higher value is a higher point. Z is in the frame of the scanner, so it can be negative.
- **mask**: same size, 0 outside the object. The height profiles skip masked pixels.
- **edges**: same size. A profile is cut where an edge is above the chosen threshold. Thresholds are per image; their names are what the viewer offers.

Check a manifest (the tests in `tests/test_manifest.py` check every manifest of `data/`):

```bash
python -m optica_core.schema manifest.schema.json data/<object>/depth.json
```
