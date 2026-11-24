# My skills

Browse, collect, and maintain skills in DeepSeek Harness (DSH), then distribute them to Codex, Claude Code, Cursor, and DSH.

When skills live in several clients, it can be hard to remember where they are or which version you edited. My skills brings those directories and shared skill directories into one panel, where you can find skills, read their full content, and compare their status across clients. Keep skills you write or adapt in a personal library and sync it with Git to restore them on another computer.

[简体中文](README.md) · [Detailed user guide](PLUGIN.md) · [Contributor instructions (Chinese)](AGENTS.md)

## Install

Install DSH first and make sure the `dsh` command is available. Run:

```sh
dsh plugin --profile desktop add @zhyq0826/dsh-personal-skill-manager
```

After installation, open **My skills** in that DSH profile's sidebar. Replace `desktop` in the command if you use a different profile.

## Features

- **Find skills**: Search names, descriptions, or paths; filter by client; inspect sources, the complete `SKILL.md`, and the list of supporting files.
- **Maintain personal skills**: Create skills, save existing skills as your own, edit content, and adjust model and user invocation settings. Save a personal copy before editing a skill from a read-only source.
- **Distribute to clients**: Link or copy personal skills to enabled clients and check for matching content or conflicts.
- **Sync and restore**: Use Git to sync personal skills, skill favorites, and plugin favorites. On another computer, restore the library, install skill favorites with known sources, and distribute personal skills.
- **Browse plugins**: Review plugin records across clients, save favorites, and generate an installation prompt for a selected client to copy into an Agent conversation.

You can also use the `skill_hub` tool in DSH conversations to browse and manage skills.

## Get started

### Favorite a skill or maintain your own version

Open a skill's details and choose the action that fits your goal:

| Goal | Action | What is saved |
| --- | --- | --- |
| Keep a community skill for later reinstallation | Favorite | Its source and pinned commit; the bundle is not copied into the personal library |
| Edit a skill and maintain your own version | Save as my skill | A skill bundle in the personal library that you can edit and distribute |
| Write a skill from scratch | Create a skill | A new skill in the personal library |

Favorites with unknown sources keep their records but are skipped during automatic installation. Use **Install favorites** on the **Sync** page to reinstall saved skills.

### Set up the library and distribute skills

1. Open **Sync → Library sync** and save the personal directory, Git remote, and branch in the repository settings.
2. In the local client list, enable the clients that should receive personal skills, choose links or copies, and save your settings.
3. Distribute personal skills and review the results. Different client content is preserved by default. Confirming a replacement backs up the client version before writing.
4. When ready to share your changes, choose **Sync personal library** to sync library changes with the Git remote.

Links let clients read the saved library files directly, so updates are available the next time they read them. Copies are independent; distribute again after updating a personal skill.

### Move to another computer

Install the plugin, open **Sync**, enter the same Git remote and branch, choose a local personal directory and client targets, and save your settings. Then choose **Restore from Git**. For a fresh clone, use an empty directory, or select an existing checkout of the same remote. Review the restore, favorite installation, and distribution results and resolve any reported conflicts.

## Data and operation boundaries

The personal library holds your own skills. Its `.skill-hub/` directory stores the skill manifest, skill favorites, and plugin favorites. Machine-local settings, backups, and trashed content live under `$DSH_HOME/skill-hub/`.

- Edits preserve the previous file. Deleting a personal skill moves its bundle to the trash directory.
- Git sync stages only personal skills and library metadata and allows only fast-forward updates. Automatic commits stay local; pushing remains a manual action.
- Plugin records distinguish installation records, caches, and local directories. Confirm enabled and loaded status in the corresponding client. Generating an installation prompt only produces text; it does not install or enable a plugin.

Backups are under `$DSH_HOME/skill-hub/backups/`. Trashed skill bundles are under `$DSH_HOME/skill-hub/trash/`.

## Development and feedback

See the [contributor instructions](AGENTS.md) for source installation, builds, and verification. Report problems or suggest features in [GitHub Issues](https://github.com/zhyq0826/dsh-personal-skill-manager/issues).
