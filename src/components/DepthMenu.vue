<script setup lang="ts">
import { downloadCSV, downloadJSON, exportFilename, annotationsFile } from 'optica-core'
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
    downloadJSON(annotationsFile(project, "depthoptica"), exportFilename("depth", imagesStore.objectPath, "json"))
  }
}

// the exported files, current or older (upgraded by readAnnotationsFile);
// the landmarks without a position get it from the backend
function importAnnotations(content: string) {
  if (!imagesStore.project) {
    return
  }
  try {
    imagesStore.project.importAnnotationsFile(JSON.parse(content), { viewer: "depthoptica" })
  } catch (error) {
    console.error("Annotations not imported:", error)
    return
  }
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
