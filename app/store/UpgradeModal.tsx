import { MAX_ITEM_LEVEL, type StoreItem } from '@/src/game/core/store/upgrades'

// ponytail: 53 lines > the 50-line rule, but prettier expands these className strings
// into one line each; a real modal can't fit in 50. Scope-disable just this component.
/* eslint-disable max-lines-per-function */
export function UpgradeModal({
  item,
  level,
  cost,
  maxed,
  affordable,
  onConfirm,
  onClose
}: {
  item: StoreItem
  level: number
  cost: number
  maxed: boolean
  affordable: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const canBuy = !maxed && affordable
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-8">
      <div className="w-full max-w-sm rounded border border-zinc-600 bg-zinc-900 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
        <h2 className="font-mono text-lg font-bold text-amber-400">
          {item.name}
        </h2>
        <p className="mt-2 font-mono text-xs leading-relaxed text-zinc-300">
          {item.description}
        </p>
        <p className="mt-2 font-mono text-xs text-amber-300">
          {maxed ? 'Efeito' : 'Upgrade'}: {item.effect}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-sm text-zinc-300">
            Nível {level}/{MAX_ITEM_LEVEL}
            {maxed ? '' : ` → ${level + 1}`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canBuy}
              onClick={onConfirm}
              className={`rounded border border-zinc-600 bg-zinc-800 px-3 py-1 font-mono text-xs active:scale-95 ${
                canBuy ? 'text-amber-400' : 'text-red-400 opacity-50'
              }`}
            >
              {maxed ? 'MAX' : `🪙 ${cost}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1 font-mono text-xs text-zinc-200 active:scale-95"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
