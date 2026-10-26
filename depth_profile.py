"""Height profile along a segment of a depth map (Xiaolin Wu's line), moved from the depth app."""

import math

import numpy as np
from scipy.ndimage import gaussian_filter1d


def wu_line(x0, y0, x1, y1, heightmap : np.ndarray, mask : np.ndarray | None, edges : np.ndarray | None, threshold = 0):
    horizontal = abs(y1 - y0) < abs(x1 - x0) # if x is longer than y
    
    inverse = x1 < x0 if horizontal else y1 < y0
    if inverse:
        # has to be a positive vector so swap start 
        # !!! need to inverse list order
        x0, x1 = x1, x0
        y0, y1 = y1, y0

    dx = x1 - x0
    dy = y1 - y0

    distance = dx if horizontal else dy
    numerator = dy if horizontal else dx

    gradient = numerator/distance if distance != 0 else 1

    list_distances = []

    

    # get integer point before start point
    ratio_start = int(x0) - x0 if horizontal else int(y0) - y0
    start_point = {
        "x" : int(x0) if horizontal else x0 + gradient*ratio_start,
        "y" : y0 + gradient*ratio_start if horizontal else int(y0)
    }

    start = 0
    length_line = int(distance)+1
    while start < length_line:

        list_pixels, distance, end = handle_distance(start, length_line, inverse, start_point, gradient, horizontal, heightmap, mask, edges, threshold)
        if len(list_pixels) > 0:  #not empty
            list_distances.append((list_pixels, distance))
        
        start = end 
    
    return list_distances


def handle_distance(i, length_line, inverse, start_point, gradient, horizontal, heightmap, mask, edges, threshold):
    list_pixels = []
    list_i = [] # get distance of each pixels added, to get the 2 furthest points
    while i < length_line:
        # iterate from int before start point to int after end point
        x = start_point["x"] + i if horizontal else start_point["x"] + i*gradient
        y = start_point["y"] + i*gradient if horizontal else start_point["y"] + i
        ix, iy = int(x), int(y)

        i += 1
        if masked(ix, iy, mask):
            break
        
        dist = y - iy  if horizontal else x - ix # swap dist if steep
        depth = getRatioedPixelHeight(ix, iy, 1.0 - dist, heightmap) + getRatioedPixelHeight(ix, iy+1, dist, heightmap) if horizontal else getRatioedPixelHeight(ix, iy, 1.0 - dist, heightmap) + getRatioedPixelHeight(ix+1, iy, dist, heightmap)
        isEdge = edges[iy,ix] >= threshold if edges is not None else True
        if isEdge:
            list_i.append(i-1)
            list_pixels.append(
                {
                    "x": x,
                    "y": y,
                    "z": depth,
                }
        )
        
    

    if inverse:
        list_pixels.reverse()
    
    return list_pixels, list_i[-1] - list_i[0] if len(list_i) else 0, i
    

def masked(x : int, y : int, mask : np.ndarray | None):
    return mask is not None and not mask[y,x]

def getRatioedPixelHeight(x : int, y : int, ratio : float, heightmap : np.ndarray):
    return heightmap[y,x] * ratio


def smooth_array(array, distance : float):
    x, y = array.T
    t = np.linspace(0, 1, len(x))
    t2 = np.linspace(0, 1, int(distance)*10)
    t3 = np.linspace(0, 1, 100)

    x2 = np.interp(t3, t, x)
    y2 = np.interp(t3, t, y)
    sigma = 1#int(distance)/10
    x3 = x2
    y3 = gaussian_filter1d(y2, sigma)

    """x4 = np.interp(t3, t2, x3).reshape((-1,1))
    y4 = np.interp(t3, t2, y3).reshape((-1,1))"""


    return np.concatenate((x3.reshape((-1,1)),y3.reshape((-1,1))),1)
