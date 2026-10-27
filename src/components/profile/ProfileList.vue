<script setup lang="ts">
import { computed } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { PhCircle } from '@phosphor-icons/vue'
import { Button } from 'optica-core/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'optica-core/ui/select'
import { Separator } from 'optica-core/ui/separator'
import type { DepthAnnotations } from '@/data/models/depth'
import { useImagesStore } from '@/lib/stores'
import ProfileIteration from './ProfileIteration.vue'

const imagesStore = useImagesStore()
const annotations = computed(() => imagesStore.annotations as DepthAnnotations)

// index of the selected profile, -1: the next end creates a new profile
function select(payload: AcceptableValue) {
  if (payload !== null) {
    annotations.value.selectedProfileIndex = Number(payload)
  }
}

const others = computed(() => annotations.value.profiles
  .map((profile, index) => ({ profile, index }))
  .filter(({ index }) => index != annotations.value.selectedProfileIndex))
</script>

<template>
  <div class="flex grow w-full flex-col space-y-5">
    <div class="flex flex-row content-center space-x-4">
      <Select :model-value="annotations.selectedProfileIndex.toString()" @update:model-value="select">
        <SelectTrigger class="w-full">
          <!-- Rendered from the annotations: reka-ui caches each item's text at mount,
               so its own label goes stale when profiles are removed or renamed -->
          <SelectValue>
            <span class="content-center">{{ annotations.selectedProfile?.label ?? 'New..' }}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem class="h-8" value="-1">
              <div class="flex flex-row space-x-2 items-center">
                <PhCircle />
                <span class="content-center">New..</span>
              </div>
            </SelectItem>
            <SelectItem class="h-8" v-for="(profile, index) in annotations.profiles" :key="index" :value="index.toString()">
              <div class="flex flex-row space-x-2 items-center">
                <PhCircle weight="fill" :color="profile.getColorHEX()" />
                <span class="content-center">{{ profile.label }}</span>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button variant="secondary" @click="select('-1')">New..</Button>
    </div>
    <ProfileIteration v-if="annotations.selectedProfile" :profile="annotations.selectedProfile"
      :index="annotations.selectedProfileIndex" :selected="true" />
    <Separator class="bg-gray-400" />
    <ProfileIteration v-for="{ profile, index } in others" :key="index" :profile="profile" :index="index" :selected="false"
      @select="select" />
  </div>
</template>
