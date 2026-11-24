# 客户端分发

用户可以把一个自有技能分发给某个客户端，也可以一次分发所有自有技能。

## Sub-features

- 在技能详情中向 DSH 分发一个技能。
- 在同步页将剩余的自有技能批量分发到启用的客户端。

## How to get to it (user POV)

侧栏 **我的技能** → 选中技能 → DSH 目标旁的 **分发到此客户端**。批量入口在 **同步** → **分发到客户端**。

## Driving it with Playwright

前置条件为 DSH 是唯一启用的目标，分发模式为链接，目标目录为空。

```sh
./.cursor/skills/verify-skill-manager/verify.sh distribution
```

选中 `qa-alpha` 并向 DSH 分发，检查请求成功且新链接指向个人库中的源目录。然后在同步页点击批量分发，检查 `qa-beta` 也已链接、链接下可读到对应技能正文，并看到分发成功状态。查看 `distribution-before.png`、`distribution-after.png` 和 JSON 中的两条链接记录。

## Gotchas

若目标已有其他内容，页面进入冲突处理流程，本场景应报告前置条件不符。客户端加载后的对话行为需要另行通过该客户端使用技能验证。
