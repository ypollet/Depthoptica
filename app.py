import math
import os

import cv2
import numpy as np
from flask import abort, jsonify, request
from flask_cors import cross_origin

from optica_core import Dataset, acquisition, create_app, image, project
from depth_profile import smooth_array, wu_line


class DepthDataset(Dataset):
    """Stacked images with their depth map (depth.json).

    Each image has its own size, pixel ratio and depth range: it is an acquisition of its own.
    """

    manifest = "depth.json"

    def stacked(self, id, image_id):
        stacked = self.load(id)["stacked"]
        if image_id not in stacked:
            abort(404)
        return stacked[image_id]

    # file of the image: "image" in the old manifests, else the name of the image
    @staticmethod
    def filename(image_id, entry):
        return entry.get("image", entry["data"].get("name", image_id))

    def images(self, id):
        depth_file = self.load(id)
        folder = self.thumbnails_folder(id, depth_file)
        acquisitions = []
        for image_id, entry in depth_file["stacked"].items():
            data = entry["data"]
            size = {"width": data["width"], "height": data["height"]}
            thresholds = entry.get("edges", {}).get("threshold")
            acquisitions.append(acquisition(
                image_id,
                label=data.get("label", image_id),
                size=size,
                standalone_images=[image(
                    image_id,
                    data.get("label", image_id),
                    size=size,
                    edgeThresholds=list(thresholds) if thresholds else None,
                    hasThumbnail=self.has_thumbnail(folder, self.filename(image_id, entry)),
                )],
            ))
        return project(*acquisitions)

    def full_image(self, id, image_id):
        return self.directory(id), self.filename(image_id, self.stacked(id, image_id))

    # the thumbnail has the file name of its image
    def thumbnail(self, id, image_id):
        folder, _ = super().thumbnail(id, image_id)
        return folder, self.filename(image_id, self.stacked(id, image_id))

    def depthmap(self, id, entry):
        return cv2.imread(os.path.join(self.directory(id), entry["depthmap"]), cv2.IMREAD_GRAYSCALE | cv2.IMREAD_ANYDEPTH)

    # x, y in mm from the pixel ratio, z from the depth map scaled to [Zmin, Zmax]
    def position(self, id, image_id, x, y):
        if image_id is None:
            abort(404)
        entry = self.stacked(id, image_id)
        data = entry["data"]
        im = self.depthmap(id, entry)
        row = min(max(round(y), 0), im.shape[0] - 1)
        col = min(max(round(x), 0), im.shape[1] - 1)
        depth = im[row][col]
        return {
            "x": x * data["PixelRatio"][0],
            "y": y * data["PixelRatio"][1],
            "z": ((data["Zmax"] - data["Zmin"]) / (2 ** (im.itemsize * 8)) * depth) + data["Zmin"],
        }


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

    directory = dataset.directory(id)
    entry = dataset.stacked(id, image_id)
    image_data = entry["data"]

    im = dataset.depthmap(id, entry)
    mask = cv2.imread(f"{directory}/{entry['mask']}", cv2.IMREAD_GRAYSCALE) if "mask" in entry else None
    edges = cv2.imread(f"{directory}/{entry['edges']['image']}", cv2.IMREAD_GRAYSCALE) if "edges" in entry else None
    edge_threshold = entry["edges"]["threshold"][threshold] if ("edges" in entry and threshold in entry["edges"]["threshold"]) else 0
    list_distances = wu_line(x1, y1, x2, y2, im, mask, edges, edge_threshold)

    def to_3d(point):
        return {
            "x": point["x"] * image_data["PixelRatio"][0],
            "y": point["y"] * image_data["PixelRatio"][1],
            "z": ((image_data["Zmax"] - image_data["Zmin"]) / (2 ** (im.itemsize * 8)) * point["z"]) + image_data["Zmin"],
        }

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
        start = {"x": x1 * image_data["PixelRatio"][0], "y": y1 * image_data["PixelRatio"][1], "z": 0}
        end = {"x": x2 * image_data["PixelRatio"][0], "y": y2 * image_data["PixelRatio"][1], "z": 0}

    return jsonify({
        "start": start,
        "end": end,
        "subLandmarkSegments": graphs_segments,
    })


if __name__ == "__main__":
    app.run()
