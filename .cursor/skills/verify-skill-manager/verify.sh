#!/usr/bin/env bash
set -euo pipefail
umask 077
skill=$(cd "$(dirname "$0")" && pwd -P)
repo=$(cd "$skill/../../.." && pwd -P)
case "${1:-all}" in
  doctor) exec node "$skill/browser.mjs" doctor "${2:?supply the scratch path printed by launch}" ;;
  all|search|distribution|sync) scenario=${1:-all} ;;
  *) echo 'Usage: verify.sh [all|search|distribution|sync|doctor RUN_DIR]' >&2; exit 2 ;;
esac
cd "$repo"
cli=${DSH_CLI_JS:-"$(dirname "$repo")/deepseek-harness/apps/cli/lib/bin.js"}
if [[ -f "$cli" ]]; then host=(node "$cli"); else host=(dsh); command -v dsh >/dev/null; fi
npm run build
mkdir -p .verification
proof=$(mktemp -d "$repo/.verification/run-XXXXXXXX")
scratch=$(mktemp -d "${TMPDIR:-/tmp}/verify-skill-manager-XXXXXXXX")
pid=''
cleanup() {
  if [[ -n "$pid" ]]; then kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; fi
  rm -rf -- "$scratch"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
echo "Scratch: $scratch"
echo "Evidence: $proof"
cd "$scratch"
mkdir -p library/skills/{qa-alpha,qa-beta} dsh/skill-hub dsh/skills agents
for name in qa-alpha qa-beta; do
  printf -- '---\nname: %s\ndescription: Verification specimen %s\n---\n\nBody of %s.\n' "$name" "$name" "$name" > "library/skills/$name/SKILL.md"
done
git init --bare --initial-branch=main remote.git > /dev/null
node --input-type=module -e 'import fs from "node:fs";const base=process.cwd();fs.writeFileSync("dsh/skill-hub/settings.json",JSON.stringify({version:1,personalDir:base+"/library",gitRemote:base+"/remote.git",gitBranch:"main",autoDistribute:false,autoSync:false,targets:[{id:"dsh",label:"DSH",path:base+"/dsh/skills",mode:"link",enabled:true}]}))'
env_args=(env -i "PATH=$PATH" "DSH_HOME=$scratch/dsh" "DSH_AGENTS_HOME=$scratch/agents" GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_ALLOW_PROTOCOL=file CI=true)
"${env_args[@]}" "${host[@]}" plugin --profile web add "link:$repo" >setup.log 2>&1 || { cat setup.log >&2; exit 1; }
port=$(node -e 'const server=require("node:net").createServer();server.listen(0,"127.0.0.1",()=>{console.log(server.address().port);server.close()})')
"${env_args[@]}" "${host[@]}" web --host 127.0.0.1 --port "$port" --no-open >host.log 2>&1 &
pid=$!
printf '%s\n' "$pid" >pid
printf '%s\n' "$port" >port
for ((i=0;i<180;i++)); do
  if grep -q 'dsh web: http://127.0.0.1:' host.log; then break; fi
  if ! kill -0 "$pid" 2>/dev/null; then sed -E 's/token=[^ ]+/token=REDACTED/g' host.log >&2; exit 1; fi
  sleep 0.5
done
node "$skill/browser.mjs" doctor "$scratch"
node "$skill/browser.mjs" "$scenario" "$scratch" "$proof"
