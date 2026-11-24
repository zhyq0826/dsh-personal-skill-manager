# 技能搜索

用户可以通过技能列表的搜索框缩小范围，再打开正文和来源详情。

## Sub-features

- 按名称过滤列表，选择匹配行，查看详情。
- 查看无匹配状态，清空输入后恢复列表。

## How to get to it (user POV)

从侧栏打开 **我的技能**，使用默认的 **全部技能** 标签和工具栏搜索框。

## Driving it with Playwright

前置条件为个人库有 `qa-alpha` 和 `qa-beta` 两个不同名称的技能。

```sh
./.cursor/skills/verify-skill-manager/verify.sh search
```

在搜索框输入 `qa-beta` 并点击匹配行。列表应只剩一行，详情标题应为 `qa-beta`。换成 `no-such-qa-skill`，列表应为空并显示空状态。清除查询后应重新看到 `qa-alpha`。对应截图为 `search-match.png` 和 `search-empty.png`。

## Gotchas

独立 profile 中有同名种子时，先检查个人库和目标目录。仅在搜索框里看到输入值不足以验证列表过滤。
