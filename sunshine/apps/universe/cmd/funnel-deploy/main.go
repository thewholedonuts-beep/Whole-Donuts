package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/thewholedonuts-beep/wholedonuts-universe/pkg/domains"
	"gopkg.in/yaml.v2"
)

type FunnelConfig struct {
	Domains []struct {
		Name    string   `yaml:"name"`
		TLD     string   `yaml:"tld"`
		Status  string   `yaml:"status"`
		Funnels []string `yaml:"funnels"`
	} `yaml:"domains"`
	Funnels map[string]struct {
		Name          string `yaml:"name"`
		Domain        string `yaml:"domain"`
		Status        string `yaml:"status"`
		ServerIP      string `yaml:"server_ip"`
		EmailProvider string `yaml:"email_provider"`
	} `yaml:"funnels"`
}

func main() {
	var (
		configFile = flag.String("config", "config/funnels.yaml", "Path to funnels configuration file")
		action     = flag.String("action", "deploy", "Action: deploy, validate, list")
		apiKey     = flag.String("api-key", os.Getenv("PORKBUN_API_KEY"), "Porkbun API Key")
		secretKey  = flag.String("secret-key", os.Getenv("PORKBUN_SECRET_KEY"), "Porkbun Secret Key")
	)
	flag.Parse()

	if *apiKey == "" || *secretKey == "" {
		log.Fatal("❌ PORKBUN_API_KEY and PORKBUN_SECRET_KEY environment variables required")
	}

	manager := domains.NewManager(*apiKey, *secretKey)
	ctx := context.Background()

	switch *action {
	case "validate":
		if err := validateConfig(*configFile); err != nil {
			log.Fatalf("❌ Configuration validation failed: %v", err)
		}
		fmt.Println("✅ Configuration is valid")

	case "deploy":
		if err := deployFunnels(ctx, manager, *configFile); err != nil {
			log.Fatalf("❌ Deployment failed: %v", err)
		}
		fmt.Println("✅ Deployment complete")

	case "list":
		listFunnels(ctx, manager)

	default:
		flag.Usage()
	}
}

func validateConfig(configFile string) error {
	data, err := os.ReadFile(configFile)
	if err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}
	data = []byte(os.ExpandEnv(string(data)))

	var config FunnelConfig
	if err := yaml.Unmarshal(data, &config); err != nil {
		return fmt.Errorf("failed to parse YAML: %w", err)
	}

	if len(config.Domains) == 0 {
		return fmt.Errorf("no domains defined in configuration")
	}

	if len(config.Funnels) == 0 {
		return fmt.Errorf("no funnels defined in configuration")
	}

	return nil
}

func deployFunnels(ctx context.Context, manager *domains.Manager, configFile string) error {
	data, err := os.ReadFile(configFile)
	if err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}
	data = []byte(os.ExpandEnv(string(data)))

	var config FunnelConfig
	if err := yaml.Unmarshal(data, &config); err != nil {
		return fmt.Errorf("failed to parse YAML: %w", err)
	}

	fmt.Println("\n🚀 Starting funnel deployment...")

	// Add domains
	fmt.Println("📍 Registering domains:")
	for _, d := range config.Domains {
		if d.Status == "active" {
			domain, err := manager.AddDomain(ctx, d.Name, d.TLD)
			if err != nil {
				log.Printf("⚠️  Failed to add domain %s.%s: %v", d.Name, d.TLD, err)
				continue
			}
			fmt.Printf("  ✅ %s (Funnels: %d)\n", domain.FullDomain, len(d.Funnels))
		}
	}

	// Create funnels
	fmt.Println("\n💰 Creating funnels:")
	for funnelID, funnelCfg := range config.Funnels {
		if funnelCfg.Status == "active" {
			cfgMap := map[string]interface{}{
				"emailProvider": funnelCfg.EmailProvider,
				"trackingID":    funnelID,
			}

			funnel, err := manager.CreateFunnel(
				ctx,
				funnelID,
				funnelCfg.Name,
				funnelCfg.Domain,
				funnelCfg.ServerIP,
				cfgMap,
			)
			if err != nil {
				log.Printf("⚠️  Failed to create funnel %s: %v", funnelID, err)
				continue
			}
			fmt.Printf("  ✅ %s (%s)\n", funnel.Name, funnelID)
		}
	}

	fmt.Println("\n✅ Deployment complete!")
	return nil
}

func listFunnels(ctx context.Context, manager *domains.Manager) {
	fmt.Println("\n=== CONFIGURED FUNNELS ===")
	funnels := manager.ListFunnels()
	if len(funnels) == 0 {
		fmt.Println("No funnels configured")
		return
	}
	for _, f := range funnels {
		fmt.Printf("\n💰 %s\n", f.Name)
		fmt.Printf("   ID: %s\n", f.ID)
		fmt.Printf("   Status: %s\n", f.Status)
		fmt.Printf("   Domain: %s\n", f.Domain)
		fmt.Printf("   Landing: https://%s.%s\n", f.LandingPage, f.Domain)
		fmt.Printf("   Checkout: https://%s.%s\n", f.Checkout, f.Domain)
		fmt.Printf("   Confirmation: https://%s.%s\n", f.ThankYouPage, f.Domain)
	}
}
