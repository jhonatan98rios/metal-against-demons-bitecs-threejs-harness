import { execSync, spawn } from 'node:child_process'

type Result = {
  name: string
  ok: boolean
  output: string
}

// Runs async commands in parallel
function run(name: string, command: string): Promise<Result> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true
    })

    const chunks: string[] = []

    // Capture stdout
    child.stdout.on('data', (data: Buffer) => {
      chunks.push(data.toString())
    })

    // Capture stderr
    child.stderr.on('data', (data: Buffer) => {
      chunks.push(data.toString())
    })

    // Resolve when process finishes
    child.on('close', (code) => {
      resolve({
        name,
        ok: code === 0,
        output: chunks.join('')
      })
    })
  })
}

// Detects how many lines changed in git diff
function getChangedLines(): number {
  try {
    const output = execSync('git diff --shortstat HEAD', {
      encoding: 'utf-8'
    })

    const match = output.match(/(\d+) insertions?/)

    return match ? Number(match[1]) : 0
  } catch {
    return 0
  }
}

function getSimpleChecks(): [string, string][] {
  const checks: [string, string][] = [
    ['lint', 'pnpm lint'],
    ['typecheck', 'pnpm typecheck'],
    ['test', 'pnpm test']
  ]

  return checks
}

function heavyChecks() {
  const checks: [string, string][] = [
    ['depcruise', 'pnpm depcruise'],
    ['knip', 'pnpm knip'],
    ['complexity', 'pnpm complexity']
  ]

  return checks
}

function getRequiredChecks(changedLines: number) {
  const checks = getSimpleChecks()

  // Run heavier checks only for large changes
  if (changedLines > 100) {
    checks.push(...heavyChecks())
  }

  return checks
}

async function runChecks(checks: [string, string][]) {
  return await Promise.allSettled(checks.map(([name, cmd]) => run(name, cmd)))
}

const normalizeAllSettled = (result: PromiseSettledResult<Result>) => {
  if (result.status === 'fulfilled') {
    return result.value
  }

  return {
    name: 'unknown',
    ok: false,
    output: String(result.reason)
  }
}

function returnStructuredOutput(failed: Result[], changedLines: number) {
  // Return structured JSON for AI agents
  if (failed.length > 0) {
    console.log(
      JSON.stringify(
        {
          success: false,
          changedLines,
          failed
        },
        null,
        2
      )
    )

    process.exit(1)
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        changedLines
      },
      null,
      2
    )
  )
}

async function main(): Promise<void> {
  const changedLines = getChangedLines()
  const checks = getRequiredChecks(changedLines)

  // Run all checks in parallel
  const settled = await runChecks(checks)

  // Normalize Promise.allSettled result
  const results: Result[] = settled.map(normalizeAllSettled)

  const failed = results.filter((result) => !result.ok)

  returnStructuredOutput(failed, changedLines)
}

void main()
