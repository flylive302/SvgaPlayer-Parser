<template>
    <div>
        <h1>This is the Parser</h1>

        <NuxtLink
            style="background: cadetblue; border-radius: .3rem; padding: .5rem 1rem;color: white"
            to="/"
        >
            Player
        </NuxtLink>
        <br><br>

        <br>
        <br>
        <hr>
        <br>
    </div>
</template>
<script setup lang="ts">
import {useSvgaParser} from "~/composables/useSvgaParser";

const outPutFilenameA = 'slide';
const outPutFilenameB = 'card';

const assetA = '/svga/vip/2/slide2.svga';
const assetB = '/svga/vip/2/vip2.svga';
const parsedSvga = ref({});

onMounted(async () => {
    parsedSvga.value = await useSvgaParser(assetA, outPutFilenameA);
    parsedSvga.value = await useSvgaParser(assetB, outPutFilenameB);
})
</script>