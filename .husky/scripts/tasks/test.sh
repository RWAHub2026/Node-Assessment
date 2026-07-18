#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "${SCRIPT_DIR}/common.sh"

header "Tests"

if ! command_exists npm; then
    die "npm is not installed."
fi

step "Running test suite"

if npm run test; then
    success "All tests passed."
    exit 0
fi

echo
error "Tests failed."

cat <<EOF

Try running:

    npm run test:watch

to see more detailed output.

EOF

exit 1
