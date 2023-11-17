import dummy from './dummy.json'
import { promiseTimeout } from '@vueuse/core'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event)

  // simulasi internet lambat
  await promiseTimeout(2000)

  if (id)
    return dummy.filter((item) => item.parent_id === Number(id))

  return dummy.filter((item) => item.parent_id === null)
})
