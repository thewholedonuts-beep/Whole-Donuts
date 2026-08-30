package domains

import (
	"path/filepath"
	"testing"
)

func TestLoadConfigAcceptsInactivePublicExample(t *testing.T) {
	cfg, err := LoadConfig(filepath.Join("..", "..", "config", "examples", "funnels.example.yaml"))
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}

	if err := ValidateConfig(cfg); err != nil {
		t.Fatalf("ValidateConfig() error = %v", err)
	}
}

func TestValidateConfigRejectsActiveConfiguration(t *testing.T) {
	cfg := &Config{
		Domains: []DomainConfig{{Name: "example", TLD: "invalid", Status: "active"}},
		Funnels: map[string]FunnelYAMLConfig{
			"sample": {Domain: "example.invalid", Status: "inactive"},
		},
	}

	if err := ValidateConfig(cfg); err == nil {
		t.Fatal("ValidateConfig() accepted an active public configuration")
	}
}
