<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="header">
    <nav>
      <RouterLink :to="{ name: 'home' }">Home</RouterLink>
      <RouterLink :to="{ name: 'about' }">About</RouterLink>
    </nav>
  </header>

  <div class="container-wrapper">
    <div class="container">
      <RouterView />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
@reference "./assets/main.css";

header {
  @apply border-b fixed top-0 left-0 right-0 h-12 z-10;
}

nav {
  @apply flex justify-end items-center;
}

nav a {
  @apply text-sm p-4;
}

.container-wrapper {
  @apply w-full flex justify-center mt-16;
}

.container {
  @apply p-4;
}
</style>
