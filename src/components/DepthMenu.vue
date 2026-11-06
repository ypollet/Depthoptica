<script setup lang="ts">
import { downloadCSV, downloadJSON, exportFilename } from 'optica-core'
import { AppMenu } from 'optica-core/ui/app-menu'
import HelpGuide from '@/components/help/HelpGuide.vue'
import { Credits } from '@/components/credits'
import { useImagesStore, useSettingsStore } from '@/lib/stores'

const settingsStore = useSettingsStore()
const imagesStore = useImagesStore()

// the annotations of every depth image, by image
function exportAnnotations(format: "csv" | "json") {
  const project = imagesStore.project
  if (!project) {
    return
  }
  if (format == "csv") {
    downloadCSV(project.annotationsToCSVRows(), exportFilename("depth", imagesStore.objectPath, "csv"))
  } else {
    downloadJSON(project.annotationsToJSON(), exportFilename("depth", imagesStore.objectPath, "json"))
  }
}

// the landmarks without a position (old exports) get it from the backend
function importAnnotations(content: string) {
  if (!imagesStore.project) {
    return
  }
  imagesStore.project.importAnnotations(JSON.parse(content))
  imagesStore.recomputePositions()
}
</script>

<template>
  <AppMenu :reverse="settingsStore.isLeft" @update:reverse="settingsStore.useToggleLeft" app-name="Depthoptica"
    @export="exportAnnotations" @import="importAnnotations">
    <template #help-guide>
      <HelpGuide />
    </template>
    <template #credits>
      <Credits />
    </template>
  </AppMenu>
</template>
