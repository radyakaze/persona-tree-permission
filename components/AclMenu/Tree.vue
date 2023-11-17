<script setup lang="ts" generic="T extends Record<string, any>">
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
    type   : String,
    default: undefined,
  },
  onFetch: {
    type   : Function as PropType<(params?: T) => Promise<T[]>>,
    default: undefined,
  },
})

const children = ref([])

const emits = defineEmits([
  'update:modelValue',
  'update:options',
  'fetch',
])

const model   = useVModel(props, 'modelValue', emits)
const options = useVModel(props, 'options', emits)

// selected node
const selectedNode = ref(undefined)

const isLoading = ref(false)

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
  if (Array.isArray(props.title)) return props.title[props.index]

  if (typeof props.title === 'string') return props.title

  return ''
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

const onClick = async (item: T) => {
  selectedNode.value = props.node ? `${props.node}.${getValue(item)}` : getValue(item)

  if (!item.has_children) return

  if (item.children) {
    selectAllChildren(item, item.children)

    children.value = item.children

    return
  }

  if (props.onFetch) {
    isLoading.value = true
    children.value  = await props.onFetch(item) as any

    selectAllChildren(item, children.value)

    // cache children
    addDataToChild(options.value, getValue(item), children.value)

    isLoading.value = false
  }
}

const selectAllChildren = (item: T, children: T[]) => {
  if (model.value.includes(getValue(item)))
    model.value = [...model.value, ...children.map((element) => getValue(element))]
}

const items = computed(() => {
  if (props.valueAttribute) return props.options.map((option) => option[props.valueAttribute as string])

  return props.options
})

const canSelectAll = computed(() => {
  return !items.value.every((selected) => model.value.includes(selected))
})

const onSelectAll = () => {
  emits('update:modelValue', [...model.value, ...items.value])
}

const onCheckbox = (value: boolean, item: T) => {
  let childrenValues: Array<string | number> = []

  const itemValue = getValue(item)

  if (item.children)
    childrenValues = item.children.map((element: T) => getValue(element))

  if (value) {
    model.value = [
      ...model.value,
      ...childrenValues,
      itemValue,
    ]

    return
  }

  model.value = model.value.filter((selected) => !childrenValues.includes(selected) && selected !== itemValue)
}
</script>

<template>
  <div class="w-80 h-[500px] overflow-y-auto">
    <div class="flex justify-between p-3 mb-2">
      <div class="font-semibold text-gray-55">
        {{ treeTitle }} {{ node }}
      </div>
      <div
        v-if="canSelectAll"
        class="text-sm text-red-30 cursor-pointer"
        @click="onSelectAll">
        Select All
      </div>
    </div>
    <p-list-group flush>
      <p-list-group-item
        v-for="item in options"
        :key="`item-${item.id}`"
        v-memo="[item, model]"
        :class="['hover:bg-subtle', { 'cursor-pointer': item.has_children }]"
        @click="onClick(item)">
        <span class="flex items-center justify-between">
          <span @click.stop.prevent>
            <p-checkbox
              v-model="model"
              :value="getValue(item)"
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
  <AclMenuTree
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