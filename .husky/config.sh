#!/usr/bin/env bash

# -----------------------------------------------------------------------------
# Balance Engineering Toolkit Configuration
# -----------------------------------------------------------------------------

# Project
readonly PROJECT_NAME="Balance"
readonly PROJECT_VERSION="1.0.0"

# Commands
readonly FORMAT_COMMAND="npm run format:check"
readonly LINT_COMMAND="npm run lint"
readonly TEST_COMMAND="npm run test"

# Hook behavior
readonly RUN_DOCTOR=true
readonly RUN_FORMAT=true
readonly RUN_LINT=true
readonly RUN_TESTS=true

# Output
readonly SHOW_TIMINGS=true
readonly SHOW_BANNER=true
readonly USE_COLOR=true

# Environment
readonly REQUIRED_TOOLS=(
    node
    npm
    git
)

# Optional tools (reported if installed)
readonly OPTIONAL_TOOLS=()

# Exit behavior
readonly STOP_ON_FIRST_FAILURE=true
