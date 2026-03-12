# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Open Browser is an AI-powered autonomous web browsing framework for TypeScript. AI agents control a Playwright browser to navigate, interact, extract data, and complete tasks without manual scripting.

## Commands

```bash
bun install                    # Install dependencies
bun run build                  # Type-check all packages (tsc --noEmit)
bun run test                   # Run all tests (bun test across all packages)
bun run lint                   # Lint with Biome
bun run format                 # Format with Biome (--write)

# Run a single test file
bun test packages/core/src/agent/agent.test.ts

# CLI
bun run packages/cli/src/index.ts run "task description"
bun run packages/cli/src/index.ts interactive
```

## Architecture

Bun monorepo with three packages:

- **`packages/core`** (`open-browser`) — Core library: agent loop, browser control, DOM analysis, LLM integration, MCP bridge
- **`packages/cli`** (`@open-browser/cli`) — CLI with 10 commands (run, interactive, open, click, type, state, screenshot, eval, extract, sessions)
- **`packages/sandbox`** (`@open-browser/sandbox`) — Resource-limited execution with CPU/memory limits, timeouts, domain restrictions

### Core Package Subsystems

- **`agent/`** — Agent orchestration loop. `Agent` composes Viewport, CommandExecutor, PageAnalyzer, and LanguageModel. Includes stall detection (page hashing), conversation compaction, replay recording, and result evaluation via judge model.
- **`viewport/`** — Playwright browser wrapper with 13 security guard classes (watchdogs) that enforce policies: URL restrictions, popup handling, crash detection, download handling, permissions, etc.
- **`page/`** — DOM analysis pipeline: `SnapshotBuilder` captures DOM via CDP, `TreeRenderer` serializes to text for LLM consumption, `ContentExtractor` converts to markdown.
- **`commands/`** — 25+ browser commands (tap, type, navigate, extract, scroll, tab management, etc.). `CommandCatalog` dynamically builds schemas based on page state. `CommandExecutor` validates and executes.
- **`model/`** — `VercelModelAdapter` wraps Vercel AI SDK for multi-provider LLM support (OpenAI, Anthropic, Google). `SchemaOptimizer` adapts JSON schemas per model capabilities.
- **`bridge/`** — MCP server exposing browser commands as tools and state as resources. Supports stdio and SSE transports.
- **`metering/`** — Token cost tracking with per-model pricing tables and budget enforcement.
- **`config/`** — Agent/viewport configuration schemas with 60+ options.

### Key Design Patterns

- **Guard pattern**: Viewport watchdogs autonomously enforce safety policies
- **Event-driven**: `EventHub` (mitt) for viewport/page events
- **Result type**: `Result<T, E>` for functional error handling
- **Branded types**: `TargetId`, `SessionId`, `ElementRef`, `TabId` for compile-time safety
- **Dynamic schema**: CommandCatalog builds tool schemas from current page state

## Tooling

- **Package manager**: Bun (workspaces)
- **Test runner**: Bun test (60s timeout, configured in bunfig.toml)
- **Linter/Formatter**: Biome — single quotes, trailing commas, semicolons, tab indent, 120-char line width
- **TypeScript**: 5.8, strict mode, ESNext target, bundler module resolution
- **CI**: GitHub Actions — install → build → test → lint

## Environment Variables

Key variables (see `.env.example`): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `BROWSER_HEADLESS`, `OPEN_BROWSER_MODEL`, `OPEN_BROWSER_TIMEOUT`.
