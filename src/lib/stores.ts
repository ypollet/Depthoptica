import { defineStore } from 'pinia'
import type { Project } from 'optica-core'
import type { DepthAcquisition, DepthImage, Profile } from '@/data/models/depth'

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
    selectAcquisition(id: string) {
      this.project?.selectAcquisition(id)
    },
  },
})
