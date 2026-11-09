export type ChangeMarker = {
  id: string
  at: number
  label: string
  project: string | null
  createdAt: number
}

export type NewChangeMarker = Pick<ChangeMarker, 'at' | 'label' | 'project'>
