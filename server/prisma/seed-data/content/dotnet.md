=== lesson: cs-basics ===
## C# in a nutshell

**C#** is a modern, statically typed language that runs on **.NET**. It's used to build web APIs, desktop apps, games and cloud services.

Create a new project from the terminal:

```bash
dotnet new console -n HelloCodePath
cd HelloCodePath
dotnet run
```

## Variables and types

```csharp
int lessons = 12;              // whole number
double rating = 4.7;           // floating-point number
decimal price = 199.99m;       // precise money values
bool isPublished = true;
string title = "C# Basics";
var students = 250;            // the compiler infers the type: int
```

**Notes:**

- `var` doesn't mean "dynamic type"; the type is fixed at compile time and never changes.
- Use `decimal` (with the `m` suffix) for money to avoid `double` rounding errors.

## Integer arithmetic

Dividing two integers returns an **integer** (the fractional part is dropped):

```csharp
int a = 7, b = 2;
Console.WriteLine(a / b);          // 3
Console.WriteLine(a % b);          // 1 (remainder)
Console.WriteLine((double)a / b);  // 3.5
```

## String interpolation

```csharp
string name = "Maryam";
int score = 95;
Console.WriteLine($"Well done, {name}! You scored {score}%");
```

=== lesson: cs-classes ===
## Classes and objects

A class is a template describing data and behaviour; an object is an instance of it:

```csharp
public class Course
{
    public string Title { get; set; }
    public int Lessons { get; private set; }

    public Course(string title)
    {
        Title = title;
    }

    public void AddLesson() => Lessons++;
}

var course = new Course("ASP.NET Core");
course.AddLesson();
Console.WriteLine($"{course.Title}: {course.Lessons}"); // ASP.NET Core: 1
```

**Code walkthrough:**

- `{ get; set; }` is a property that can be read and written.
- `private set` allows changes from inside the class only, an example of **encapsulation**.
- The constructor has the class's name and runs on `new`.

## Records

A `record` is a type designed for data. It compares objects **by value** instead of by reference, and is immutable by default:

```csharp
public record Student(string Name, int Level);

var s1 = new Student("Khaled", 2);
var s2 = new Student("Khaled", 2);
Console.WriteLine(s1 == s2);      // True: same values

var s3 = s1 with { Level = 3 };   // modified copy, original unchanged
```

If `Student` were a regular `class`, the comparison would be `False`, because they are two different objects in memory.

## Interfaces

An interface is a contract describing what a class must provide; it's the foundation of dependency injection later on:

```csharp
public interface INotifier
{
    void Send(string message);
}

public class EmailNotifier : INotifier
{
    public void Send(string message) => Console.WriteLine($"Email: {message}");
}
```

=== lesson: linq ===
## What is LINQ?

**LINQ** (Language Integrated Query) is a unified, readable way to query collections and databases from C#.

```csharp
var students = new List<Student>
{
    new("Sara", 91),
    new("Ahmed", 68),
    new("Noura", 84),
};

var topNames = students
    .Where(s => s.Score >= 80)       // filter
    .OrderByDescending(s => s.Score) // sort descending
    .Select(s => s.Name)             // project: keep only the name
    .ToList();

// ["Sara", "Noura"]

public record Student(string Name, int Score);
```

## Key operators

| Operator | What it does |
| --- | --- |
| `Where` | Filter items by a condition |
| `Select` | Transform each item into a new shape |
| `OrderBy` / `OrderByDescending` | Sort |
| `First` / `FirstOrDefault` | First item (or a default value) |
| `Any` / `All` | Does any item match? Do all items match? |
| `GroupBy` | Group by a key |
| `Sum` / `Average` / `Count` | Numeric aggregates |

## Deferred execution

Most LINQ queries **don't run** when they're defined, but when you enumerate the results (with `foreach`, `ToList()` or `Count()`):

```csharp
var numbers = new List<int> { 1, 2, 3 };
var query = numbers.Where(n => n > 1);  // not executed yet

numbers.Add(10);

Console.WriteLine(query.Count());       // 3, because 10 was added before execution
```

> Call `ToList()` when you want to "freeze" the results at a specific moment or avoid running the query more than once.

=== lesson: minimal-api ===
## Minimal APIs

**ASP.NET Core** lets you build lightweight HTTP APIs with very little code:

```bash
dotnet new web -n CoursesApi
```

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var courses = new List<Course>
{
    new(1, "C# Basics"),
    new(2, "LINQ"),
};

app.MapGet("/courses", () => courses);

app.MapGet("/courses/{id:int}", (int id) =>
{
    var course = courses.FirstOrDefault(c => c.Id == id);
    return course is null ? Results.NotFound() : Results.Ok(course);
});

app.MapPost("/courses", (Course course) =>
{
    courses.Add(course);
    return Results.Created($"/courses/{course.Id}", course);
});

app.Run();

public record Course(int Id, string Title);
```

**Code walkthrough:**

- `MapGet` and `MapPost` bind a route and HTTP verb to a handler.
- `{id:int}` is a route constraint that accepts integers only.
- ASP.NET Core converts the JSON request body into a `Course` automatically (model binding).
- `Results.NotFound()` returns **404**, and `Results.Created` returns **201** with a `Location` header.

## Common status codes

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 400 | Bad request |
| 401 | Not authenticated |
| 403 | Forbidden |
| 404 | Not found |

=== lesson: dependency-injection ===
## Dependency injection

Instead of a class creating its dependencies with `new`, it **receives** them from outside. This makes code testable and easy to swap.

```csharp
public interface IGradeService
{
    string Evaluate(int score);
}

public class GradeService : IGradeService
{
    public string Evaluate(int score) => score >= 70 ? "Pass" : "Needs review";
}
```

Register the service with the container, then request it in an endpoint:

```csharp
builder.Services.AddScoped<IGradeService, GradeService>();

app.MapGet("/grade/{score:int}", (int score, IGradeService grades) =>
    Results.Ok(new { result = grades.Evaluate(score) }));
```

## Service lifetimes

| Method | Instance lifetime | Good fit |
| --- | --- | --- |
| `AddTransient` | A new instance every time it's requested | Lightweight, stateless services |
| `AddScoped` | One instance per HTTP request | Entity Framework's `DbContext` |
| `AddSingleton` | One instance for the app's lifetime | Configuration, caches |

**A common mistake:** don't inject a `Scoped` service into a `Singleton`, because the singleton would hold on to an instance that should end with the request.
