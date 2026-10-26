<script setup lang="ts">
import { usePersistedAnnotations } from '@optica/core'
import { Separator } from '@optica/core/ui/separator'
import DepthMenu from '@/components/DepthMenu.vue'
import DepthViewer from '@/components/DepthViewer.vue'
import { MainLogo } from '@/components/logo'
import Sidebar from '@/components/Sidebar.vue'
import { useImagesStore, useSettingsStore } from '@/lib/stores'

const settingsStore = useSettingsStore()
const imagesStore = useImagesStore()

const urlParams = new URLSearchParams(window.location.search)
imagesStore.setPath(urlParams.get('series') ?? "")

// the annotations survive a reload (sessionStorage, by series)
usePersistedAnnotations(() => imagesStore.project)
</script>

<template>
  <main class="h-screen">
    <div class="flex menu">
      <DepthMenu class="sticky top-0 flex flex-row grow z-50" />
      <div class="flex pr-2 items-center space-x-2">
        <MainLogo :height=35 :width=35 />
        <h1 class="font-dejavu font-bold text-brand">Depthoptica</h1>
      </div>
    </div>
    <Separator />
    <div class="h-full flex" :class="settingsStore.isLeft ? 'flex-row' : 'flex-row-reverse'">
      <div class="rest_height overflow-auto sidebar border p-4">
        <Sidebar />
      </div>
      <div class="rest_width rest_height flex grow items-center justify-center">
        <DepthViewer />
      </div>
    </div>
  </main>
</template>

<style scoped>
.menu {
  height: 40px;
}

.sidebar {
  width: 25%;
}

.rest_height {
  height: calc(100% - 41px);
}

.rest_width {
  width: 75%;
}
</style>
