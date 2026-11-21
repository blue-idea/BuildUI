# AC 验收矩阵（Acceptance Criteria Matrix）· TASK-021

> 文件路径：`docs/spec/versions/v5/ac/TASK-021-AC.md`  
> 规范版本：v5  
> 任务编号：TASK-021  
> 任务名称：应用模版元数据管理与脚手架初始化服务  
> 执行日期：2026-11-21  
> 执行人：Agent (TDD / SDD 自动化执行)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|:---:|:---:|:---:|:---|:---:|:---|:---:|
| TASK-021 | `v5.REQ-001-AC-001` | Unit | `internal/template/template.go` 注册 4 套官方内置应用模版（SaaS Analytics Dashboard, Creative Portfolio, Modern Landing Page, E-Commerce Storefront），包含完整元数据、分类与 Starter 代码 | `PASS` | `internal/template/template_test.go` | — |
| TASK-021 | `v5.REQ-001-AC-002` | Unit / Integration | `TemplateService.InstantiateTemplate` 根据模版 ID 安全在目标目录写入工程代码文件与 `package.json`，拦截未知模版 ID | `PASS` | `internal/template/template_test.go` | — |
| TASK-021 | `v5.REQ-001-AC-002` | Unit / Desktop | `App.GetAppTemplates` 与 `App.CreateAppFromTemplate` Wails RPC 接口实现，支持传递模版请求创建并注册应用 | `PASS` | `app_test.go`, `app.go` | — |

---

## 测试命令与真实执行记录

```bash
go test -v -count=1 . ./internal/template/...
# 输出:
# === RUN   TestApp_SelectDirectory
# --- PASS: TestApp_SelectDirectory (0.00s)
# === RUN   TestApp_InstallDependencies
# --- PASS: TestApp_InstallDependencies (0.00s)
# === RUN   TestApp_GetAppTemplatesAndCreate
# --- PASS: TestApp_GetAppTemplatesAndCreate (0.00s)
# PASS
# ok      buildui 0.741s
# === RUN   TestTemplate_DefaultTemplates
# --- PASS: TestTemplate_DefaultTemplates (0.00s)
# === RUN   TestTemplateService_InstantiateTemplate
# --- PASS: TestTemplateService_InstantiateTemplate (0.00s)
# PASS
# ok      buildui/internal/template       0.037s
```
