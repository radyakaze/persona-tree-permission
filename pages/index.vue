<script setup lang="ts">
const selected = ref<string[]>([])

const fetcher = async (option?: Record<string, any>) => {
  return await $fetch('/api/demo-tree', { params: { id: option?.id } })
}
</script>

<template>
  <div class="p-6">
    <acl-menu
      v-model="selected"
      :title="['MENU', 'SUB-MENU', 'ACTION']"
      value-attribute="value"
      option-attribute="label"
      @fetch="fetcher" />
  </div>

  <pre>{{ selected }}</pre>
</template>
