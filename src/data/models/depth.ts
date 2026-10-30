import Color from "color"
import {
    Acquisition, Annotations, DequeMax2, Landmark, computeDistance, distanceVector, landmarkCSVRow, randomColorRGB,
    type AnnotationsObject, type AnnotationsSelection, type Coordinates, type Coords3D,
    type LandmarkObject, type ProjectImage, type ScaleUnit,
} from "optica-core"

// Stacked image with its depth map. Edge thresholds: names of the edge levels the profiles can follow
export type DepthImage = ProjectImage & {
    edgeThresholds?: string[] | null
}

// Sent by the backend: the 3D ends and the height along the profile, in segments (masked parts cut it)
export type ProfileLandmarks = {
    start: Coords3D
    end: Coords3D
    subLandmarkSegments: Coordinates[][]
}

export type ProfileObject = {
    label: string
    color: string
    landmarks: LandmarkObject[]
    subLandmarkSegments: Coordinates[][]
    edgeThreshold?: string
    smooth?: boolean
}

// Saved form of a profile: with its lengths shown in the scale of the annotations (not read back)
export type ProfileAnnotationObject = ProfileObject & {
    distance: number,
    length: number
}

// Lengths of a profile shown in the scale of the annotations
export type ScaledProfile = {
    // straight between the ends
    distance: number
    // along the surface, total and per segment
    length: number
    segments: number[]
    // chart of the height along the profile, not rounded
    points: Coordinates[][]
}

// Height profile between two landmarks of the depth map
export class Profile {
    label: string
    // the two ends, adding a third one drops the first
    landmarks: DequeMax2<Landmark>
    // x: position along the profile, y: height, both physical
    subLandmarkSegments: Coordinates[][]
    edgeThreshold: string
    smooth: boolean
    color: Color
    show: boolean = true

    constructor(label: string, landmarks: Landmark[] = [], subLandmarkSegments: Coordinates[][] = [], edgeThreshold: string = "none", smooth: boolean = true, color: Color | null = null) {
        this.label = label
        this.landmarks = new DequeMax2(landmarks)
        this.subLandmarkSegments = subLandmarkSegments
        this.edgeThreshold = edgeThreshold
        this.smooth = smooth
        this.color = color ?? Color.rgb(randomColorRGB())
    }

    // physical length along the surface of each segment (masked parts cut the profile), undefined without both ends.
    // A segment starts from the last point of the previous one: the jump over a masked part counts
    get segmentLengths(): number[] | undefined {
        if (!this.landmarks.isFull() || this.subLandmarkSegments.length === 0) {
            return undefined
        }
        let last: Coordinates | undefined
        return this.subLandmarkSegments.map((segment) => computeDistance(segment.map((point) => {
            const interval = distanceVector(last ?? point, point)
            last = point
            return interval
        })))
    }

    // physical length along the surface: sum of the segments
    get length(): number | undefined {
        return this.segmentLengths?.reduce((sum, length) => sum + length, 0)
    }

    // physical straight 3D distance between the ends
    get distance(): number | undefined {
        if (!this.landmarks.isFull()) {
            return undefined
        }
        return computeDistance([distanceVector(this.landmarks.first!.position, this.landmarks.last!.position)])
    }

    // swap the ends, the chart is mirrored on the same range
    permute() {
        if (!this.landmarks.isFull()) {
            return
        }
        this.landmarks.permute()
        const start = this.subLandmarkSegments[0]?.[0]
        const lastSegment = this.subLandmarkSegments[this.subLandmarkSegments.length - 1]
        const end = lastSegment?.[lastSegment.length - 1]
        if (start == undefined || end == undefined) {
            return
        }
        const offset = start.x + end.x
        this.subLandmarkSegments = [...this.subLandmarkSegments].reverse().map((segment) =>
            [...segment].reverse().map((point) => ({ ...point, x: offset - point.x })))
    }

    // result of the backend for the current ends
    setResult(result: ProfileLandmarks) {
        if (!this.landmarks.isFull()) {
            return
        }
        this.landmarks.first!.position = result.start
        this.landmarks.last!.position = result.end
        this.subLandmarkSegments = result.subLandmarkSegments
    }

    getColorHEX(): string {
        return this.color.hex()
    }

    setColorHEX(color: string) {
        this.color = Color(color)
    }

    toJSON(): ProfileObject {
        return {
            label: this.label, color: this.color.hex(), landmarks: this.landmarks.items.map((landmark) => landmark.toJSON()),
            subLandmarkSegments: this.subLandmarkSegments, edgeThreshold: this.edgeThreshold, smooth: this.smooth,
        }
    }

    static fromObject(object: ProfileObject): Profile {
        const landmarks = object.landmarks.map((landmark) => Landmark.fromJSON(landmark))
        return new Profile(object.label, landmarks, object.subLandmarkSegments ?? [], object.edgeThreshold ?? "none",
            object.smooth ?? true, object.color ? Color(object.color) : null)
    }
}

export type DepthAnnotationsObject = AnnotationsObject & {
    profiles?: ProfileAnnotationObject[]
}

export type DepthSelection = AnnotationsSelection & {
    selectedProfileIndex: number
}

// Annotations of a depth image: landmarks and distances of the core, and the profiles
export class DepthAnnotations extends Annotations {
    profiles: Profile[] = []
    selectedProfileIndex: number = -1
    scale: ScaleUnit = "mm"
    // the image of the acquisition, for the files exported by the first depth version
    image: DepthImage

