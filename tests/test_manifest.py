"""The manifest schema of depthoptica (depth.json), on top of the common one of optica_core."""

import copy
import glob
import json
import os

import pytest

pytest.importorskip("jsonschema")
from optica_core.schema import errors, validator  # noqa: E402

HERE = os.path.dirname(__file__)
SCHEMA = os.path.join(HERE, "..", "manifest.schema.json")
DATA = os.path.join(HERE, "..", "data")

EXAMPLE = {
    "format": "optica-manifest",
    "version": 1,
    "viewer": "depthoptica",
    "unit": "mm",
    "thumbnails": "thumbnails",
    "acquisitions": [
        {
            "id": "x25",
            "size": {
                "width": 10,
                "height": 20
            },
            "pixelSize": [
                0.01,
                0.02
            ],
            "image": {
                "file": "x25_color.png"
            },
            "heightmap": {
                "file": "x25_depth.png",
                "zMin": -5.9,
                "zMax": 0
            },
            "mask": {
                "file": "x25_mask.png"
            },
            "edges": {
                "file": "x25_sobel.png",
                "thresholds": {
                    "light": 5
                }
            }
        }
    ]
}


@pytest.fixture(scope="module")
def check():
    return validator(SCHEMA)


def test_example(check):
    assert errors(check, EXAMPLE) == []


def a_misspelled_key(manifest):
    manifest["acquisitions"][0]["pixelRatio"] = [1, 1]


def no_height_map(manifest):
    del manifest["acquisitions"][0]["heightmap"]

def no_pixel_size(manifest):
    manifest["acquisitions"][0]["pixelSize"] = None


@pytest.mark.parametrize("mistake", [
    a_misspelled_key,
    no_height_map,
    no_pixel_size,
])
def test_mistakes_are_refused(check, mistake):
    manifest = copy.deepcopy(EXAMPLE)
    mistake(manifest)
    assert errors(check, manifest) != []


# the manifests of the data folder, when there is one (it isn't in git)
@pytest.mark.parametrize("path", sorted(glob.glob(os.path.join(DATA, "**", "depth.json"), recursive=True)) or [None])
def test_data(check, path):
    if path is None:
        pytest.skip("no depth.json in data/")
    with open(path) as f:
        assert errors(check, json.load(f)) == []
