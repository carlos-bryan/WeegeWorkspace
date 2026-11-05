# Nexo workspace

Protótipo de um agente de atendimento para uma empresa fictícia de serviços de TI. O usuário descreve um problema em linguagem natural e recebe uma orientação do agente local.

## Stack

- **Front-end:** React, TypeScript, Vite e Tailwind CSS
- **Back-end:** Node.js, Express e TypeScript
- **IA:** Ollama local com `llama3.2`
- **Markdown:** `react-markdown` com suporte a GitHub Flavored Markdown
- **Banco preparado:** PostgreSQL via `pg`
- **Testes:** Vitest

## Como executar

### Pré-requisitos

- Node.js 22 ou superior
- Ollama instalado: https://ollama.com/download

Baixe o modelo uma vez:

```powershell
ollama pull llama3.2
```

O Ollama deve estar disponível em `http://localhost:11434`.

### Instalação

```powershell
npm install
Copy-Item .env.example .env
```

### Desenvolvimento

Abra dois terminais na raiz do projeto:

```powershell
npm run dev:server
```

```powershell
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`.

## Variáveis de ambiente

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
DATABASE_URL=postgresql://user:password@localhost:5432/nexo_assist
PORT=3000
```

O `DATABASE_URL` é opcional no protótipo. A API expõe `GET /api/health` para verificar a disponibilidade do banco quando ele estiver configurado.

## Decisões
- A IA roda localmente com Ollama para evitar dependência de créditos, chaves secretas e serviços externos durante a demonstração.
- O servidor mantém a integração com a IA fora do navegador. Assim, a URL do Ollama e futuras credenciais permanecem no back-end.
- O histórico da conversa é mantido no estado do front-end e enviado ao servidor a cada mensagem.
- As respostas do modelo são renderizadas como Markdown com `react-markdown` e `remark-gfm`. HTML arbitrário não é habilitado.
- A ferramenta de data e hora só é oferecida quando a mensagem menciona contexto de data ou horário, reduzindo acionamentos incorretos de modelos locais.
- PostgreSQL e o health check já estão preparados para a próxima etapa: persistir conversas, chamados e status de atendimento.

## Validação

```powershell
npm test
npm run build
```

## Estrutura

```text
src/
  App.tsx          Interface e fluxo da conversa
  main.tsx         Entrada React
  style.css        Estilos da aplicação
server/
  index.ts         API Express e integração com Ollama
  db.ts            Pool PostgreSQL opcional
  tools.ts         Ferramenta de data e hora
  tools.test.ts    Teste unitário da ferramenta
```

## creio que poderíamos aplicar isso, seria interessante (tenho isso nos meus projetos hoje)

- Persistir conversas e chamados no PostgreSQL.
- Classificar automaticamente o chamado como novo ou existente.
- Adicionar abertura, atualização e consulta de chamados.
- Encaminhar casos complexos para um analista.
- Adicionar autenticação e observabilidade no ambiente de produção.
