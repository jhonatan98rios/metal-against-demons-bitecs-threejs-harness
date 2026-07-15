import { MAX_ENTITIES, sab } from '../constants'

/** 0 = top-down follow, 1 = first-person */
export const CameraMode = {
  mode: sab.u8(MAX_ENTITIES)
}
