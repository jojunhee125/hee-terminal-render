import type { ElementTable, RenderElement } from 'claude-code'

import { graphemes, width } from './render'
import type { Theme } from './theme'

export type StepStatus = 'pending' | 'in_progress' | 'completed'
export type Step = { id: string; text: string; status: StepStatus }
export type RunningTool = { id: string; tool: string; target: string }
export type TurnEnding = 'answer' | 'aborted' | 'refusal' | 'error'
export type AgentRun = { id: string; description: string; startedAt: number; endedAt?: number }
export type Progress = {
  startedAt: number | null
  endedAt: number | null
  durationMs: number
  ending: TurnEnding
  tools: number
  running: RunningTool[]
  steps: Step[]
  agents: AgentRun[]
}

export type Tone = 'accent' | 'ok' | 'note' | 'dim' | 'warn' | 'plain'
export type ProgressRow = { key: string; text: string; tone: Tone }

export const PROGRESS_ROWS = 12
const TARGET_MAX = 48
const KEEP_AGENTS = 20
const KEEP_RUNNING = 8
const SHOWN_AGENTS = 3

export const EMPTY_PROGRESS: Progress = { startedAt: null, endedAt: null, durationMs: 0, ending: 'answer', tools: 0, running: [], steps: [], agents: [] }

