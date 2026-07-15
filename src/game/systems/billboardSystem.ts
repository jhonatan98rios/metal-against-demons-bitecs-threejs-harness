import { query, World } from 'bitecs'
import * as THREE from 'three'
import { Billboard } from '../core/shared/components/Billboard'
import { Active } from '../core/shared/components/Active'
import { Position } from '../core/shared/components/Position'

export const createBillboardSystem = (
  world: World,
  camera: THREE.PerspectiveCamera,
  renderObjects: Map<number, THREE.Object3D>
) => {
  return {
    update() {
      const entities = query(world, [Billboard, Active, Position])
      const camPos = camera.position

      for (const eid of entities) {
        if (Active.isActive[eid] === 0) continue

        const obj = renderObjects.get(eid)
        if (!obj) continue

        // cylindrical billboard: rotate around Y to face camera
        obj.lookAt(camPos.x, Position.y[eid], camPos.z)
      }
    }
  }
}
