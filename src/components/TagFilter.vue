<script setup lang="ts">
import { getXbatchNames } from '@/data/members.ts'
import { getChannelTitles } from '@/data/channels.ts'
import TagList from '@/components/TagList.vue'
import { useSelectedTagsStore } from '@/stores/selectedTags.ts'

const { clear } = useSelectedTagsStore()

const batches = [
  {
    title: '2期生',
    memberNames: getXbatchNames(2, false),
  },
  {
    title: '3期生',
    memberNames: getXbatchNames(3, false),
  },
  {
    title: '4期生',
    memberNames: getXbatchNames(4, false),
  },
  {
    title: '5期生',
    memberNames: getXbatchNames(5, false),
  },
]
const batchesGraduated = [
  {
    title: '1期生',
    memberNames: getXbatchNames(1, true),
  },
  {
    title: '2期生',
    memberNames: getXbatchNames(2, true),
  },
  // {
  //   title: '3期生',
  //   memberNames: getXbatchNames(3, true),
  // },
  {
    title: '4期生',
    memberNames: getXbatchNames(4, true),
  },
]
const others = ['未分類']
</script>

<template>
  <div class="">
    <h2 class="text-center">フィルタ<button class="clear-btn" @click="clear">（解除）</button></h2>
    <ul>
      <li>
        <h3>チャンネル</h3>
        <TagList :tags="getChannelTitles()" :canClick="true" />
      </li>
      <li>
        <h3>メンバー</h3>
        <ul>
          <li v-for="batch in batches" :key="batch.title">
            <h4>{{ batch.title }}</h4>
            <TagList :tags="batch.memberNames" :canClick="true" />
          </li>
        </ul>
      </li>
      <li>
        <h3>卒業メンバー</h3>
        <ul>
          <li v-for="batch in batchesGraduated" :key="batch.title">
            <h4>{{ batch.title }}</h4>
            <TagList :tags="batch.memberNames" :canClick="true" />
          </li>
        </ul>
      </li>
      <li>
        <h3>その他</h3>
        <TagList :tags="others" :canClick="true" />
      </li>
    </ul>
  </div>
</template>

<style lang="postcss" scoped>
@reference "../assets/main.css";

.clear-btn {
  @apply text-sm;
}

h4 {
  @apply mt-2 ml-2;
}

div > ul > li {
  @apply mt-4 p-1 pb-2 border-1 border-dashed border-primary-color;
}
</style>
