# docs/spec/README.md · 版本索引

> 文件路径：`docs/spec/README.md`  
> 本文件记录当前活跃 version，由 Agent 在每个 STEP 开始前读取  
> 官方源码基准仓库：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 当前活跃 Version

```yaml
current_version: v6      # → Agent 替换 {{VERSION}} 时取此值
```

---

## Version 清单

| Version | 状态 | 路径 | 说明 |
|---------|:----:|------|------|
| v1 | finished | `docs/spec/versions/v1-finished/` | 首个版本已圆满收官（脚手架底座、蓝图门禁、XML流式落盘、闭环自愈、本地预览、Turn-level Git） |
| v2 | finished | `docs/spec/versions/v2-finished/` | 第二版本已圆满收官（真实多模型 LLM 流式接入、多轮上下文记忆与中止、Git 时光机 Diff 审查与回滚、原生桌面体验） |
| v3 | finished | `docs/spec/versions/v3-finished/` | 第三版本已圆满收官（多应用抽屉与工作区切换、双向可视化组件审查定位、一键 Zip 导出与原生资源管理器） |
| v4 | finished | `docs/spec/versions/v4-finished/` | 第四版本已圆满收官（智能第三方依赖提取与沙箱自动安装、UI 视觉主题预设引擎与跨沙箱动态 CSS 注入） |
| v5 | finished | `docs/spec/versions/v5-finished/` | 第五版本已圆满收官（应用模版预设库与脚手架初始化、全局快捷键与命令面板 Ctrl+K 全键盘交互） |
| v6 | active | `docs/spec/versions/v6/` | 当前启动规划：生产环境静态站点一键构建与托管配置生成（Vercel / Netlify）、静态包预览 |
| v7 | planned | `docs/spec/versions/v7/` | 规划中：云端沙箱同步、团队协作与实时分享 |

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
        ├── v2-finished/            # 已归档完成的 v2 版本全量规格与验收证据
        ├── v3-finished/            # 已归档完成的 v3 版本全量规格与验收证据
        ├── v4-finished/            # 已归档完成的 v4 版本全量规格与验收证据
        ├── v5-finished/            # 已归档完成的 v5 版本全量规格与验收证据
        └── v6/                     # 当前活跃的 v6 规格与规划任务
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
