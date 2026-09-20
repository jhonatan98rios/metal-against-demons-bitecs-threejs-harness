import * as THREE from 'three'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

// Same damage intensity (hitTimer / 0.15) as the top-down sprite glow, but painted
// onto the screen edges instead of a visible sprite — FPS has no self-sprite in view,
// so the feedback must ride the camera buffer.
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`

const FRAG = /* glsl */ `
  uniform sampler2D tDiffuse; // read buffer, wired by ShaderPass
  uniform float uDamage;      // 0..1, mirrors HitEffect.timer / 0.15
  uniform vec3  uColor;       // red tint blended into the edges
  uniform float uMix;         // edge strength 0..1

  varying vec2 vUv;

  void main() {
    vec4 c = texture2D( tDiffuse, vUv );
    float dist = length( ( vUv - vec2( 0.5 ) ) * 2.0 );
    float edge = smoothstep( 0.6, 1.0, dist ); // corners dark, center clear
    // ponytail: lerp toward red — subtracting red would leave the edges cyan/green
    gl_FragColor = vec4( mix( c.rgb, uColor, uDamage * uMix * edge ), c.a );
  }
`

export function createDamageVignette(): ShaderPass {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uDamage: { value: 0 },
      uColor: { value: new THREE.Color(0xff2200) },
      uMix: { value: 0.65 }
    },
    vertexShader: VERT,
    fragmentShader: FRAG
  })
}
