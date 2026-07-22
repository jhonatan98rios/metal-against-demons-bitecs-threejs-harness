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
import { createCameraMouseController } from './gameplay/cameraMouseController'
import { createWorkerPool } from './systems/createWorkerPool'
import { createRender } from './rendering/createRender'
import {
  createRenderSystem
} from './rendering/createRenderSystem'
import { createCameraSystem } from './systems/cameraSystem'
import { createCameraSwitcher } from './ui/cameraSwitcher'
import { createFirstPersonOverlay } from './ui/FirstPersonOverlay'
import { createLevelUpSystem } from './core/player/levelUpSystem'
import { PlayerHUD } from './ui/PlayerHUD'
import { Health } from './core/shared/components/Health'
import { Position } from './core/shared/components/Position'
import { GameState, STATES } from './core/shared/components/GameState'
import { XP } from './core/shared/components/XP'
import { createGameStateSystem } from './systems/gameStateSystem'
import { createVictorySystem } from './systems/victorySystem'
import { getPhase, DEFAULT_PHASE } from './core/phases/definitions'
import { createScenario, SCENARIOS } from './scenarios/createScenario'
import { createSkillManager } from './core/skills/manager'
import { SKILL_ID } from './core/skills/skillIds'
import { getCollisionSystem } from './core/projectiles/systems/collisionSystem'
import './core/skills/definitions/projectile'
import './core/skills/definitions/redBolt'

