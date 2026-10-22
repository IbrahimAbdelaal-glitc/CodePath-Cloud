=== lesson: html-semantic ===
## Why semantic HTML?

**HTML** doesn't only define what a page looks like; it describes what each part **means**. When you use the right element for each job, search engines, screen readers and other developers can understand your page structure easily.

Compare the two approaches:

```html
<!-- Non-semantic -->
<div class="header">...</div>
<div class="nav">...</div>
<div class="content">...</div>

<!-- Semantic -->
<header>...</header>
<nav aria-label="Main navigation">...</nav>
<main>...</main>
```

In the second example a screen reader knows exactly where the navigation starts and where the main content is, so the user can jump to it with a single key press.

## The most important semantic elements

| Element | Use it for |
| --- | --- |
| `<header>` | The header of a page or section |
| `<nav>` | A group of major navigation links |
| `<main>` | The unique main content; appears **only once** |
| `<article>` | Self-contained content that could be published alone, such as a post or comment |
| `<section>` | A thematic section with a heading |
| `<footer>` | The footer of a page or section |

## A complete page

Note the `lang` attribute on the root element; it tells the browser and assistive technology which language the page is in:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Tech Blog</title>
  </head>
  <body>
    <header>
      <h1>My Tech Blog</h1>
    </header>
    <main>
      <article>
        <h2>An introduction to the web</h2>
        <p>The web is built on three technologies: HTML, CSS and JavaScript.</p>
      </article>
    </main>
    <footer>All rights reserved</footer>
  </body>
</html>
```

**Code walkthrough:** `<meta charset="UTF-8">` makes every character display correctly, and the `viewport` tag makes the page responsive on phones.

> Tip: use headings `<h1>` to `<h6>` in a logical order without skipping levels; they form the page's "table of contents" for screen readers.

=== lesson: css-layout ===
## The box model

Every element on the page is a box made of four layers, from the inside out: **content**, then **padding**, then **border**, then **margin**.

```css
.card {
  width: 200px;
  padding: 16px;
  border: 2px solid #0e7c66;
  margin: 24px;
}
```

By default `box-sizing: content-box` applies, so `width` covers the content only, and the visible width becomes:
`200 + 16×2 + 2×2 = 236px`.

That's why most developers start every project with this rule:

```css
*,
*::before,
*::after {
  box-sizing: border-box; /* width includes padding and border */
}
```

## Layout with Flexbox

**Flexbox** is a one-dimensional layout system: it arranges items in a row or a column.

```css
.toolbar {
  display: flex;
  justify-content: space-between; /* distribution on the main axis */
  align-items: center;            /* alignment on the cross axis */
  gap: 1rem;                      /* fixed space between items */
  flex-wrap: wrap;                /* allow wrapping on small screens */
}
```

**Code walkthrough:**

- `justify-content` controls distribution along the **main axis** (horizontal by default).
- `align-items` controls alignment along the **cross axis**.
- `flex-direction: column` swaps the axes, so `justify-content` then works vertically.

## Logical properties

Instead of `margin-left`, prefer logical properties that adapt to the writing direction:

```css
.icon {
  margin-inline-end: 0.5rem; /* the "end" side of the line */
  padding-block: 0.25rem;    /* top and bottom */
}
```

=== lesson: js-variables ===
## Declaring variables

Modern JavaScript uses `let` and `const`, and avoids the older `var`.

```js
const siteName = "CodePath";  // cannot be reassigned
let score = 0;                 // can change
score = score + 10;
```

- Use `const` by default, and switch to `let` only when you need to change the value.
- `const` prevents **reassignment**, but it doesn't freeze objects:

```js
const user = { name: "Layla" };
user.name = "Sara";     // allowed: we changed a property inside the object
// user = {};           // error: a const cannot be reassigned
```

## Primitive types

| Type | Example |
| --- | --- |
| `string` | `"hello"` |
| `number` | `42` and `3.14` |
| `boolean` | `true` and `false` |
| `undefined` | a variable that was never assigned |
| `null` | an intentional absence of value |
| `object` | `{}` and `[]` |

Use `typeof` to find a value's type, and watch out for two famous cases:

```js
typeof "text";   // "string"
typeof 42;       // "number"
typeof null;     // "object"  ← a historical bug in the language
typeof [];       // "object"  ← arrays are objects
Array.isArray([]); // true    ← the right way to check for an array
```

## Implicit type coercion

The `+` operator with a string **concatenates**, while other arithmetic operators convert the string to a number:

```js
"5" + 3;   // "53"
"5" - 3;   // 2
0.1 + 0.2 === 0.3; // false because of floating-point precision
```

**Golden rule:** always use strict equality `===` instead of `==` to avoid surprising conversions.

=== lesson: js-functions ===
## Ways to define functions

```js
// Function declaration
function add(a, b) {
  return a + b;
}

// Arrow function
const multiply = (a, b) => a * b;

