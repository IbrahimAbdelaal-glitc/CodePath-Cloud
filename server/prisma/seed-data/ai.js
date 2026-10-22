const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export default {
  roadmap: {
    slug: 'ai-fullstack',
    title: 'Full-Stack AI Development',
    summary: 'Integrate language models into your apps: from prompt engineering to RAG.',
    description:
      'A path for developers who want to build complete intelligent applications: understand how language models work, write effective prompts, call model APIs securely from the server, stream answers to the UI, and build semantic search and RAG systems on top of your own data.',
    category: 'Artificial Intelligence',
    difficulty: 'ADVANCED',
    prerequisites: ['Solid JavaScript and async/await', 'Basic experience building an API with Node.js or Python'],
    isFeatured: true,
    order: 4,
  },
  modules: [
    {
      key: 'llm-foundations',
      title: 'Language Model Foundations',
      description: 'Tokens, context windows and prompt engineering.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'llm-basics',
          title: 'How Large Language Models Work',
          summary: 'Tokens, context windows, generation settings and model limits.',
          difficulty: 'BEGINNER',
          estimatedMinutes: 20,
          keyTakeaways: [
            'A model repeatedly predicts the next piece of text.',
            'Cost and limits are measured in tokens, not words.',
            'Lower temperature gives steadier answers.',
            'Always verify important facts because models can hallucinate.',
          ],
          resources: [
            { title: 'Hugging Face courses', url: 'https://huggingface.co/learn', type: 'DOCUMENTATION' },
            { title: 'Prompt Engineering Guide', url: 'https://www.promptingguide.ai/', type: 'ARTICLE' },
            { title: 'Video tutorials on how LLMs work', url: yt('how large language models work explained'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'What is a token in a language model?',
              questionType: 'MULTIPLE_CHOICE',
              options: [
                'Only a password for accessing the service',
                'A unit of text (a word or part of a word) that the model processes',
                'Always a whole sentence',
                'Always a single character',
              ],
              correctAnswer: 'A unit of text (a word or part of a word) that the model processes',
              explanation: 'A model splits text into tokens, which can be a word, part of a word or a punctuation mark; cost and context limits are counted in tokens.',
              topic: 'llm-tokens',
            },
            {
              question: 'What does this code print?',
              questionType: 'CODE_OUTPUT',
              codeSnippet:
                'const contextWindow = 8000;\nconst promptTokens = 6500;\nconst maxOutputTokens = 2000;\n\nconsole.log(promptTokens + maxOutputTokens <= contextWindow);',
              correctAnswer: 'false',
              explanation: 'The request and answer total 8500 tokens, which exceeds the 8000-token context window, so the request does not fit and false is printed.',
              topic: 'llm-tokens',
            },
            {
              question: 'What is the effect of lowering temperature?',
              questionType: 'MULTIPLE_CHOICE',
              options: ['Always longer answers', 'Steadier, more predictable answers', 'Higher cost', 'A larger context window'],
              correctAnswer: 'Steadier, more predictable answers',
              explanation: 'Temperature controls randomness in token selection; low values favour the most likely tokens, so answers become more consistent.',
              topic: 'llm-tokens',
            },
          ],
        },
        {
          key: 'prompt-engineering',
          title: 'Prompt Engineering',
          summary: 'Writing clear instructions, message roles and structured output.',
          difficulty: 'BEGINNER',
          estimatedMinutes: 25,
          keyTakeaways: [
            'Specify the role, task, constraints and output format.',
            'The system message sets overall behaviour.',
            'Examples (few-shot) improve format adherence.',
            'Validate structured output before using it.',
          ],
          resources: [
            { title: 'Prompt Engineering Guide', url: 'https://www.promptingguide.ai/', type: 'DOCUMENTATION' },
            { title: 'Few-shot prompting', url: 'https://www.promptingguide.ai/techniques/fewshot', type: 'ARTICLE' },
            { title: 'Video tutorials on prompt engineering', url: yt('prompt engineering tutorial'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'Which prompt is best for getting a beginner-friendly explanation?',
              questionType: 'MULTIPLE_CHOICE',
              options: [
                'Explain loops.',
                'Loops!!',
                'You are a teacher for beginners. Explain the JavaScript for loop in 4 sentences, with an example that prints 1 to 5.',
                'Write everything you know about programming.',
              ],
              correctAnswer: 'You are a teacher for beginners. Explain the JavaScript for loop in 4 sentences, with an example that prints 1 to 5.',
              explanation: 'A good prompt sets the role, audience, task and constraints (length and focus) and asks for a specific example, so the answer is focused and useful.',
              topic: 'prompt-engineering',
            },
            {
              question: 'Complete the role of the message that sets the assistant’s overall behaviour:',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet:
                'const messages = [\n  { role: "___", content: "You are an assistant who explains programming to beginners." },\n  { role: "user", content: "What is a variable?" },\n];',
              correctAnswer: 'system',
              explanation: 'The system message sets the rules and overall context, while user messages carry the user’s questions.',
              topic: 'prompt-engineering',
            },
          ],
        },
      ],
    },
    {
      key: 'ai-integration',
      title: 'Integrating AI into Applications',
      description: 'Call models securely from the server and stream answers to the UI.',
      difficulty: 'INTERMEDIATE',
      prerequisites: ['llm-foundations'],
      lessons: [
        {
          key: 'ai-api',
          title: 'Calling Models Securely from the Server',
          summary: 'Protecting keys, validating input and handling errors.',
          difficulty: 'INTERMEDIATE',
          estimatedMinutes: 30,
          keyTakeaways: [
            'Never put an API key in browser code.',
            'Read secrets from environment variables.',
            'Cap input length and request rate to control cost.',
            'Turn provider errors into clear user-facing messages.',
          ],
          resources: [
            { title: 'Environment variables in Node.js', url: 'https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs', type: 'DOCUMENTATION' },
            { title: 'OWASP Top 10 for LLM Applications', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', type: 'ARTICLE' },
            { title: 'Video tutorials on AI APIs with Node.js', url: yt('AI API Node.js Express tutorial'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'Why should an AI service be called from the server rather than directly from the browser?',
              questionType: 'MULTIPLE_CHOICE',
              options: ['Because browsers do not support fetch', 'To keep the API key hidden from users', 'Because servers are always faster', 'There is no real reason'],
              correctAnswer: 'To keep the API key hidden from users',
              explanation: 'Any key that reaches the browser can be extracted and abused on your account. The server keeps the key and adds validation and rate limiting.',
              topic: 'ai-api-integration',
            },
            {
              question: 'Complete the code to read the key from environment variables in Node.js:',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet: 'const apiKey = process.___.AI_API_KEY;',
              correctAnswer: 'env',
              explanation: 'process.env holds the environment variables, keeping the key out of the code and the repository.',
              topic: 'ai-api-integration',
            },
          ],
        },
        {
          key: 'ai-streaming',
          title: 'Streaming Answers to the UI',
          summary: 'Server-Sent Events and reading a stream progressively in the browser.',
          difficulty: 'INTERMEDIATE',
          estimatedMinutes: 30,
          keyTakeaways: [
            'Streaming reduces perceived waiting time.',
            'SSE events are lines starting with "data: ".',
            'Keep an incomplete line in a buffer.',
            'Use aria-live so screen readers announce streamed text.',
          ],
          resources: [
            { title: 'Server-sent events on MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events', type: 'DOCUMENTATION' },
            { title: 'Using readable streams on MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams', type: 'ARTICLE' },
            { title: 'Video tutorials on Server-Sent Events', url: yt('Server Sent Events tutorial'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'What is the main benefit of streaming a model’s answer instead of waiting for all of it?',
              questionType: 'MULTIPLE_CHOICE',
              options: [
                'Fewer tokens are used',
                'The user sees the answer gradually, so perceived waiting time drops',
                'More accurate answers',
                'No need for a server',
              ],
              correctAnswer: 'The user sees the answer gradually, so perceived waiting time drops',
              explanation: 'Streaming doesn’t change cost or accuracy, but it shows the first words within moments instead of waiting for the full answer.',
              topic: 'ai-streaming',
            },
            {
              question: 'What does this code print?',
              questionType: 'CODE_OUTPUT',
              codeSnippet:
                'const events = ["data: Hel", "data: lo", "data: [DONE]", "data: !"];\nlet out = "";\nfor (const e of events) {\n  const payload = e.slice(6);\n  if (payload === "[DONE]") break;\n  out += payload;\n}\nconsole.log(out);',
              correctAnswer: 'Hello',
              explanation: 'slice(6) removes the "data: " prefix (6 characters), so we join "Hel" and "lo" and stop at [DONE] before reaching "!".',
              topic: 'ai-streaming',
            },
          ],
        },
      ],
    },
    {
      key: 'rag',
      title: 'Embeddings and RAG',
      description: 'Semantic search and answers grounded in your own data.',
      difficulty: 'ADVANCED',
      prerequisites: ['ai-integration'],
      lessons: [
        {
          key: 'embeddings',
          title: 'Embeddings and Semantic Search',
          summary: 'Turning text into vectors and measuring similarity between them.',
          difficulty: 'ADVANCED',
          estimatedMinutes: 35,
          keyTakeaways: [
            'An embedding is a numeric vector representing meaning.',
            'Cosine similarity measures the angle between two vectors.',
            'Use the same embedding model for documents and questions.',
            'pgvector adds vector search to PostgreSQL.',
          ],
          resources: [
            { title: 'Cosine similarity (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Cosine_similarity', type: 'ARTICLE' },
            { title: 'pgvector for PostgreSQL', url: 'https://github.com/pgvector/pgvector', type: 'DOCUMENTATION' },
            { title: 'Video tutorials on embeddings', url: yt('embeddings semantic search explained'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'What does this code print?',
              questionType: 'CODE_OUTPUT',
              codeSnippet: 'function dot(a, b) {\n  return a.reduce((s, x, i) => s + x * b[i], 0);\n}\n\nconsole.log(dot([1, 0, 2], [3, 4, 1]));',
              correctAnswer: '5',
              explanation: 'The dot product = 1×3 + 0×4 + 2×1 = 3 + 0 + 2 = 5.',
              topic: 'embeddings',
            },
            {
              question: 'If the cosine similarity between two text vectors is 1, what does that mean?',
              questionType: 'MULTIPLE_CHOICE',
              options: ['The texts have opposite meanings', 'The texts are unrelated', 'The vectors point the same way, meaning high semantic similarity', 'The calculation failed'],
              correctAnswer: 'The vectors point the same way, meaning high semantic similarity',
              explanation: '1 means a zero angle between the vectors, 0 means they are perpendicular (unrelated), and -1 means they point in opposite directions.',
              topic: 'embeddings',
            },
          ],
        },
        {
          key: 'rag',
          title: 'Building a Complete RAG Pipeline',
          summary: 'Chunking, indexing, retrieval and generation with citations.',
          difficulty: 'ADVANCED',
          estimatedMinutes: 40,
          keyTakeaways: [
            'RAG adds your knowledge to the context without retraining the model.',
            'The stages are chunking, indexing, retrieval and generation.',
            'Ask the model to admit when it does not know.',
            'Show sources to users and measure quality with a fixed question set.',
          ],
          resources: [
            { title: 'Retrieval-augmented generation (Prompt Engineering Guide)', url: 'https://www.promptingguide.ai/techniques/rag', type: 'ARTICLE' },
            { title: 'Hugging Face courses', url: 'https://huggingface.co/learn', type: 'DOCUMENTATION' },
            { title: 'Video tutorials on RAG', url: yt('RAG Retrieval Augmented Generation tutorial'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'What is the correct order of a RAG pipeline’s stages?',
              questionType: 'MULTIPLE_CHOICE',
              options: [
                'Generate → retrieve → chunk → index',
                'Chunk → index with embeddings → retrieve the closest chunks → generate the answer',
                'Index → generate → chunk → retrieve',
                'Retrieve → chunk → generate → index',
              ],
              correctAnswer: 'Chunk → index with embeddings → retrieve the closest chunks → generate the answer',
              explanation: 'We first split documents into chunks, then embed and store them; when a question arrives we retrieve the closest chunks and pass them to the model to generate the answer.',
              topic: 'rag-pipeline',
            },
            {
              question: 'Complete the method that keeps the top three chunks after sorting:',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet:
                'const top = chunks\n  .map((c) => ({ ...c, score: cosine(queryEmbedding, c.embedding) }))\n  .sort((a, b) => b.score - a.score)\n  .___(0, 3);',
              correctAnswer: 'slice',
              explanation: 'slice(0, 3) returns a copy with the first three items without changing the array; after sorting descending, those are the most similar.',
              topic: 'rag-pipeline',
            },
          ],
        },
      ],
    },
  ],
};
