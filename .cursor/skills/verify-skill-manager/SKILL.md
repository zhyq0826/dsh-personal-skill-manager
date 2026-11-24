---
name: verify-skill-manager
description: 在真实 DSH Web 和 Chrome 中验证「我的技能」插件。修改技能搜索、客户端分发、Git 同步或客户端打包入口时使用。
---

# 验证 DSH 个人技能管理插件

## Launch

在仓库根目录执行。需要 Node.js、npm、pnpm、Git、Bash、`lsof`、Google Chrome 和可启动 Web profile 的 DSH。此仓库使用 `playwright-core` 驱动系统 Chrome。

```sh
npm ci
./.cursor/skills/verify-skill-manager/verify.sh all
```

脚本优先使用相邻 `deepseek-harness/apps/cli/lib/bin.js`，也可用绝对路径环境变量 `DSH_CLI_JS` 指定已构建的 CLI，或由 `PATH` 提供 `dsh`。它先构建当前工作树，在空临时目录创建 web profile，通过 `dsh plugin --profile web add link:…` 接入本仓库，然后启动监听回环地址的 DSH。

每次运行有独立的端口、DSH profile、浏览器上下文、个人库、DSH 技能目录和本地裸 Git 仓库。个人库有 `qa-alpha`、`qa-beta` 两个样本，分发目标只有临时 DSH 目录。初始远端分支为空。对同一工作树的源码编辑和构建应在验收开始前完成，确保返回的脚本与本次构建一致。

DSH 输出启动地址后脚本自动执行 Doctor。Chrome 从侧栏打开 **我的技能**，看到样本技能与当前包版本，并确认收到的脚本包含本地构建的完整字节后，才开始功能操作。首次预览说明和登录提示通过界面关闭。

## Doctor

脚本启动时打印 `Scratch` 和 `Evidence` 路径。在运行期间，另一个终端可用 `RUN_DIR` 指向该次打印的 `Scratch` 路径，执行只读检查。

```sh
./.cursor/skills/verify-skill-manager/verify.sh doctor "$RUN_DIR"
```

Doctor 核对监听 PID、启动地址、带该次会话凭据的健康请求，以及已安装 profile 实际解析到的客户端文件。成功时打印包版本和 SHA-256。若端口所有者、插件身份或产物不匹配，先处理该错误再驱动页面。启动 URL 中的令牌只保存在本次临时目录。

## Drive

`all` 顺序执行三个场景。要复现单个功能，在相同命令中将 `all` 换为 `search`、`distribution` 或 `sync`。每次调用都从新的测试目录开始。具体入口、操作和断言见[功能地图](features/README.md)。

## Evidence

运行结果写入仓库下独立的 `.verification/run-*/` 目录。`result.json` 记录场景、包版本、客户端 SHA-256、页面操作、写请求回执、文件链接和推送的提交。PNG 记录可见的操作前后状态。检查退出码和 `result`，再根据操作记录找对应截图。只有界面、回执和该功能的磁盘或 Git 断言全部通过，脚本才报告成功。

验收使用真实浏览器、插件接口和 Git。远端使用本地裸仓库，因此托管服务登录、网络推送及另一台机器的恢复需单独验证。DSH 对话工具的路由和权限检查可运行 `npm test`。

## Cleanup

`verify.sh` 在正常返回、出错或收到 `Ctrl-C` 时终止自己启动的 DSH PID，等待退出，再移除本次临时目录。浏览器驱动在结束时关闭 Chrome。截图和 JSON 位于独立的证据目录，清理后仍可查看。操作系统强制终止脚本时，按打印的 `Scratch` 路径检查 `pid`、`port` 和监听进程归属，再处理该次实例。

## Helpers

`verify.sh` 管理构建、种子数据、启动和清理，是常规运行入口。它在启动后执行下列驱动命令。排障时可对仍在运行且满足对应前置条件的测试实例单独执行，`PROOF_DIR` 指向本次独立的证据目录。

```sh
./.cursor/skills/verify-skill-manager/browser.mjs doctor "$RUN_DIR"
./.cursor/skills/verify-skill-manager/browser.mjs search "$RUN_DIR" "$PROOF_DIR"
```
