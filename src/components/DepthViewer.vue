<script setup lang="ts">
import type Color from 'color'
import { useTemplateRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Landmark, type Coordinates, type Pose } from '@optica/core'
import { ImageViewer, type ViewerDrawContext } from '@optica/core/ui/image-viewer'
import { ProjectLoader } from '@optica/core/ui/project-loader'
import type { Profile } from '@/data/models/depth'
import { getRepository } from '@/data/setup'
import { useImagesStore } from '@/lib/stores'

// ticks along a profile, in image pixels
const TICK_SPACING = 100

const imagesStore = useImagesStore()
const { acquisition, annotations, selectedImage } = storeToRefs(imagesStore)

const repository = getRepository()

// the viewer watches its landmarks; the profiles (hover from the chart, segments) are drawn by drawProfiles
const viewer = useTemplateRef('viewer')
watch(() => annotations.value?.profiles, () => viewer.value?.update(), { deep: true })

async function loadProject() {
  const project = await repository.getImages(imagesStore.objectPath)
  imagesStore.project = project
  return project
}

async function createLandmark(pose: Pose, color?: Color): Promise<Landmark> {
  const id = annotations.value!.generateID()
  const position = await repository.computeLandmarkPosition(imagesStore.objectPath, pose)
  return new Landmark(id, id, pose, position, color)
}

async function updateProfile(profile: Profile) {
  const result = await repository.computeProfile(imagesStore.objectPath, profile)
  if (result) {
    profile.setResult(result)
  }
}

async function place(pos: Coordinates) {
  const current = annotations.value
  if (!selectedImage.value || !current) {
    return
  }
  const pose = { marker: pos, image: selectedImage.value }
  switch (current.tab) {
    case "landmarks":
      current.landmarks.push(await createLandmark(pose))
      break
    case "distances": {
      const distance = current.selectedDistance ?? current.newDistance()
      distance.landmarks.push(await createLandmark(pose, distance.color))
      break
    }
    case "profiles": {
      // a third end replaces the first one
      const profile = current.selectedProfile ?? current.newProfile()
      profile.landmarks.add(await createLandmark(pose, profile.color))
      await updateProfile(profile)
      break
    }
  }
}

async function move(landmark: Landmark, pos: Coordinates) {
  if (!selectedImage.value) {
    return
  }
  landmark.setPose(selectedImage.value, pos)
  const profile = annotations.value?.profileOf(landmark)
  if (profile) {
    // the backend gives the 3D ends with the profile
    await updateProfile(profile)
  } else {
    landmark.setPosition(await repository.computeLandmarkPosition(imagesStore.objectPath, landmark.pose))
  }
}

function perpendicular(vector: Coordinates, size: number): Coordinates {
  const length = Math.hypot(vector.x, vector.y)
  return { x: -vector.y * size / length, y: vector.x * size / length }
}

// tick across the profile at `at` (canvas)
function drawTick(ctx: CanvasRenderingContext2D, at: Coordinates, vector: Coordinates, color: string, size: number) {
  const perp = perpendicular(vector, size)
  ctx.beginPath()
  ctx.moveTo(at.x - perp.x, at.y - perp.y)
  ctx.lineTo(at.x + perp.x, at.y + perp.y)
  ctx.strokeStyle = color
  ctx.lineWidth = size / 4
  ctx.stroke()
  ctx.closePath()
}

// last end of a profile: a triangle pointing along it
function drawEnd(ctx: CanvasRenderingContext2D, landmark: Landmark, at: Coordinates, vector: Coordinates, radius: number) {
  const angle = Math.atan2(vector.y, vector.x)
  const size = radius * 2
  const vertices = [0, 2 * Math.PI / 3, 4 * Math.PI / 3].map((a) => ({
    x: at.x + size * Math.cos(a + angle),
    y: at.y + size * Math.sin(a + angle),
  }))
  ctx.beginPath()
  ctx.moveTo(vertices[0]!.x, vertices[0]!.y)
  vertices.slice(1).forEach((vertex) => ctx.lineTo(vertex.x, vertex.y))
  ctx.closePath()
  ctx.fillStyle = landmark.getColorHEX()
  ctx.fill()
  ctx.lineWidth = radius / 2
  ctx.strokeStyle = landmark.isClicked ? "white" : "black"
  ctx.stroke()
}

function drawProfiles(ctx: CanvasRenderingContext2D, view: ViewerDrawContext<Landmark>) {
  annotations.value?.profiles.forEach((profile) => {
    if (!profile.show || profile.landmarks.isEmpty()) {
      return
    }
    const first = profile.landmarks.first!
    if (!profile.landmarks.isFull()) {
      view.drawLandmark(first)
      return
    }
    const last = profile.landmarks.last!
    const start = view.markerOf(first)
    const end = view.markerOf(last)
    if (!start || !end) {
      return
    }
    const from = view.toCanvas(start)
    const to = view.toCanvas(end)
    const canvasVector = { x: to.x - from.x, y: to.y - from.y }
    const color = profile.getColorHEX()

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.strokeStyle = color
    ctx.lineWidth = view.radius / 2
    ctx.stroke()
    ctx.closePath()

    // ticks every TICK_SPACING image pixels
    const length = Math.hypot(end.x - start.x, end.y - start.y)
    for (let i = 1; i * TICK_SPACING < length; i++) {
      const t = i * TICK_SPACING / length
      drawTick(ctx, { x: from.x + canvasVector.x * t, y: from.y + canvasVector.y * t }, canvasVector, color, view.radius * 2)
    }
    // where the mouse is on the chart
    if (profile.hover_profile != undefined) {
      const t = profile.hover_profile
      drawTick(ctx, { x: from.x + canvasVector.x * t, y: from.y + canvasVector.y * t }, canvasVector, color, view.radius * 4)
    }

    view.drawLandmark(first)
    if (view.isDragged(last)) {
      view.drawLandmark(last)
    } else {
      drawEnd(ctx, last, to, canvasVector, view.radius)
    }
  })
}
</script>

<template>
  <ProjectLoader :load="loadProject" :query-key="['project', imagesStore.objectPath]">
    <ImageViewer v-if="acquisition && annotations && selectedImage" ref="viewer" class="object-fit" :image="selectedImage"
      :size="acquisition.sizeOf()" :camera="acquisition.camera" :landmarks="annotations.landmarks"
      :distances="annotations.distances" :extra-landmarks="annotations.shownProfileLandmarks" :draw="drawProfiles"
      @place="place" @move="move" @remove="(landmark) => annotations!.removeLandmark(landmark.id)"
      @select="(landmark) => annotations!.showInSidebar(landmark)" />
  </ProjectLoader>
</template>
