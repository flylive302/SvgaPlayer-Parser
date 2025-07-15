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

const outPutFilename = 'slide5';

const asset = '/svga/slide5.svga';
const parsedSvga = ref({});

onMounted(async () => {
    parsedSvga.value = await useSvgaParser(asset, outPutFilename);
})
</script>