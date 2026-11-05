import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const initialMessages: Message[] = [
  {
    role: 'assistant',
    content:
      'Olá. Posso ajudar a organizar uma ideia, esclarecer uma dúvida ou estruturar uma tarefa.',
  },
]

export function App() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const requestController = useRef<AbortController | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = input.trim()
    if (!content || isLoading) return

    const userMessage: Message = { role: 'user', content }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsLoading(true)
    const controller = new AbortController()
    requestController.current = controller

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
        signal: controller.signal,
      })
      const data = (await response.json()) as { message?: string; error?: string }
      if (!response.ok) {
        throw new Error(data.error ?? 'Não foi possível obter uma resposta.')
      }
      setMessages((current) => [...current, { role: 'assistant', content: data.message ?? 'Resposta vazia.' }])
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      const message = error instanceof Error ? error.message : 'Erro inesperado.'
      setMessages((current) => [...current, { role: 'assistant', content: message }])
    } finally {
      requestController.current = null
      setIsLoading(false)
    }
  }

  function stopProcessing() {
    requestController.current?.abort()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">W</span>
          <span>Weege <strong>workspace</strong></span>
        </div>
        <div className="topbar-actions">
          <button className="clear-button" type="button" onClick={() => setMessages(initialMessages)}>Nova conversa</button>
        </div>
      </header>

      <section className="chat-card" aria-label="Conversa do Nexo workspace">
        <div className="chat-heading">
          <div>
            <h1>Em que você está trabalhando?</h1>
          </div>
        </div>

        <div className="messages" aria-live="polite">
          {messages.map((message, index) => (
            <div className={`message-row ${message.role}`} key={`${message.role}-${index}`}>
              {message.role === 'assistant' && <span className="avatar">N</span>}
              <div className="message-content">
                {message.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                ) : <p>{message.content}</p>}
              </div>
            </div>
          ))}
          {isLoading && <div className="message-row assistant"><span className="avatar">N</span><div className="message-content"><p className="typing">Processando...</p></div></div>}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Digite sua mensagem..."
            aria-label="Mensagem"
          />
          {isLoading ? (
            <button className="stop-button" type="button" onClick={stopProcessing}>Parar</button>
          ) : (
            <button type="submit" disabled={!input.trim()} aria-label="Enviar mensagem">↑</button>
          )}
        </form>
      </section>
    </main>
  )
}
