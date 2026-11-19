import math
import os

import cv2
import numpy as np
from flask import abort, jsonify, request
from flask_cors import cross_origin

from optica_core import Dataset, acquisition, create_app, image, project
from depth_profile import masked, smooth_array, wu_line


class DepthDataset(Dataset):
    """Stacked images with their height map (depth.json).

    Each image has its own size, pixel size and height range: it is an acquisition of its own, and the
    id of its image is the id of the acquisition.
    """

    manifest = "depth.json"
    viewer = "depthoptica"

    def entry(self, id, image_id):
        return self.acquisition(self.load(id), image_id)

    def images(self, id):
        manifest = self.load(id)
        folder = self.thumbnails_folder(id, manifest)
        acquisitions = []
        for entry in manifest["acquisitions"]:
            label = entry.get("label", entry["id"])
            thresholds = entry.get("edges", {}).get("thresholds")
            acquisitions.append(acquisition(
                entry["id"],
                label=label,
                size=entry["size"],
                standalone_images=[image(
                    entry["id"],
                    label,
                    size=entry["size"],
                    edgeThresholds=list(thresholds) if thresholds else None,
                    hasThumbnail=self.has_thumbnail(folder, entry["image"]["file"]),
                )],
            ))
        return project(*acquisitions, unit=manifest["unit"])

    def full_image(self, id, image_id):
        return self.directory(id), self.entry(id, image_id)["image"]["file"]

    # the thumbnail has the file name of its image
    def thumbnail(self, id, image_id):
        folder, _ = super().thumbnail(id, image_id)
        return folder, self.entry(id, image_id)["image"]["file"]

    def read(self, id, entry, key, flags=cv2.IMREAD_GRAYSCALE):
        return cv2.imread(os.path.join(self.directory(id), entry[key]["file"]), flags) if key in entry else None

    def heightmap(self, id, entry):
        return self.read(id, entry, "heightmap", cv2.IMREAD_GRAYSCALE | cv2.IMREAD_ANYDEPTH)

    # x, y from the pixel size, z from the height map; z is None outside the mask
    def position(self, id, image_id, x, y):
        if image_id is None:
            abort(404)
        entry = self.entry(id, image_id)
        im = self.heightmap(id, entry)
        row = min(max(round(y), 0), im.shape[0] - 1)
        col = min(max(round(x), 0), im.shape[1] - 1)
        px, py = scaled(entry, x, y)
        mask = self.read(id, entry, "mask")
        if masked(col, row, mask):
            return {"x": px, "y": py, "z": None}
        return {"x": px, "y": py, "z": height(entry, im, im[row][col])}


# height of a value of the height map: its full range [0, max of the type] is [zMin, zMax]
def height(entry, im, value):
    heightmap = entry["heightmap"]
    return heightmap["zMin"] + (heightmap["zMax"] - heightmap["zMin"]) * float(value) / np.iinfo(im.dtype).max


# pixel (x, y) -> x, y in the unit of the manifest
def scaled(entry, x, y):
    return x * entry["pixelSize"][0], y * entry["pixelSize"][1]


app = create_app(DepthDataset, logo="Depthoptica", version="1.4.0")
dataset: DepthDataset = app.extensions["optica_dataset"]


# height profile between two points of an image
@app.route("/<id>/<image_id>/profile")
@cross_origin()
def compute_profile(id, image_id):
    try:
        x1 = float(request.args["x1"])
        y1 = float(request.args["y1"])
        x2 = float(request.args["x2"])
        y2 = float(request.args["y2"])
    except (KeyError, ValueError):
        abort(400)

    threshold = request.args.get("threshold", "")
    smooth = request.args.get("smooth", "true").lower() != "false"

    entry = dataset.entry(id, image_id)
    im = dataset.heightmap(id, entry)
    mask = dataset.read(id, entry, "mask")
    edges = dataset.read(id, entry, "edges")
    edge_threshold = entry.get("edges", {}).get("thresholds", {}).get(threshold, 0)
    list_distances = wu_line(x1, y1, x2, y2, im, mask, edges, edge_threshold)

    def to_3d(point):
        px, py = scaled(entry, point["x"], point["y"])
        return {"x": px, "y": py, "z": height(entry, im, point["z"])}

    graphs_segments = []
    if len(list_distances) > 0:
        first_segment, _ = list_distances[0]
        last_segment, _ = list_distances[-1]
        start = to_3d(first_segment[0])
        end = to_3d(last_segment[-1])

        for sub_landmarks, distance in list_distances:
            sub_landmarks = [to_3d(point) for point in sub_landmarks]

            # position along the profile (from the start) and height
            line_2d = np.array([
                [math.sqrt((point["x"] - start["x"]) ** 2 + (point["y"] - start["y"]) ** 2), point["z"]]
                for point in sub_landmarks])
            if smooth:
                line_2d = smooth_array(line_2d, distance)

            graphs_segments.append([{"x": point[0], "y": point[1]} for point in line_2d.tolist()])
    else:
        # the whole segment is masked
        start = dict(zip("xy", scaled(entry, x1, y1)), z=0)
        end = dict(zip("xy", scaled(entry, x2, y2)), z=0)

    return jsonify({
        "start": start,
        "end": end,
        "subLandmarkSegments": graphs_segments,
    })


if __name__ == "__main__":
    app.run()
