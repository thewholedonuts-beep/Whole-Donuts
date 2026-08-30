# Domain funnel configuration validator

This tool validates **inactive, sanitized examples** only. It has no registrar
client, credentials, DNS record operations, deployment command, or automated
workflow. It must not be used as public DNS or deployment configuration.

Run `go test ./...` to test the validator or `go run ./cmd/funnel-cli` to
validate `config/examples/funnels.example.yaml`. Any real domain, provider
configuration, IP address, or deployment plan belongs in private operations
systems outside this public repository.
