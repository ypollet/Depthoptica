import { SCALE_UNITS, type ScaleUnit } from 'optica-core'

// the profiles are physical (mm from the pixel ratio and the depth range): no px
export const DEPTH_UNITS: ScaleUnit[] = SCALE_UNITS.filter((unit) => unit != "px")
