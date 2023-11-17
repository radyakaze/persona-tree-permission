<script setup lang="ts" generic="T extends Record<string, any>">
import Tree from './Tree.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: Array<string | number>,
    title?: string | string[],
    optionAttribute?: string,
    valueAttribute?: string,
    onFetch?:(params?: T) => T[] | Promise<T[]>,
  }>(),
  {
    modelValue     : () => [],
    title          : undefined,
    optionAttribute: undefined,
    valueAttribute : undefined,
    onFetch        : undefined,
  },
)

// eslint-disable-next-line func-call-spacing
const emits = defineEmits<{
  (e: 'update:modelValue', value: Array<string | number>): void,
  (e: 'fetch', option?: Record<string, any>): Record<string, any>,
}>()

const model = useVModel(props, 'modelValue', emits)

const options = ref<T[]>([])

const allItems = computed<string[]>(() => {
  return getValues(options.value)
})

const getValue = (option: T) => {
  if (props.valueAttribute)
    return option[props.valueAttribute]

  return option
}

const permitAll = computed({
  get: () => allItems.value.every((selected) => model.value.includes(selected)),
  set: (value) => {
    model.value = value ? allItems.value : []
  },
})

const getValues = (data: T[] | undefined) => {
  if (!data) return []

  return data.flatMap((d) => [getValue(d), ...getValues(d.children)])
}

onMounted(async () => {
  if (props.onFetch && typeof props.onFetch === 'function')
    options.value = await props.onFetch() as any
})
</script>

<template>
  <div class="flex justify-between gap-4 items-center mb-6">
    <div>
      <div class="font-bold">
        Access
      </div>
      <div class="text-sm text-subtle">
        Select the menu that the user can access on the dashboard
      </div>
    </div>
    <div
      class="text-subtle">
      <p-toggle
        v-model="permitAll"
        variant="pill"
        no-label>
        {{ permitAll ? 'Revoke All' : 'Permit All' }}
      </p-toggle>
    </div>
  </div>
  <div class="flex">
    <Tree
      v-model="model"
      v-model:options="options"
      :title="title"
      :option-attribute="optionAttribute"
      :value-attribute="valueAttribute"
      @fetch="onFetch" />
  </div>
</template>
