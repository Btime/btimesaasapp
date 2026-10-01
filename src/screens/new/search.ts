/** Texto para busca: sem acento, sem diferença entre maiúscula e minúscula. */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Verdadeiro quando todas as palavras da busca aparecem no texto. */
export function matchesSearch(haystack: string, query: string): boolean {
  const q = normalizeSearch(query)
  if (!q) return true
  const text = normalizeSearch(haystack)
  return q.split(/\s+/).every((word) => text.includes(word))
}
