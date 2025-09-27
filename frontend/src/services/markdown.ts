import DOMPurify, { type Config } from 'dompurify'
import MarkdownIt from 'markdown-it'

/**
 * 允許的 CSS 屬性白名單（小寫）
 * 可視需求擴充，但務必審慎
 */
const ALLOWED_CSS_PROPS = new Set([
  'color',
  'background',
  'background-color',
  'background-image',
  'background-size',
  'background-position',
  'background-repeat',
  'font',
  'font-family',
  'font-weight',
  'font-size',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-decoration',
  'text-transform',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border',
  'border-radius',
  'border-width',
  'border-style',
  'border-color',
  'box-shadow',
  'width',
  'min-width',
  'max-width',
  'height',
  'min-height',
  'max-height',
  'display',
  'flex',
  'flex-direction',
  'justify-content',
  'align-items',
  'gap',
  'opacity'
])

/**
 * 基本允許的 HTML 標籤與屬性
 */
const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: [
    'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'i', 'img', 'li',
    'ol', 'p', 'pre', 's', 'small', 'span', 'strong', 'sub', 'sup', 'u', 'ul',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'section', 'article', 'header', 'footer'
  ],
  ALLOWED_ATTR: [
    'class', 'id', 'href', 'target', 'rel', 'src', 'alt', 'title', 'style',
    // data-/aria- 前綴
    'role', 'aria-label', 'aria-hidden', 'aria-describedby'
  ],
  ALLOW_DATA_ATTR: true,
  RETURN_TRUSTED_TYPE: false,
  KEEP_CONTENT: true
}

/**
 * 將 style="" 內的 CSS 宣告過濾，只保留白名單屬性
 */
function filterInlineStyle(styleValue: string): string {
  try {
    const parts = styleValue.split(';')
    const kept: string[] = []
    for (const raw of parts) {
      const decl = raw.trim()
      if (!decl) continue
      const idx = decl.indexOf(':')
      if (idx === -1) continue
      const prop = decl.slice(0, idx).trim().toLowerCase()
      const value = decl.slice(idx + 1).trim()
      if (ALLOWED_CSS_PROPS.has(prop)) {
        // 最簡過濾，避免 URL 危險協議
        if (/url\s*\(/i.test(value) && !/^url\(["']?https?:/i.test(value)) continue
        kept.push(`${prop}: ${value}`)
      }
    }
    return kept.join('; ')
  } catch {
    return ''
  }
}

/**
 * 對整段 CSS（如 <style> 內容）做宣告層級的白名單過濾
 * - 非嚴格 CSS Parser，但足夠防守基本攻擊面
 */
function sanitizeCssText(cssText: string): string {
  // 粗略切出規則區塊 selector { declarations }
  const blocks = cssText.split('}')
  const result: string[] = []
  for (const block of blocks) {
    const parts = block.split('{')
    if (parts.length !== 2) continue
    const selector = parts[0].trim()
    let body = parts[1].trim()
    if (!selector || !body) continue

    // 過濾每一條宣告
    const decls = body.split(';')
    const kept: string[] = []
    for (const raw of decls) {
      const line = raw.trim()
      if (!line) continue
      const idx = line.indexOf(':')
      if (idx === -1) continue
      const prop = line.slice(0, idx).trim().toLowerCase()
      const value = line.slice(idx + 1).trim()
      if (ALLOWED_CSS_PROPS.has(prop)) {
        if (/url\s*\(/i.test(value) && !/^url\(["']?https?:/i.test(value)) continue
        kept.push(`${prop}: ${value}`)
      }
    }
    if (kept.length) {
      result.push(`${selector} { ${kept.join('; ')} }`)
    }
  }
  return result.join('\n')
}

/**
 * 解析 Markdown：抽出 <style> 區塊與 @import 字體、輸出 HTML
 */
export function renderAdvancedMarkdown(markdown: string): {
  html: string
  cssText: string
  fontHrefs: string[]
} {
  // 抽取 <style> 區塊
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>|<style[^>]*>([\s\S]*?)<\/style>/gi
  let cssTextRaw = ''
  let mdWithoutStyles = markdown
  let m: RegExpExecArray | null
  while ((m = styleRegex.exec(markdown)) !== null) {
    const rawInner = (m[1] ?? m[2] ?? '')
    cssTextRaw += '\n' + rawInner
  }
  mdWithoutStyles = mdWithoutStyles.replace(styleRegex, '')

  // 解析 @import 連結（Google Fonts 等）
  const fontHrefs: string[] = []
  const importRegex = /@import\s+url\((['"]?)(https?:\/\/[^'")]+)\1\)\s*;?/gi
  let cssWithoutImports = cssTextRaw
  let im: RegExpExecArray | null
  while ((im = importRegex.exec(cssTextRaw)) !== null) {
    const href = im[2]
    if (href && href.startsWith('https://')) {
      fontHrefs.push(href)
    }
  }
  cssWithoutImports = cssWithoutImports.replace(importRegex, '')

  // Markdown-It：允許 HTML
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true
  })

  const dirtyHtml = md.render(mdWithoutStyles)

  // DOMPurify：過濾並限制 style 屬性
  const purify = DOMPurify
  // Hook 過濾 style 內容
  purify.addHook('uponSanitizeAttribute', (node) => {
    if (node.attrName === 'style' && typeof node.attrValue === 'string') {
      node.attrValue = filterInlineStyle(node.attrValue)
      if (!node.attrValue) {
        // 移除空的 style
        // @ts-ignore
        delete node.attrValue
      }
    }
  })
  const safeHtml = purify.sanitize(dirtyHtml, PURIFY_CONFIG)

  // 清理 CSS 文字
  const cssText = sanitizeCssText(cssWithoutImports)

  return { html: safeHtml, cssText, fontHrefs }
}

/**
 * 將 HTML 片段（如表單標題/描述/題目文字）進行 DOMPurify 清理
 */
export function sanitizeHTMLFragment(input: string | undefined | null): string {
  if (!input) return ''
  // 使用相同 style 過濾 hook
  DOMPurify.addHook('uponSanitizeAttribute', (node) => {
    if (node.attrName === 'style' && typeof node.attrValue === 'string') {
      node.attrValue = filterInlineStyle(node.attrValue)
      if (!node.attrValue) {
        // @ts-ignore
        delete node.attrValue
      }
    }
  })
  return DOMPurify.sanitize(input, PURIFY_CONFIG)
}

/**
 * 動態安裝字體（<link rel="stylesheet" href="...">）
 */
export function ensureFonts(fontHrefs: string[], key: string): void {
  const head = document.head
  for (const href of fontHrefs) {
    const id = `qter-font-${key}-${btoa(href).replace(/=+$/, '')}`
    if (document.getElementById(id)) continue
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    head.appendChild(link)
  }
}

/**
 * 將 CSS 以 <style> 插入/覆寫至 document.head
 */
export function upsertStyleTag(id: string, cssText: string): void {
  const head = document.head
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = id
    head.appendChild(el)
  }
  el.textContent = cssText
}

/**
 * 便利函式：從 Markdown 一步到樣式注入與 HTML
 * - styleId: 用於 style 標籤的 DOM id，避免覆蓋彼此
 * - fontKey: 用於字體 link 的唯一鍵
 */
export function buildAndApplyMarkdown(md: string, styleId: string, fontKey: string): { html: string } {
  const { html, cssText, fontHrefs } = renderAdvancedMarkdown(md)
  if (cssText.trim()) upsertStyleTag(styleId, cssText)
  if (fontHrefs.length) ensureFonts(fontHrefs, fontKey)
  return { html }
}