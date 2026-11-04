<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { AnnotationsPanel } from 'optica-core/ui/annotations-panel'
import { vectorToString } from 'optica-core'
import { Label } from 'optica-core/ui/label'
import ProfileList from '@/components/profile/ProfileList.vue'
import { DEPTH_UNITS } from '@/config/units'
import { useImagesStore } from '@/lib/stores'
import { ImageOverview } from 'optica-core/ui/image-overview'
import { ToggleImage } from 'optica-core/ui/toggle-image'
import { PhChartLine } from '@phosphor-icons/vue'

const imagesStore = useImagesStore()
const { project, acquisition, annotations, selectedImage } = storeToRefs(imagesStore)

const images = computed(() => (project.value?.acquisitions ?? []).map((item) => ({ value: String(item.id), label: item.label })))

// after the shared annotation tabs
const TABS = [{ value: "profiles", label: "Profilometer", icon: PhChartLine }]
</script>

<template>
  <div class="flex flex-col pb-[12px] w-auto h-full">
    <ImageOverview v-if="acquisition && selectedImage" :image="selectedImage" :size="acquisition.sizeOf()"
      :camera="acquisition.camera" />
    <!-- one depth image per acquisition, each with its own annotations -->
    <ToggleImage v-if="project" :items="images" :model-value="acquisition ? String(acquisition.id) : undefined"
      @update:model-value="(id : string | undefined) => { if (id != undefined) imagesStore.selectAcquisition(id) }" />
    <div class="flex-none space-y-4 py-4">
      <AnnotationsPanel v-if="annotations" :annotations="annotations" :extra-tabs="TABS" :units="DEPTH_UNITS">
        <template #landmark-info="{ landmark }">
          <Label class="whitespace-nowrap">{{ vectorToString(landmark.position) }}</Label>
        </template>
        <template #measure-landmark-info="{ landmark }">
          <Label class="whitespace-nowrap">{{ vectorToString(landmark.position) }}</Label>
        </template>
        <template #profiles>
          <ProfileList />
        </template>
      </AnnotationsPanel>
    </div>
  </div>
</template>
