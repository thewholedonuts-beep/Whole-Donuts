# WholeDonut Funnel Management Makefile

.PHONY: help build run test clean setup deploy list activate deactivate

help:
	@echo "WholeDonut Funnel Management - Available Commands:"
	@echo ""
	@echo "  make setup          - Install dependencies and configure environment"
	@echo "  make build          - Build CLI tools"
	@echo "  make test           - Run tests"
	@echo "  make deploy         - Deploy funnels from config/funnels.yaml"
	@echo "  make list           - List all domains and funnels"
	@echo "  make activate       - Activate all funnels"
	@echo "  make deactivate     - Deactivate all funnels"
	@echo "  make clean          - Remove build artifacts"
	@echo ""

setup:
	@echo "📦 Setting up environment..."
	@test -f .env || cp .env.example .env
	@echo "ℹ️  Update .env with your Porkbun API credentials"
	@source .env
	@go mod download
	@go mod tidy
	@echo "✅ Setup complete"

build:
	@echo "🔨 Building CLI tools..."
	@mkdir -p bin
	@go build -o bin/funnel-cli ./cmd/funnel-cli
	@go build -o bin/funnel-deploy ./cmd/funnel-deploy
	@echo "✅ Build complete"

test:
	@echo "🧪 Running tests..."
	@go test -v -race -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "✅ Tests complete (coverage: coverage.html)"

deploy: build
	@echo "🚀 Deploying funnels..."
	@./bin/funnel-deploy -config=config/funnels.yaml -action=deploy

list: build
	@echo "📊 Listing domains and funnels..."
	@./bin/funnel-cli -cmd=list-domains
	@echo ""
	@./bin/funnel-cli -cmd=list-funnels

activate: build
	@echo "🚀 Activating funnels..."
	@./bin/funnel-cli -cmd=activate -funnel-id=lead-capture-org
	@./bin/funnel-cli -cmd=activate -funnel-id=checkout-buzz
	@./bin/funnel-cli -cmd=activate -funnel-id=content-chef

deactivate: build
	@echo "⏸️  Deactivating funnels..."
	@./bin/funnel-cli -cmd=deactivate -funnel-id=lead-capture-org
	@./bin/funnel-cli -cmd=deactivate -funnel-id=checkout-buzz
	@./bin/funnel-cli -cmd=deactivate -funnel-id=content-chef

clean:
	@echo "🧹 Cleaning up..."
	@rm -rf bin/ coverage.out coverage.html
	@go clean
	@echo "✅ Clean complete"

.DEFAULT_GOAL := help
