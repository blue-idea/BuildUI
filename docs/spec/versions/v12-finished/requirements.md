# 需求文档（Requirements）· Blot-UI v12

> 文件路径：`docs/spec/versions/v12/requirements.md`  
> 规范版本：v12 · 日期：2026-11-22  
> 状态：草稿 / 待确认（Reviewing）  
> 核心目标：工业级代码生成核心管线强化（蓝图门禁澄清闭环、脚手架规范硬注入、零占位符与缺失文件即时创建铁律）  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 介绍

Blot-UI (Wails + React) 作为面向开发者的现代化本地 AI 应用构建工作台，其核心价值在于高成功率、零断链、工业级的 UI 与业务代码生成能力。
本版本（v12）针对用户在实际使用中的痛点，全面强化三道核心防线：
1. **蓝图门禁（Blueprint Gate）**：严格推行 `planning_questionnaire` → `write_app_blueprint` → 用户审批流程。在生成任何 UI 前，必须先完成需求澄清与蓝图审批，蓝图必须完整包含设计方向（Design Direction）、主色调（Primary Color）、视觉资产清单（Visuals：包含 Logo、插图、图标等的 prompts）。
2. **工业级脚手架底座（Industrial Scaffold Baseline）**：参考 `docs/knowledge/scaffold/AI_RULES.md`，生成的 UI 必须全面利用预装的 40+ 个 shadcn/ui 组件库，严格遵守页面放 `src/pages/`、组件放 `src/components/` 的规范目录分层，并且严格使用 Tailwind CSS，坚决禁止编写任何自定义 CSS。
3. **零占位符铁律（Zero Placeholder Policy）**：参考 `docs/knowledge/src/prompts/local_agent_prompt.ts`，禁止任何 `// TODO`、省略号或半成品代码；每个生成的组件必须全功能可用（Fully Functional）；引入的内部文件若不存在，必须在同一次响应流中立即全量创建，彻底杜绝悬空引用和编译断链。

---

## 需求列表

---

### 需求 v12.REQ-001 · 蓝图澄清问卷与前置审批门禁闭环流程

**用户故事：** 作为开发者，我希望在 AI 生成任何 UI 代码前，必须先经历结构化需求澄清问卷与蓝图生成，并在我亲自点击审批后才准许写盘，以便杜绝方向偏差与无效代码生成。

#### 验收标准 (AC)

```yaml
- id: v12.REQ-001-AC-001
  ears: >
    While a chat does not have an approved blueprint,
    when a user initiates an application build or prompt,
    the Agent service shall guide the workflow through planning_questionnaire (1-5 focused product clarification questions) before producing or approving the blueprint.
  test_type: Unit
  expected:
    questionnaire_schema:
      min_questions: 1
      max_questions: 5
      supported_types: ["single_choice", "multi_choice", "text"]
    file_mutation_blocked: true

- id: v12.REQ-001-AC-002
  ears: >
    When the clarification questionnaire answers are submitted,
    the Agent service shall generate a complete App Blueprint containing Design Direction, Primary Color, and Visuals prompts list (Logo, illustrations, icons), and emit the app-blueprint:update event.
  test_type: Integration
  expected:
    blueprint_fields:
      appName: "string (non-empty)"
      designDirection: "string (1-2 sentences)"
      primaryColor: "string (hex format #rrggbb)"
      visuals: "array with id, type (logo|illustration|icon|background), description, prompt"
    blueprint_approved: false
    state_mutating_tools_blocked: true

- id: v12.REQ-001-AC-003
  ears: >
    When the user approves the blueprint in the BlueprintCard,
    the App Service shall persist approved=true, emit app-blueprint:approved, and unlock code generation and file-writing tools.
  test_type: E2E
  expected:
    blueprint_approved: true
    subsequent_tool_unlocked: "dyad-write"
```

---

### 需求 v12.REQ-002 · 工业级脚手架底座与规范硬编码提示词注入

