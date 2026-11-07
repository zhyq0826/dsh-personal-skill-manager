# dsh-personal-skill-manager

A personal skill manager for every code agent on the machine.

**The personal repository is the center of the product.** It has two different
kinds of content:

- **my skills** — written skills plus favorites;
- **written skills** — bundles you maintain, stored under `skills/`, and the only
  content distributed to other agents;
- **favorites** — community skills you want to reinstall later. A favorite stores
  repository, commit, and subpath in `.skill-hub/catalog.json`, **not a copy of
  the skill**.

Codex, Claude Code, Cursor, DSH, and the shared agent root are sources to collect
from and distribution targets to install into. They never become a second source.

The daily loop: see every skill, filter by client, favorite a community skill
into the catalog, **save as my skill** only when you want to fork/own the
content, then distribute my skills to the clients that should have them.

## Repository layout

```text
<personal-repository>/
  skills/
    my-skill/SKILL.md          # written or saved-as-mine content
  .skill-hub/
    manifest.json              # v3 metadata for personal skills
    catalog.json               # community favorites: source + fixed revision
  .git/
```

If the repository has a `skills/` directory, it is the library base for new
skills; existing bundles at the repository root are still scanned. The catalog
and personal skills both travel with Git.

## The list shows every skill

The main panel lists one row per skill name, merging the personal library with
every client entry of the same name. Each row carries only source information:

- `我编写的` — personal content in the library;
- `收藏的` — in the reinstall catalog, or a legacy collected copy;
- `未入库` — only in a client directory and not favorited;
- client labels: personal library, Codex, Claude Code, Cursor, DSH, shared.

The tabs are **全部技能 / 我的技能**. **我的技能** lists written skills and
favorited community skills. A community row shows a favorite mark that removes
the catalog record. **全部技能** also lists skills that are only on a client,
and those rows can be favorited.
The filter select narrows by a specific client. Search matches name, description,
path, and client labels.
Model/user invocation, links, and conflict counts are not shown in the list;
the detail panel carries distribution status and the model/user switches.

## Favorite vs. save as my skill

- **Favorite** (star) writes a source record to `.skill-hub/catalog.json`:
  repository, full commit, subpath, and the client it was collected from. It
  does **not** copy the skill into the repository. On another machine, the
  catalog can reinstall it from that exact commit.
- **Save as my skill** copies the content into `skills/<name>` and marks it
  `personal`; the catalog entry is removed. This is the only operation that
  copies a community skill into your repository, because it becomes your fork.
- A catalog source that cannot be verified (not a clean Git worktree and no
  lock record) is kept with `kind: unknown`; it is visible in the catalog but
  cannot be auto-installed. Save as my skill is the fallback.

Earlier versions materialized community favorites into the library. Those copies
are reported as **legacy favorite copies** in Sync and can be moved into the
plugin backups with “Clean up legacy copies”; the catalog entries are retained.

## Moving to the next machine

1. Install the plugin and open **Skill library → Sync**.
2. Set the personal repository, Git remote, branch, and target clients.
3. Use **Save and restore**:
   - empty directory: clone the library;
   - existing repository: fetch + fast-forward only;
   - existing local skills without a repository: initialize and push only when
     the remote branch is empty; an existing remote branch is refused.
4. The restored catalog is installed into the enabled clients, then the personal
   `skills/` are distributed to them. Missing targets are installed; conflicts
   are kept and reported.
5. Optionally enable **Distribute to clients on startup** for later starts. It
   is opt-in.

## Client targets and distribution

Default targets: Codex `~/.codex/skills`, Claude Code `~/.claude/skills`, Cursor
`~/.cursor/skills`, DSH `$DSH_HOME/skills`; the shared agent root is present but
disabled by default. Paths, link/copy mode, and enablement are editable in Sync.

- **Distribute to clients** installs every **personal** skill; legacy collected
  copies are not distributed.
- **Distribute here** in a skill's detail updates one target. `未安装` creates a
  link or copy; `已有不同内容` means the client already has a different same-name
  content or link, so the default keeps it. `备份并替换` moves it to
  `$DSH_HOME/skill-hub/backups/` and then installs the library version.
- **Install favorites** in Sync installs catalog entries into enabled clients by
  cloning the recorded commit and copying the subpath; it never writes those
  community bundles into the personal library.
- A target that is the personal repository is reported as `source`, not copied.

## Git sync

- **Sync personal library** stages `.skill-hub/manifest.json`,
  `.skill-hub/catalog.json`, the `skills/` directory, and top-level skill
  bundles; it does not stage unrelated repository files. It commits, fetches,
  fast-forwards, and pushes.
- It never force-pushes and refuses a repository origin that differs from the
  configured remote.
- **Auto-sync after edits** commits local library/catalog changes after a write;
  it does not push automatically.

## Mutations

- **Edit / invocation toggle** rewrites the scanned `SKILL.md` atomically and
  copies the previous file to `$DSH_HOME/skill-hub/backups/`.
- **Create** writes the library base and records `kind: personal`.
- **Delete** requires confirmation and a fresh scan of the same path; it moves
  the bundle to `$DSH_HOME/skill-hub/trash/` and never erases content.

## HTTP surface

