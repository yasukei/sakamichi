<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()

const appTitle = __APP_TITLE__
</script>

<template>
  <Teleport to="title"> {{ title }} - {{ appTitle }} </Teleport>
</template>
