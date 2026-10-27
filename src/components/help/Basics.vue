<script setup lang="ts">
import { Card, CardContent } from 'optica-core/ui/card';
import { PhMouseLeftClick, PhMouseRightClick, PhMouseScroll } from '@phosphor-icons/vue'

</script>

<template>
  <Card id="card" class="flex h-full min-h-full w-full max-w-full min-w-0 overflow-x-hidden overlow-auto">
    <CardContent
      class="flex flex-col h-full min-h-full min-w-0 flex-1 space-y-5 items-start justify-start overflow-x-hidden overflow-y-auto p-6">
      <div>
        <h4 class="w-full min-w-0 text-base font-semibold">What is Depthoptica?</h4>
        <span class="block w-full min-w-0 text-muted-foreground break-all pl-5">
          Depthoptica is a 2D Viewer combining a high-resolution image and a heightmap of the surface<br />
          This allows the users to make 3D measurements based of the surface captured.
        </span>
      </div>
      <div>
        <h4 class="w-full min-w-0 text-base font-semibold">Basics of the app</h4>
        <details class="mt-3 w-full rounded-md" open>
          <summary class="cursor-pointer font-medium">Image interactions</summary>

          <ul class="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li class="items-center gap-2 leading-6">
                <span><PhMouseScroll size="24" class="shrink-0 inline" weight="fill" /> Mouse Wheel</span>
              <ul class="mt-1 list-[circle] pl-5 space-y-1">
                <li>Zoom in/out on the image.</li>
              </ul>
            </li>

            <li>
              <span><PhMouseLeftClick size="24" class="shrink-0 inline" weight="fill" /> Left Click</span>
              <ul class="mt-1 list-[circle] pl-5 space-y-1">
                <li>Drag on empty space to pan,</li>
                <li>Drag a landmark to move it.</li>
              </ul>
            </li>

            <li>
              <span><PhMouseRightClick size="24" class="shrink-0 inline" weight="fill" /> Right Click</span>
              <ul class="mt-1 list-[circle] pl-5 space-y-1">
                <li>Click on empty space to add a landmark,</li>
                <li>Click on an existing point to delete it.</li>
              </ul>
            </li>
          </ul>
        </details>

        <details class="mt-3 rounded-md w-full" open>
          <summary class="cursor-pointer font-medium">Interact with the image</summary>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Use the mouse wheel to zoom in or out.</li>
            <br />
            <li>Left-click and drag on empty space to pan the image.</li>
            <li>Left-click and drag a landmark to move it.</li>
            <br />
            <li>Right-click on a empty space to add a landmark</li>
            <li>Right-click on an existing point to delete it.</li>
          </ul>
        </details>
      </div>
    </CardContent>
  </Card>
</template>