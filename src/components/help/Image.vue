<script setup lang="ts">
import { Card, CardContent } from '@optica/core/ui/card';
import { PhMouseLeftClick, PhMouseRightClick, PhMouseScroll } from '@phosphor-icons/vue'

</script>

<template>
    <Card id="card" class="flex h-full min-h-full w-full max-w-full min-w-0 overflow-x-hidden overlow-auto">
        <CardContent
            class="flex flex-col h-full min-h-full min-w-0 flex-1 space-y-5 items-start justify-start overflow-x-hidden overflow-y-auto p-6">
            <h4 class="w-full min-w-0 text-base font-semibold">Interact with the image</h4>
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
                        <li>Drag on empty space to pan,</li>
                        <li>Drag a landmark to move it.</li>
                    </ul>
                </li>
                <br />
                <li>
                    <span>
                        <PhMouseRightClick size="24" class="shrink-0 inline" weight="fill" /> Right Click
                    </span>
                    <ul class="mt-1 list-[circle] pl-5 space-y-1">
                        <li>Click on empty space to add a landmark,</li>
                        <li>Click on an existing landmark to delete it.</li>
                    </ul>
                </li>
            </ul>
        </CardContent>
    </Card>
</template>