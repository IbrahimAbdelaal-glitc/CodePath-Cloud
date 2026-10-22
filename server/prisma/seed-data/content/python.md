=== lesson: py-basics ===
## Why Python?

**Python** is a readable, flexible language that's widely used for backend development, data analysis and AI. It uses **indentation** instead of braces to define blocks.

```bash
python -m venv .venv
source .venv/bin/activate   # on Windows: .venv\Scripts\activate
python --version
```

## Basic types and operators

```python
title = "Python Basics"   # str
lessons = 8               # int
rating = 4.8              # float
is_free = True            # bool

print(7 / 2)    # 3.5  regular division always returns a float
print(7 // 2)   # 3    floor division
print(7 % 2)    # 1    remainder
print(2 ** 3)   # 8    exponent
```

## Lists

A list is an ordered, mutable collection:

```python
langs = ["Python", "SQL", "Git"]
langs.append("Docker")

print(langs[0])     # Python   indexing starts at 0
print(langs[-1])    # Docker   negative indexes count from the end
print(langs[1:3])   # ['SQL', 'Git']  slices exclude the end index
```

## Dictionaries

```python
student = {"name": "Reem", "score": 88}
student["level"] = "intermediate"
print(student.get("email", "not provided"))  # default if the key is missing
```

## List comprehensions

A short, readable way to build a new list from another:

```python
scores = [55, 90, 72, 40]
passed = [s for s in scores if s >= 60]     # [90, 72]
squares = [n * n for n in range(5)]         # [0, 1, 4, 9, 16]
```

=== lesson: py-functions ===
## Defining functions

```python
def greet(name, greeting="Hello"):
    """Return a greeting. This is a docstring."""
    return f"{greeting}, {name}"

print(greet("Ali"))                  # Hello, Ali
print(greet("Ali", greeting="Hi"))   # keyword argument
```

Strings prefixed with `f` let you embed variables inside `{}`.

## Flexible parameters

```python
def total(*numbers):          # numbers is a tuple of all positional arguments
    return sum(numbers)

def profile(**info):          # info is a dict of all keyword arguments
    for key, value in info.items():
        print(key, "=", value)

total(1, 2, 3)                 # 6
profile(name="Salma", city="Jeddah")
```

## The mutable default argument trap

A default value is created **once**, when the function is defined, not on every call:

```python
def add_item(item, items=[]):   # ⚠️ common mistake
    items.append(item)
    return items

add_item("a")
print(add_item("b"))   # ['a', 'b']  the same list is shared between calls!
```

The correct approach:

```python
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

## Type hints

Python doesn't enforce them at runtime, but they document your code and tools like FastAPI use them:

```python
def average(scores: list[float]) -> float:
    return sum(scores) / len(scores)
```

=== lesson: py-classes ===
## Classes in Python

```python
class Course:
    platform = "CodePath"          # class attribute shared by all objects

    def __init__(self, title, lessons=0):
        self.title = title         # instance attribute
        self.lessons = lessons

    def add_lesson(self):
        self.lessons += 1

    def __str__(self):
        return f"{self.title} ({self.lessons} lessons)"

course = Course("FastAPI")
course.add_lesson()
print(course)   # FastAPI (1 lessons)
```

**Code walkthrough:**

- `__init__` is the initialiser, called automatically when an object is created.
- `self` refers to the current object and must be the first parameter of instance methods.
- `__str__` controls how the object looks when printed.

## Inheritance and polymorphism

```python
class Notifier:
    def send(self, message):
        raise NotImplementedError

class EmailNotifier(Notifier):
    def send(self, message):
        return f"Email: {message}"

class SmsNotifier(Notifier):
    def send(self, message):
        return f"SMS: {message}"

for n in [EmailNotifier(), SmsNotifier()]:
    print(n.send("A new lesson is available"))
```

Each subclass **overrides** `send`, and Python calls the right method based on the object's actual type. That's **polymorphism**.

## Dataclasses

```python
from dataclasses import dataclass

@dataclass
class Student:
    name: str
    score: int = 0

print(Student("Huda", 90))  # Student(name='Huda', score=90)
```

=== lesson: fastapi-intro ===
## What is FastAPI?

**FastAPI** is a modern framework for building APIs in Python. It uses type hints to validate input and generate documentation automatically.

```bash
pip install "fastapi[standard]"
fastapi dev main.py
```

## Your first API

```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

courses = {1: "Python Basics", 2: "FastAPI"}

@app.get("/courses")
def list_courses():
    return [{"id": cid, "title": t} for cid, t in courses.items()]

@app.get("/courses/{course_id}")
def read_course(course_id: int):
    if course_id not in courses:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"id": course_id, "title": courses[course_id]}
```

**Code walkthrough:**

- The `@app.get` decorator binds the route to the GET verb.
- `course_id: int` makes FastAPI convert and validate that part of the path; if a user requests `/courses/abc`, FastAPI automatically responds with **422** and a description of the error.
- `HTTPException` returns clear HTTP errors.

## Query parameters

Any function parameter that isn't part of the path is treated as a query parameter:

```python
@app.get("/search")
def search(q: str, limit: int = 10):
    return {"query": q, "limit": limit}
# /search?q=python&limit=5
```

> Once it's running, open `/docs` to see interactive documentation generated automatically (Swagger UI).

=== lesson: pydantic ===
## Validating data with Pydantic

FastAPI uses **Pydantic** to define the shape of data and validate it:

```python
from pydantic import BaseModel, Field

class LessonIn(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    minutes: int = Field(gt=0, le=300)
    tags: list[str] = []
```

Then use the model as a request-body parameter:

```python
@app.post("/lessons", status_code=201)
def create_lesson(lesson: LessonIn):
    return {"saved": True, "title": lesson.title}
```

If a client sends `minutes: -5`, FastAPI rejects the request with **422** automatically, without you writing any validation code.

## Automatic type coercion

In the default (lax) mode, Pydantic converts compatible values:

```python
lesson = LessonIn(title="Intro", minutes="45")
print(lesson.minutes + 5)   # 50, because "45" was converted to an int
```

A value like `"five"` fails validation because it doesn't represent a number.

## Response models

Keep what you accept separate from what you return, so you never leak sensitive fields:

```python
class UserOut(BaseModel):
    id: int
    name: str
    # never include password_hash here

@app.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int):
    return find_user(user_id)   # any extra fields are removed from the response
```