The browser panel calls same-origin routes under `/api/skill-hub/*`. Each route
requires a loopback socket, a loopback `Host` header, and same-origin browser
fetch metadata; writes also require the `x-skill-hub: 1` header.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/skill-hub/list` | All skills, client provenance, catalog metadata |
| GET | `/api/skill-hub/read` | One library or client skill's content |
| POST | `/api/skill-hub/favorite` | Add/remove a source-only catalog entry |
| POST | `/api/skill-hub/save-as-mine` | Copy a client skill / promote collected to personal |
| POST | `/api/skill-hub/set-invocation` | Rewrite invocation frontmatter |
| POST | `/api/skill-hub/save` | Replace `SKILL.md` |
| POST | `/api/skill-hub/create` | Create a personal skill |
| POST | `/api/skill-hub/delete` | Move a personal skill to the trash |
| POST | `/api/skill-hub/distribute-skill` | Distribute one personal skill to selected clients |
| POST | `/api/skill-hub/distribute` | Distribute personal skills to enabled clients |
| POST | `/api/skill-hub/install-catalog` | Install catalog favorites into clients |
| POST | `/api/skill-hub/cleanup-legacy` | Move legacy collected copies to backups |
| GET | `/api/skill-hub/sync/status` | Repo, personal manifest, catalog, last runs |
| POST | `/api/skill-hub/settings` | Save repo/target settings; optionally restore |
| POST | `/api/skill-hub/sync` | Commit, fetch, fast-forward, push |
| POST | `/api/skill-hub/restore` | Clone/fast-forward, install catalog, distribute personal |
| GET | `/api/skill-hub/health` | Route health and library count |

## Configuration

Machine-local settings live in `$DSH_HOME/skill-hub/settings.json`; they are not
committed. The bundle row can supply defaults:

```yaml
- id: dsh-personal-skill-manager
  name: 'dsh-personal-skill-manager'
  config:
    personalDir: null         # defaults to $DSH_HOME/skills
    customSkillDirs: []
    dshHome: null
    agentsHome: null
    bundledSkillDir: null
    includeShared: true
    maxContentBytes: 262144
    maxBundleFiles: 500
    maxBundleBytes: 8388608
```

Settings fields: `personalDir`, `gitRemote`, `gitBranch`, `targets`,
`autoDistribute`, `autoSync`, plus the legacy `autoInstall` flag.

## Agent tool

`skill_hub` supports `list`, `read`, `favorite`, `save_as_mine`, `install_catalog`,
`set_invocation`, `create`, `save`, `delete`, `distribute`, `targets`, and `sync`.

## Development

Plain ESM, no runtime dependencies, no build step.

```bash
node --test plugins/skill-hub/test/*.test.js
node --check plugins/skill-hub/index.js
node --check plugins/skill-hub/lib/core.js
node --check plugins/skill-hub/lib/catalog.js
node --check plugins/skill-hub/lib/targets.js
node --check plugins/skill-hub/lib/sync.js
node --check plugins/skill-hub/client.js
```

Tests use temporary directories and local Git repositories; they never touch the
real agent directories or a network remote.

## Limits

- The library scan is one level deep inside the repository (plus `skills/`).
- Favorites are source records, not content; an unknown source cannot be
  auto-installed and remains a catalog warning.
- Catalog installation clones the recorded commit; no branch/latest fallback.
- Existing client conflicts are kept by default; replacement backs up first.
- The frontmatter parser is smaller than YAML; DSH remains the authority for
  whether a skill loads.
- The panel is loopback-only; paired remote access is not implemented.

## Plugin inventory

The Plugins tab and `skill_hub` action `plugins` provide a separate read-only inventory for Codex, Claude Code, Cursor and DSH. `GET /api/skill-hub/plugins` exposes the same data.

- Claude Code, Cursor and Codex adapters read `installed_plugins.json` when present, plus manifests in plugin cache and local directories. Cache-only entries are not labelled installed. Marketplace listings are excluded.
- DSH profiles list direct dependencies whose installed package declares `dsh`. A dependency does not prove that its host row is enabled.
- Rows retain client, plugin identifier, version, scope, path and evidence file. Same-named plugins from different clients, versions or scopes remain separate.
- Enablement and loading remain unknown. Missing files and unreadable records are reported. Cursor's internal installation state and Codex configuration-based activation are not verified by this adapter.
- This does not enumerate editor extensions, install plugins, modify settings, or copy plugin skills into the personal library.

Plugin favorites are stored in `.skill-hub/plugins.json` and travel with the personal Git repository. The list has a star button and a favorites-only filter. `POST /api/skill-hub/plugins/favorite` accepts `{key, favorite}` behind the same write guards as skills. Favorites retain client, plugin identifier, version and evidence category, without machine-local paths. Different clients and known versions remain separate. Unknown versions use an observation-specific key rather than being merged. On another machine, missing favorites remain visible as not observed. This feature does not install or enable plugins and does not claim that an identifier alone guarantees reinstallability.

## Plugin installation prompts

Expand a plugin, choose a target client, and click Generate install prompt. Copy the generated request into an Agent conversation. It includes the plugin identifier, version, source client and local path when available. Missing local files do not prevent generating a request from a saved favorite.

The request asks the Agent to verify the source, version and target support, propose adaptation when needed, preserve existing changes, request confirmation for model charges or consequential changes, and report the actual loading result. Generating or copying the prompt does not install anything, write target files, create an adaptation task, or call a model. The panel no longer provides delivery previews or model-task controls.

The previous delivery and adaptation backend remains available to existing callers; generating a prompt does not use it.