export const koDuration = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}초`
  if (s < 3600) return `${Math.floor(s / 60)}분 ${s % 60}초`
  return `${Math.floor(s / 3600)}시간 ${Math.floor((s % 3600) / 60)}분`
}

const clip = (text: string, max = TARGET_MAX): string => {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (width(flat) <= max) return flat
  let out = ''
  let used = 0
  for (const g of graphemes(flat)) {
    const w = width(g)
    if (used + w > max - 1) break
    out += g
    used += w
  }
  return `${out}…`
}

const fieldOf = (input: unknown, key: string): string | undefined => {
  if (input === null || typeof input !== 'object') return undefined
  const value = (input as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}

const baseName = (path: string): string => path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || path

const hostPath = (url: string): string => url.replace(/^[a-z]+:\/\//i, '').replace(/[?#].*$/, '')

const TARGETS: Record<string, (input: unknown) => string | undefined> = {
  Bash: input => fieldOf(input, 'command')?.split('\n')[0],
  PowerShell: input => fieldOf(input, 'command')?.split('\n')[0],
  Read: input => mapped(fieldOf(input, 'file_path'), baseName),
  Edit: input => mapped(fieldOf(input, 'file_path'), baseName),
  MultiEdit: input => mapped(fieldOf(input, 'file_path'), baseName),
  Write: input => mapped(fieldOf(input, 'file_path'), baseName),
  NotebookEdit: input => mapped(fieldOf(input, 'notebook_path'), baseName),
  Grep: input => fieldOf(input, 'pattern'),
  Glob: input => fieldOf(input, 'pattern'),
  WebFetch: input => mapped(fieldOf(input, 'url'), hostPath),
  WebSearch: input => fieldOf(input, 'query'),
  Agent: input => fieldOf(input, 'description'),
  Task: input => fieldOf(input, 'description'),
  Skill: input => fieldOf(input, 'skill'),
  TaskCreate: input => fieldOf(input, 'subject'),
}

const mapped = (value: string | undefined, fn: (v: string) => string): string | undefined => (value === undefined ? undefined : fn(value))

const GENERIC_FIELDS = ['description', 'file_path', 'path', 'pattern', 'query', 'url', 'name', 'command']

export const toolTarget = (tool: string, input: unknown): string => {
  const own = TARGETS[tool]
  const found = own ? own(input) : GENERIC_FIELDS.map(k => fieldOf(input, k)).find(v => v !== undefined)
  return found === undefined ? '' : clip(found)
}

export const toolLabel = (tool: string): string => {
  const mcp = /^mcp__(.+?)__(.+)$/.exec(tool)
  return mcp ? `${mcp[1]}:${mcp[2]}` : tool
}

const allDone = (steps: readonly Step[]) => steps.length > 0 && steps.every(s => s.status === 'completed')

export const turnStarted = (p: Progress, at: number): Progress => ({
  ...p,
  startedAt: at,
  endedAt: null,
  durationMs: 0,
  ending: 'answer',
  tools: 0,
  running: [],
  steps: allDone(p.steps) ? [] : p.steps,
  agents: p.agents.filter(a => a.endedAt === undefined),
})

export const turnEnded = (p: Progress, at: number, ending: TurnEnding = 'answer'): Progress => ({
  ...p,
  startedAt: null,
  endedAt: at,
  durationMs: p.startedAt === null ? p.durationMs : at - p.startedAt,
  ending,
  running: [],
})

export const toolStarted = (p: Progress, id: string, tool: string, input: unknown): Progress => ({
  ...p,
  tools: p.tools + 1,
  running: [...p.running.filter(r => r.id !== id), { id, tool: toolLabel(tool), target: toolTarget(tool, input) }].slice(-KEEP_RUNNING),
})

export const toolEnded = (p: Progress, id: string): Progress => ({ ...p, running: p.running.filter(r => r.id !== id) })

type Todo = { content?: unknown; status?: unknown; activeForm?: unknown }

const statusOf = (value: unknown): StepStatus => (value === 'completed' || value === 'in_progress' ? value : 'pending')

export const todosWritten = (p: Progress, todos: unknown): Progress => {
  if (!Array.isArray(todos)) return p
  const steps = (todos as Todo[]).map((todo, i): Step => {
    const status = statusOf(todo?.status)
    const active = status === 'in_progress' && typeof todo?.activeForm === 'string' && todo.activeForm.trim() ? todo.activeForm : undefined
    return { id: `todo:${i}`, text: clip(active ?? (typeof todo?.content === 'string' ? todo.content : ''), 80), status }
  })
  return { ...p, steps }
}

export const taskCreated = (p: Progress, taskId: string, subject: string): Progress => ({
  ...p,
  steps: [...p.steps.filter(s => s.id !== `task:${taskId}`), { id: `task:${taskId}`, text: clip(subject, 80), status: 'pending' }],
})

export const taskUpdated = (p: Progress, taskId: string, change: { status?: unknown; subject?: unknown }): Progress => {
  const id = `task:${taskId}`
  if (change.status === 'deleted') return { ...p, steps: p.steps.filter(s => s.id !== id) }
  return {
    ...p,
    steps: p.steps.map(s => (s.id !== id ? s : { ...s, ...(change.status === undefined ? {} : { status: statusOf(change.status) }), ...(typeof change.subject === 'string' && change.subject.trim() ? { text: clip(change.subject, 80) } : {}) })),
  }
}

export const agentStarted = (p: Progress, id: string, description: string, at: number): Progress => {
  const agents = [...p.agents.filter(a => a.id !== id), { id, description: clip(description || '에이전트', 40), startedAt: at }]
  const running = agents.filter(a => a.endedAt === undefined)
  const done = agents.filter(a => a.endedAt !== undefined)
  return { ...p, agents: [...done.slice(-Math.max(0, KEEP_AGENTS - running.length)), ...running].sort((a, b) => a.startedAt - b.startedAt) }
}

export const agentEnded = (p: Progress, id: string, at: number): Progress =>
  p.agents.some(a => a.id === id && a.endedAt === undefined) ? { ...p, agents: p.agents.map(a => (a.id === id ? { ...a, endedAt: at } : a)) } : p

const MARK: Record<StepStatus, string> = { completed: '✅', in_progress: '🔄', pending: '⬜' }

const stepWindow = (steps: readonly Step[], room: number): { shown: Step[]; hidden: number } => {
  if (steps.length <= room) return { shown: [...steps], hidden: 0 }
  const visible = Math.max(1, room - 1)
  const first = steps.findIndex(s => s.status !== 'completed')
  const start = Math.max(0, Math.min((first < 0 ? steps.length : first) - 1, steps.length - visible))
  return { shown: steps.slice(start, start + visible), hidden: steps.length - visible }
}

const agentRows = (agents: readonly AgentRun[], now: number): ProgressRow[] => {
  const running = agents.filter(a => a.endedAt === undefined)
  const done = agents.filter(a => a.endedAt !== undefined)
  const picked = [...running, ...done.slice(-Math.max(0, SHOWN_AGENTS - running.length))].slice(0, SHOWN_AGENTS)
  const rows = picked.map((a): ProgressRow => ({
    key: `agent:${a.id}`,
    text: a.endedAt === undefined ? `🔄 ${a.description} · ${koDuration(now - a.startedAt)}` : `✅ ${a.description} · ${koDuration(a.endedAt - a.startedAt)}`,
    tone: a.endedAt === undefined ? 'note' : 'dim',
  }))
  const more = agents.length - picked.length
  return more > 0 ? [...rows, { key: 'agent:more', text: `   외 ${more}개`, tone: 'dim' }] : rows
}

const counted = (steps: readonly Step[]) => `${steps.filter(s => s.status === 'completed').length}/${steps.length}`

const ENDINGS: Record<TurnEnding, { label: string; tone: Tone }> = {
  answer: { label: '✓ 완료', tone: 'dim' },
  aborted: { label: '✗ 중단', tone: 'dim' },
  error: { label: '⚠ 오류', tone: 'warn' },
  refusal: { label: '⚠ 거절', tone: 'warn' },
}

export const summaryLine = (p: Progress): ProgressRow => {
  const running = p.agents.filter(a => a.endedAt === undefined).length
  const ending = ENDINGS[p.ending] ?? ENDINGS.answer
  const parts = [
    `${ending.label} ${koDuration(p.durationMs)}`,
    `도구 ${p.tools}`,
    ...(p.steps.length ? [`단계 ${counted(p.steps)}`] : []),
    ...(running ? [`에이전트 ${running} 실행 중`] : []),
  ]
  return { key: 'summary', text: parts.join(' · '), tone: ending.tone === 'warn' ? 'warn' : running ? 'note' : 'dim' }
}

export const progressRows = (p: Progress, now: number, max = PROGRESS_ROWS): ProgressRow[] => {
  if (p.startedAt === null) return p.endedAt === null ? [] : [summaryLine(p)]
  const current = p.running.at(-1)
  const head: ProgressRow[] = [
    { key: 'head', text: `진행 ${koDuration(now - p.startedAt)} · 도구 ${p.tools}회`, tone: 'accent' },
    current ? { key: 'tool', text: `> ${current.tool}${current.target ? ` · ${current.target}` : ''}${p.running.length > 1 ? ` (+${p.running.length - 1})` : ''}`, tone: 'plain' } : { key: 'tool', text: '… 생각 중', tone: 'dim' },
  ]
  const live = p.agents.filter(a => a.endedAt === undefined).length
  const agents = p.agents.length ? [{ key: 'agents', text: `에이전트 실행 ${live} · 완료 ${p.agents.length - live}`, tone: 'accent' as const }, ...agentRows(p.agents, now)] : []
  const room = max - head.length - agents.length - 1
  if (!p.steps.length || room < 1) return [...head, ...agents].slice(0, max)
  const { shown, hidden } = stepWindow(p.steps, room)
  const steps: ProgressRow[] = [
    { key: 'steps', text: `단계 ${counted(p.steps)}`, tone: 'accent' },
    ...shown.map((s): ProgressRow => ({ key: s.id, text: `${MARK[s.status]} ${s.text}`, tone: s.status === 'in_progress' ? 'note' : s.status === 'completed' ? 'dim' : 'plain' })),
    ...(hidden ? [{ key: 'steps:more', text: `   외 ${hidden}개`, tone: 'dim' as const }] : []),
  ]
  return [...head, ...agents, ...steps].slice(0, max)
}

const colorOf = (theme: Theme, tone: Tone): string | undefined =>
  tone === 'accent' ? theme.accent : tone === 'ok' ? theme.codeString : tone === 'note' ? theme.heading : tone === 'warn' ? theme.codeFlag : tone === 'dim' ? theme.codeComment : undefined

export const renderProgress = ({ Box, Text }: ElementTable, theme: Theme, rows: readonly ProgressRow[]): RenderElement => (
  <Box flexDirection="column">
    {rows.map(row => (
      <Box key={row.key}>
        <Text color={colorOf(theme, row.tone)} wrap="truncate-end">
          {row.text}
        </Text>
      </Box>
    ))}
  </Box>
)
