import { activitiesNotes } from './activities'
import { activityNotes } from './activity'
import { homeNotes } from './home'
import { newNotes } from './new'
import { profileNotes } from './profile'
import type { NotesMap } from './types'

export const NOTES: NotesMap = {
  ...homeNotes,
  ...activitiesNotes,
  ...activityNotes,
  ...newNotes,
  ...profileNotes,
}

export type { ScreenNote } from './types'
