# 仓库维护指南

本仓库维护 DeepSeek Harness（DSH）的个人技能管理插件。维护规则、当前范围和验收以本文为准。DSH 插件详情页展示 [README.md](README.md)，安装命令和详细操作见 [PLUGIN.md](PLUGIN.md)。

## 硬边界

- 个人库是自有技能的内容来源。客户端目录用于扫描、收集和接收分发。`.skill-hub/` 下的 `manifest.json` 记录自有技能，`catalog.json` 记录技能收藏，`plugins.json` 记录插件收藏。技能收藏只记录来源和固定提交，来源不明时跳过自动安装。
- 技能分发默认保留客户端已有的不同内容。显式替换前先备份。编辑前保留原文件，删除技能包时移入回收目录。
- Git 同步只暂存个人技能及其库元数据。同步只允许快进，远程地址不匹配时拒绝同步。自动提交只写本地 Git。
- 面板 HTTP 接口限本机同源访问，写请求另需 `x-skill-hub: 1`。调整接口时保留现有请求检查和写入确认。
- 插件清单区分安装记录、缓存和本地目录。启用或加载状态由对应客户端确认。插件页的安装 Prompt 只生成文本。后端分发需要确认，适配任务调用模型需要显式授权。

## 现在

- 统一查看 Codex、Claude Code、Cursor、DSH 和共享目录中的技能，支持收藏、另存为个人技能、创建、编辑和切换调用方式。
- 将个人技能以链接或复制方式分发到启用的客户端。通过 Git 同步个人库和收藏，换机时可恢复、安装来源明确的技能收藏并分发个人技能。
- 查看各客户端插件记录、收藏插件并生成面向所选客户端的安装 Prompt。保留已有的插件分发和适配后端入口。
- DSH 对话可通过 `skill_hub` 操作。HTTP 路由和工具参数分别以 `lib/routes.js` 和 `lib/tool.js` 为准。

## 下一步

按实际需求调整对应模块，同一变更覆盖入口、业务行为和验收。调整面板时在目标 DSH profile 验证受影响的流程。

## 不要做

- 保留现有 `$DSH_HOME/skill-hub/` 和个人库 `.skill-hub/` 数据路径。目录或格式变更必须先明确兼容和迁移要求。
- 保留手动推送、冲突确认和模型授权边界。新增自动操作前先明确触发条件和影响范围。

## 改哪里

| 改动 | 路径 |
| --- | --- |
| DSH 注册、启动行为、打包配置 | `index.js`、`cordis.patch.yml`、`package.json` |
| 面板、侧栏、文案和图标 | `client.js`、`locale/`、`icon.svg`、`icon-dark.svg` |
| 技能扫描、设置、文件改写和个人库元数据 | `lib/core.js` |
| 技能收藏安装、客户端扫描和分发 | `lib/catalog.js`、`lib/targets.js` |
| Git 同步和换机恢复 | `lib/sync.js` |
| 插件清单、收藏、分发和适配 | `lib/plugins.js`、`lib/plugin-delivery.js` |
| 面板 HTTP 接口与对话工具 | `lib/routes.js`、`lib/tool.js` |
| 自动验收与文档 | `test/`、`AGENTS.md`、`README.md`、`README.en.md`、`PLUGIN.md` |

## 启动与打包

插件使用原生 ESM，由 DSH 直接加载。在源码仓库根目录运行 `dsh plugin --profile desktop add .`，然后在对应 profile 的侧栏打开 **我的技能**。

发版时在 `package.json` 更新版本，运行下方验收，然后用 `npm whoami --registry=https://registry.npmjs.org/` 确认账号为 `zhyq0826`，再执行 `npm publish`。发布前会自动运行测试。

## 验收

在源码仓库根目录运行下列命令，需要 Node.js、npm 和 Git。

```sh
npm test
node --check client.js
npm run pack:check
```

测试使用临时目录和本地 Git 仓库。打包清单应包含 Host 和面板入口、`lib/`、`locale/`、`cordis.patch.yml`、图标和文档。

若改动依赖 DSH Host 或面板行为，在测试 profile 中加载本地插件，打开 **我的技能**，按 [操作指南](PLUGIN.md) 验证受影响的流程。报告中分别记录自动检查结果和 DSH 实测结果。
