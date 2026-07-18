#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "${SCRIPT_DIR}/common.sh"
source "${SCRIPT_DIR}/../config.sh"

header "Lint"

if ! command_exists npm; then
    die "npm is not installed."
fi

if [[ ! -f "${ROOT_DIR}/package.json" ]]; then
    die "package.json not found."
fi

step "Running ESLint"

if npm run lint; then
    success "Lint passed."
    exit 0
fi

echo
error "Lint failed."

cat <<EOF

Run:

    npm run lint

Review the reported issues, fix them, and commit again.

EOF

exit 1
