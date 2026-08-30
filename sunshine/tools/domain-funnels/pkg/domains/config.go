package domains

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v2"
)

// Config represents the funnels configuration from YAML
type Config struct {
	Domains []DomainConfig            `yaml:"domains"`
	Funnels map[string]FunnelYAMLConfig `yaml:"funnels"`
}

// DomainConfig represents a domain in the configuration
type DomainConfig struct {
	Name    string   `yaml:"name"`
	TLD     string   `yaml:"tld"`
	Status  string   `yaml:"status"`
	Funnels []string `yaml:"funnels"`
}

// FunnelYAMLConfig represents a funnel in the configuration
type FunnelYAMLConfig struct {
	Name    string `yaml:"name"`
	Domain  string `yaml:"domain"`
	Status  string `yaml:"status"`
	Purpose string `yaml:"purpose"`
}

// LoadConfig loads and parses the YAML configuration file
func LoadConfig(filePath string) (*Config, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse YAML: %w", err)
	}

	return &cfg, nil
}

// ValidateConfig checks that the configuration is valid
func ValidateConfig(cfg *Config) error {
	if len(cfg.Domains) == 0 {
		return fmt.Errorf("no domains defined")
	}

	if len(cfg.Funnels) == 0 {
		return fmt.Errorf("no funnels defined")
	}

	domains := make(map[string]struct{}, len(cfg.Domains))
	for _, domain := range cfg.Domains {
		if domain.Name == "" || domain.TLD == "" {
			return fmt.Errorf("domain entries require name and tld")
		}
		if domain.Status != "inactive" {
			return fmt.Errorf("domain %s.%s must be inactive in public configuration", domain.Name, domain.TLD)
		}
		domains[domain.Name+"."+domain.TLD] = struct{}{}
	}

	for funnelID, funnel := range cfg.Funnels {
		if funnel.Domain == "" {
			return fmt.Errorf("funnel %s missing domain", funnelID)
		}
		if funnel.Status != "inactive" {
			return fmt.Errorf("funnel %s must be inactive in public configuration", funnelID)
		}
		if _, ok := domains[funnel.Domain]; !ok {
			return fmt.Errorf("funnel %s references an unknown domain", funnelID)
		}
	}

	return nil
}
