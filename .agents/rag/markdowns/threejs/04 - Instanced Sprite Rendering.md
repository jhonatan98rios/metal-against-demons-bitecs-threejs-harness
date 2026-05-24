# Instanced Sprite Rendering

For high-performance entity rendering, use InstancedMesh. This avoids the overhead of creating thousands of individual mesh objects.

```TS
// Create a mesh capable of drawing N instances of one frame
const mesh = new THREE.InstancedMesh(spriteGeometry, material, maxCount);
mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

const dummy = new THREE.Object3D();

// Update loop for instances
const updateInstances = (entities, camera) => {
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    
    dummy.position.set(Position.x[eid], 4, Position.z[eid]);
    
    // Flip sprite based on movement direction
    const flip = Velocity.x[eid] > 0 ? 1 : -1;
    dummy.scale.set(flip, 1, 1);
    
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
};
```