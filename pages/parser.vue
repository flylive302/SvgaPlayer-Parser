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
import SvgaPlayer from "~/components/common/SvgaPlayer.vue";

const outPutFilename = '7';

const asset = '/svga/7.svga';
const parsedSvga = ref({});

onMounted(async () => {
    parsedSvga.value = await useSvgaParser(asset, outPutFilename);
})
</script>