import dummy from './dummy.json'
import { promiseTimeout } from '@vueuse/core'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event)

  // simulasi internet lambat
  await promiseTimeout(1000)

  // eslint-disable-next-line unicorn/no-null
  return dummy.filter((item) => item.parent_id === (id ? Number(id) : null))
})
