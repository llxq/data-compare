<script setup lang="ts">
// import Test from './components/test.vue'
import { useSpeedCreateCompareNode } from './hooks/useSpeedCreateCompareNode'
const { compareTree1, compareTree2, compareResult } = useSpeedCreateCompareNode()

</script>

<template>
    <div>
        {{ compareTree1 }}
        {{ compareTree2 }}
        {{ compareResult }}
    </div>
    <Test class="123"></Test>
</template>

<style scoped>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}

.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
