=== lesson: llm-basics ===
## How do large language models work?

A large language model (LLM) is a system trained on huge amounts of text to predict **the next piece of text** based on what came before. By repeating that prediction piece by piece, the model produces a complete answer.

## Tokens

A model doesn't read words the way we do; it splits text into **tokens**: a whole word, part of a word, or a punctuation mark. Text in some languages is split into more tokens than English.

Token counts matter for three reasons:

1. **Cost:** most services charge by input and output tokens.
2. **Context window:** every model has a maximum total of tokens per request (instructions + conversation + answer).
3. **Speed:** longer outputs take longer to generate.

```js
// Rough check: does the request fit in the context window?
function fitsInContext({ contextWindow, promptTokens, maxOutputTokens }) {
  return promptTokens + maxOutputTokens <= contextWindow;
}

fitsInContext({ contextWindow: 8000, promptTokens: 5000, maxOutputTokens: 2000 }); // true
```

## Generation settings

| Setting | Effect |
| --- | --- |
| `temperature` | Low = steadier, more predictable answers; high = more variety and creativity |
| `max_tokens` | Maximum length of the answer |
| `stop` | Strings where generation stops |

## Limits to know

- A model can "hallucinate" and state wrong information confidently; always verify important facts.
- A model doesn't know about events after its training date unless you provide them in the context.
- Don't send sensitive data without checking the service's policies.

=== lesson: prompt-engineering ===
## Prompt engineering

Answer quality depends heavily on clear instructions. A good prompt specifies:

1. **Role and context:** who is speaking, and what's the background?
2. **Task:** what exactly do you want?
3. **Constraints:** length, language, tone.
4. **Output format:** prose, a list, JSON...
5. **Examples** when needed (few-shot).

## Before and after

```text
❌ Explain loops.

✅ You are a programming teacher for beginners. Explain the for loop
   in JavaScript in at most 4 sentences, then give one example
   that prints the numbers 1 to 5, with a comment on each line.
```

## Message roles

Most chat APIs take a list of messages, each with a role:

```js
const messages = [
  {
    role: "system",
    content: "You are a teaching assistant who explains programming concisely.",
  },
  { role: "user", content: "What's the difference between let and const?" },
];
```

- The **system** message sets overall behaviour and rules.
- **user** messages are the user's questions.
- **assistant** messages are the model's earlier replies (to keep conversation context).

## Asking for structured output

When your program consumes the answer, ask for a specific format and validate it:

```js
const prompt = `Analyse the following question and return only JSON in this shape:
{"topic": string, "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED"}

Question: How do I use async/await?`;
```

> Never trust the output blindly: parse JSON inside `try/catch` and check the fields before using them.

=== lesson: ai-api ===
## Calling a model from the server

The most important rule: **never put an API key in browser code**. Anything that reaches the browser can be seen by any user. Have the frontend call your server, and have your server call the provider.

```text
Browser  ──►  Your server (Express)  ──►  AI model provider
              keeps the key in environment variables
```

## An Express example

```js
import express from "express";

const app = express();
app.use(express.json());

app.post("/api/explain", async (req, res) => {
  const question = String(req.body.question || "").slice(0, 500);
  if (!question) return res.status(400).json({ error: "A question is required" });

  const response = await fetch(process.env.AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "Explain programming concepts concisely." },
        { role: "user", content: question },
      ],
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    return res.status(502).json({ error: "Could not get an answer, try again later" });
  }
  const data = await response.json();
  res.json({ answer: data.output });
});
```

**Code walkthrough:**

- The key is read from `process.env` and never appears in the code or repository.
- We validate the input and cap its length to control cost.
- Provider errors become a clear message without exposing internal details.
- The request and response shapes differ between providers; always check their docs.

## Production practices

- **Rate-limit** requests per user to protect your account from abuse.
- **Log usage** (token counts) to monitor cost.
- **Retry** with increasing delays on temporary overload errors (429 or 5xx).

=== lesson: ai-streaming ===
## Why streaming?

Generating a long answer can take several seconds. Instead of waiting for the whole answer, you can **stream it piece by piece** so the user sees the text appear gradually, which greatly reduces perceived waiting time.

## Server-Sent Events

The most common way to stream over HTTP is **SSE**: the server sends lines starting with `data: `, with a blank line between events.

```text
data: Welcome

data:  to

data:  CodePath

data: [DONE]
```

## Reading the stream in the browser

```js
async function streamAnswer(question, onText) {
  const response = await fetch("/api/explain/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop();                   // the last line may be incomplete
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);        // "data: " is 6 characters long
      if (payload === "[DONE]") return;
      onText(payload);
    }
  }
}
```

**Code walkthrough:** we read bytes gradually and decode them to text, keeping the last line in `buffer` because it may arrive split across two chunks. For every line starting with `data: ` we cut out the payload and pass it to the UI.

> In the UI: show a "typing..." indicator and a stop button, and use `aria-live="polite"` so screen readers announce new text.

=== lesson: embeddings ===
## What are embeddings?

An embedding turns text into a **vector of numbers** so that texts with similar meanings are close together in mathematical space. For example, "How do I learn to code?" and "Ways to study programming" have nearby vectors even though the words differ.

## Measuring similarity

The most common measure is **cosine similarity**, which measures the angle between two vectors:

- **1**: same direction, high semantic similarity.
- **0**: unrelated.
- **-1**: opposite directions.

```js
function dot(a, b) {
  return a.reduce((sum, x, i) => sum + x * b[i], 0);
}

function norm(v) {
  return Math.sqrt(dot(v, v));
}

function cosineSimilarity(a, b) {
  return dot(a, b) / (norm(a) * norm(b));
}

cosineSimilarity([1, 2, 3], [2, 4, 6]); // 1  (exactly the same direction)
cosineSimilarity([1, 0], [0, 1]);       // 0  (perpendicular)
```

## Semantic search

1. Convert each document (or chunk of one) into a vector once and store it.
2. When a question arrives, convert it into a vector with the same model.
3. Compute similarity against the stored vectors and sort the results descending.

In production, vectors are stored in a dedicated database or in PostgreSQL with the **pgvector** extension, which provides fast search indexes.

=== lesson: rag ===
## Retrieval-augmented generation (RAG)

A model doesn't know your company's documents or your platform's lessons. Instead of retraining it, we **retrieve** the relevant chunks and put them in the context along with the question.

## The stages of a RAG pipeline

1. **Chunking:** split documents into small chunks (e.g. 300–800 tokens) with a little overlap.
2. **Indexing:** generate an embedding for each chunk and store it with its text and source.
3. **Retrieval:** embed the question and pick the closest chunks.
4. **Generation:** pass the retrieved chunks and the question to the model and ask for an answer grounded in them.

```js
async function answerWithRag(question, chunks) {
  const queryEmbedding = await embed(question);

  const top = chunks
    .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const context = top
    .map((c, i) => `[${i + 1}] (${c.source})\n${c.text}`)
    .join("\n\n");

  return generate([
    {
      role: "system",
      content: "Answer using only the attached chunks. If the answer isn't there, say so clearly, and cite the source number.",
    },
    { role: "user", content: `Chunks:\n${context}\n\nQuestion: ${question}` },
  ]);
}
```

**Code walkthrough:** we score every chunk, sort descending, keep the best three with `slice(0, 3)`, then build a numbered context so the model can cite its sources.

## Quality tips

- Ask the model to admit when it doesn't know instead of guessing.
- Show sources to users so they can verify for themselves.
- Measure quality with a fixed set of test questions whenever you change chunking or the number of chunks.
