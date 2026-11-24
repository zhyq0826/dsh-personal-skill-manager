# Using the skill library

To install a published version in the `desktop` profile, run `dsh plugin --profile desktop add @zhyq0826/dsh-personal-skill-manager`. Open **My skills** in the DSH sidebar.

## Set up a personal library

1. Open **Sync**. Set the personal directory, Git remote, branch, and client targets.
2. Choose which targets to enable and whether each receives a link or a copy. Save the settings.
3. Use **Sync personal library** to push your changes when ready. You can enable automatic local commits after edits and distribution on startup from the same screen.

Machine-local settings are in `$DSH_HOME/skill-hub/settings.json`. The personal repository holds skill bundles, usually under `skills/`, and shared metadata under `.skill-hub/`.

## Collect and distribute skills

1. Find a skill by name or client. Click **Favorite** to save its source for later installation. To edit your own copy, use **Save as my skill** before editing.
2. To distribute a personal skill to one client, open its details and use **Distribute here**. To distribute the personal library, use **Distribute to clients** in **Sync**.
3. Check the distribution result. If a target has different content, review the conflict before choosing **Back up and replace**. Verify loading in the target client.

Use **Install favorites** in **Sync** to install community skills with a recorded source. If **Legacy favorite copies** appears, **Clean up legacy copies** moves those copies to the plugin backup directory and keeps the source records.

Backups are under `$DSH_HOME/skill-hub/backups/`. A deleted personal skill bundle can be recovered from `$DSH_HOME/skill-hub/trash/`.

## Restore on another computer

1. Install the plugin and open **Sync**.
2. Enter the same Git remote and branch, then select your local directory and client targets.
3. Choose **Save and restore**. Review the restore, favorite installation, and distribution results before resolving any reported conflicts.

Choose an empty directory for a fresh clone or select an existing checkout of the same remote. To keep an existing directory of skills without Git, use an empty remote branch so restore can initialize and push that library.

## Generate a plugin installation prompt

Open **Plugins**, expand a plugin, select the target client, and choose **Generate install prompt**. Copy it into an Agent conversation. You can also start from a favorite whose local files are missing.
