import 'dotenv/config'
import express from 'express'
import { getCurrentTime } from './tools'
import { database } from './db'

const app = express()
const port = Number(process.env.PORT ?? 3000)
const ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const ollamaModel = process.env.OLLAMA_MODEL ?? 'llama3.2'
const timeRequestPattern = /\b(hora|horário|horas|data|dia|hoje|agora)\b/i

app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (_request, response) => {
  if (!database) {
    response.json({ status: 'ok', database: 'not configured' })
    return
  }
  try {
    await database.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Database health check failed', error)
    response.status(503).json({ status: 'error', database: 'unavailable' })
  }
})

app.post('/api/chat', async (request, response) => {
  const messages = request.body?.messages
  if (!Array.isArray(messages)) {
    response.status(400).json({ error: 'messages deve ser um array.' })
    return
  }

  const controller = new AbortController()
  request.on('close', () => {
    if (!response.writableEnded) controller.abort()
  })

  try {
    const lastUserMessage = [...messages]
      .reverse()
      .find((message: unknown) =>
        typeof message === 'object' && message !== null &&
        'role' in message && message.role === 'user' &&
        'content' in message && typeof message.content === 'string',
      )
    const shouldOfferTimeTool =
      typeof lastUserMessage === 'object' && lastUserMessage !== null &&
      'content' in lastUserMessage && typeof lastUserMessage.content === 'string' &&
      timeRequestPattern.test(lastUserMessage.content)

    const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
      model: ollamaModel,
      stream: false,
      messages: [
        { role: 'system', content: 'Você é o Nexo, um assistente útil e objetivo. Responda em português.' },
        ...messages.filter((message: unknown) =>
          typeof message === 'object' && message !== null &&
          'role' in message && 'content' in message &&
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string',
        ),
      ],
      ...(shouldOfferTimeTool ? {
        tools: [{
          type: 'function',
          function: {
            name: 'get_current_time',
            description: 'Obtém data e hora atuais no fuso de São Paulo.',
            parameters: { type: 'object', properties: {}, additionalProperties: false },
          },
        }],
      } : {}),
      }),
      signal: controller.signal,
    })
    if (!ollamaResponse.ok) {
      const error = await ollamaResponse.text()
      response.status(502).json({ error: `Ollama: ${error || 'servidor indisponível.'}` })
      return
    }

    const completion = (await ollamaResponse.json()) as {
      message?: {
      content?: string
      tool_calls?: Array<{ function?: { name?: string } }>
      }
    }
    const toolCall = completion.message?.tool_calls?.[0]
    if (toolCall?.function?.name === 'get_current_time') {
      response.json({ message: `Agora são ${getCurrentTime()}.` })
      return
    }
    response.json({ message: completion.message?.content ?? 'Não consegui responder agora.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return
    console.error('Chat request failed', error)
    const message = error instanceof Error ? error.message : 'servidor indisponível.'
    response.status(502).json({ error: `Ollama: ${message}` })
  }
})

app.listen(port, () => console.log(`Nexo API running on port ${port}`))
