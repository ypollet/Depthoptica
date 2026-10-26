import axios from "axios"
import { parseAcquisitions, ProjectRepository, type AcquisitionObject, type DataProvider } from "@optica/core"
import { DepthAcquisition, type DepthImage, type Profile, type ProfileLandmarks } from "../models/depth"

// Reads the standard payload, or the one of the depthoptica backends not migrated yet (Orthanc plugin):
// { images: [{ id, label, size, edgeThresholds }], thumbnails }, one acquisition per image
export function parseDepth(data: any): AcquisitionObject<DepthImage>[] {
    if (data.acquisitions) {
        return parseAcquisitions<DepthImage>(data)
    }
    return (data.images ?? []).map((image: any) => ({
        id: image.id,
        label: image.label,
        images: [],
        standaloneImages: [{ name: image.id, label: image.label, size: image.size, edgeThresholds: image.edgeThresholds }],
        size: image.size,
        thumbnails: data.thumbnails,
    }))
}

export class DepthRepository extends ProjectRepository<DepthImage, DepthAcquisition> {
    constructor(provider: DataProvider) {
        super(provider, parseDepth, (object) => new DepthAcquisition(object))
    }

    // height along the profile between its two ends, undefined until it has them
    async computeProfile(objectPath: string, profile: Profile): Promise<ProfileLandmarks | undefined> {
        if (!profile.landmarks.isFull()) {
            return undefined
        }
        const first = profile.landmarks.first!
        const last = profile.landmarks.last!
        const url = this.provider.imageUrl(objectPath, first.pose.image.name, "profile")
        const res = await axios.get(url, {
            params: {
                x1: first.pose.marker.x, y1: first.pose.marker.y,
                x2: last.pose.marker.x, y2: last.pose.marker.y,
                threshold: profile.edgeThreshold, smooth: profile.smooth,
            }
        })
        return res.data as ProfileLandmarks
    }
}
