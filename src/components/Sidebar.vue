<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { vectorToString } from 'optica-core'
import { AnnotationTabs } from 'optica-core/ui/annotation-tabs'
import { DistanceList } from 'optica-core/ui/distance'
import { Label } from 'optica-core/ui/label'
import { LandmarkList } from 'optica-core/ui/landmark'
import { ThumbnailViewer } from 'optica-core/ui/thumbnail-viewer'
import { ToggleGroup, ToggleGroupItem } from 'optica-core/ui/toggle-group'
import ProfileList from '@/components/profile/ProfileList.vue'
import { DEPTH_UNITS } from '@/config/units'
import { useImagesStore } from '@/lib/stores'

const imagesStore = useImagesStore()
const { project, acquisition, annotations, selectedImage } = storeToRefs(imagesStore)

const images = computed(() => (project.value?.acquisitions ?? []).map((item) => ({ value: String(item.id), label: item.label })))

const tabs = [
  { value: "landmarks", label: "Landmarks" },
  { value: "distances", label: "Distances" },
  { value: "profiles", label: "Profilometer" },
]
</script>

<template>
  <div class="flex flex-col pb-[12px] w-auto h-full">
    <ImageOverview v-if="acquisition && selectedImage" :image="selectedImage" :size="acquisition.sizeOf()"
      :camera="acquisition.camera" />
    <!-- one depth image per acquisition, each with its own annotations -->
    <ToggleImage v-if="project" :items="images" :model-value="acquisition ? String(acquisition.id) : undefined"
      @update:model-value="(id : string | undefined) => { if (id != undefined) imagesStore.selectAcquisition(id) }" />
    <div class="flex-none space-y-4 py-4">
      <AnnotationTabs v-if="annotations" v-model="annotations.tab" :tabs="tabs">
        <template #landmarks>
          <LandmarkList v-model="annotations.landmarks">
            <template #info="{ landmark }">
              <Label class="whitespace-nowrap">{{ vectorToString(landmark.position) }}</Label>
            </template>
          </LandmarkList>
        </template>
        <template #distances>
          <DistanceList v-model="annotations.distances" v-model:selected="annotations.selectedDistanceIndex"
            v-model:scale="annotations.scale" :adjust-factor="annotations.adjustFactor" :units="DEPTH_UNITS">
            <template #landmark-info="{ landmark }">
              <Label class="whitespace-nowrap">{{ vectorToString(landmark.position) }}</Label>
            </template>
          </DistanceList>
        </template>
        <template #profiles>
          <ProfileList />
        </template>
      </AnnotationTabs>
    </div>
  </div>
</template>
