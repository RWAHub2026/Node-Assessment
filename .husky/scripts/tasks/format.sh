#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "${SCRIPT_DIR}/common.sh"

header "Formatting"

if ! command_exists npm; then
    die "npm is not installed."
fi

step "Checking Prettier formatting"

if npm run format:check; then
    success "Formatting passed."
else
    echo
    error "Formatting failed."
    echo
    echo "Run:"
    echo
    echo "    npm run format"
    echo
    exit 1
fi
