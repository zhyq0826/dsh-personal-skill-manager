# dsh-personal-skill-manager

[简体中文](./README.md) | English

A personal skill manager for DeepSeek Harness (DSH). Browse skills across clients, favorite community versions, maintain your own skills, and sync them to another computer with Git.

## Features

- Scan Codex, Claude Code, Cursor, DSH, and shared skill directories. Search skills and read their sources and content.
- Favorite community skills by recording their source and pinned revision for later installation.
- Save skills to your personal repository. Create and edit skills, and configure model and user invocation.
- Distribute personal skills to clients using symlinks or copies. Keep conflicting content by default, or back it up before replacing it.
- Sync personal skills and favorites through Git and restore them on another computer.
- Manage skills in DSH conversations with the `skill_hub` tool.

## Installation

Requires a DSH build with plugin support. Git sync requires Git and access to the remote repository.

```bash
dsh plugin --profile desktop add /absolute/path/to/personal-skill-hub
```

Replace the path and profile with your local values. After installation, open **Skill library** in the sidebar.

## Usage

1. Open **Sync** and configure your personal directory, Git remote, branch, and client targets.
2. Find a skill and click **Favorite** to record its community version. To maintain your own version, choose **Save as my skill**, then edit the copy.
3. Distribute personal skills to enabled clients and check the results.
4. Click **Sync personal library** to push changes. On another computer, configure the same repository and click **Save and restore**.

Startup distribution and automatic local commits after edits are optional. Automatic commits do not push changes; run sync to push them.

## Notes

- Favorites with unknown sources cannot be reinstalled automatically. Existing client content that differs is kept by default.
- Editing changes the selected file. Use **Save as my skill** first to preserve the original.
- Successful distribution does not confirm that a client has loaded the skill. Check in the target client.
- Settings and backups remain under `$DSH_HOME/skill-hub/`, and repository metadata remains under `.skill-hub/`. The plugin rename requires no data migration.

See [PLUGIN.md](./PLUGIN.md) for configuration, data locations, and API details. Run `npm test` for development tests.
