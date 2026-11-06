import { defineStore } from 'pinia'
import type { Project } from 'optica-core'
import type { DepthAcquisition, DepthImage, Profile } from '@/data/models/depth'
import { getRepository } from '@/data/setup'

export const useSettingsStore = defineStore('settings', {
  state: () => ({ isLeft: false }),
  actions: {
    useToggleLeft(value: boolean) {
      this.isLeft = value
    },
  },
  persist: {
    storage: localStorage,
    key: 'settings',
  }
})

// The profile under the mouse in the sidebar: one of its lengths (`segment`)
// or its chart, at `fraction` of the profile
export type ProfileHover = {
  profile: Profile
  segment?: number
  fraction?: number
}

// The project holds everything else: one acquisition per depth image, each with its camera and annotations.
// Its annotations are saved by usePersistedAnnotations (ViewerView).
export const useImagesStore = defineStore('images', {
  state: () => ({
    objectPath: "",
    project: null as Project<DepthImage, DepthAcquisition> | null,
    hover: null as ProfileHover | null,
  }),
  getters: {
    acquisition: (state) => state.project?.acquisition ?? null,
    // typed from the state: the store unwraps the classes (protected members are dropped)
    annotations: (state) => state.project?.acquisition?.annotations ?? null,
    selectedImage(): DepthImage | null {
      return this.acquisition?.selectedImage ?? null
    },
  },
  actions: {
    setPath(path: string) {
      this.$reset()
      this.objectPath = path
    },
    // the 3D ends and the chart of the profile, by the backend. Dropped if an end moved meanwhile
    async updateProfile(profile: Profile) {
      const poses = profile.landmarks.items.map((landmark) => landmark.pose)
      const result = await getRepository().computeProfile(this.objectPath, profile)
      const moved = profile.landmarks.items.some((landmark, index) => landmark.pose !== poses[index])
      if (result && !moved) {
        profile.setResult(result)
      }
    },
    // computes the positions and profiles that aren't known: old exports have none, a reload during a computation loses one
    recomputePositions() {
      const repository = getRepository()
      this.project?.acquisitions.forEach((acquisition) => {
        acquisition.annotations.recomputePositions((pose) => repository.computeLandmarkPosition(this.objectPath, pose))
        acquisition.annotations.profilesToRecompute().forEach((profile) => {
          this.updateProfile(profile).catch((error) => console.error("Profile not computed:", error))
        })
      })
    },
    selectAcquisition(id: string) {
      this.project?.selectAcquisition(id)
    },
  },
})