function spawnEnemies(pool: ReturnType<typeof createEnemyPool>, count: number) {
  Array.from({ length: count }, () => {
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

// ponytail: intercept back button → pause/resume instead of navigating away
function setupBackButton(gameState: ReturnType<typeof createGameStateSystem>) {
  history.pushState({ game: true }, '', location.href)
  const onPop = () => {
    const s = gameState.getState()
    if (s === STATES.PLAYING || s === STATES.PAUSED) {
      history.pushState({ game: true }, '', location.href)
      gameState.togglePause()
    }
  }
  window.addEventListener('popstate', onPop)
}

// ponytail: shared restart logic — reset player and resume
function makeRestartCallback(world: { playerEid: number }) {
  return () => {
    const pid = world.playerEid
    Health.current[pid] = Health.max[pid]
    Position.x[pid] = 30
    Position.y[pid] = 5
    Position.z[pid] = 0
  }
}

// ponytail: per-frame helpers extracted to keep loop complexity low
function tickGameplay(systems: GameSystems, _eid: number, dt: number) {
  systems.controller.update(dt)
  systems.boids.update()
  systems.skillManager.update(dt)
  systems.collision.update()
  systems.animation.update(dt)
  systems.playerDamage.update(dt)
  systems.death.update()
  systems.playerDeath.update()
  systems.levelUp.update()
  systems.victory.update()
}

function handlePointerLock(systems: GameSystems, stateEid: number) {
  if (!systems.pointerLock) return
  const isFP = systems.camera.isFirstPerson()
  const isPlaying = GameState.status[stateEid] === STATES.PLAYING
  if (isFP && isPlaying && !systems.pointerLock.isLocked())
    void systems.pointerLock.lock()
  else if ((!isFP || !isPlaying) && systems.pointerLock.isLocked())
    systems.pointerLock.unlock()
}

function tickVisuals(
  systems: GameSystems,
  renderCtx: RenderCtx,
  world: ReturnType<typeof setupWorld>,
  hud: PlayerHUD | null,
  fpOverlay: ReturnType<typeof createFirstPersonOverlay>
) {
  const { composer, playerFill } = renderCtx
  const { stateEid, playerEid } = world

  systems.camera.update()
  handlePointerLock(systems, stateEid)
  fpOverlay.update(systems.camera.isFirstPerson())

  if (hud) {
    hud.update({
      hp: Health.current[playerEid],
      hpMax: Health.max[playerEid],
      xp: XP.current[playerEid],
      xpNext: XP.next[playerEid],
      level: XP.level[playerEid],
      state: GameState.status[stateEid] as (typeof STATES)[keyof typeof STATES]
    })
  }

  if (playerFill && playerEid) {
    playerFill.position.set(
      Position.x[playerEid],
      Position.y[playerEid] + 6,
      Position.z[playerEid]
    )
  }

  composer.render()
}

function createGameLoop(
  systems: GameSystems,
  world: ReturnType<typeof setupWorld>,
  renderCtx: RenderCtx,
  hud: PlayerHUD | null,
  fpOverlay: ReturnType<typeof createFirstPersonOverlay>
) {
  const delta = { last: performance.now(), current: 0 }

  window.addEventListener('resize', () =>
    renderCtx.composer.setSize(window.innerWidth, window.innerHeight)
  )

  return function loop() {
    const now = performance.now()
    delta.current = Math.min(0.1, (now - delta.last) / 1000)
    delta.last = now

    systems.gameState.update()
    if (GameState.status[world.stateEid] === STATES.PLAYING) {
      tickGameplay(systems, world.stateEid, delta.current)
    }

    systems.render(delta.current)
    tickVisuals(systems, renderCtx, world, hud, fpOverlay)
    requestAnimationFrame(loop)
  }
}

function createHUD(
  gameState: ReturnType<typeof createGameStateSystem>,
  skillManager: ReturnType<typeof createSkillManager>,
  onReturnToMenu: () => void
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
    },
    onReturnToMenu
  )
}

export function start(phaseId?: string) {
  const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement
  if (!canvas || typeof window === 'undefined') return

  const phase = phaseId ? (getPhase(phaseId) ?? DEFAULT_PHASE) : DEFAULT_PHASE
  const world = setupWorld()
  const renderCtx = createRender(canvas)
  const input = createInput()

  createScenario(renderCtx.scene, SCENARIOS.LEVEL1)
  const enemyPool = createEnemyPool(world, phase.poolSize)
  spawnEnemies(enemyPool, phase.enemyCount)

  const gameState = createGameStateSystem(
    world,
    () => input.consumePressed('escape'),
    () => input.consumePressed('enter'),
    makeRestartCallback(world)
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

  const fpOverlay = createFirstPersonOverlay()

  const cleanup = () => {
    systems.destroyables.forEach((fn) => fn())
    fpOverlay.destroy()
    hud?.destroy?.()
  }

  const hud = createHUD(gameState, skillManager, () => {
    cleanup()
    // ponytail: full page nav cleans up everything, no lingering DOM
    window.location.href = '/'
  })
  const loop = createGameLoop(systems, world, renderCtx, hud, fpOverlay)
  loop()

  setupBackButton(gameState)
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
  const destroyables: (() => void)[] = []
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    const joystick = createVirtualJoystick(input)
    destroyables.push(() => joystick.destroy())
  }

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  const gameCanvas = document.querySelector('#game-canvas') as HTMLCanvasElement
  const cameraCtrl = isTouch
    ? createCameraTouchController()
    : (() => {
        const ctrl = createCameraMouseController(gameCanvas)
        destroyables.push(() => ctrl.destroy())
        return ctrl
      })()

  const cameraSystem = createCameraSystem(world, camera, () =>
    cameraCtrl.getAngle()
  )
  const controller = createCharacterController(world, input, 20, () =>
    cameraSystem.isFirstPerson() ? cameraCtrl.getAngle() : 0
  )

  const cameraSwitcher = createCameraSwitcher(() => cameraSystem.toggle())
  destroyables.push(() => cameraSwitcher.destroy())

  const pointerLock = isTouch
    ? undefined
    : (() => {
        const m = cameraCtrl as ReturnType<typeof createCameraMouseController>
        return {
          lock: () => m.lock(),
          unlock: () => m.unlock(),
          isLocked: () => m.isLocked()
        }
      })()

  return {
    gameState,
    skillManager,
    destroyables,
    pointerLock,
    collision: getCollisionSystem(world),
    boids: createBoidsSystem(world),
    render: createRenderSystem(world, scene, camera),
    animation: createWorkerPool(world),
    levelUp: createLevelUpSystem(world, () => gameState.setLevelUp()),
    death: createEnemyDeathSystem(world, (eid) => enemyPool.release(eid)),
    playerDamage: createPlayerDamageSystem(world),
    playerDeath: createPlayerDeathSystem(world, () => gameState.setGameOver()),
    victory: createVictorySystem(world, () => gameState.setVictory()),
    camera: cameraSystem,
    controller
  }
}
