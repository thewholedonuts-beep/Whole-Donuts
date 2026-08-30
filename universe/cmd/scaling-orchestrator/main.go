package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/thewholedonuts-beep/wholedonuts-universe/pkg/domains"
)

type ScalingStrategy struct {
	Name              string
	TemplateNetworks []string
	TargetDomains    []string
	FunnelsPerDomain int
	ServerIPs        []string
}

type ScalingOrchestrator struct {
	manager    *domains.Manager
	strategies map[string]*ScalingStrategy
	mu         sync.RWMutex
}

func NewScalingOrchestrator(apiKey, secretKey string) *ScalingOrchestrator {
	return &ScalingOrchestrator{
		manager:    domains.NewManager(apiKey, secretKey),
		strategies: make(map[string]*ScalingStrategy),
	}
}

func (so *ScalingOrchestrator) CreateScalingStrategy(name string, templateNets []string, targetDomains []string, funnelsPerDomain int, serverIPs []string) *ScalingStrategy {
	so.mu.Lock()
	defer so.mu.Unlock()

	strategy := &ScalingStrategy{
		Name:              name,
		TemplateNetworks: templateNets,
		TargetDomains:    targetDomains,
		FunnelsPerDomain: funnelsPerDomain,
		ServerIPs:        serverIPs,
	}

	so.strategies[name] = strategy
	fmt.Printf("✅ Scaling strategy '%s' created\n", name)
	return strategy
}

func (so *ScalingOrchestrator) ExecuteScaling(ctx context.Context, strategyName string) error {
	so.mu.RLock()
	strategy, exists := so.strategies[strategyName]
	so.mu.RUnlock()

	if !exists {
		return fmt.Errorf("strategy %s not found", strategyName)
	}

	fmt.Printf("\n🚀 Executing scaling strategy: %s\n", strategyName)
	fmt.Printf("   Target domains: %d\n", len(strategy.TargetDomains))
	fmt.Printf("   Funnels per domain: %d\n", strategy.FunnelsPerDomain)
	fmt.Printf("   Server IPs: %d\n", len(strategy.ServerIPs))

	var wg sync.WaitGroup
	errorChan := make(chan error, 100)
	deployedCount := 0
	mu := sync.Mutex{}

	for domainIdx, domain := range strategy.TargetDomains {
		parts := parseDomain(domain)
		if len(parts) != 2 {
			continue
		}

		// Register domain
		_, err := so.manager.AddDomain(ctx, parts[0], parts[1])
		if err != nil {
			log.Printf("⚠️  Failed to register %s: %v", domain, err)
		}

		// Deploy funnels to this domain
		for funnelNum := 1; funnelNum <= strategy.FunnelsPerDomain; funnelNum++ {
			wg.Add(1)

			go func(d string, fn int, serverIP string) {
				defer wg.Done()

				funnelID := fmt.Sprintf("scale-funnel-%d-%d", domainIdx, fn)
				funnelName := fmt.Sprintf("Scaled Funnel %d - %s", fn, d)

				config := map[string]interface{}{
					"scalingID":      strategyName,
					"trackingID":     funnelID,
					"emailProvider":  "sendgrid",
				}

				_, err := so.manager.CreateFunnel(ctx, funnelID, funnelName, d, serverIP, config)
				if err != nil {
					errorChan <- fmt.Errorf("failed to deploy %s: %w", funnelID, err)
				} else {
					mu.Lock()
					deployedCount++
					mu.Unlock()
					fmt.Printf("   ✅ Deployed %s\n", funnelID)
				}
			}(domain, funnelNum, strategy.ServerIPs[funnelNum%len(strategy.ServerIPs)])
		}
	}

	wg.Wait()
	close(errorChan)

	errorCount := 0
	for err := range errorChan {
		if err != nil {
			log.Printf("❌ %v", err)
			errorCount++
		}
	}

	fmt.Printf("\n✅ Scaling complete: %d deployed, %d errors\n", deployedCount, errorCount)
	return nil
}

func (so *ScalingOrchestrator) HealthCheck(ctx context.Context) map[string]interface{} {
	fmt.Println("\n🏥 Running health check...")

	healthStatus := map[string]interface{}{
		"timestamp":        time.Now().Format(time.RFC3339),
		"domains_count":    len(so.manager.ListDomains()),
		"funnels_count":    len(so.manager.ListFunnels()),
		"strategies_count": len(so.strategies),
		"status":           "healthy",
	}

	// Test Porkbun API connectivity
	_, err := so.manager.GetDomainRecords(ctx, "wholedonuts.org")
	if err != nil {
		healthStatus["api_status"] = "offline"
		healthStatus["status"] = "unhealthy"
	} else {
		healthStatus["api_status"] = "online"
	}

	fmt.Printf("✅ Health check complete: %s\n", healthStatus["status"])
	return healthStatus
}

func parseDomain(fullDomain string) []string {
	var parts []string
	var name, tld string
	for i := len(fullDomain) - 1; i >= 0; i-- {
		if fullDomain[i] == '.' {
			name = fullDomain[:i]
			tld = fullDomain[i+1:]
			break
		}
	}
	if name != "" && tld != "" {
		parts = append(parts, name, tld)
	}
	return parts
}

func main() {
	var (
		apiKey     = flag.String("api-key", os.Getenv("PORKBUN_API_KEY"), "Porkbun API Key")
		secretKey  = flag.String("secret-key", os.Getenv("PORKBUN_SECRET_KEY"), "Porkbun Secret Key")
		command   = flag.String("cmd", "", "Command: scale, health-check, list-strategies")
		strategy  = flag.String("strategy", "", "Strategy name")
	)
	flag.Parse()

	if *apiKey == "" || *secretKey == "" {
		log.Fatal("❌ PORKBUN_API_KEY and PORKBUN_SECRET_KEY environment variables required")
	}

	orchestrator := NewScalingOrchestrator(*apiKey, *secretKey)
	ctx := context.Background()

	switch *command {
	case "scale":
		if *strategy == "" {
			log.Fatal("❌ --strategy required")
		}
		err := orchestrator.ExecuteScaling(ctx, *strategy)
		if err != nil {
			log.Fatalf("❌ Scaling failed: %v", err)
		}

	case "health-check":
		status := orchestrator.HealthCheck(ctx)
		fmt.Printf("\nHealth Status: %v\n", status)

	case "list-strategies":
		orchestrator.mu.RLock()
		for name, strategy := range orchestrator.strategies {
			fmt.Printf("\n📋 %s\n", name)
			fmt.Printf("   Template Networks: %v\n", strategy.TemplateNetworks)
			fmt.Printf("   Target Domains: %d\n", len(strategy.TargetDomains))
			fmt.Printf("   Funnels per Domain: %d\n", strategy.FunnelsPerDomain)
		}
		orchestrator.mu.RUnlock()

	default:
		flag.Usage()
	}
}
