import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { EMPTY_PROGRESS, PROGRESS_ROWS, agentEnded, agentStarted, koDuration, progressRows, taskCreated, taskUpdated, todosWritten, toolEnded, toolStarted, toolTarget, turnEnded, turnStarted } from '../hooks/progress'
import type { TurnEnding } from '../hooks/progress'
import { resolveStyle } from '../hooks/theme'

const T0 = Date.UTC(2026, 9, 28, 1, 0)

const texts = (rows: { text: string }[]) => rows.map(r => r.text)

test('a todo list becomes done, in-progress and pending rows', () => {
  let p = turnStarted(EMPTY_PROGRESS, T0)
  p = todosWritten(p, [
    { content: 'read the spec', status: 'completed', activeForm: 'Reading the spec' },
    { content: 'write tests', status: 'in_progress', activeForm: 'Writing tests' },
    { content: 'ship it', status: 'pending', activeForm: 'Shipping' },
  ])
  const rows = texts(progressRows(p, T0 + 75000))
  expect(rows[0]).toBe('진행 1분 15초 · 도구 0회')
  expect(rows).toContain('단계 1/3')
  expect(rows).toContain('✅ read the spec')
  expect(rows).toContain('🔄 Writing tests')
  expect(rows).toContain('⬜ ship it')
})

test('the current tool shows its name, a short target and the turn count', () => {
  let p = turnStarted(EMPTY_PROGRESS, T0)
  p = toolStarted(p, 'c1', 'Read', { file_path: '/home/hee/p/app/src/main.ts' })
  p = toolEnded(p, 'c1')
  p = toolStarted(p, 'c2', 'Bash', { command: 'npm test -- --watch=false\necho done' })
  const rows = texts(progressRows(p, T0 + 5000))
  expect(rows[0]).toBe('진행 5초 · 도구 2회')
  expect(rows[1]).toBe('> Bash · npm test -- --watch=false')
  expect(toolTarget('Edit', { file_path: 'C:\\work\\x\\y.ts' })).toBe('y.ts')
  expect(toolTarget('WebFetch', { url: 'https://example.com/a/b?q=1' })).toBe('example.com/a/b')
  expect(texts(progressRows(toolEnded(p, 'c2'), T0 + 6000))[1]).toBe('… 생각 중')
  expect(texts(progressRows(toolStarted(p, 'm', 'mcp__ax-tm__axtm_task_list', {}), T0))[1]).toBe('> ax-tm:axtm_task_list (+1)')
})

test('a subagent shows running with its elapsed time, then done with its run time', () => {
  let p = turnStarted(EMPTY_PROGRESS, T0)
  p = agentStarted(p, 'a1', 'Explore the auth code', T0 + 1000)
  p = agentStarted(p, 'a2', 'Run the benchmarks', T0 + 2000)
  let rows = texts(progressRows(p, T0 + 62000))
  expect(rows).toContain('에이전트 실행 2 · 완료 0')
  expect(rows).toContain('🔄 Explore the auth code · 1분 1초')
  p = agentEnded(p, 'a1', T0 + 31000)
  rows = texts(progressRows(p, T0 + 62000))
  expect(rows).toContain('에이전트 실행 1 · 완료 1')
  expect(rows).toContain('🔄 Run the benchmarks · 1분 0초')
  expect(rows).toContain('✅ Explore the auth code · 30초')
  expect(agentEnded(p, 'unknown', T0)).toBe(p)
})

