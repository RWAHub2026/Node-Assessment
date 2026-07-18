#!/usr/bin/env bash

set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
source "$(dirname "${BASH_SOURCE[0]}")/../config.sh"

echo "${PROJECT_NAME} ${PROJECT_VERSION}"
