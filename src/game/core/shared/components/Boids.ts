/**
 * Boids component for BitECS.
 * Per-entity boids algorithm parameters controlling flocking behavior.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * @property {Float32Array} maxSpeed - Maximum movement speed (world units/sec)
 * @property {Float32Array} perceptionRadius - Max distance to detect neighbors
 * @property {Float32Array} separationRadius - Distance threshold for separation push
 * @property {Float32Array} separationWeight - Strength of separation force
 * @property {Float32Array} alignmentWeight - Strength of alignment force
 * @property {Float32Array} cohesionWeight - Strength of cohesion force
 * @property {Float32Array} pursuitWeight - Strength of player-pursuit force
 */
import { MAX_ENTITIES, sab } from '../constants'

export const Boids = {
  maxSpeed: sab.f32(MAX_ENTITIES),
  perceptionRadius: sab.f32(MAX_ENTITIES),
  separationRadius: sab.f32(MAX_ENTITIES),
  separationWeight: sab.f32(MAX_ENTITIES),
  alignmentWeight: sab.f32(MAX_ENTITIES),
  cohesionWeight: sab.f32(MAX_ENTITIES),
  pursuitWeight: sab.f32(MAX_ENTITIES)
}

export const BOIDS_DEFAULTS = {
  MAX_SPEED: 15,
  PERCEPTION_RADIUS: 8,
  SEPARATION_RADIUS: 30,
  SEPARATION_WEIGHT: 3,
  ALIGNMENT_WEIGHT: 1.0,
  COHESION_WEIGHT: 1.0,
  PURSUIT_WEIGHT: 2.0
} as const
