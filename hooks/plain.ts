import { figureRuns, isFigureLang, reframe } from './figure'
import { tableText } from './html'
import type { Block, ListItem } from './markdown'
import { displayText, nestedBlocks } from './markdown'
import { mermaidText } from './mermaid'
import { tableArt } from './render'
import type { Style } from './theme'

type PlainLook = Pick<Style, 'mermaid' | 'mermaidAscii'>

const ART_COLUMNS = 100

const lines = (text: string): string => text.split('\n').map(line => line.trimEnd()).join('\n')

const indent = (text: string, by: number): string => text.split('\n').map(line => (line ? ' '.repeat(by) + line : line)).join('\n')

const figureArt = (source: readonly string[]): string => lines(reframe(source.map(figureRuns)).map(runs => runs.map(run => run.text).join('')).join('\n'))

const codeText = (block: Extract<Block, { kind: 'code' }>, look: PlainLook, columns: number): string => {
  if (isFigureLang(block.lang)) return figureArt(block.lines)
  const art = look.mermaid && block.lang.toLowerCase() === 'mermaid' ? mermaidText(block.lines.join('\n'), look.mermaidAscii, columns) : null
  return art === null ? block.lines.join('\n') : lines(art)
}

const itemMark = (item: ListItem): string => (item.task !== undefined ? (item.task ? '[x]' : '[ ]') : /\d/.test(item.marker) ? item.marker : '-')

const listText = (block: Extract<Block, { kind: 'list' }>, look: PlainLook, columns: number): string =>
  block.items.map(item => {
    const lead = `${' '.repeat(item.depth * 2)}${itemMark(item)} `
    const head = lead + displayText(item.inline)
    return item.blocks?.length ? `${head}\n${indent(plainText(item.blocks, look, columns), lead.length)}` : head
  }).join('\n')

const blockText = (block: Block, look: PlainLook, columns: number): string => {
  switch (block.kind) {
    case 'heading':
    case 'paragraph':
      return displayText(block.inline)
    case 'list':
      return listText(block, look, columns)
    case 'code':
      return codeText(block, look, columns)
    case 'table':
      return tableArt(block).split('\n').slice(1, -1).join('\n')
    case 'quote':
      return plainText(block.blocks, look, columns)
    case 'alert':
      return [`[${block.level.toUpperCase()}]`, plainText(block.blocks, look, columns)].filter(Boolean).join('\n')
    case 'rule':
      return '-'.repeat(20)
    case 'notes':
      return block.notes.map(note => `${note.mark} ${displayText(note.inline)}`).join('\n')
  }
}

export const plainText = (blocks: Block[], look: PlainLook, columns = ART_COLUMNS): string =>
  blocks.map(block => blockText(block, look, columns)).filter(text => text.trim() !== '').join('\n\n')

export type CopyPick = { text: string; what: string } | { missing: string }

export const pickCopy = (reply: string, blocks: Block[], name: string | undefined, look: PlainLook): CopyPick => {
  if (name === 'plain') return { text: plainText(blocks, look), what: 'reply as plain text' }
  if (name === 'code') {
    const code = nestedBlocks(blocks).findLast(b => b.kind === 'code')
    return code?.kind === 'code' ? { text: code.lines.join('\n'), what: 'code block' } : { missing: 'The last reply has no code block.' }
  }
  if (name === 'table') {
    const table = nestedBlocks(blocks).findLast(b => b.kind === 'table')
    return table?.kind === 'table' ? { text: tableText(table), what: 'table' } : { missing: 'The last reply has no table.' }
  }
  return { text: reply, what: 'reply' }
}
