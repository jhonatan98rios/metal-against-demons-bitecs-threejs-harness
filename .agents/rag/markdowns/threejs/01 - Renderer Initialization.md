# Renderer Initialization

The renderer uses the modern WebGPU backend. It must be initialized asynchronously before the game loop starts.

```JavaScript
import WebGPURenderer from "three/examples/jsm/renderers/webgpu/WebGPURenderer.js";

// Initialize the WebGPU-based renderer
export async function createRenderer() {
  const renderer = new WebGPURenderer({ antialias: true });

  // Critical: Wait for GPU device initialization
  await renderer.init();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // Enables PCF shadows

  document.body.appendChild(renderer.domElement);
  return renderer;
}
```
