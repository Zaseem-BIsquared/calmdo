# Project Overview

This is a project management tool called **Calmdo**, built with the PETAL (Phoenix, Elixir, TailwindCSS, Alpine.js, LiveView) stack. It uses the [Ash framework](https://ash-hq.org/) for resource-oriented development, which provides a powerful way to model and interact with data.

The primary resource is `Project`, which has a `name` and a `completed` status. The application is in its early stages, with a single LiveView for managing projects.

## Building and Running

### Prerequisites

-   [Elixir](https://elixir-lang.org/install.html)
-   [Erlang](https://www.erlang.org/downloads)
-   [PostgreSQL](https://www.postgresql.org/download/)

### Setup

To set up the project for the first time, run:

```bash
mix setup
```

This command will:

1.  Install all dependencies.
2.  Set up the Ash resources.
3.  Install and build the CSS and JavaScript assets.
4.  Create and migrate the database.
5.  Seed the database with initial data.

### Running the Server

To start the Phoenix server, run:

```bash
mix phx.server
```

The application will be available at [http://localhost:4000](http://localhost:4000).

### Running Tests

To run the test suite, use the following command:

```bash
mix test
```

The `test` alias is configured to set up the test database correctly before running the tests.

## Development Conventions

### Ash Framework

The application uses the Ash framework for data modeling and business logic. Resources are defined in the `lib/calmdo` directory. The main resource is `Calmdo.Work.Project`.

### Styling

When styling components, prioritize using daisyUI components and classes. If a suitable daisyUI component is not available, fall back to using Tailwind CSS utility classes to create custom styles.

#### Conditional Classes in HEEx

To conditionally apply a class to an element in a HEEx template, use a list for the `class` attribute. The `if/2` helper can be used inside the list to conditionally add a class name. This is the preferred and correct syntax.

*Example:*
```html
<div class={[
  "modal",
  "modal-bottom",
  if(@show_modal, do: "modal-open", else: "")
]}>
  ...
</div>
```

### Code Formatting

The project uses the standard Elixir formatter. To format the code, run:

```bash
mix format
```

### Pre-commit Hook

A `precommit` alias is available to run a series of checks before committing code:

```bash
mix precommit
```

This will compile the code with warnings as errors, check for unused dependencies, format the code, and run the test suite.
