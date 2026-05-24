# Environment & Lighting

Consistent world-building through fog and high-intensity directional lighting.

```TS
// Scene and Fog Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd7c1a0);
scene.fog = new THREE.Fog(0xd7c1a0, 0, 300); // Matches camera far plane

// Lighting Configuration
const setupLighting = (scene) => {
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  
  sun.position.set(-20, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); // High-res shadows
  
  scene.add(ambient, sun);
}
```