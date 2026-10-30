<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { PhArrowsDownUp, PhEye, PhEyeClosed, PhX } from '@phosphor-icons/vue'
import { vectorToString } from 'optica-core'
import { Button } from 'optica-core/ui/button'
import { Input } from 'optica-core/ui/input'
import { Label } from 'optica-core/ui/label'
import { LandmarkIteration } from 'optica-core/ui/landmark'
import type { DepthAnnotations, Profile } from '@/data/models/depth'
import { useImagesStore } from '@/lib/stores'
import ProfileChart from './ProfileChart.vue'

const props = defineProps<{
  profile: Profile
  index: number
  // the selected profile shows its chart, lengths and ends
  selected: boolean
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

const imagesStore = useImagesStore()
const annotations = computed(() => imagesStore.annotations as DepthAnnotations)
const scaled = computed(() => annotations.value.scaledProfile(props.profile))

const input = useTemplateRef('input')
// the label is being typed
const editing = ref<boolean>(false)

function changeColor(event: Event) {
  const target = event.currentTarget as HTMLInputElement | null
  if (target == null) {
    return
  }
  props.profile.setColorHEX(target.value)
  props.profile.landmarks.forEach((landmark) => landmark.setColorHEX(target.value))
}

// the last end removed deletes the profile
function removeEnd(first: boolean) {
  if (first) {
    props.profile.landmarks.popFirst()
  } else {
    props.profile.landmarks.popLast()
  }
  if (props.profile.landmarks.isEmpty()) {
    annotations.value.removeProfile(props.index)
  }
}

function showInput(event: MouseEvent) {
  event.preventDefault()
  if (!props.selected) {
    emit('select', props.index)
    return
  }
  editing.value = true
  input.value?.$el?.focus?.()
}

function permute() {
  props.profile.permute()
  annotations.value.selectedProfileIndex = props.index
}
</script>

<template>
  <div class="flex flex-col space-y-2">
    <div class="flex pr-2 border-transparent border-2">
      <div class="flex grow row justify-between items-center pr-3 py-2">
        <div class="flex grow row w-full justify-start items-center space-x-3 mr-3">
          <input type="color"
            class="h-8 w-8 block bg-white border border-gray-950 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-300"
            :value="profile.getColorHEX()" title="Choose your color" @change="changeColor($event)">
            <Label v-show="!editing" class="flex whitespace-nowrap w-36 font-normal text-lg"
              @dblclick="showInput">
              {{ profile.label }}
            </Label>
            <Input v-show="editing" ref="input" type="text" :model-value="profile.label"
              class="flex h-auto w-full px-0" @focusout="editing = false"
              @keyup.enter="editing = false"
              @update:model-value="(label) => profile.label = label.toString()" />
        </div>
        <div class="flex row justify-end space-x-3">
          <Button class="relative w-6 h-6 p-0" variant="secondary" v-show="profile.landmarks.isFull()"
            title="Swap the ends" @click="permute">
            <PhArrowsDownUp class="relative w-4 h-4 p-0" />
          </Button>
          <Button class="relative w-6 h-6 p-0" v-show="profile.show" variant="secondary" @click="profile.show = false">
            <PhEye class="relative w-4 h-4 p-0" />
          </Button>
          <Button class="relative w-6 h-6 p-0" v-show="!profile.show" variant="secondary" @click="profile.show = true">
            <PhEyeClosed class="relative w-4 h-4 p-0" />
          </Button>
          <Button class="relative w-6 h-6 p-0" variant="destructive" @click="annotations.removeProfile(index)">
            <PhX class="relative w-4 h-4 p-0" />
          </Button>
        </div>
      </div>
    </div>
    <ProfileChart v-if="selected && profile.landmarks.isFull()" :profile="profile"
      :edge-thresholds="imagesStore.selectedImage?.edgeThresholds" />
    <div class="flex row justify-between space-x-2">
      <div class="flex row space-x-1">
        <Label class="flex whitespace-nowrap w-auto items-center">Distance :</Label>
        <Label class="flex whitespace-nowrap w-auto items-center">
          {{ scaled.distance }} {{ annotations.scale }}
        </Label>
      </div>
      <div class="flex row space-x-1">
        <Label class="flex whitespace-nowrap w-auto items-center">Length :</Label>
        <Label class="inline-flex flex-wrap w-auto items-start content-start gap-x-2 gap-y-1">
          <div v-for="(length, segment) in scaled.segments" :key="segment" class="text-right tabular-nums"
            @mouseover="imagesStore.hover = { profile, segment }" @mouseout="imagesStore.hover = null">
            {{ length }} {{ annotations.scale }}
          </div>
        </Label>
      </div>
    </div>
    <div v-if="selected" class="overflow-auto w-full border">
      <LandmarkIteration v-for="(landmark, end) in profile.landmarks.items" :key="landmark.id" :landmark="landmark"
        :handle="false" :color-picker="false" :visibility-toggle="false" @remove="removeEnd(end == 0)">
        <template #info>
          <Label class="whitespace-nowrap">{{ vectorToString(landmark.position) }}</Label>
        </template>
      </LandmarkIteration>
    </div>
  </div>
</template>