// Default parameter value
function greet(name = "friend") {
  return "Hello " + name;
}
```

An arrow function with a single expression returns that expression automatically, without `return`.

## Scope

Variables declared with `let` and `const` live inside the **block** `{}` where they were declared:

```js
if (true) {
  const message = "inside the block";
}
// console.log(message); // ReferenceError
```

## Closures

A closure is a function's ability to **remember variables** from the scope it was created in, even after that scope has finished running.

```js
function makeCounter() {
  let count = 0;            // private variable, unreachable from outside
  return function () {
    count += 1;
    return count;
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
```

**Code walkthrough:** `makeCounter` finished running after its last line, but the returned function still holds a reference to `count`. Every call to `makeCounter()` creates an **independent counter** with its own variable.

### Practical uses

- Data privacy (private variables).
- Building specialised functions such as `makeMultiplier(2)`.
- Event handlers that remember their context.

=== lesson: js-arrays ===
## Basic array operations

```js
const langs = ["HTML", "CSS"];
langs.push("JavaScript");   // add to the end
langs.length;               // 3
langs.includes("CSS");      // true
```

## Higher-order functions

Higher-order functions take a **function** as an argument. The three most important ones don't modify the original array; they return a new result:

```js
const prices = [120, 80, 45, 200];

// map: transform every item
const withTax = prices.map((p) => p * 1.15);

// filter: keep the items that match a condition
const cheap = prices.filter((p) => p < 100);   // [80, 45]

// reduce: reduce the array to a single value
const total = prices.reduce((sum, p) => sum + p, 0); // 445
```

**How `reduce` works:** the first parameter, `sum`, is the "accumulator" that carries the running result, and the `0` at the end is its initial value. If you forget the initial value, the accumulator starts with the array's first item.

## Chaining

Because each method returns a new array, you can chain them readably:

```js
const students = [
  { name: "Omar", score: 92 },
  { name: "Hind", score: 67 },
  { name: "Yusuf", score: 81 },
];

const honorRoll = students
  .filter((s) => s.score >= 80)
  .map((s) => s.name)
  .join(", ");

console.log(honorRoll); // Omar, Yusuf
```

=== lesson: js-async ===
## Why asynchronous programming?

JavaScript runs on a **single thread**. If it waited for a network request synchronously, the interface would freeze. Instead, long-running work is scheduled, execution continues, and the result is handled when it's ready.

## Promises

A Promise is an object representing a value that will be available **later**. It has three states: `pending`, then either `fulfilled` or `rejected`.

```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

wait(1000)
  .then(() => console.log("One second passed"))
  .catch((err) => console.error(err));
```

## async and await

The `async/await` syntax makes asynchronous code read like synchronous code:

```js
async function showProfile() {
  try {
    const user = await getUser();          // waits without freezing the UI
    const posts = await getPosts(user.id);
    console.log(user.name, posts.length);
  } catch (error) {
    console.error("Could not load:", error.message);
  }
}
```

- A function declared with `async` **always** returns a Promise.
- `await` is used inside an `async` function (or at the top level of modules).
- To run independent operations in parallel, use `Promise.all`.

## The event loop

Execution order: synchronous code first, then **microtasks** (such as promise `then` callbacks), then **tasks** (such as `setTimeout`).

```js
console.log("1");
setTimeout(() => console.log("4"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("2");
// Output: 1, then 2, then 3, then 4
```

=== lesson: js-fetch ===
## Fetching data with Fetch

`fetch` is built into browsers and modern Node.js, and returns a Promise for a response object.

```js
async function loadCourses() {
  const response = await fetch("https://api.example.com/courses");

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const courses = await response.json();
  return courses;
}
```

**Very important:** `fetch` does **not** reject the promise for error statuses such as 404 or 500; it only rejects when the network itself fails. So always check `response.ok` yourself.

## Sending JSON

```js
await fetch("/api/notes", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "New note" }),
});
```

## The three UI states

When fetching data in a real interface, always handle three states: **loading**, **error** and **success** (plus an "empty" state when there's no data).

```js
let state = { loading: true, error: null, data: null };
try {
  state.data = await loadCourses();
} catch (e) {
  state.error = "Could not load courses, please try again";
} finally {
  state.loading = false;
}
```

=== lesson: react-components ===
## Components

A React app is built from **components**: functions that receive data (props) and return UI written in **JSX**.

```jsx
function CourseCard({ title, lessons }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <p>{lessons} lessons</p>
    </article>
  );
}

export default function App() {
  return <CourseCard title="JavaScript Basics" lessons={12} />;
}
```

## JSX essentials

- Use `className` instead of `class`, because `class` is a reserved word in JavaScript.
- Put any JavaScript expression inside curly braces `{}`.
- A component must return a single root element (or a Fragment `<>...</>`).
- Component names start with a capital letter to distinguish them from HTML elements.

## Rendering lists

To render a list we use `map`, and every item needs a **unique, stable** `key` prop:

```jsx
function LessonList({ lessons }) {
  if (lessons.length === 0) return <p>No lessons yet.</p>;
  return (
    <ul>
      {lessons.map((lesson) => (
        <li key={lesson.id}>{lesson.title}</li>
      ))}
    </ul>
  );
}
```

**Why `key`?** React uses it to work out which items changed, were added or were removed, so it can update the page efficiently. Avoid using the array index as a key if the order of items can change.

=== lesson: react-state ===
## State

State is data a component remembers between renders; changing it re-renders the UI.

```jsx
import { useState } from "react";

function LikeButton() {
  const [likes, setLikes] = useState(0);
  return (
    <button onClick={() => setLikes(likes + 1)}>
      Like ({likes})
    </button>
  );
}
```

### State is a snapshot

The value of state within a given render is **fixed**. So these consecutive calls only add one:

```jsx
setLikes(likes + 1); // likes = 0 → requests 1
setLikes(likes + 1); // likes is still 0 → requests 1
```

For an update based on the previous value, use an **updater function**:

```jsx
setLikes((prev) => prev + 1);
setLikes((prev) => prev + 1); // result: +2
```

## Side effects: useEffect

`useEffect` synchronises a component with external systems such as the network or the page title:

```jsx
import { useEffect } from "react";

function Notifications({ count }) {
  useEffect(() => {
    document.title = "You have " + count + " notifications";
  }, [count]); // re-runs only when count changes

  return <p>Notifications: {count}</p>;
}
```

**The dependency array:** if it's empty `[]` the effect runs once after the first render; if you omit it entirely, the effect runs after **every** render.
