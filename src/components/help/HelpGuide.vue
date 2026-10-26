<script setup lang="ts">
import { Card, CardContent } from '@optica/core/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@optica/core/ui/carousel'
import Basics from './Basics.vue';
import Image from './Image.vue';

</script>

<template>
  <Carousel id="carousel" class="h-full w-full max-w-full px-10 ">
    <CarouselContent id="carousel-content" class="flex h-full min-h-full">
      <CarouselItem class="flex h-full min-h-full w-full max-w-full min-w-0">
        <div class="flex h-full w-full flex-1 p-1">
          <Basics/>
        </div>
      </CarouselItem>
      <CarouselItem class="flex h-full min-h-full w-full max-w-full min-w-0">
        <div class="flex h-full w-full flex-1 p-1">
          <Image/>
        </div>
      </CarouselItem>
    </CarouselContent>
    <CarouselPrevious class="-left-0" />
    <CarouselNext class="-right-0" />
  </Carousel>
</template>

<!--
<template>
  <section class="rounded-lg border p-3 text-sm">
    <h3 class="font-semibold text-base">How to use</h3>
    <p class="mt-1 text-muted-foreground">
      Quick guide for creating landmarks, distances, and profiles on the image.
    </p>

    <details class="mt-3 rounded-md border p-2" open>
      <summary class="cursor-pointer font-medium">Basic interactions</summary>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>Use the mouse wheel to zoom in or out.</li>
        <li>Left-click and drag on empty space to pan the image.</li>
        <li>Left-click and drag a point to move it.</li>
        <li>Right-click on an existing point to delete it.</li>
      </ul>
    </details>

    <details class="mt-2 rounded-md border p-2" open>
      <summary class="cursor-pointer font-medium">Add a landmark</summary>
      <ol class="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
        <li>Open the <strong>Landmarks</strong> tab.</li>
        <li>Right-click on the image where you want the landmark.</li>
        <li>Rename it from the list with a double-click on its label if needed.</li>
      </ol>
    </details>

    <details class="mt-2 rounded-md border p-2">
      <summary class="cursor-pointer font-medium">What is a profile?</summary>
      <p class="mt-2 text-muted-foreground">
        A profile is a measured line between two points. The app computes values along this line
        and shows related measurements and chart information.
      </p>
      <ol class="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
        <li>Open the <strong>Profilometer</strong> tab.</li>
        <li>Select <strong>New..</strong> in the profile selector.</li>
        <li>Right-click for the first point, then right-click for the second point.</li>
      </ol>
    </details>

    <details class="mt-2 rounded-md border p-2">
      <summary class="cursor-pointer font-medium">Distance tool</summary>
      <ol class="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
        <li>Open the <strong>Distances</strong> tab.</li>
        <li>Select an existing distance or create a new one.</li>
        <li>Right-click points on the image to define the distance path.</li>
      </ol>
    </details>
  </section>
</template>
-->