**用户故事：** 作为开发者，我希望大模型在生成代码时明确知道内置的 40+ 个 shadcn/ui 组件与严格的目录规范，以便生成结构严谨、样式统一、现代美观的工业级 UI。

#### 验收标准 (AC)

```yaml
- id: v12.REQ-002-AC-001
  ears: >
    When the PromptAssembler builds system and context prompts for code implementation,
    it shall inject the complete AI_RULES scaffold specification explicitly declaring that 40+ shadcn/ui components are pre-installed in src/components/ui/ and ready for immediate import.
  test_type: Unit
  expected:
    prompt_contains:
      - "40+ shadcn/ui components"
      - "@/components/ui/"
      - "do not re-implement existing ui primitives"

- id: v12.REQ-002-AC-002
  ears: >
    When the PromptAssembler builds directory structure guidelines,
    it shall strictly enforce that page components reside in src/pages/, reusable components reside in src/components/, and routing is maintained in src/App.tsx with default page src/pages/Index.tsx.
  test_type: Unit
  expected:
    prompt_contains:
      - "src/pages/"
      - "src/components/"
      - "src/pages/Index.tsx"
      - "src/App.tsx"

- id: v12.REQ-002-AC-003
  ears: >
    When generating UI styles,
    the system prompt shall mandate Tailwind CSS utility classes exclusively and strictly prohibit any custom CSS files, inline style tags, or custom css rules.
  test_type: Unit
  expected:
    prompt_contains:
      - "Tailwind CSS"
      - "STRICTLY PROHIBIT custom CSS"
      - "no custom .css or style blocks"
```

---

### 需求 v12.REQ-003 · 零占位符铁律与缺失内部文件即时创建保障机制

**用户故事：** 作为开发者，我希望生成的代码绝对没有 `// TODO` 或省略号半成品，每个组件全功能可用，并且引入的任何内部文件如果尚未存在，AI 必须在同次流式回复中立即创建，防止构建报错。

#### 验收标准 (AC)

```yaml
- id: v12.REQ-003-AC-001
  ears: >
    When the PromptAssembler builds the implementation prompt,
    it shall enforce the Zero Placeholder Policy forbidding // TODO, /* TODO */, ellipsis (...), and requiring every component to be fully functional with complete production-ready code.
  test_type: Unit
  expected:
    prompt_contains:
      - "ZERO PLACEHOLDER POLICY"
      - "FULLY FUNCTIONAL"
      - "no // TODO"
      - "no placeholder comments or ellipsis"

- id: v12.REQ-003-AC-002
  ears: >
    When generated code references or imports internal files or local components that do not yet exist in the workspace,
    the model instructions shall mandate emitting an immediate <dyad-write> block within the same response to create and fully implement that file.
  test_type: Unit
  expected:
    prompt_contains:
      - "IMMEDIATE FILE CREATION"
      - "If you import an internal file or component that does not exist, you MUST immediately create it"

- id: v12.REQ-003-AC-003
  ears: >
    When the FileWriter receives file content containing placeholder tokens or ellipses,
    it shall reject the write operation with a ValidationError.
  test_type: Unit
  expected:
    validation_error: "placeholder comments detected"
```

### 需求 v12.REQ-004 · 长构建分步执行与恢复

作为开发者，我希望大型构建按步骤执行，并在模型或桌面应用中断后继续剩余步骤，避免重复生成已经完成的文件。

- **v12.REQ-004-AC-001（集成）** 当用户在已审批会话中发起构建时，系统应先生成有序计划。每个步骤应发起独立模型请求，并仅附加本步骤的指定源码。步骤所要求的文件写齐后，系统应持久化进度。
- **v12.REQ-004-AC-002（集成、组件、E2E）** 当构建中断时，系统应保留已完成的文件和步骤。用户重新打开同一会话并点击 `Resume build` 时，系统应从首个未完成步骤继续。
- **v12.REQ-004-AC-003（集成、E2E）** 当某一步的工具输出被截断时，系统应在该步骤内完成续写。所有步骤成功后，系统应只保存一轮构建记录并清除检查点，生成站点应能够打开预览。

