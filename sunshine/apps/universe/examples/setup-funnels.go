package main

import (
	"context"
	"fmt"
	"log"

	"github.com/thewholedonuts-beep/wholedonuts-universe/pkg/domains"
)

// Example: Setup money-making funnels for WholeDonut domains
func main() {
	// Initialize domain manager with your Porkbun credentials
	manager := domains.NewManager(
		"YOUR_PORKBUN_API_KEY",
		"YOUR_PORKBUN_SECRET_KEY",
	)

	ctx := context.Background()

	// Step 1: Register your primary domains
	fmt.Println("📍 Registering domains...")

	domain1, err := manager.AddDomain(ctx, "wholedonuts", "org")
	if err != nil {
		log.Fatalf("Failed to add domain: %v", err)
	}
	fmt.Printf("✅ Added domain: %s\n", domain1.FullDomain)

	domain2, err := manager.AddDomain(ctx, "wholedonuts", "buzz")
	if err != nil {
		log.Fatalf("Failed to add domain: %v", err)
	}
	fmt.Printf("✅ Added domain: %s\n", domain2.FullDomain)

	domain3, err := manager.AddDomain(ctx, "thenutur3dchef", "com")
	if err != nil {
		log.Fatalf("Failed to add domain: %v", err)
	}
	fmt.Printf("✅ Added domain: %s\n", domain3.FullDomain)

	// Step 2: Create funnels for lead capture
	fmt.Println("\n💰 Creating lead capture funnels...")

	funnel1Config := map[string]interface{}{
		"emailProvider": "sendgrid",
		"trackingID":    "lead-capture-org",
		"listID":        "lead-list-1",
	}

	funnel1, err := manager.CreateFunnel(
		ctx,
		"lead-capture-org",
		"Lead Capture - WholeDonut Org",
		"wholedonuts.org",
		"192.168.1.100", // Your server IP
		funnel1Config,
	)
	if err != nil {
		log.Fatalf("Failed to create funnel: %v", err)
	}
	fmt.Printf("✅ Funnel created: %s\n", funnel1.Name)

	// Step 3: Create funnels for e-commerce checkout
	fmt.Println("\n💳 Creating checkout funnels...")

	funnel2Config := map[string]interface{}{
		"emailProvider":  "mailchimp",
		"trackingID":     "checkout-buzz",
		"paymentGateway": "stripe",
	}

	funnel2, err := manager.CreateFunnel(
		ctx,
		"checkout-buzz",
		"Checkout Funnel - WholeDonut Buzz",
		"wholedonuts.buzz",
		"192.168.1.101",
		funnel2Config,
	)
	if err != nil {
		log.Fatalf("Failed to create funnel: %v", err)
	}
	fmt.Printf("✅ Funnel created: %s\n", funnel2.Name)

	// Step 4: Create webinar/content funnel
	fmt.Println("\n🎓 Creating content funnels...")

	funnel3Config := map[string]interface{}{
		"emailProvider": "activecampaign",
		"trackingID":    "content-chef",
		"courseID":      "nutrition-course-101",
	}

	funnel3, err := manager.CreateFunnel(
		ctx,
		"content-chef",
		"Nutrition Content - TheNutur3dChef",
		"thenutur3dchef.com",
		"192.168.1.102",
		funnel3Config,
	)
	if err != nil {
		log.Fatalf("Failed to create funnel: %v", err)
	}
	fmt.Printf("✅ Funnel created: %s\n", funnel3.Name)

	// Step 5: Test and activate funnels
	fmt.Println("\n🚀 Activating funnels...")

	err = manager.ActivateFunnel("lead-capture-org")
	if err != nil {
		log.Printf("Failed to activate funnel: %v", err)
	}

	err = manager.ActivateFunnel("checkout-buzz")
	if err != nil {
		log.Printf("Failed to activate funnel: %v", err)
	}

	err = manager.ActivateFunnel("content-chef")
	if err != nil {
		log.Printf("Failed to activate funnel: %v", err)
	}

	// Step 6: Display all configured funnels
	fmt.Println("\n=== CONFIGURED FUNNELS ===")
	funnels := manager.ListFunnels()
	for _, f := range funnels {
		fmt.Printf("💰 %s (%s)\n", f.ID, f.Name)
		fmt.Printf("   Status: %s\n", f.Status)
		fmt.Printf("   Domain: %s\n", f.Domain)
		fmt.Printf("   Landing: https://%s.%s\n", f.LandingPage, f.Domain)
		fmt.Printf("   Checkout: https://%s.%s\n", f.Checkout, f.Domain)
		fmt.Printf("   Confirmation: https://%s.%s\n", f.ThankYouPage, f.Domain)
	}

	// Step 7: Retrieve DNS records for verification
	fmt.Println("\n=== DNS RECORDS ===")
	records, err := manager.GetDomainRecords(ctx, "wholedonuts.org")
	if err != nil {
		log.Printf("Failed to get records: %v", err)
	} else {
		for _, r := range records {
			if r.Type == "A" {
				fmt.Printf("📍 %s.wholedonuts.org -> %s\n", r.Name, r.Content)
			}
		}
	}
}
