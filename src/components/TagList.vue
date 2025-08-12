<script setup lang="ts">
import { useSelectedTagsStore } from '@/stores/selectedTags'

interface Props {
  tags: string[]
  canClick: boolean
}
const props = defineProps<Props>()

const selectedTagsStore = useSelectedTagsStore()

const onClick = (tag: string) => {
  if (!props.canClick) {
    return
  }

  if (selectedTagsStore.selectedTags.has(tag)) {
    selectedTagsStore.unselectTag(tag)
  } else {
    selectedTagsStore.selectTag(tag)
  }
}

const getClass = (tag: string) => {
  let s = 'tag'
  if (selectedTagsStore.selectedTags.has(tag)) {
    s += ' tag-on'
  } else {
    s += ' tag-off'
  }
  if (props.canClick) {
    s += ' hover:cursor-pointer'
  }
  return s
}
</script>

<template>
  <ul>
    <template v-for="tag in tags" :key="tag">
      <li @click="onClick(tag)" :class="getClass(tag)">
        {{ tag }}
      </li>
    </template>
  </ul>
</template>

<style lang="postcss" scoped>
@reference "../assets/main.css";

.tag {
  @apply text-sm p-1 mt-2 ml-2 inline-block rounded-sm;
}

.tag-on {
  @apply text-white bg-primary-color hover:bg-primary-hover-color;
}

.tag-off {
  @apply text-gray-500 border hover:text-gray-950 border-primary-color;
}
</style>
