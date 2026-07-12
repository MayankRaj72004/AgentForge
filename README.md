# MyGPT — Agentic AI Chatbot

An agentic AI chatbot with memory, tool use, and Retrieval-Augmented Generation (RAG), built with **LangChain**, **LangGraph**, and **FastAPI** on the backend and **React (Vite)** on the frontend.

The agent doesn't just answer questions — it reasons over multiple steps and decides *when* to call a tool: searching the live web, searching your uploaded documents, doing math, or recalling something it was told to remember earlier in the conversation.

## Features

- **Agentic reasoning with LangGraph** — a stateful graph (`chatbot` → `tools` → `chatbot`) lets the model decide when it needs a tool versus when it can answer directly.
- **Persistent conversation memory** — chat state is checkpointed per `thread_id` using `langgraph-checkpoint-sqlite`, so conversations survive server restarts.
- **Retrieval-Augmented Generation (RAG)** — upload PDF, DOCX, TXT, MD, PY, or CSV files; they're chunked, embedded with a HuggingFace `sentence-transformers` model, and stored in a **ChromaDB** vector store, scoped per conversation thread.
- **Live web search** — the agent calls the **Tavily Search** API for time-sensitive or current-events questions.
- **Long-term memory tool** — the agent can be explicitly told to remember a fact and recall it later, stored via SQLAlchemy in a local SQLite database.
- **Streaming responses** — answers are streamed token-by-token to the frontend over Server-Sent Events (SSE).
- **Multi-model support** — swap between Groq-hosted models (Llama 3.3 70B, Llama 3.1 8B, GPT-OSS 120B/20B, DeepSeek R1 Distill) per request.

## Architecture

```
┌─────────────────┐        HTTP / SSE        ┌──────────────────────┐
│  React Frontend  │ ───────────────────────▶ │   FastAPI Backend    │
│  (Vite, served   │ ◀─────────────────────── │   (app.py)            │
│   as static build)│                          └──────────┬────────────┘
└─────────────────┘                                     │
                                                          ▼
                                          ┌───────────────────────────┐
                                          │     LangGraph Agent        │
                                          │  (agent.py)                 │
                                          │  chatbot ⇄ tools nodes     │
                                          └──────────┬────────────────┘
                                                      │
                     ┌────────────────────┬──────────┼──────────────┬────────────────────┐
                     ▼                    ▼                         ▼                    ▼
              Calculator tool     search_uploaded_documents   Tavily web search     remember_this /
                                     (rag.py + ChromaDB)                              recall_memory
                                                                                     (database.py)
```

## Tech Stack

**Backend:** Python, FastAPI, LangChain, LangGraph, ChromaDB, HuggingFace `sentence-transformers`, Tavily Search API, Groq API, SQLAlchemy, SQLite
**Frontend:** React 19, Vite
**Infra:** Docker, GitHub Actions (CI/CD), AWS EC2

## Project Structure

```
MyGPT-Agentic-AI-ChatBot/
├── Backend/
│   ├── app.py        # FastAPI app, routes, SSE streaming, serves built frontend
│   ├── agent.py       # LangGraph agent graph definition
│   ├── tools.py       # Agent tools (calculator, RAG search, memory, web search)
│   ├── rag.py         # Document ingestion + ChromaDB retrieval
│   ├── database.py    # SQLAlchemy models: conversations, messages, memory
│   └── requirements.txt (root-level)
├── Frontend/
│   ├── src/           # React app
│   ├── index.html
│   └── package.json
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
└── .github/workflows/deploy.yml
```

## Running Locally (without Docker)

### 1. Clone the repository

```bash
git clone https://github.com/MayankRaj72004/MyGPT-Agentic-AI-ChatBot.git
cd MyGPT-Agentic-AI-ChatBot
```

### 2. Backend setup

```bash
cd Backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt
```

Create a `.env` file inside `Backend/` (see `.env.example` at the repo root):

```
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

Run the backend:

```bash
python app.py
```

The API will be available at `http://localhost:8000`.

### 3. Frontend setup

In a separate terminal:

```bash
cd Frontend
npm install
npm run dev
```

The dev server proxies API calls to `http://localhost:8000` (configured in `vite.config.js`).

### 4. Production build

To serve the frontend from the FastAPI backend directly:

```bash
cd Frontend
npm run build
cd ../Backend
python app.py
```

`app.py` automatically mounts `Frontend/dist` as static files once it exists.

## Running with Docker

```bash
# 1. Copy the example env file and fill in your API keys
cp .env.example .env

# 2. Build and run
docker compose up --build
```

The app will be available at `http://localhost:8000`.

## CI/CD Pipeline

Every push to `main` triggers a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. Builds a multi-stage Docker image (Vite frontend build → Python/FastAPI runtime).
2. Pushes the image to Docker Hub.
3. Connects to an AWS EC2 instance over SSH and redeploys the container with the latest image.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full setup guide, including required GitHub Secrets and EC2 configuration.

## License

MIT — see [LICENSE](./LICENSE).
