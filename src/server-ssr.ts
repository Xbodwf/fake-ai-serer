import fs from 'fs'
import path from 'path'

const templatePath = path.join(process.cwd(), 'dist/client/index.html')

export function loadTemplate(): string {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`)
  }
  return fs.readFileSync(templatePath, 'utf-8')
}

export function renderTemplate(html: string, initialState: any = {}): string {
  // 替换SSR占位符
  return html
    .replace('<!--ssr-outlet-->', html)
    .replace(
      '<script>window.__INITIAL_STATE__;</script>',
      `<script>window.__INITIAL_STATE__=${JSON.stringify(initialState)};</script>`
    )
}