import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSelectedTagsStore = defineStore('selectedTags', () => {
  const selectedTags = ref(new Set<string>())
  function selectTag(tag: string) {
    selectedTags.value.add(tag)
  }
  function unselectTag(tag: string) {
    selectedTags.value.delete(tag)
  }
  function clear() {
    selectedTags.value.clear()
  }

  return { selectedTags, selectTag, unselectTag, clear }
})
