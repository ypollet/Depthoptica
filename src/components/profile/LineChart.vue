<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import * as d3 from 'd3'
import { downloadBlob, Scale, type Coordinates } from 'optica-core'
import { Button } from 'optica-core/ui/button'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuTrigger } from 'optica-core/ui/context-menu'
import { Label } from 'optica-core/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'optica-core/ui/select'
import { SelectScale } from 'optica-core/ui/select-scale'
import { Toggle } from 'optica-core/ui/toggle'
import { DEPTH_UNITS } from '@/config/units'
import type { Profile } from '@/data/models/depth'
import { getRepository } from '@/data/setup'
import { useImagesStore } from '@/lib/stores'

const props = defineProps<{
  profile: Profile
  edgeThresholds?: string[] | null
}>()

const repository = getRepository()
const imagesStore = useImagesStore()

const VERTICAL_SPACING = 20
const HORIZONTAL_SPACING = 30
const GRID_OPACITY = 0.2

const container = useTemplateRef("container")
const svg = useTemplateRef("svg")

function drawChart() {
  let dataSegments = props.profile.subLandmarkSegments
  if (dataSegments.length == 0 || container.value == null) {
    return;
  }
  const svgEl = d3.select(svg.value)
  svgEl.selectAll('*').remove()

  let scaledData = dataSegments.map((segment) => {
    return segment.map((point) => {
      return {
        x: point.x / Scale[imagesStore.annotations!.scale],
        y: point.y / Scale[imagesStore.annotations!.scale]
      }
    })
  })

  const xValues = scaledData.map((segment) => segment.map((point) => point.x)).flat()
  const yValues = scaledData.map((segment) => segment.map((point) => point.y)).flat()
  const minX = xValues.length > 0 ? Math.min(...xValues) : 0
  const maxX = xValues.length > 0 ? Math.max(...xValues) : 1
  const minY = yValues.length > 0 ? Math.min(...yValues) : 0
  const maxY = yValues.length > 0 ? Math.max(...yValues) : 1
  let xRange = maxX - minX
  let yRange = maxY - minY

  // If axises are too disproportionate, make a square chart
  if (xRange < (yRange * 0.05)) {
    xRange = yRange
  }
  if (yRange < (xRange * 0.05)) {
    yRange = xRange
  }

  const margin = { left: 40, top: 20, right: 15, bottom: 7 }

  // size of the grapĥ with the right aspect ratio
  const width = Math.floor(container.value!.clientWidth) - margin.left - margin.right
  const height = width / xRange * yRange

  const paddedWidth = width + margin.left + margin.right
  const paddedHeight = height + margin.bottom + margin.top

  svgEl.attr("width", paddedWidth)
  svgEl.attr("height", paddedHeight)

  const horizontal_ticks = Math.floor(width / HORIZONTAL_SPACING)
  const vertical_ticks = Math.floor(height / VERTICAL_SPACING)

  // Create a rect on top of the svg area: this rectangle recovers mouse position
  svgEl
    .append('rect')
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr('width', paddedWidth)
    .attr('height', paddedHeight)
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseout', mouseout);


  const xScale = d3.scaleLinear()
    .range([margin.left, paddedWidth - margin.right])
    .domain([minX, maxX])

  svgEl.append('g')
    .call(d3.axisBottom(xScale).ticks(horizontal_ticks, "~s"))
    .call(g => g.selectAll(".tick line").clone().lower()
      .attr("stroke-opacity", GRID_OPACITY)
      .attr("y1", -height + margin.top + margin.bottom))
    .attr('transform', `translate(0,${height - margin.bottom})`)



  const yScale = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])
    .domain([minY, maxY])


  svgEl.append('g')
    .call(d3.axisLeft(yScale).ticks(vertical_ticks, "~s"))
    .call(g => g.selectAll(".tick line").clone().lower()
      .attr("stroke-opacity", GRID_OPACITY)
      .attr("x1", width))
    .attr('transform', `translate(${margin.left},0)`)


  const line = d3.line<Coordinates>()
    .x(function (d) {
      return xScale(d.x);
    })
    .y(function (d) {
      return yScale(d.y);
    });

  // Create the circle that travels along the curve of chart
  var focus = svgEl
    .append('g')
    .append('circle')
    .style("fill", "none")
    .attr("stroke", "currentColor")
    .attr('r', 8.5)
    .style("opacity", 0)

  scaledData.forEach((scaledSegment, index) => {
    // Add the line
    svgEl.append("path")
      .datum(scaledSegment)
      .attr("fill", "none")
      .attr("stroke", (index == props.profile.hover_segment) ? "limegreen" : "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);
  })


  function mouseover() {
    focus.style("opacity", 1)
  }

  function mousemove(event: MouseEvent) {
    // Recover X in data-space and interpolate the corresponding Y on the profile.
    const x0 = Math.min(maxX, Math.max(xScale.invert(d3.pointer(event)[0]), minX));
    const y0 = getYAtX(x0, scaledData)

    props.profile.hover_profile = x0 / maxX
    if (y0 === undefined) {

      focus.style("opacity", 0)
      return
    }

    focus
      .style("opacity", 1)
      .attr("cx", xScale(x0))
      .attr("cy", yScale(y0))
    /*
    var i = d3.bisect(scaledData.map(segment => segment.map(d => d.x)).flat(), x0, 0, scaledData.length - 1);
    let selectedData = scaledData[i]!
     selectedData.x / scaledData[scaledData.length - 1]!.x
    focus
      .attr("cx", xScale(selectedData.x))
      .attr("cy", yScale(selectedData.y))
    */
  }
  function mouseout() {
    focus.style("opacity", 0)
    props.profile.hover_profile = undefined
  }

  function getYAtX(x: number, segments: Coordinates[][]): number | undefined {
    for (const segment of segments) {
      if (segment.length === 0) {
        continue
      }

      if (segment.length === 1) {
        if (x === segment[0]!.x) {
          return segment[0]!.y
        }
        continue
      }

      const firstX = segment[0]!.x
      const lastX = segment[segment.length - 1]!.x
      if (x < firstX || x > lastX) {
        continue
      }

      for (let i = 1; i < segment.length; i++) {
        const p1 = segment[i - 1]!
        const p2 = segment[i]!

        if (x < p1.x || x > p2.x) {
          continue
        }

        if (x === p1.x) {
          return p1.y
        }
        if (x === p2.x) {
          return p2.y
        }

        if (p1.x === p2.x) {
          // Vertical segment: choose the midpoint on Y.
          return (p1.y + p2.y) / 2
        }

        const t = (x - p1.x) / (p2.x - p1.x)
        return p1.y + t * (p2.y - p1.y)
      }
    }

    return undefined
  }


  return svgEl.node()
}

