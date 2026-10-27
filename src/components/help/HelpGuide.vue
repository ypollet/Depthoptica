<script setup lang="ts">
import { Card, CardContent } from 'optica-core/ui/card';
import { PhArrowsDownUp, PhEraser, PhEye, PhMouseLeftClick, PhMouseRightClick, PhMouseScroll, PhX } from '@phosphor-icons/vue';

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
        <details class="mt-3 w-full rounded-md">
          <summary class="cursor-pointer font-medium">How does the heightmap work?</summary>
          <ul class="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              The heightmap is a grayscale image where every pixel is the height of the surface at that point
            </li>
            <li>
              When a landmark is placed, depthoptica compute its 3D position
              <strong>(X; Y; Z)</strong>:
              <ul class="mt-1 list-[circle] pl-5 space-y-1">
                <li><strong>X</strong> and <strong>Y</strong> with the pixel position scaled thanks to the pixel spacing
                  of the image</li>
                <li><strong>Z</strong> comes from the heightmap value, scaled to the thickness of the captured stack
                </li>
              </ul>
            </li>
            <li>Results are displayed in the unit chosen in the scale selector (m, cm, mm, µm...)</li>
          </ul>
        </details>

        <details class="mt-3 w-full rounded-md">
          <summary class="cursor-pointer font-medium">Annotations</summary>
          <ul class="mt-2 list-none space-y-2 pl-6 text-muted-foreground">
            <li>
              <details class="mt-3 w-full rounded-md" open>
                <summary class="font-medium text-foreground">Types</summary>
                <ul class="mt-1 list-[circle] pl-5 space-y-1">
                  <li><strong>Landmarks</strong> : Single points placed on the surface</li>
                  <li><strong>Distances</strong> : A path made of several landmarks</li>
                  <li><strong>Profiles</strong> : A line between two landmarks that follows the surface</li>
                </ul>
              </details>
            </li>
            <li>
              <details class="mt-3 w-full rounded-md" open>
                <summary class="font-medium text-foreground">Terminology</summary>
                <ul class="mt-1 list-[circle] pl-5 space-y-1">
                  <li><strong>Distance</strong>: the straight 3D distance between the landmarks</li>
                  <li><strong>Length</strong>: the length following the surface along the line</li>
                  <li><strong>Smooth</strong>: to reduce the noise for the profile</li>
                  <li><strong>Smooth profile</strong>: if available, reduces the impact of uniform areas</li>
                </ul>
              </details>
            </li>
            <li>
              <details class="mt-3 w-full rounded-md" open>
                <summary class="font-medium text-foreground">Interactions</summary>
                <ul class="mt-1 list-[circle] pl-5 space-y-2 text-left">
                  <li>
                    <PhMouseLeftClick class="inline h-6 w-6 align-middle" /><span class="text-xs font-bold">x2</span> on
                    a
                    label to rename it
                  </li>
                  <li>
                    <svg width="4" height="4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"
                      class="inline h-5 w-5 ml-1">
                      <path
                        d="M7.49985 0.877045C3.84216 0.877045 0.877014 3.84219 0.877014 7.49988C0.877014 11.1575 3.84216 14.1227 7.49985 14.1227C11.1575 14.1227 14.1227 11.1575 14.1227 7.49988C14.1227 3.84219 11.1575 0.877045 7.49985 0.877045ZM1.82701 7.49988C1.82701 4.36686 4.36683 1.82704 7.49985 1.82704C10.6328 1.82704 13.1727 4.36686 13.1727 7.49988C13.1727 10.6329 10.6328 13.1727 7.49985 13.1727C4.36683 13.1727 1.82701 10.6329 1.82701 7.49988ZM7.49999 9.49999C8.60456 9.49999 9.49999 8.60456 9.49999 7.49999C9.49999 6.39542 8.60456 5.49999 7.49999 5.49999C6.39542 5.49999 5.49999 6.39542 5.49999 7.49999C5.49999 8.60456 6.39542 9.49999 7.49999 9.49999Z"
                        fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                    </svg>
                    to change position of the landmark in the list
                  </li>
                  <li>
                    <span
                      class="inline-block mx-1 h-4 w-4 align-middle bg-brand border border-black dark:border-white rounded-md"></span>
                    to change its color
                  </li>
                  <li>
                    <PhEraser class="inline h-6 w-6 align-middle" /> to clear the landmark list of the distance
                  </li>
                  <li>
                    <PhArrowsDownUp class="inline h-6 w-6 align-middle" /> to switch the direction of the profile
                  </li>
                  <li>
                    <PhEye class="inline h-6 w-6 align-middle" /> to (un)hide
                  </li>
                  <li>
                    <span
                      class="inline-flex items-center justify-center h-6 w-6 align-middle border rounded-lg bg-destructive">
                      <PhX class="h-4 w-4" />
                    </span>
                    to delete
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </details>

        <details class="mt-3 w-fill rounded-md">
          <summary class="w-full min-w-0 text-base font-semibold">Image interactions</summary>
          <ul class="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li class="items-center gap-2 leading-6">
              <span>
                <PhMouseScroll size="24" class="shrink-0 inline" weight="fill" /> Mouse Wheel
              </span>
              <ul class="mt-1 list-[circle] pl-5 space-y-1">
                <li>Zoom in/out on the image.</li>
              </ul>
            </li>
            <br />
            <li>
              <span>
                <PhMouseLeftClick size="24" class="shrink-0 inline" weight="fill" /> Left Click
              </span>
              <ul class="mt-1 list-[circle] pl-5 space-y-1">
                <li>On empty space : drag to pan</li>
                <li>On a landmark : drag to move</li>
              </ul>
            </li>
            <br />
            <li>
              <span>
                <PhMouseRightClick size="24" class="shrink-0 inline" weight="fill" /> Right Click
              </span>
              <ul class="mt-1 list-[circle] pl-5 space-y-1">
                <li>On empty space : adds a landmark</li>
                <li>On an existing landmark : deletes it.</li>
              </ul>
            </li>
          </ul>
        </details>
      </div>
    </CardContent>
  </Card>
</template>