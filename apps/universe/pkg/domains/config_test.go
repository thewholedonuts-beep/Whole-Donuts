package domains

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadConfigIncludesManagedDomains(t *testing.T) {
	cfg, err := LoadConfig(filepath.Join("..", "..", "config", "funnels.yaml"))
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}

	fullDomains := make(map[string]struct{}, len(cfg.Domains))
	for _, domain := range cfg.Domains {
		fullDomains[domain.Name+"."+domain.TLD] = struct{}{}
	}

	expectedDomains := []string{
		"wholedonuts.org",
		"wholedonuts.buzz",
		"wholedonuts.app",
		"wenevergonnaclose.com",
		"thenurturedchef.com",
		"thenurturedchef.foundation",
		"thenutur3dchef.com",
	}

	for _, domain := range expectedDomains {
		if _, ok := fullDomains[domain]; !ok {
			t.Errorf("expected domain %q to be present in config/funnels.yaml", domain)
		}
	}
}

func TestDomainInventoryDocumentsRequestedDomains(t *testing.T) {
	requiredDomains := []string{
		"wholedonuts.org",
		"wholedonuts.buzz",
		"wholedonuts.app",
		"wenevergonnaclose.com",
		"thenurturedchef.com",
		"thenurturedchef.foundation",
		"thenutur3dchef.com",
		"thewholedonuts-beep.github.io",
		"thewholedonuts-universe.github.io",
	}

	inventoryFiles := []string{
		filepath.Join("..", "..", "README.md"),
		filepath.Join("..", "..", "DOMAINS.md"),
		filepath.Join("..", "..", "projects", "wholedonut-universe.yml"),
	}

	for _, file := range inventoryFiles {
		content, err := os.ReadFile(file)
		if err != nil {
			t.Errorf("ReadFile(%q) error = %v", file, err)
			continue
		}

		text := string(content)
		for _, domain := range requiredDomains {
			if !strings.Contains(text, domain) {
				t.Errorf("expected %q to be documented in %s", domain, file)
			}
		}
	}
}
