const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export default {
  roadmap: {
    slug: 'frontend',
    title: 'Frontend Development',
    summary: 'From semantic HTML to interactive, responsive React apps.',
    description:
      'A complete path that starts with building semantic, well-styled web pages, goes deep into modern JavaScript and asynchronous programming, and ends with building interactive interfaces in React. Ideal if you want to break into web development from scratch.',
    category: 'Frontend',
    difficulty: 'BEGINNER',
    prerequisites: ['Basic computer and web browser skills', 'A code editor such as VS Code'],
    isFeatured: true,
    order: 1,
  },
  modules: [
    {
      key: 'html-css',
      title: 'HTML and CSS Fundamentals',
      description: 'Build accessible, semantic pages and style them with flexible layouts.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'html-semantic',
          title: 'Semantic HTML Page Structure',
          summary: 'How to choose the right element for each part of a page, and why it matters.',
          difficulty: 'BEGINNER',
          estimatedMinutes: 20,
          keyTakeaways: [
            'Semantic elements describe what content means, not how it looks.',
            'The <main> element appears only once per page.',
            'The lang attribute tells browsers and screen readers the page language.',
            'Order headings h1 to h6 logically without skipping levels.',
          ],
          resources: [
            { title: 'HTML elements reference on MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element', type: 'DOCUMENTATION' },
            { title: 'Learn Accessibility on web.dev', url: 'https://web.dev/learn/accessibility', type: 'ARTICLE' },
            { title: 'Video tutorials on semantic HTML', url: yt('semantic HTML tutorial'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'Which element is best for wrapping the unique main content of a page?',
              questionType: 'MULTIPLE_CHOICE',
              options: ['<div id="main">', '<main>', '<section>', '<article>'],
              correctAnswer: '<main>',
              explanation:
                '<main> is meant for the unique main content and appears once; screen readers use it to jump straight to the content. A <div> carries no semantic meaning.',
              topic: 'html-semantics',
            },
            {
              question: 'Complete the correct closing tag for the navigation:',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet: '<nav aria-label="Main navigation">\n  <ul>\n    <li><a href="/">Home</a></li>\n  </ul>\n</___>',
              correctAnswer: 'nav',
              explanation: 'Every element is closed with its own name; we opened <nav>, so we close it with </nav>.',
              topic: 'html-semantics',
            },
          ],
        },
        {
          key: 'css-layout',
          title: 'The Box Model and Flexbox Layout',
          summary: 'Understand how element sizes are calculated and how to arrange them flexibly.',
          difficulty: 'BEGINNER',
          estimatedMinutes: 30,
          keyTakeaways: [
            'An element is content, then padding, then border, then margin.',
            'box-sizing: border-box makes the width include padding and border.',
            'justify-content works on the main axis; align-items on the cross axis.',
            'Logical properties such as margin-inline-end adapt to the writing direction.',
          ],
          resources: [
            { title: 'Basic concepts of Flexbox on MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox', type: 'DOCUMENTATION' },
            { title: 'A Complete Guide to Flexbox (CSS-Tricks)', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', type: 'ARTICLE' },
            { title: 'Video tutorials on Flexbox', url: yt('CSS Flexbox tutorial'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'What total width does the element take up on screen (excluding margin)? Include the unit.',
              questionType: 'CODE_OUTPUT',
              codeSnippet: '.card {\n  box-sizing: content-box;\n  width: 200px;\n  padding: 10px;\n  border: 5px solid;\n}',
              correctAnswer: '230px',
              acceptedAnswers: ['230', '230 px'],
              explanation:
                'With content-box, width covers the content only, so we add padding on both sides (10×2) and border on both sides (5×2): 200 + 20 + 10 = 230px.',
              topic: 'css-box-model',
            },
            {
              question: 'Which property distributes Flexbox items along the main axis?',
              questionType: 'MULTIPLE_CHOICE',
              options: ['align-items', 'justify-content', 'flex-direction', 'flex-wrap'],
              correctAnswer: 'justify-content',
              explanation:
                'justify-content controls distribution along the main axis, align-items works on the cross axis, and flex-direction sets the direction of the axis itself.',
              topic: 'css-flexbox',
            },
            {
              question: 'Complete the missing value to lay items out in a flexible row:',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet: '.row {\n  display: ___;\n  gap: 1rem;\n}',
              correctAnswer: 'flex',
              acceptedAnswers: ['inline-flex'],
              explanation: 'display: flex turns the element into a flex container, and gap adds space between the items.',
              topic: 'css-flexbox',
            },
          ],
        },
      ],
    },
    {
      key: 'js-core',
      title: 'JavaScript Fundamentals',
      description: 'Variables, types, functions, closures and arrays.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'js-variables',
          title: 'Variables and Types',
          summary: 'let and const, primitive types, and implicit coercion.',
          difficulty: 'BEGINNER',
          estimatedMinutes: 25,
          keyTakeaways: [
            'Use const by default and let when the value needs to change.',
            'const prevents reassignment but does not freeze an object’s contents.',
            'typeof null returns "object" because of a historical bug.',
            'Always use === to avoid implicit coercion.',
          ],
          resources: [
            { title: 'JavaScript data types on MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures', type: 'DOCUMENTATION' },
            { title: 'Variables on javascript.info', url: 'https://javascript.info/variables', type: 'ARTICLE' },
            { title: 'Video tutorials on JavaScript variables', url: yt('JavaScript let const tutorial'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'What does this code print? Write each result on its own line.',
              questionType: 'CODE_OUTPUT',
              codeSnippet: 'console.log(typeof null);\nconsole.log(typeof []);',
              correctAnswer: 'object\nobject',
              explanation:
                'typeof null returns "object" because of a historical bug in the language, and arrays are objects, so typeof [] also returns "object". Use Array.isArray to check for arrays.',
              topic: 'js-types',
            },
            {
              question: 'Which statement about const is correct?',
              questionType: 'MULTIPLE_CHOICE',
              options: [
                'It makes an object completely immutable',
                'It prevents reassignment, but an object’s properties can still change',
                'It is exactly like var but faster',
                'It cannot be used with arrays',
              ],
              correctAnswer: 'It prevents reassignment, but an object’s properties can still change',
              explanation:
                'const fixes the binding only. You can modify the properties of an object or the items of an array declared with const, but you cannot assign a new value to the variable itself.',
              topic: 'js-variables',
            },
            {
              question: 'What does this code print? Write each result on its own line.',
              questionType: 'CODE_OUTPUT',
              codeSnippet: 'console.log(0.1 + 0.2 === 0.3);\nconsole.log("5" + 3);\nconsole.log("5" - 3);',
              correctAnswer: 'false\n53\n2',
              explanation:
                '0.1 + 0.2 equals 0.30000000000000004 because of floating-point representation. + with a string concatenates, giving "53", while - converts the string to a number, giving 2.',
              topic: 'js-types',
            },
          ],
        },
        {
          key: 'js-functions',
          title: 'Functions and Closures',
          summary: 'Ways to define functions, scope, and how a function remembers its variables.',
          difficulty: 'INTERMEDIATE',
          estimatedMinutes: 30,
          keyTakeaways: [
            'A single-expression arrow function returns that expression automatically.',
            'let and const are block-scoped.',
            'A closure lets a function remember variables from the scope it was created in.',
            'Each call to a factory function creates an independent closure.',
          ],
          resources: [
            { title: 'Closures on MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures', type: 'DOCUMENTATION' },
            { title: 'Variable scope and closures on javascript.info', url: 'https://javascript.info/closure', type: 'ARTICLE' },
            { title: 'Video tutorials on closures', url: yt('JavaScript closures explained'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'What does this code print?',
              questionType: 'CODE_OUTPUT',
              codeSnippet:
                'function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\n\nconst counter = makeCounter();\ncounter();\ncounter();\nconsole.log(counter());',
              correctAnswer: '3',
              explanation:
                'The returned function keeps a reference to count through a closure. Each call increments it: 1, then 2, then 3, and the third call is the one printed.',
              topic: 'js-closures',
            },
            {
              question: 'Complete the missing symbol to define an arrow function:',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet: 'const add = (a, b) ___ a + b;',
              correctAnswer: '=>',
              explanation: 'An arrow function uses => between its parameters and its body, and returns the expression directly.',
              topic: 'js-functions',
            },
            {
              question: 'Which is the most accurate description of a closure?',
              questionType: 'MULTIPLE_CHOICE',
              options: [
                'A function that closes itself after running',
                'A function’s ability to access variables from the scope it was created in, after that scope has finished',
                'A way to stop a function running more than once',
                'A try/catch block around a function',
              ],
              correctAnswer: 'A function’s ability to access variables from the scope it was created in, after that scope has finished',
              explanation:
                'A closure is a function bundled with the lexical environment it was created in, so that environment’s variables stay available even after the outer function returns.',
              topic: 'js-closures',
            },
          ],
        },
        {
          key: 'js-arrays',
          title: 'Arrays and Higher-Order Functions',
          summary: 'map, filter and reduce, chained readably.',
          difficulty: 'INTERMEDIATE',
          estimatedMinutes: 25,
          keyTakeaways: [
            'map transforms, filter selects, and reduce collapses to a single value.',
            'These methods do not modify the original array.',
            'Always give reduce an initial value.',
            'Chaining makes data processing clear and readable.',
          ],
          resources: [
            { title: 'Array.prototype.reduce on MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce', type: 'DOCUMENTATION' },
            { title: 'Array methods on javascript.info', url: 'https://javascript.info/array-methods', type: 'ARTICLE' },
            { title: 'Video tutorials on map, filter and reduce', url: yt('JavaScript map filter reduce tutorial'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'What does this code print?',
              questionType: 'CODE_OUTPUT',
              codeSnippet:
                'const nums = [1, 2, 3, 4];\nconst result = nums\n  .filter((n) => n % 2 === 0)\n  .map((n) => n * 10);\nconsole.log(result.join(","));',
              correctAnswer: '20,40',
              explanation: 'filter keeps the even numbers [2, 4], map multiplies each by 10 to get [20, 40], and join combines them with a comma.',
              topic: 'js-arrays',
            },
            {
              question: 'Complete the name of the method that combines the array into a single value:',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet: 'const total = [5, 10, 15].___((sum, n) => sum + n, 0);\n// total = 30',
              correctAnswer: 'reduce',
              explanation: 'reduce walks the items carrying an accumulated value (sum) that starts at 0, giving 30.',
              topic: 'js-arrays',
            },
          ],
        },
      ],
    },
    {
      key: 'js-async',
      title: 'Asynchronous JavaScript',
      description: 'Promises, async/await and fetching data from servers.',
      difficulty: 'INTERMEDIATE',
      prerequisites: ['js-core'],
      lessons: [
        {
          key: 'js-async',
          title: 'Promises and async/await',
          summary: 'How JavaScript handles long-running work without freezing the UI.',
          difficulty: 'INTERMEDIATE',
          estimatedMinutes: 35,
          keyTakeaways: [
            'A Promise represents a value that will be available later.',
            'An async function always returns a Promise.',
            'Use try/catch with await to handle errors.',
            'Microtasks (then) run before setTimeout.',
          ],
          resources: [
            { title: 'Using promises on MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises', type: 'DOCUMENTATION' },
            { title: 'async/await on javascript.info', url: 'https://javascript.info/async-await', type: 'ARTICLE' },
            { title: 'Video tutorials on the event loop', url: yt('JavaScript event loop explained'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'What does this code print? Write each result on its own line.',
              questionType: 'CODE_OUTPUT',
              codeSnippet:
                'console.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");',
              correctAnswer: 'A\nD\nC\nB',
              explanation:
                'Synchronous code runs first (A then D), then microtasks such as then (C), and finally tasks such as setTimeout (B), even with a zero delay.',
              topic: 'js-promises',
            },
            {
              question: 'Complete the missing keyword to wait for the request result:',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet: 'async function loadUser() {\n  const response = ___ fetch("/api/user");\n  return response.json();\n}',
              correctAnswer: 'await',
              explanation: 'await pauses the async function until the promise settles, then returns its value, without freezing the UI.',
              topic: 'js-async-await',
            },
            {
              question: 'What does any function declared with async return?',
              questionType: 'MULTIPLE_CHOICE',
              options: ['The value directly', 'Always a Promise', 'Always undefined', 'A new function'],
              correctAnswer: 'Always a Promise',
              explanation: 'An async function always wraps its return value in a Promise; if it throws, the promise is rejected.',
              topic: 'js-async-await',
            },
          ],
        },
        {
          key: 'js-fetch',
          title: 'Fetching Data with Fetch',
          summary: 'Sending requests, handling responses, and UI states.',
          difficulty: 'INTERMEDIATE',
          estimatedMinutes: 25,
          keyTakeaways: [
            'fetch does not reject on 404 or 500; check response.ok.',
            'Use JSON.stringify with a Content-Type header when sending JSON.',
            'Always handle loading, error and success states.',
          ],
          resources: [
            { title: 'Using Fetch on MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch', type: 'DOCUMENTATION' },
            { title: 'Fetch on javascript.info', url: 'https://javascript.info/fetch', type: 'ARTICLE' },
            { title: 'Video tutorials on the Fetch API', url: yt('JavaScript Fetch API tutorial'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'When the server responds with status 404, what happens to the promise returned by fetch?',
              questionType: 'MULTIPLE_CHOICE',
              options: [
                'It is rejected automatically',
                'It resolves successfully, and you must check response.ok yourself',
                'fetch retries automatically',
                'The browser stops running the page',
              ],
              correctAnswer: 'It resolves successfully, and you must check response.ok yourself',
              explanation:
                'fetch only rejects when the network fails. Any response from the server, even 404 or 500, resolves the promise, so we check response.ok or response.status.',
              topic: 'js-fetch',
            },
            {
              question: 'Complete the property that indicates a successful response (status 200–299):',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet: 'const res = await fetch(url);\nif (!res.___) {\n  throw new Error("Request failed");\n}',
              correctAnswer: 'ok',
              explanation: 'response.ok is true when the status code is between 200 and 299.',
              topic: 'js-fetch',
            },
          ],
        },
      ],
    },
    {
      key: 'react',
      title: 'Building Interfaces with React',
      description: 'Components, JSX, state and side effects.',
      difficulty: 'ADVANCED',
      prerequisites: ['html-css', 'js-async'],
      lessons: [
        {
          key: 'react-components',
          title: 'Components and JSX',
          summary: 'Build the UI from small, reusable components.',
          difficulty: 'INTERMEDIATE',
          estimatedMinutes: 30,
          keyTakeaways: [
            'A component is a function that takes props and returns JSX.',
            'Use className instead of class.',
            'Each item in a list needs a unique, stable key.',
            'Component names start with a capital letter.',
          ],
          resources: [
            { title: 'The official React tutorial', url: 'https://react.dev/learn', type: 'DOCUMENTATION' },
            { title: 'Rendering lists in React', url: 'https://react.dev/learn/rendering-lists', type: 'ARTICLE' },
            { title: 'Video tutorials on React for beginners', url: yt('React tutorial for beginners'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'Why do we write className instead of class in JSX?',
              questionType: 'MULTIPLE_CHOICE',
              options: [
                'Because class is a reserved word in JavaScript',
                'Because className renders faster',
                'Because React does not support CSS',
                'There is no difference at all',
              ],
              correctAnswer: 'Because class is a reserved word in JavaScript',
              explanation: 'JSX compiles to JavaScript, where class is reserved for defining classes, so React uses the name className.',
              topic: 'react-jsx',
            },
            {
              question: 'Complete the prop React needs to tell list items apart:',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet:
                'function List({ items }) {\n  return (\n    <ul>\n      {items.map((item) => (\n        <li ___={item.id}>{item.name}</li>\n      ))}\n    </ul>\n  );\n}',
              correctAnswer: 'key',
              explanation: 'The key prop helps React identify which items changed, were added or were removed, so it can update the UI efficiently.',
              topic: 'react-components',
            },
          ],
        },
        {
          key: 'react-state',
          title: 'State and Hooks',
          summary: 'useState, useEffect, and how React re-renders the UI.',
          difficulty: 'ADVANCED',
          estimatedMinutes: 35,
          keyTakeaways: [
            'Changing state re-renders the component.',
            'A state value is fixed within a single render.',
            'Use an updater function, prev => prev + 1, when relying on the previous value.',
            'useEffect’s dependency array decides when it re-runs.',
          ],
          resources: [
            { title: 'State: a component’s memory', url: 'https://react.dev/learn/state-a-components-memory', type: 'DOCUMENTATION' },
            { title: 'useEffect reference', url: 'https://react.dev/reference/react/useEffect', type: 'DOCUMENTATION' },
            { title: 'Video tutorials on React hooks', url: yt('React hooks useState useEffect tutorial'), type: 'VIDEO' },
          ],
          quizzes: [
            {
              question: 'After one click on the button, what is the value of count?',
              questionType: 'CODE_OUTPUT',
              codeSnippet:
                'function Counter() {\n  const [count, setCount] = useState(0);\n\n  function handleClick() {\n    setCount(count + 1);\n    setCount(count + 1);\n    setCount(count + 1);\n  }\n\n  return <button onClick={handleClick}>{count}</button>;\n}',
              options: ['0', '1', '3'],
              correctAnswer: '1',
              explanation:
                'count is fixed at 0 within this render, so every call asks to set it to 1. To get 3, use setCount((c) => c + 1).',
              topic: 'react-state',
            },
            {
              question: 'Complete the dependency array so the title updates only when count changes:',
              questionType: 'FILL_IN_THE_BLANK',
              codeSnippet: 'useEffect(() => {\n  document.title = "You have " + count + " messages";\n}, [___]);',
              correctAnswer: 'count',
              explanation: 'The effect re-runs when any value in the dependency array changes, and this effect depends only on count.',
              topic: 'react-effects',
            },
          ],
        },
      ],
    },
  ],
};