    constructor(image: DepthImage) {
        super()
        this.image = image
    }

    get selectedProfile(): Profile | null {
        return this.profiles[this.selectedProfileIndex] ?? null
    }

    get profileLandmarks(): Landmark[] {
        return this.profiles.flatMap((profile) => profile.landmarks.items)
    }

    // landmarks of the shown profiles, given to the ImageViewer as extra landmarks
    get shownProfileLandmarks(): Landmark[] {
        return this.profiles.filter((profile) => profile.show).flatMap((profile) => profile.landmarks.items)
    }

    get allLandmarks(): Landmark[] {
        return [...super.allLandmarks, ...this.profileLandmarks]
    }

    profileOf(landmark: Landmark | string): Profile | undefined {
        return this.profiles.find((profile) => profile.landmarks.contains(landmark))
    }

    // Adds a profile and selects it, returns the stored one (reactive through a store)
    newProfile(): Profile {
        const index = this.profiles.push(new Profile("Profile " + (this.profiles.length + 1))) - 1
        this.selectedProfileIndex = index
        return this.profiles[index]!
    }

    // keeps selectedProfileIndex on the same profile
    removeProfile(index: number) {
        if (index < 0 || index >= this.profiles.length) {
            return
        }
        if (index == this.selectedProfileIndex) {
            this.selectedProfileIndex = -1
        } else if (index < this.selectedProfileIndex) {
            this.selectedProfileIndex--
        }
        this.profiles.splice(index, 1)
    }

    removeLandmark(id: string) {
        super.removeLandmark(id)
        this.profiles.forEach((profile) => profile.landmarks.remove(id))
    }

    showInSidebar(landmark: Landmark) {
        const index = this.profiles.findIndex((profile) => profile.landmarks.contains(landmark))
        if (index !== -1) {
            this.tab = "profiles"
            this.selectedProfileIndex = index
            return
        }
        super.showInSidebar(landmark)
    }

    // lengths of the profile shown in the current scale, corrected by the calibration and rounded (0 while they can't be measured)
    scaledProfile(profile: Profile): ScaledProfile {
        return {
            distance: this.toUnit(profile.distance),
            length: this.toUnit(profile.length),
            segments: (profile.segmentLengths ?? []).map((length) => this.toUnit(length)),
            points: profile.subLandmarkSegments.map((segment) =>
                segment.map((point) => ({ x: this.inScale(point.x), y: this.inScale(point.y) }))),
        }
    }

    toJSON(): DepthAnnotationsObject {
        return { ...super.toJSON(),
                profiles: this.profiles.map((profile) => {
                    const { distance, length } = this.scaledProfile(profile)
                    return { ...profile.toJSON(), distance, length }
                }),
        }
    }

    // also reads the per image stores exported by the first depth version
    merge(object: Partial<DepthAnnotationsObject>) {
        const normalized = this.fromFirstVersion(object)
        const used = new Set(this.allLandmarks.map((landmark) => landmark.id))
        super.merge(normalized)
        const profiles = (normalized.profiles ?? []).map((profile) => Profile.fromObject(profile))
        // super.merge used new ids for its landmarks: avoid them too
        this.allLandmarks.forEach((landmark) => used.add(landmark.id))
        this.claimIDs(profiles.flatMap((profile) => profile.landmarks.items), used)
        this.profiles.push(...profiles)
    }

    restore(object: Partial<DepthAnnotationsObject>) {
        this.profiles = []
        this.selectedProfileIndex = -1
        super.restore(object)
    }

    getSelection(): DepthSelection {
        return { ...super.getSelection(), selectedProfileIndex: this.selectedProfileIndex }
    }

    setSelection(selection: Partial<DepthSelection>) {
        super.setSelection(selection)
        const index = selection.selectedProfileIndex
        if (typeof index === "number" && index >= -1 && index < this.profiles.length) {
            this.selectedProfileIndex = index
        }
    }

    toCSVRows(): string[][] {
        return [
            ...super.toCSVRows(),
            ...this.profiles.flatMap((profile) => profile.landmarks.items.map((landmark) => landmarkCSVRow("Profile", profile.label, landmark))),
        ]
    }

    // First depth exports: landmarks { pos, pose } (pixel, 3D), "adjustFactor", profiles' ends in { array }
    private fromFirstVersion(object: any): Partial<DepthAnnotationsObject> {
        const landmark = (old: any): LandmarkObject => ("pos" in old)
            ? { id: old.id, label: old.label, color: old.color, pose: { marker: old.pos, image: this.image }, position: old.pose }
            : old
        return {
            scale_factor: object.scale_factor ?? object.adjustFactor,
            scale: object.scale,
            landmarks: (object.landmarks ?? []).map(landmark),
            distances: (object.distances ?? []).map((distance: any) => ({ ...distance, landmarks: (distance.landmarks ?? []).map(landmark) })),
            profiles: (object.profiles ?? []).map((profile: any) => ({
                ...profile,
                landmarks: (Array.isArray(profile.landmarks) ? profile.landmarks : profile.landmarks?.array ?? []).map(landmark),
            })),
        }
    }
}

// One depth image: its own size, pixel ratio and depth range, so its own annotations
export class DepthAcquisition extends Acquisition<DepthImage> {
    declare annotations: DepthAnnotations

    protected createAnnotations(): DepthAnnotations {
        return new DepthAnnotations(this.standaloneImages[0] ?? this.images[0]!)
    }
}