function exportSVG() {
  if (svg.value != null) {
    // Clone the SVG element to avoid modifying the displayed chart
    const svgClone = svg.value.cloneNode(true) as SVGSVGElement

    // Add a white background rectangle as the first element
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    bgRect.setAttribute("width", "100%")
    bgRect.setAttribute("height", "100%")
    bgRect.setAttribute("fill", "white")
    svgClone.insertBefore(bgRect, svgClone.firstChild)

    let header = '<?xml version="1.0" encoding="UTF-8"?>'
    var svgData = svgClone.outerHTML;
    let blob: Blob = new Blob([header, svgData], { type: 'image/svg+xml;charset=utf-8;' })
    downloadBlob(blob, imagesStore.objectPath + "-" + props.profile.label.split(' ').join('_') + ".svg")
  }
}

function exportJPG() {
  if (svg.value != null) {
    let horizontal = svg.value.clientWidth >= svg.value.clientHeight

    let ratio = (horizontal) ? svg.value.clientHeight / svg.value.clientWidth : svg.value.clientWidth / svg.value.clientHeight


    let long_side = 1000
    let short_side = long_side * ratio

    let width = (horizontal) ? long_side : short_side
    let height = (horizontal) ? short_side : long_side
    let canvas = new OffscreenCanvas(width, height)

    let ratio_img = (horizontal) ? long_side / svg.value.clientWidth : long_side / svg.value.clientHeight

    let image = new Image()
        let xml = new XMLSerializer().serializeToString(svg.value);
    btoa(xml)
    image.src = "data:image/svg+xml;base64," + btoa(xml)
    image.onload = () => {
      let ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(ratio_img, ratio_img)
      ctx.drawImage(image, 0, 0)
      canvas.convertToBlob({ type: "image/jpeg", quality: 1 }).then((blob) => {
        downloadBlob(blob, imagesStore.objectPath + "-" + props.profile.label.split(' ').join('_') + ".jpg")
      })
    }
  }
}


let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  resizeObserver = new ResizeObserver(() => drawChart())
  if (container.value) {
    resizeObserver.observe(container.value)
  }
  drawChart()
})
onBeforeUnmount(() => resizeObserver?.disconnect())
watch(() => props.profile.subLandmarkSegments, drawChart)
watch(() => props.profile.hover_segment, drawChart)
watch(() => imagesStore.annotations?.scale, drawChart)

// edge threshold or smoothing changed: ask the backend again
async function updateProfile() {
  const result = await repository.computeProfile(imagesStore.objectPath, props.profile)
  if (result) {
    props.profile.setResult(result)
  }
}

</script>

<template>
  <div class="flex flex-col space-y-2">
    <div class="flex flex-row space-x-2 justify-between items-center">
      <div>
        <div v-if="props.edgeThresholds != undefined && props.edgeThresholds.length > 0" class="flex row space-x-1">
          <Label class="content-center">Profile Sampling</Label>
          <Select class="w-fit" v-model="props.profile.edgeThreshold" @update:model-value="updateProfile">
            <SelectTrigger class="w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem class="h-8" value="none">
                  <div class="flex flex-row space-x-2">
                    <span class="content-center">none</span>
                  </div>

                </SelectItem>
                <SelectItem class="h-8" v-for="threshold in props.edgeThresholds" :value="threshold">
                  <div class="flex flex-row space-x-2">
                    <span class="content-center">{{ threshold }}</span>
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Toggle :model-value="props.profile.smooth" @update:model-value="(pressed: boolean) => { props.profile.smooth = pressed; updateProfile() }">Smooth</Toggle>
      </div>
      <SelectScale v-if="imagesStore.annotations" v-model="imagesStore.annotations.scale" :units="DEPTH_UNITS" />
    </div>
    <ContextMenu>
      <ContextMenuTrigger>
        <div ref="container" class="flex grow flex-col w-full h-auto">
          <svg ref="svg"></svg>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>
          Export
        </ContextMenuLabel>
        <ContextMenuItem inset @select="exportSVG">
          SVG
        </ContextMenuItem>
        <ContextMenuItem inset @select="exportJPG">
          JPG
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
    <div class="flex row space-x-1 items-center text-gray-500">
      <Label>! Units converted to their</Label>
      <Button class="p-0" variant="link">
        <a target="_blank" rel="noopener noreferrer" class="text-gray-500 italic"
          href="https://en.wikipedia.org/wiki/Metric_prefix#List_of_SI_prefixes">SI Prefix</a>
      </Button>
    </div>

  </div>
</template>
