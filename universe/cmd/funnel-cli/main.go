package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/thewholedonuts-beep/wholedonuts-universe/pkg/domains"
)

func main() {
	var (
		apiKey      = flag.String("api-key", os.Getenv("PORKBUN_API_KEY"), "Porkbun API Key")
		secretKey   = flag.String("secret-key", os.Getenv("PORKBUN_SECRET_KEY"), "Porkbun Secret API Key")
		command    = flag.String("cmd", "", "Command: add-domain, create-funnel, list-domains, list-funnels, activate, deactivate")
		domain     = flag.String("domain", "", "Domain name (e.g., wholedonuts.org)")
		funnelID   = flag.String("funnel-id", "", "Funnel ID")
		funnelName = flag.String("funnel-name", "", "Funnel name")
		ipAddress  = flag.String("ip", "", "Target IP address")
	)
	flag.Parse()

	if *apiKey == "" || *secretKey == "" {
		log.Fatal("❌ PORKBUN_API_KEY and PORKBUN_SECRET_KEY environment variables required")
	}

	manager := domains.NewManager(*apiKey, *secretKey)
	ctx := context.Background()

	switch *command {
	case "add-domain":
		if *domain == "" {
			log.Fatal("❌ --domain required")
		}
		parts := parseFullDomain(*domain)
		if len(parts) != 2 {
			log.Fatal("❌ Invalid domain format. Use: name.tld")
		}
		d, err := manager.AddDomain(ctx, parts[0], parts[1])
		if err != nil {
			log.Fatalf("❌ Failed to add domain: %v", err)
		}
		fmt.Printf("✅ Domain added: %s\n", d.FullDomain)
		fmt.Printf("   Status: %s\n", d.Status)
		fmt.Printf("   Records: %d\n", len(d.Records))

	case "create-funnel":
		if *funnelID == "" || *domain == "" || *funnelName == "" || *ipAddress == "" {
			log.Fatal("❌ --funnel-id, --domain, --funnel-name, and --ip required")
		}
		_, err := manager.AddDomain(ctx, parseFullDomain(*domain)[0], parseFullDomain(*domain)[1])
		if err != nil && !contains(err.Error(), "not registered") {
			log.Fatalf("❌ Failed to add domain: %v", err)
		}
		config := map[string]interface{}{
			"emailProvider": "sendgrid",
			"trackingID":    *funnelID,
		}
		f, err := manager.CreateFunnel(ctx, *funnelID, *funnelName, *domain, *ipAddress, config)
		if err != nil {
			log.Fatalf("❌ Failed to create funnel: %v", err)
		}
		fmt.Printf("✅ Funnel created: %s (%s)\n", f.ID, f.Name)
		fmt.Printf("   Landing Page: %s.%s\n", f.LandingPage, f.Domain)
		fmt.Printf("   Checkout: %s.%s\n", f.Checkout, f.Domain)
		fmt.Printf("   Thank You: %s.%s\n", f.ThankYouPage, f.Domain)

	case "list-domains":
		domains := manager.ListDomains()
		if len(domains) == 0 {
			fmt.Println("No domains registered")
			return
		}
		fmt.Println("\n=== DOMAINS ===")
		for _, d := range domains {
			fmt.Printf("📍 %s\n", d.FullDomain)
			fmt.Printf("   Status: %s\n", d.Status)
			fmt.Printf("   Records: %d\n", len(d.Records))
			fmt.Printf("   Funnels: %v\n", d.Funnels)
		}

	case "list-funnels":
		funnels := manager.ListFunnels()
		if len(funnels) == 0 {
			fmt.Println("No funnels configured")
			return
		}
		fmt.Println("\n=== FUNNELS ===")
		for _, f := range funnels {
			fmt.Printf("💰 %s (%s)\n", f.ID, f.Name)
			fmt.Printf("   Status: %s\n", f.Status)
			fmt.Printf("   Domain: %s\n", f.Domain)
			fmt.Printf("   Landing: %s.%s\n", f.LandingPage, f.Domain)
			fmt.Printf("   Checkout: %s.%s\n", f.Checkout, f.Domain)
		}

	case "activate":
		if *funnelID == "" {
			log.Fatal("❌ --funnel-id required")
		}
		err := manager.ActivateFunnel(*funnelID)
		if err != nil {
			log.Fatalf("❌ Failed to activate funnel: %v", err)
		}

	case "deactivate":
		if *funnelID == "" {
			log.Fatal("❌ --funnel-id required")
		}
		err := manager.DeactivateFunnel(*funnelID)
		if err != nil {
			log.Fatalf("❌ Failed to deactivate funnel: %v", err)
		}

	default:
		flag.Usage()
	}
}

func parseFullDomain(domain string) []string {
	var parts []string
	var name, tld string
	for i := len(domain) - 1; i >= 0; i-- {
		if domain[i] == '.' {
			name = domain[:i]
			tld = domain[i+1:]
			break
		}
	}
	if name != "" && tld != "" {
		parts = append(parts, name, tld)
	}
	return parts
}

func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && (s == substr || (len(s) > len(substr) && s[:len(substr)] == substr))
}
