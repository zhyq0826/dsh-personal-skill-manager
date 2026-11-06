# @local/skill-hub

DeepSeek Harness 的技能库插件。

```bash
dsh plugin --profile desktop add /Users/sanyuesha/workspace/personal-skill-hub
```

本机开发安装是指向这个仓库根的符号链接：

```text
~/.dsh/profiles/desktop/node_modules/@local/skill-hub
```

## 仓库

```text
package.json          # dsh.bundle + dsh.client
cordis.patch.yml      # 挂载 Host 行
index.js              # Host 入口
client.js             # 浏览器面板
lib/                  # 扫描、收藏、分发、同步
locale/               # 插件页文案
icon.svg
test/
PLUGIN.md             # 使用说明
```
