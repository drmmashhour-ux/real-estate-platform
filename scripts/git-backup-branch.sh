#!/usr/bin/env bash
# Create a local backup branch at the current HEAD for safe rollback / comparison.
# Usage: ./scripts/git-backup-branch.sh [short-label]
# Then: git push -u origin <printed-branch-name>
set -euo pipefail

LABEL="${1:-snapshot}"
SAFE_LABEL=$(echo "$LABEL" | sed 's/[^a-zA-Z0-9._-]/_/g')
BR="backup/$(date +%Y%m%d)-${SAFE_LABEL}"

git branch "$BR"
echo "Created local branch: $BR (at current HEAD)"
echo "Push to remote: git push -u origin $BR"
