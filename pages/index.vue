<template>
    <div>
        <h1>This is the Player</h1>
        <NuxtLink
            style="background: cadetblue; border-radius: .3rem; padding: .5rem 1rem;color: white"
            to="/parser"
        >
            Parser
        </NuxtLink>
        <br>
        <br>

        <SvgaPlayer name="frame_2" width="auto" height="auto" :loop="0" />
    </div>
</template>
<script setup lang="ts">
import SvgaPlayer from "~/components/common/SvgaPlayer.vue";
</script>