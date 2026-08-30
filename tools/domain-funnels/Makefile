.PHONY: help build test clean validate

help:
	@echo "Domain funnel configuration validator"
	@echo "  make build     - Build offline validation tools"
	@echo "  make test      - Run tests"
	@echo "  make validate  - Validate the inactive example configuration"

build:
	@mkdir -p bin
	@go build -o bin/funnel-cli ./cmd/funnel-cli
	@go build -o bin/analytics-dashboard ./cmd/analytics-dashboard

test:
	@go test ./...

validate:
	@go run ./cmd/funnel-cli -action=validate

clean:
	@rm -rf bin/
	@go clean

.DEFAULT_GOAL := help
