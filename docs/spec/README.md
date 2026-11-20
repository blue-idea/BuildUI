# docs/spec/README.md · 版本索引

> 文件路径：`docs/spec/README.md`  
> 首次创建：STEP 1（立规矩）  
> 本文件记录当前活跃 version，由 Agent 在每个 STEP 开始前读取  
> 官方源码基准仓库：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 当前活跃 Version

```yaml
current_version: v1      # → Agent 替换 {{VERSION}} 时取此值
```

---

## Version 清单

| Version | 状态 | 路径 | 说明 |
|---------|:----:|------|------|
| v1 | active | `docs/spec/versions/v1/` | 首个版本：Dyad 核心复刻工程（脚手架底座、蓝图前置、多 Agent 引擎、闭环验证、本地预览） |
| v2 | planned | `docs/spec/versions/v2/` | 待 v1 完成后启动：高级分布式协作、云端沙箱同步、扩展市场生态 |

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
        └── v1/
            ├── constitution.md     # 技术宪法
            ├── requirements.md     # 需求规格说明书 (EARS + AC)
            ├── design.md           # 架构与系统设计
            ├── data.md             # 数据模型与 SQLite Schema
            ├── api.md              # IPC 通信接口与契约
            ├── tasks.md            # 任务拆解与里程碑
            └── traceability.md     # 需求-设计-任务-测试追溯矩阵
```

---

## 切换 Version 的步骤

```
1. v1 所有 TASK 完成并合并到主分支
2. 验证 v1 的 docs/spec/versions/v1/ 全部文档已定稿
3. git mv docs/spec/versions/v1 docs/spec/versions/v1-finished
4. mkdir docs/spec/versions/v2
5. 编辑本 README.md：
   - current_version: v2
   - 在清单中将 v1 标记为 finished，新增 v2 活跃行
6. 进入 v2 的 STEP 1（沿用 v1/constitution.md 与 steering/ 规则，无需重新生成）
```