test('the turn end collapses everything to one summary line, still counting live agents', () => {
  let p = turnStarted(EMPTY_PROGRESS, T0)
  p = toolStarted(p, 'c1', 'Bash', { command: 'ls' })
  p = todosWritten(p, [{ content: 'a', status: 'completed', activeForm: 'A' }, { content: 'b', status: 'pending', activeForm: 'B' }])
  p = agentStarted(p, 'bg', 'background scan', T0)
  p = turnEnded(p, T0 + 192000)
  expect(texts(progressRows(p, T0 + 999999))).toEqual(['✓ 완료 3분 12초 · 도구 1 · 단계 1/2 · 에이전트 1 실행 중'])
  p = agentEnded(p, 'bg', T0 + 300000)
  expect(texts(progressRows(p, T0 + 999999))).toEqual(['✓ 완료 3분 12초 · 도구 1 · 단계 1/2'])
  const ended = (ending: TurnEnding) => texts(progressRows(turnEnded(turnStarted(EMPTY_PROGRESS, T0), T0 + 4000, ending), T0))
  expect(ended('aborted')).toEqual(['✗ 중단 4초 · 도구 0'])
  expect(ended('error')).toEqual(['⚠ 오류 4초 · 도구 0'])
  expect(ended('refusal')).toEqual(['⚠ 거절 4초 · 도구 0'])
  expect(ended('answer')).toEqual(['✓ 완료 4초 · 도구 0'])
  expect(progressRows(EMPTY_PROGRESS, T0)).toEqual([])
})

test('a new turn drops finished agents and a fully done list, and keeps an open one', () => {
  let p = turnStarted(EMPTY_PROGRESS, T0)
  p = agentStarted(p, 'done', 'old', T0)
  p = agentEnded(p, 'done', T0 + 1000)
  p = agentStarted(p, 'live', 'still going', T0)
  p = todosWritten(p, [{ content: 'a', status: 'completed', activeForm: 'A' }])
  p = turnStarted(turnEnded(p, T0 + 2000), T0 + 3000)
  expect(p.agents.map(a => a.id)).toEqual(['live'])
  expect(p.steps).toEqual([])
  expect(p.tools).toBe(0)
  const open = turnStarted(todosWritten(EMPTY_PROGRESS, [{ content: 'a', status: 'pending', activeForm: 'A' }]), T0)
  expect(open.steps).toHaveLength(1)
})

test('task tools add, update and delete steps', () => {
  let p = taskCreated(EMPTY_PROGRESS, '1', 'Design the API')
  p = taskCreated(p, '2', 'Write the code')
  p = taskUpdated(p, '1', { status: 'completed' })
  p = taskUpdated(p, '2', { status: 'in_progress', subject: 'Write the server code' })
  expect(p.steps.map(s => `${s.status}:${s.text}`)).toEqual(['completed:Design the API', 'in_progress:Write the server code'])
  expect(taskUpdated(p, '1', { status: 'deleted' }).steps.map(s => s.id)).toEqual(['task:2'])
})

test('a long list stays within twelve rows and keeps the step in progress in view', () => {
  let p = turnStarted(EMPTY_PROGRESS, T0)
  p = toolStarted(p, 'c', 'Grep', { pattern: 'TODO' })
  p = agentStarted(p, 'a1', 'one', T0)
  const todos = Array.from({ length: 20 }, (_, i) => ({ content: `step ${i}`, status: i < 14 ? 'completed' : i === 14 ? 'in_progress' : 'pending', activeForm: `doing ${i}` }))
  p = todosWritten(p, todos)
  const rows = texts(progressRows(p, T0))
  expect(rows.length).toBeLessThanOrEqual(PROGRESS_ROWS)
  expect(rows).toContain('🔄 doing 14')
  expect(rows).toContain('✅ step 13')
  expect(rows.some(r => /^ +외 \d+개$/.test(r))).toBe(true)
  expect(progressRows(p, T0, 3)).toHaveLength(3)
})

test('targets are cut by display width without splitting a character', () => {
  const cut = toolTarget('Bash', { command: '한글'.repeat(40) })
  expect(cut.endsWith('…')).toBe(true)
  expect(cut.length).toBe(24)
  const emoji = toolTarget('Bash', { command: '😀'.repeat(40) })
  expect(emoji.endsWith('…')).toBe(true)
  expect([...emoji.slice(0, -1)].every(c => c === '😀')).toBe(true)
})

