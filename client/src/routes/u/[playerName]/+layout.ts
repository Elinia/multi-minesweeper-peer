import type { LayoutLoad } from './$types'

export const load = (({ params }) => {
  return params
}) satisfies LayoutLoad
