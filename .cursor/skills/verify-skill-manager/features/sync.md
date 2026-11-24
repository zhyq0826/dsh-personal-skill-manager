# Git 同步

用户可将本机个人库的技能和元数据提交并推送到配置的远端。

## Sub-features

- 从同步页推送个人库，验证远端 `main` 分支和本地提交一致。
- 从远端 Git 对象读取技能正文，与本地文件逐项核对。

## How to get to it (user POV)

侧栏 **我的技能** → **同步** → **同步个人库**。

## Driving it with Playwright

前置条件为个人库已有两个技能，分支为 `main`，远端是空的临时裸仓库。

```sh
./.cursor/skills/verify-skill-manager/verify.sh sync
```

先取证远端尚无分支。点击 **同步个人库** 后，等待页面显示同步完成，再核对远端提交与本地 `HEAD` 相同，且该提交中的 `skills/qa-beta/SKILL.md` 与源文件内容相同。`sync-before.png`、`sync-after.png` 和 JSON 中的提交号共同记录本次推送。

## Gotchas

保留脚本创建的本地远端。远端已有分支、凭据不可用和换机恢复属于其他 Git 流程，分别需要对应的种子状态。
