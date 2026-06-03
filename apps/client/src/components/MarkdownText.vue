<template>
  <!-- eslint-disable-next-line vue/no-v-html -- markdown-it runs with html:false, so the output is safe -->
  <div class="md-content" v-html="rendered"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown } from '../utils/markdown';

const props = defineProps<{ text: string }>();

const rendered = computed(() => renderMarkdown(props.text));
</script>
