<script setup lang="ts">
import { batch2Names, batch3Names, batch4Names, batch5Names } from '@/data/members.ts'
import { getChannelTitles } from '@/data/channels.ts'
import TagList from '@/components/TagList.vue'

const batches = [
  {
    title: '2期生',
    memberNames: batch2Names,
  },
  {
    title: '3期生',
    memberNames: batch3Names,
  },
  {
    title: '4期生',
    memberNames: batch4Names,
  },
  {
    title: '5期生',
    memberNames: batch5Names,
  },
]
</script>

<template>
  <div class="">
    <h2 class="text-center">フィルタ</h2>
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
    </ul>
  </div>
</template>

<style lang="postcss" scoped>
@reference "../assets/main.css";

h4 {
  @apply mt-2 ml-2;
}

div > ul > li {
  @apply mt-4 p-1 pb-2 border-1 border-dashed border-primary-color;
}
</style>
