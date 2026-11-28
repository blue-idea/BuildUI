# BuildUI

> **Code builds everything.** BuildUI is a local-first desktop workspace for turning ideas, references, and conversations into working project prototypes.

[English](README.md) · [中文](README.zh-CN.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Français](README.fr.md) · [日本語](README.ja.md)

## Install

### macOS — Homebrew (recommended)

BuildUI is distributed as a Homebrew Cask. Install or update it from Terminal:

```bash
brew update
brew install --cask blue-idea/tap/buildui
```

Update an existing installation:

```bash
brew update
brew upgrade --cask buildui
```

Uninstall:

```bash
brew uninstall --cask buildui
```

If Homebrew is not installed yet, follow the [official Homebrew installation guide](https://brew.sh/), then run the commands above. Homebrew installs `BuildUI.app` for normal use from the Applications folder.

### macOS — release download

Download the latest [`BuildUI.dmg`](https://github.com/blue-idea/BuildUI/releases) and drag `BuildUI.app` into `/Applications`. If macOS blocks the first launch because the downloaded app is quarantined, run:

```bash
xattr -dr com.apple.quarantine /Applications/BuildUI.app
```

Or use the repository installer, which downloads the latest release and installs it into `/Applications`:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/blue-idea/BuildUI/main/scripts/install-mac.sh)"
```

### Other platforms and source builds

Use a platform release when one is available, or build locally with the instructions in [Build from source](#build-from-source).

## Why BuildUI

BuildUI is for the fast, visual part of software creation: describe an idea, shape the product direction, generate a working prototype, and keep refining it through code and preview. It is designed in the same space as Google Stitch, Bolt.new, and v0, while keeping the project workspace on your machine.

BuildUI is **not a replacement for Claude Code, Cursor, or other coding agents**. It is a complementary prototyping layer for teams and individuals who want a local project, a live preview, and a short path from visual intent to editable code.

## Screenshots

![BuildUI home with platform selection, style presets, and model selection](assets/readme/buildui-home.png)

*Start a Web, Desktop, or App prototype from one focused workspace.*

![BuildUI component and tool catalog](assets/readme/buildui-components.png)

*Connect reusable tools and component resources from the component center.*

## Core capabilities

| Capability | What it does |
| --- | --- |
| **Local-first workflow** | Keeps project files, SQLite app data, conversation history, previews, and version snapshots in the local desktop workspace. Remote model traffic only goes to the provider you configure. |
| **Localization** | Provides English and Simplified Chinese UI and model-response instructions. The documentation is available in English, Chinese, Spanish, Portuguese, French, and Japanese. |
| **Custom models and providers** | Configure OpenAI, DeepSeek, local Ollama, or any custom OpenAI-compatible endpoint with its own Base URL, API key, and model name. |
| **Blueprint before code** | Clarifies product features, layout, and visual direction before code generation, then waits for blueprint approval before implementation. |
| **Local sandbox and isolation** | Runs the generated project in a local preview environment and validates production builds inside a temporary detached Git Worktree. This keeps verification changes away from the main workspace. |
| **Automatic code repair** | Runs TypeScript diagnostics and build checks, feeds actionable problems back into the repair loop, and verifies the result before marking a build complete. |
| **Partial redraw and local editing** | Select an element in the live preview, resolve its component path and source region, inspect its box model, and submit a targeted change without rewriting the whole page. |
| **Multi-turn conversation** | Continue a project through incremental prompts, clarification answers, attachments, and follow-up edits while keeping the live preview and changed files in context. |
| **Style extraction and definition** | Start from a brand name, design reference, or uploaded screenshot. Extract a palette, typography, radius, tags, and reusable style prompt, then save it as a Web, App, or Desktop preset. |
| **Component-first projects** | Begin with starter templates and reusable UI primitives, inspect the component behind a preview element, and use the component center to connect tools and component resources. |
| **Live preview and project snapshots** | Run Web, Desktop, and App previews, capture project covers, inspect source code, export a standalone ZIP, and revisit version snapshots. |

## The workflow

1. **Describe the product.** Choose Web, Desktop, or App and describe the prototype in natural language.
2. **Clarify the intent.** Answer optional questions about features, layout, colors, and mood.
3. **Approve the blueprint.** Review the generated design direction before implementation starts.
4. **Build in the local sandbox.** BuildUI writes the project, installs missing dependencies when needed, starts the preview, and verifies the code.
5. **Refine through conversation.** Ask for another page, a new interaction, a different visual direction, or a focused change to one selected component.
6. **Extract and reuse style.** Save a design language as a preset and apply it to future prototypes.
7. **Review and export.** Inspect the preview and source, capture a cover, roll back a snapshot, or export the project.

## Model setup

Open **Settings → Models** to configure a provider:

- **OpenAI** and **DeepSeek** presets for hosted models.
- **Ollama (Local)** for a local model endpoint without an API key.
- **Custom (OpenAI-compatible)** for self-hosted gateways, compatible proxies, or another provider.
- A per-provider **Base URL**, **API key**, and **model name**, with a connection test before saving.

BuildUI does not ship a model key. Use your own credentials and review the privacy policy of any hosted provider you select.

## Local editing and multi-turn changes

In a live preview, turn on **Local Edit**, then select an element. BuildUI attaches the relevant component path, line range, source snippet, and box-model context to the next instruction. You can inspect the code, jump to the source view, use a quick action such as changing color or spacing, or write a custom request. The change then becomes a normal conversation turn and is verified through the same local build loop.

## Build from source

### Prerequisites

- Go `1.26+`
- Node.js `20+`
- pnpm `9+`
- Wails CLI `2.13+`
- Git `2.30+`

Install the Wails CLI and check the native toolchain:

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@v2.13.0
wails doctor
```

Clone the repository and install the frontend dependencies:

```bash
git clone https://github.com/blue-idea/BuildUI.git
cd BuildUI/frontend
pnpm install
cd ..
```

Start the desktop development app with live reload:

```bash
wails dev
```

Build a production package:

```bash
wails build
```

## Quality checks

Run the checks that match the area you changed:

```bash
# Go backend tests
go test -v -race -cover ./...

# README and release-script contract tests
pnpm test:readme
pnpm test:scripts

# Frontend tests, lint, typecheck, and build
pnpm --prefix frontend test
pnpm --prefix frontend run lint
pnpm --prefix frontend exec tsc -p tsconfig.json --noEmit
pnpm --prefix frontend run build
```

UI changes should also be verified with the repository Playwright flows and screenshot evidence.

## Repository layout

```text
BuildUI/
├── assets/readme/       # README product screenshots
├── config/              # Shared application and release configuration
├── frontend/            # React + TypeScript desktop UI
├── internal/            # Go services for projects, agents, previews, and verification
├── scripts/             # Release and documentation contract tests
├── build/               # Wails packaging assets
├── app.go               # Wails application bridge
└── README*.md           # Localized project documentation
```

## Documentation languages

The default documentation is English. Use the language links at the top of any README to switch between:

- [English](README.md)
- [中文](README.zh-CN.md)
- [Español](README.es.md)
- [Português](README.pt-BR.md)
- [Français](README.fr.md)
- [日本語](README.ja.md)

## License

See the repository for the current license and contribution terms.
