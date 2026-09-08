export function toCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsvRow(fields: string[]): string {
  return fields.map(toCsvField).join(',')
}

// Leading UTF-8 BOM ensures Excel renders the peso sign correctly instead of mangling it.
export function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [toCsvRow(headers), ...rows.map(toCsvRow)]
  return '\uFEFF' + lines.join('\r\n') + '\r\n'
}
