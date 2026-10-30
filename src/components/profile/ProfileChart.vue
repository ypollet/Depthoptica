<script setup lang="ts">
import { computed } from 'vue'
import { Label } from 'optica-core/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'optica-core/ui/select'
import { SelectScale } from 'optica-core/ui/select-scale'
import { Toggle } from 'optica-core/ui/toggle'
import { DEPTH_UNITS } from '@/config/units'
import type { DepthAnnotations, Profile } from '@/data/models/depth'
import { getRepository } from '@/data/setup'
import { useImagesStore } from '@/lib/stores'
import LineChart from './LineChart.vue'

// Chart of a profile with its controls: sampling, smoothing and scale
const props = defineProps<{
  profile: Profile
  edgeThresholds?: string[] | null
}>()

const repository = getRepository()
const imagesStore = useImagesStore()
const annotations = computed(() => imagesStore.annotations as DepthAnnotations)

const points = computed(() => annotations.value.scaledProfile(props.profile).points)
// segment of this profile hovered in the sidebar
const highlighted = computed(() => imagesStore.hover?.profile === props.profile ? imagesStore.hover.segment : undefined)
const filename = computed(() => imagesStore.objectPath + "-" + props.profile.label.split(' ').join('_'))

// edge threshold or smoothing changed: ask the backend again
async function updateProfile() {
  const result = await repository.computeProfile(imagesStore.objectPath, props.profile)
  if (result) {
    props.profile.setResult(result)
  }
}
</script>

<template>
  <div class="flex flex-col space-y-2">
    <div class="flex flex-row space-x-2 justify-between items-center">
      <div>
        <div v-if="edgeThresholds != undefined && edgeThresholds.length > 0" class="flex row space-x-1">
          <Label class="content-center">Profile Sampling</Label>
          <Select class="w-fit" v-model="profile.edgeThreshold" @update:model-value="updateProfile">
            <SelectTrigger class="w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem class="h-8" value="none">
                  <div class="flex flex-row space-x-2">
                    <span class="content-center">none</span>
                  </div>

                </SelectItem>
                <SelectItem class="h-8" v-for="threshold in edgeThresholds" :value="threshold">
                  <div class="flex flex-row space-x-2">
                    <span class="content-center">{{ threshold }}</span>
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Toggle :model-value="profile.smooth" @update:model-value="(pressed: boolean) => { profile.smooth = pressed; updateProfile() }">Smooth</Toggle>
      </div>
      <SelectScale v-model="annotations.scale" :units="DEPTH_UNITS" />
    </div>
    <LineChart :segments="points" :highlighted="highlighted" :filename="filename"
      @hover="(fraction) => imagesStore.hover = fraction == undefined ? null : { profile, fraction }" />
  </div>
</template>
