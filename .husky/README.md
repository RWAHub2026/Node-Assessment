# Husky

This repository includes Git hooks to mirror a typical team workflow.

The hooks provide fast local feedback before code is committed. They are **not** part of the exercise — you do not need to modify, debug, or extend them.

## What the hooks do

### pre-commit

Runs environment validation, formatting checks, ESLint, and the test suite.

### pre-push

Runs the complete quality checks.

### post-checkout

Displays a short welcome message on first checkout.

### commit-msg

Provides non-blocking guidance for commit messages.

## Why we include Husky

Candidates receive the same fast feedback our engineers get, without configuring tooling themselves. The exercise focuses on React engineering rather than repository setup.
