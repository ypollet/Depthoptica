# Depthoptica (core)

Depthoptica rebuilt on [`core/`](../core): the viewers, landmark and distance lists, menu, models and data layer come from `@optica/core` and `optica_core`; this folder only keeps what is specific to images with a depth map.

- `src/data/models/depth.ts`: `DepthImage`, `Profile` (height profile between two landmarks), `DepthAnnotations` (core annotations + profiles, reads the files of the first depth version), `DepthAcquisition` (one per depth image: its own size, pixel ratio and depth range).
- `src/data/repositories/depth_repository.ts`: the `/profile` call, and the old `/images` payload (Orthanc plugin).
- `src/components/`: the viewer wiring (profiles drawn with the `draw` hook of the core ImageViewer), the sidebar, the profilometer (`profile/`: list, chart with d3), the menu with the help guide, the logo.
- `src/config/`: credits and the units offered (no px: the profiles are physical).
- `app.py`: the `depth.json` adapter of the common API, and the `/profile` route (`depth_profile.py`: the profile along the depth map).

## Run

```bash
# backend, series in ./data/<id>/depth.json ($OPTICA_DATA_FOLDER to use another folder)
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/flask --app app run --port 5000

# frontend (http://localhost:5173/?series=insect)
npm install
npm run dev
```

`.env` selects the backend (`VITE_BACKEND_TYPE=WEB|ORTHANC`, `VITE_BACKEND_URL`).

`data/insect` holds the files `depth.json` refers to (image, depth map, thumbnails), the layers of `../depth/data/insect` were left out.
