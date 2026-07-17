import * as THREE from 'three'

import { setupWorld } from './core/bootstrap/setup'
import { setupApparition } from './core/enemies/entity'
import { createEnemyPool } from './core/enemies/pool/enemyPool'
import { createBoidsSystem } from './core/enemies/systems/boidsSystem'
import { createEnemyDeathSystem } from './core/enemies/systems/deathSystem'
import { createPlayerDamageSystem } from './core/enemies/systems/playerDamageSystem'
import { createPlayerDeathSystem } from './core/player/deathSystem'
import { createCharacterController } from './gameplay/characterController'
import { createInput } from './gameplay/input'
import { createVirtualJoystick } from './gameplay/virtualJoystick'
import { createCameraTouchController } from './gameplay/cameraTouchController'
import { createWorkerPool } from './systems/createWorkerPool'
import { createRender } from './rendering/createRender'
import {
  createRenderSystem,
  renderObjects
} from './rendering/createRenderSystem'
import { createCameraSystem } from './systems/cameraSystem'
import { createBillboardSystem } from './systems/billboardSystem'
import { createCameraSwitcher } from './ui/cameraSwitcher'
import { createLevelUpSystem } from './core/player/levelUpSystem'
import { PlayerHUD } from './ui/PlayerHUD'
import { Health } from './core/shared/components/Health'
import { Position } from './core/shared/components/Position'
import { GameState, STATES } from './core/shared/components/GameState'
import { XP } from './core/shared/components/XP'
import { createGameStateSystem } from './systems/gameStateSystem'
import { createScenario, SCENARIOS } from './scenarios/createScenario'
import { createSkillManager } from './core/skills/manager'
import { SKILL_ID } from './core/skills/skillIds'
import './core/skills/definitions/projectile'

function spawnEnemies(pool: ReturnType<typeof createEnemyPool>) {
  Array.from({ length: 100 }, () => {
    const eid = pool.acquire()
    setupApparition(
      eid,
      -75 + Math.random() * 150,
      -60 + Math.random() * 120,
      Math.random() > 0.5
    )
  })
}

type GameSystems = ReturnType<typeof createGameSystems>
type RenderCtx = ReturnType<typeof createRender>

function createGameLoop(
  systems: GameSystems,
  world: ReturnType<typeof setupWorld>,
  renderCtx: RenderCtx,
  hud: PlayerHUD | null
) {
  const delta = { last: performance.now(), current: 0 }
  const { renderer, scene, camera } = renderCtx
  const { stateEid, playerEid } = world

  return function loop() {
    const now = performance.now()
    delta.current = Math.min(0.1, (now - delta.last) / 1000)
    delta.last = now

    systems.gameState.update()

    if (GameState.status[stateEid] === STATES.PLAYING) {
      systems.controller.update(delta.current)
      systems.boids.update()
      systems.skillManager.update(delta.current)
      systems.animation.update(delta.current)
      systems.playerDamage.update(delta.current)
      systems.death.update()
      systems.playerDeath.update()
      systems.levelUp.update()
    }

    systems.render(delta.current)
    systems.camera.update()
    systems.billboard.update()

    if (hud) {
      hud.update({
        hp: Health.current[playerEid],
        hpMax: Health.max[playerEid],
        xp: XP.current[playerEid],
        xpNext: XP.next[playerEid],
        level: XP.level[playerEid],
        state: GameState.status[
          stateEid
        ] as (typeof STATES)[keyof typeof STATES]
      })
    }

    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
}

function createHUD(
  gameState: ReturnType<typeof createGameStateSystem>,
  skillManager: ReturnType<typeof createSkillManager>
): PlayerHUD | null {
  const container = document.querySelector('#hud-container')
  if (!container) return null

  // ponytail: store options in closure so callback uses the SAME options shown to player
  // eslint-disable-next-line functional/no-let
  let currentOptions: ReturnType<typeof skillManager.getUpgradeOptions> = []

  return new PlayerHUD(
    container as HTMLElement,
    () => gameState.togglePause(),
    () => {
      currentOptions = skillManager.getUpgradeOptions()
      return currentOptions
    },
    (index) => {
      if (index >= 0 && index < currentOptions.length) {
        skillManager.applyUpgradeChoice(currentOptions[index])
      }
      gameState.resumeFromLevelUp()
    }
  )
}

export function start() {
  const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement
  if (!canvas || typeof window === 'undefined') return

  const world = setupWorld()
  const renderCtx = createRender(canvas)
  const input = createInput()

  createScenario(renderCtx.scene, SCENARIOS.LEVEL1)
  const enemyPool = createEnemyPool(world, 100)
  spawnEnemies(enemyPool)

  const gameState = createGameStateSystem(
    world,
    () => input.consumePressed('escape'),
    () => input.consumePressed('enter'),
    () => {
      const pid = world.playerEid
      Health.current[pid] = Health.max[pid]
      Position.x[pid] = 30
      Position.y[pid] = 5
      Position.z[pid] = 0
    }
  )

  const skillManager = createSkillManager(world)
  skillManager.activate(SKILL_ID.PROJECTILE, 1)

  const systems = createGameSystems(
    world,
    renderCtx.scene,
    renderCtx.camera,
    enemyPool,
    { input, gameState, skillManager }
  )

  const hud = createHUD(gameState, skillManager)
  const loop = createGameLoop(systems, world, renderCtx, hud)
  loop()
}

function createGameSystems(
  world: ReturnType<typeof setupWorld>,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  enemyPool: ReturnType<typeof createEnemyPool>,
  ctx: {
    input: ReturnType<typeof createInput>
    gameState: ReturnType<typeof createGameStateSystem>
    skillManager: ReturnType<typeof createSkillManager>
  }
) {
  const { input, gameState, skillManager } = ctx
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    createVirtualJoystick(input)

  const cameraTouch = createCameraTouchController()
  const cameraSystem = createCameraSystem(world, camera, () =>
    cameraTouch.getAngle()
  )
  const controller = createCharacterController(world, input, 20, () =>
    cameraSystem.isFirstPerson() ? cameraTouch.getAngle() : 0
  )

  createCameraSwitcher(() => cameraSystem.toggle())

  return {
    gameState,
    skillManager,
    boids: createBoidsSystem(world),
    render: createRenderSystem(world, scene),
    animation: createWorkerPool(world),
    levelUp: createLevelUpSystem(world, () => gameState.setLevelUp()),
    death: createEnemyDeathSystem(world, (eid) => enemyPool.release(eid)),
    playerDamage: createPlayerDamageSystem(world),
    playerDeath: createPlayerDeathSystem(world, () => gameState.setGameOver()),
    camera: cameraSystem,
    controller,
    billboard: createBillboardSystem(world, camera, renderObjects)
  }
}
