#!/usr/bin/env bash

set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

header "Environment Check"

check_command() {
    local name="$1"
    local install_hint="$2"

    if command_exists "$name"; then
        local version
        version="$("$name" --version 2>/dev/null | head -n1 || true)"

        if [[ -n "$version" ]]; then
            success "${name}: ${version}"
        else
            success "${name}"
        fi

        return
    fi

    error "${name} is not installed."
    echo
    echo "Install:"
    echo "  ${install_hint}"
    echo

    exit 1
}

check_command \
    node \
    "https://nodejs.org/"

check_command \
    npm \
    "https://nodejs.org/"

echo
success "Environment looks good."
