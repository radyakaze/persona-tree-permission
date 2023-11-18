<script setup lang="ts" generic="T extends Record<string, any>">
import type { UnwrapRef } from 'vue'
defineOptions({ name: 'Tree' })

const props = defineProps({
  modelValue: {
    type   : Array as PropType<Array<string | number>>,
    default: () => [],
  },
  title: {
    type   : [String, Array] as PropType<string | string[]>,
    default: undefined,
  },
  index: {
    type   : Number,
    default: 0,
  },
  options: {
    type   : Array as PropType<T[]>,
    default: () => [],
  },
  optionAttribute: {
    type   : String,
    default: undefined,
  },
  valueAttribute: {
    type   : String,
    default: undefined,
  },
  node: {
    type   : Array as PropType<string[]>,
    default: () => [],
  },
  onFetch: {
    type   : Function as PropType<(params?: T) => Promise<T[]>>,
    default: undefined,
  },
})

const children = ref<T[]>([])

const emits = defineEmits([
  'update:modelValue',
  'update:options',
  'fetch',
])

const model   = useVModel(props, 'modelValue', emits)
const options = useVModel(props, 'options', emits)

// selected node
const selectedNode = ref<string[]>([])

const isLoading = ref(false)

const removeDuplicateArray = (item: Array<string | number>) => [...new Set(item)]

const getValue = (option: T) => {
  if (props.valueAttribute)
    return option[props.valueAttribute]

  return option
}

const getLabel = (option: T) => {
  if (props.optionAttribute)
    return option[props.optionAttribute]

  return option
}

const treeTitle = computed(() => {
  if (typeof props.title === 'string') return props.title

  if (Array.isArray(props.title)) return props.title[props.index]
})

// FIXME: need perfomance improvement
const addDataToChild = (arr: T[], id: string | number, children: T[]) => {
  for (const i of arr) {
    if (getValue(i) === id) {
      // @ts-expect-error dynamic assignment
      i.children = [...(i.children || []), ...children]
    } else
      addDataToChild(i.children || [], id, children)
  }
}

const onOpenChildren = async (item: T) => {
  if (!item.has_children) return

  selectedNode.value = [...props.node, getValue(item)]

  if (item.children) {
    selectAllChildren(item, item.children)

    children.value = item.children

    return
  }

  if (props.onFetch) {
    isLoading.value = true
    children.value  = await props.onFetch(item) as UnwrapRef<T[]>

    selectAllChildren(item, children.value)

    // cache children
    addDataToChild(options.value, getValue(item), children.value)

    isLoading.value = false
  }
}

const selectAllChildren = (item: T, children: T[]) => {
  if (model.value.includes(getValue(item)))
    model.value = removeDuplicateArray([...model.value, ...children.map((element) => getValue(element))])
}

const items = computed(() => {
  if (props.valueAttribute) return props.options.map((option) => option[props.valueAttribute as string])

  return props.options
})

const onCheckbox = (value: boolean, item: T) => {
  let childrenValues: Array<string | number> = []

  const itemValue = getValue(item)

  if (item.children)
    childrenValues = item.children.map((element: T) => getValue(element))

  if (value || checkIndeterminate(item)) {
    model.value = removeDuplicateArray([
      ...model.value,
      ...childrenValues,
      itemValue,
    ])

    return
  }

  model.value = model.value.filter((selected) => !childrenValues.includes(selected) && selected !== itemValue)
}

const isSelectedAll  = computed(() => items.value.every((selected) => model.value.includes(selected)))
const isNoneSelected = computed(() => !items.value.some((selected) => model.value.includes(selected)))

watch(isSelectedAll, (value) => {
  if (value && props.node.length > 0 && props.node.at(-1)) {
    const lastNode = props.node.at(-1) as string | number

    model.value = removeDuplicateArray([...model.value, lastNode])
  }
})

watch(isNoneSelected, (value) => {
  if (value && props.node.length > 0 && props.node.at(-1)) {
    const lastNode = props.node.at(-1) as string | number

    model.value = model.value.filter((selected) => selected !== lastNode)
  }
})

const toggleSelectAll = () => {
  if (isSelectedAll.value) {
    model.value = model.value.filter((selected) => !items.value.includes(selected))

    return
  }

  model.value = removeDuplicateArray([...model.value, ...items.value])
}

const checkIndeterminate = (item: T) => {
  if (item.children) {
    const childrenValues = item.children.map((element: T) => getValue(element))

    return model.value.some((selected) => childrenValues.includes(selected))
      && !childrenValues.every((selected) => model.value.includes(selected))
  }
}
</script>

<template>
  <div
    v-if="options.length > 0"
    class="w-80 h-[500px] overflow-y-auto">
    <div class="flex justify-between p-3 mb-2">
      <div class="font-semibold text-gray-55">
        {{ treeTitle }}
      </div>
      <div
        class="text-sm text-red-30 cursor-pointer"
        @click="toggleSelectAll">
        {{ isSelectedAll ? 'Deselect All' : 'Select All' }}
      </div>
    </div>
    <p-list-group flush>
      <p-list-group-item
        v-for="item in options"
        :key="`item-${item.id}`"
        v-memo="[item, model]"
        :class="['hover:bg-subtle', { 'cursor-pointer': item.has_children }]"
        @click="onOpenChildren(item)">
        <span class="flex items-center justify-between">
          <span @click.stop.prevent>
            <p-checkbox
              v-model="model"
              :value="getValue(item)"
              :indeterminate="checkIndeterminate(item)"
              @change="($event) => onCheckbox($event, item)">
              {{ getLabel(item) }}
            </p-checkbox>
          </span>
          <pi-chevron-right-16 v-if="item.has_children" />
        </span>
      </p-list-group-item>
    </p-list-group>
  </div>

  <div
    v-if="isLoading"
    class="w-80 h-[250px] flex flex-col gap-4 justify-center items-center">
    <pi-refresh-32 class="animate-spin" />
    <div class="text-xl font-semibold">
      Loading
    </div>
  </div>
  <Tree
    v-if="children.length > 0 && !isLoading"
    v-model="model"
    v-model:options="children"
    :node="selectedNode"
    :title="title"
    :index="index + 1"
    :option-attribute="optionAttribute"
    :value-attribute="valueAttribute"
    @fetch="onFetch" />
</template>