test('every glyph the rows use is ASCII, Hangul or a known emoji, no ambiguous-width marks', () => {
  let p = turnStarted(EMPTY_PROGRESS, T0)
  p = toolStarted(p, 'c', 'Bash', { command: 'ls' })
  p = agentStarted(p, 'a', 'agent', T0)
  p = todosWritten(p, [{ content: 'a', status: 'completed', activeForm: 'A' }, { content: 'b', status: 'in_progress', activeForm: 'B' }, { content: 'c', status: 'pending', activeForm: 'C' }])
  const all = [...texts(progressRows(p, T0)), ...texts(progressRows(turnEnded(p, T0, 'error'), T0))].join('')
  expect(all).not.toMatch(/[⏱✔▶⏹]/u)
})

test('koDuration reads seconds, minutes and hours', () => {
  expect(koDuration(4400)).toBe('4초')
  expect(koDuration(192000)).toBe('3분 12초')
  expect(koDuration(3_900_000)).toBe('1시간 5분')
})

test('progressPane is on by default and off when false', () => {
  expect(resolveStyle({}).progressPane).toBe(true)
  expect(resolveStyle({ progressPane: false }).progressPane).toBe(false)
})

const BAND = {
  plugin: 'prismantis',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 20, bodyColumns: 80, scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

const engine = (on: On) => {
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('tool.call', () => ({ result: {} }))
  on('agent.spawn', () => ({ model: 'opus', agentId: 'a1' }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
}

test('the band above the prompt follows a live turn and collapses when it ends', { timeoutMs: 30000 }, async ($, on) => {
  const clock = mock.clock(on, { now: T0 })
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't1' })
  await $.tool.call({ tool: 'TodoWrite', todos: [{ content: 'plan', status: 'completed', activeForm: 'Planning' }, { content: 'build', status: 'in_progress', activeForm: 'Building' }] })
  await $.agent.spawn({ tool_use_id: 'tu-agent', prompt: 'look around', description: 'scan the repo', subagentType: 'Explore', provider: { plugin: 'engine', tier: 'core' }, parentModel: 'opus', background: true, fork: false })
  await clock.advance(65000)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: /^진행 1분 5초 · 도구 1회$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^🔄 Building$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^🔄 scan the repo · 1분 5초$/ })).toBeDefined()
    await ui.unmount()
  }
  await $.turn.complete({ answer: 'done', durationMs: 65000, isAborted: false, turnId: 't1', reason: 'answer' })
  const ended = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ended.findAll({ type: 'Text' })).map(t => t.text)).toEqual(['✓ 완료 1분 5초 · 도구 1 · 단계 1/2 · 에이전트 1 실행 중'])
  await ended.unmount()
  await $.turn.complete({ answer: 'found it', durationMs: 70000, isAborted: false, turnId: 's1', reason: 'answer', agentId: 'a1' })
  const after = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await after.findAll({ type: 'Text' })).map(t => t.text)).toEqual(['✓ 완료 1분 5초 · 도구 1 · 단계 1/2'])
  await after.unmount()
})

test('subagent tool calls do not count toward the main turn', { timeoutMs: 30000 }, async ($, on) => {
  mock.clock(on, { now: T0 })
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't1' })
  await $.tool.call({ tool: 'Bash', command: 'ls', agentId: 'a1' })
  await $.tool.call({ tool: 'Bash', command: 'pwd' })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /^진행 0초 · 도구 1회$/ })).toBeDefined()
  await ui.unmount()
  await $.turn.complete({ answer: 'done', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })
})

test('the band is left to the engine before any turn', { timeoutMs: 30000 }, async ($, on) => {
  engine(on)
  const idle = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await idle.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await idle.unmount()
})

test('progressPane false leaves the band to the engine during a turn', { timeoutMs: 30000, options: { progressPane: false } }, async ($, on) => {
  mock.clock(on, { now: T0 })
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't1' })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await ui.unmount()
  await $.turn.complete({ answer: 'done', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })
})

test('a survey keeps the band', { timeoutMs: 30000 }, async ($, on) => {
  mock.clock(on, { now: T0 })
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't1' })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal', props: { ...BAND.props, hasSurvey: true } })
  expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await ui.unmount()
  await $.turn.complete({ answer: 'done', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })
})
