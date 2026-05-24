# World Geometry (Plane & Displacement)

Heavy use of displacement maps for terrain and tiling textures for roads.

```TS
// Ground with Height Displacement
const geometry = new THREE.PlaneGeometry(width, height, 512, 512);
const material = new THREE.MeshStandardMaterial({
  map: texture,
  displacementMap: displacementMap, 
  displacementScale: 5,
  roughness: 0.8,
});

// Road with Repeat Wrapping
const roadTexture = new THREE.TextureLoader().load("./path/to/road.jpg");
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 50); // Repeat along the length
```