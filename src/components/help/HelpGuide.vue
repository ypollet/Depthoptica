<script setup lang="ts">
import { PhArrowsDownUp, PhMouseRightClick } from '@phosphor-icons/vue'
import {
  DrawingHelp, HelpGuide, HelpSection, ManagingHelp, MeasuresHelp, MenusHelp, NavigationHelp,
} from 'optica-core/ui/help-guide'
</script>

<template>
  <HelpGuide app-name="Depthoptica">
    <template #about>
      <p>Depthoptica shows a sharp, high-resolution image of a specimen together with its heightmap: the height of the
        surface at every pixel, computed from a focus stack or captured directly by a 3D device (e.g. a
        structured-light scanner).</p>
      <p>Measurements placed on the image take the relief into account: distances are measured in 3D, and profiles show
        the shape of the surface along a line.</p>
    </template>

    <NavigationHelp/>

    <HelpSection title="How it works">
      <li>
        An acquisition is one image with its heightmap and its own annotations, it is chosen above the tabs of the
        sidebar
      </li>
      <li>The heightmap stores the height of every pixel</li>
      <li>
        When a landmark is placed, Depthoptica computes its 3D position <strong>(X; Y; Z)</strong>:
        <ul class="mt-1 list-[circle] pl-5 space-y-1">
          <li><strong>X</strong> and <strong>Y</strong>: the pixel position, scaled by the pixel spacing of the image
          </li>
          <li><strong>Z</strong>: the heightmap value, scaled to the depth range of the acquisition</li>
        </ul>
      </li>
    </HelpSection>

    <DrawingHelp>
      <template #types>
        <li>
          <strong>Profiles</strong>: a line between two ends that follows the surface, placing a third end replaces
          the first one
        </li>
      </template>
    </DrawingHelp>

    <ManagingHelp>
      <li>
        <PhArrowsDownUp class="inline h-5 w-5 align-text-bottom" /> swaps the ends of a profile
      </li>
    </ManagingHelp>

    <MeasuresHelp>
      <template #intro>
        <li>All values are in 3D: they include the height of the surface</li>
      </template>
      <template #distance>
        <li><strong>Length</strong> (profiles): the length following the surface along the line</li>
      </template>
    </MeasuresHelp>

    <HelpSection title="Profilometer">
      <li>The selected profile shows the height of the surface along the line in a chart</li>
      <li>
        <strong>Profile Sampling</strong> (if available): only uses the points on visible details (edges) of the image,
        where the heightmap is the most reliable. A higher threshold keeps fewer but more reliable points
      </li>
      <li><strong>Smooth</strong>: reduces the noise of the profile</li>
      <li>
        <strong>Segments</strong>: an acquisition can come with a mask, the areas of the image without valid height
        (e.g. the background around the specimen, or parts that need to be ignored). A profile crossing the mask is cut into segments: the masked parts
        are left out of the chart and each segment gets its own length
      </li>
      <li>Hovering the length of a segment highlights it in the chart</li>
      <li>
        <PhMouseRightClick class="inline h-5 w-5 align-text-bottom" weight="fill" /> Right Click on the chart: exports
        it (SVG or JPG)
      </li>
    </HelpSection>

    <MenusHelp />
  </HelpGuide>
</template>
