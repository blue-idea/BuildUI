# docs/spec/README.md · 版本索引

> 文件路径：`docs/spec/README.md`  
> 本文件记录当前活跃 version，由 Agent 在每个 STEP 开始前读取  
> 官方源码基准仓库：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 当前活跃 Version

```yaml
current_version: v2      # → Agent 替换 {{VERSION}} 时取此值
```

---

## Version 清单

| Version | 状态 | 路径 | 说明 |
|---------|:----:|------|------|
| v1 | finished | `docs/spec/versions/v1-finished/` | 首个版本已圆满收官（脚手架底座、蓝图门禁、XML流式落盘、闭环自愈、本地预览、Turn-level Git） |
| v2 | active | `docs/spec/versions/v2/` | 当前进行中：真实多模型 LLM 流式接入、多轮上下文记忆、时光机版本 Diff 审查与回滚、原生桌面体验 |
| v3 | planned | `docs/spec/versions/v3/` | 待 v2 完成后启动：分布式协同、云端沙箱同步、组件生态市场 |

---

## 目录结构

```
docs/
├── AGENTS.md                       # 项目级 Agent 入口
├── architecture-overview.md        # 架构核心剖析与构建完整性揭秘
├── knowledge/                      # 核心源码与规则本地镜像知识库 (54个文件)
│   └── README.md                   # 知识库索引与上游 GitHub 网络链接
└── spec/
    ├── README.md                   # 本文件（版本索引）
    ├── test_strategy.md            # 项目级测试策略简报
    ├── info.md                     # 本地测试账号、环境与假服务配置（gitignore）
    ├── steering/                   # 项目级恒定规则（跨版本继承）
    │   ├── project-rules.md        # 协作 / Git / 测试门槛
    │   ├── tech-stack.md           # 锁定技术栈
    │   └── style-guide.md          # 命名 / 错误格式 / 日志规范
    └── versions/
        ├── v1-finished/            # 已归档完成的 v1 版本全量规格与验收证据
        └── v2/                     # 当前活跃的 v2 规格与实现任务
            ├── requirements.md     # 需求规格说明书 (EARS + AC)
            ├── design.md           # 架构与系统设计
            ├── tasks.md            # 任务拆解与里程碑
            ├── traceability.md     # 需求-设计-任务-测试追溯矩阵
            ├── ac/                 # 验收矩阵
            └── reports/            # 阶段与版本收官报告
```

---

## 切换 Version 的步骤

```
1. vN 所有 TASK 完成并合并到主分支
2. 验证 vN 的 docs/spec/versions/vN/ 全部文档已定稿
3. git mv docs/spec/versions/vN docs/spec/versions/vN-finished
4. mkdir docs/spec/versions/vN+1
5. 编辑本 README.md：
   - current_version: vN+1
   - 在清单中将 vN 标记为 finished，新增 vN+1 活跃行
6. 进入 vN+1 的 STEP 1（沿用 v1-finished/constitution.md 与 steering/ 规则，无需重新生成）
```
