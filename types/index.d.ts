export type PrismantisMarkdownArgs<Surface> = {
  surface: Surface
  text: string
  columns: number
}

export type Prismantis<Surface, Drawing> = {
  markdown: (args: PrismantisMarkdownArgs<Surface>) => Promise<Drawing | undefined>
}

declare module 'claude-code' {
  interface EngineInterface {
    prismantis: Prismantis<RenderSurface, RenderElement>
  }
  interface PluginState {
    prismantis: {
      formulas: Record<string, unknown>
      dir: string
      unfolded: string[]
      sent: { text: string; at: number }[]
      turnEnds: { durationMs: number; at: number }[]
      setupAt: number
      setupFocus: string
      setupLand: string
      foundPaths: string[]
      drawn: StateFamily<number>
      progress: Shaped<{
        startedAt: number | null
        endedAt: number | null
        durationMs: number
        ending: 'answer' | 'aborted' | 'refusal' | 'error'
        tools: number
        running: { id: string; tool: string; target: string }[]
        steps: { id: string; text: string; status: 'pending' | 'in_progress' | 'completed' }[]
        agents: { id: string; description: string; startedAt: number; endedAt?: number }[]
      }>
      progressTick: number
    }
  }
}
