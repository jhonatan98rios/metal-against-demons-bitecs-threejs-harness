import { World } from 'bitecs'

export type System = (world: World) => World

export class SystemRegistry {
  private systems = new Map<string, System>()

  add(name: string, system: System) {
    this.systems.set(name, system)
  }

  remove(name: string) {
    this.systems.delete(name)
  }

  run(world: World) {
    for (const system of this.systems.values()) {
      system(world)
    }
  }
}

export interface GameContext {
  world: World
  systems: SystemRegistry
  resources: Map<string, unknown>
}

export interface GamePlugin {
  install(ctx: GameContext): void
  uninstall?(ctx: GameContext): void
}
