export type ToolCall = {
  name: 'get_current_time'
  arguments: Record<string, never>
}

export function getCurrentTime(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())
}
