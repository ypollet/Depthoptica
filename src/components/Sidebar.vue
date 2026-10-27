<script setup lang="ts">
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

const tabs = [
  { value: "landmarks", label: "Landmarks" },
  { value: "distances", label: "Distances" },
  { value: "profiles", label: "Profilometer" },
]
</script>

<template>
  <div class="flex flex-col pb-[12px] w-auto h-full">
    <div v-if="acquisition && selectedImage" class="flex justify-center">
      <div class="w-4/5">
        <ThumbnailViewer :src="selectedImage.thumbnail || selectedImage.image" :alt="selectedImage.label"
          :size="acquisition.sizeOf()" :zoom-rect="acquisition.camera.zoomRect" />
      </div>
    </div>
    <!-- one depth image per acquisition, each with its own annotations -->
    <div v-if="project" class="flex justify-center px-4 py-4">
      <ToggleGroup type="single" variant="outline" :spacing="5" class="w-auto max-w-full flex-wrap justify-center"
        :model-value="acquisition?.id"
        @update:model-value="(id) => { if (id != undefined) imagesStore.selectAcquisition(String(id)) }">
        <ToggleGroupItem v-for="item in project.acquisitions" :key="item.id" :value="item.id">
          {{ item.label }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
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
