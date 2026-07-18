.PHONY: help install fmt fmt-check lint test check clean

help:
	@echo "Available commands:"
	@echo "  make install      Install Node.js dependencies"
	@echo "  make fmt          Format sources with Prettier"
	@echo "  make fmt-check    Verify formatting"
	@echo "  make lint         Run ESLint"
	@echo "  make test         Run Vitest"
	@echo "  make check        Run all quality checks"
	@echo "  make clean        Remove build artifacts"

install:
	npm install

fmt:
	npm run format

fmt-check:
	npm run format:check

lint:
	npm run lint

test:
	npm run test

check: fmt-check lint test

clean:
	rm -rf dist node_modules
