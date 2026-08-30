package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/thewholedonuts-beep/wholedonuts-universe/pkg/domains"
)

type NetworkConfig struct {
	Networks map[string]NetworkDef `json:"networks"`
}

type NetworkDef struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Domains     []string `json:"domains"`
	Funnels     []string `json:"funnels"`
	Status      string   `json:"status"`
}

type NetworkManager struct {
	manager   *domains.Manager
	networks  map[string]*NetworkDef
	mu        sync.RWMutex
	apiKey    string
	secretKey string
}

func NewNetworkManager(apiKey, secretKey string) *NetworkManager {
	return &NetworkManager{
		manager:   domains.NewManager(apiKey, secretKey),
		networks:  make(map[string]*NetworkDef),
		apiKey:    apiKey,
		secretKey: secretKey,
	}
}

func (nm *NetworkManager) CreateNetwork(ctx context.Context, name, description string, domainList []string) (*NetworkDef, error) {
	nm.mu.Lock()
	defer nm.mu.Unlock()

	network := &NetworkDef{
		Name:        name,
		Description: description,
		Domains:     domainList,
		Funnels:     []string{},
		Status:      "active",
	}

	fmt.Printf("\n🌐 Creating Network: %s\n", name)
	fmt.Printf("   Domains in network: %d\n", len(domainList))

	// Register all domains in the network
	for _, domain := range domainList {
		parts := parseDomain(domain)
		if len(parts) == 2 {
			_, err := nm.manager.AddDomain(ctx, parts[0], parts[1])
			if err != nil {
				log.Printf("⚠️  Failed to add domain %s: %v", domain, err)
			} else {
				fmt.Printf("   ✅ %s registered\n", domain)
			}
		}
	}

	nm.networks[name] = network
	fmt.Printf("✅ Network '%s' created\n", name)
	return network, nil
}

func (nm *NetworkManager) DeployNetworkFunnel(ctx context.Context, networkName, funnelID, funnelName, domainFilter, serverIP string) error {
	nm.mu.RLock()
	network, exists := nm.networks[networkName]
	nm.mu.RUnlock()

	if !exists {
		return fmt.Errorf("network %s not found", networkName)
	}

	fmt.Printf("\n🚀 Deploying funnel '%s' to network '%s'\n", funnelName, networkName)

	var wg sync.WaitGroup
	errorChan := make(chan error, len(network.Domains))
	successCount := 0

	for _, domain := range network.Domains {
		// Filter domains if specified
		if domainFilter != "" && domain != domainFilter {
			continue
		}

		wg.Add(1)
		go func(d string) {
			defer wg.Done()

			funnelConfig := map[string]interface{}{
				"networkID":     networkName,
				"trackingID":    funnelID + "-" + d,
				"emailProvider": "sendgrid",
			}

			funnelName := fmt.Sprintf("%s-%s", funnelID, d)
			_, err := nm.manager.CreateFunnel(ctx, funnelName, funnelName, d, serverIP, funnelConfig)
			if err != nil {
				errorChan <- fmt.Errorf("failed to deploy to %s: %w", d, err)
			} else {
				fmt.Printf("   ✅ Deployed to %s\n", d)
			}
		}(domain)
	}

	wg.Wait()
	close(errorChan)

	for err := range errorChan {
		if err != nil {
			log.Printf("❌ %v", err)
		} else {
			successCount++
		}
	}

	network.Funnels = append(network.Funnels, funnelID)
	fmt.Printf("✅ Funnel deployment complete (%d domains)\n", len(network.Domains))
	return nil
}

func (nm *NetworkManager) ActivateNetwork(networkName string) error {
	nm.mu.RLock()
	network, exists := nm.networks[networkName]
	nm.mu.RUnlock()

	if !exists {
		return fmt.Errorf("network %s not found", networkName)
	}

	fmt.Printf("\n🚀 Activating network '%s'\n", networkName)
	for _, funnelID := range network.Funnels {
		nm.manager.ActivateFunnel(funnelID)
	}
	network.Status = "active"
	fmt.Printf("✅ Network '%s' is now ACTIVE\n", networkName)
	return nil
}

func (nm *NetworkManager) DeactivateNetwork(networkName string) error {
	nm.mu.RLock()
	network, exists := nm.networks[networkName]
	nm.mu.RUnlock()

	if !exists {
		return fmt.Errorf("network %s not found", networkName)
	}

	fmt.Printf("\n⏸️  Deactivating network '%s'\n", networkName)
	for _, funnelID := range network.Funnels {
		nm.manager.DeactivateFunnel(funnelID)
	}
	network.Status = "inactive"
	fmt.Printf("✅ Network '%s' is now INACTIVE\n", networkName)
	return nil
}

func (nm *NetworkManager) ListNetworks() map[string]*NetworkDef {
	nm.mu.RLock()
	defer nm.mu.RUnlock()
	return nm.networks
}

func (nm *NetworkManager) GetNetworkStats(networkName string) map[string]interface{} {
	nm.mu.RLock()
	network, exists := nm.networks[networkName]
	nm.mu.RUnlock()

	if !exists {
		return nil
	}

	return map[string]interface{}{
		"name":     network.Name,
		"status":   network.Status,
		"domains":  len(network.Domains),
		"funnels":  len(network.Funnels),
		"description": network.Description,
	}
}

func (nm *NetworkManager) ExportNetworkConfig(filename string) error {
	nm.mu.RLock()
	defer nm.mu.RUnlock()

	networks := make(map[string]NetworkDef, len(nm.networks))
	for name, network := range nm.networks {
		networks[name] = *network
	}
	config := NetworkConfig{Networks: networks}
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filename, data, 0644)
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
		apiKey      = flag.String("api-key", os.Getenv("PORKBUN_API_KEY"), "Porkbun API Key")
		secretKey   = flag.String("secret-key", os.Getenv("PORKBUN_SECRET_KEY"), "Porkbun Secret Key")
		command    = flag.String("cmd", "", "Command: create-network, deploy-funnel, activate, deactivate, list, stats")
		networkName = flag.String("network", "", "Network name")
		description = flag.String("desc", "", "Network description")
		domains    = flag.String("domains", "", "Comma-separated list of domains")
		funnelID   = flag.String("funnel-id", "", "Funnel ID")
		funnelName = flag.String("funnel-name", "", "Funnel name")
		serverIP   = flag.String("ip", "", "Server IP address")
	)
	flag.Parse()

	if *apiKey == "" || *secretKey == "" {
		log.Fatal("❌ PORKBUN_API_KEY and PORKBUN_SECRET_KEY environment variables required")
	}

	nm := NewNetworkManager(*apiKey, *secretKey)
	ctx := context.Background()

	switch *command {
	case "create-network":
		if *networkName == "" || *domains == "" {
			log.Fatal("❌ --network and --domains required")
		}
		domainList := parseDomainList(*domains)
		_, err := nm.CreateNetwork(ctx, *networkName, *description, domainList)
		if err != nil {
			log.Fatalf("❌ Failed to create network: %v", err)
		}

	case "deploy-funnel":
		if *networkName == "" || *funnelID == "" || *funnelName == "" || *serverIP == "" {
			log.Fatal("❌ --network, --funnel-id, --funnel-name, and --ip required")
		}
		err := nm.DeployNetworkFunnel(ctx, *networkName, *funnelID, *funnelName, "", *serverIP)
		if err != nil {
			log.Fatalf("❌ Deployment failed: %v", err)
		}

	case "activate":
		if *networkName == "" {
			log.Fatal("❌ --network required")
		}
		err := nm.ActivateNetwork(*networkName)
		if err != nil {
			log.Fatalf("❌ Failed to activate: %v", err)
		}

	case "deactivate":
		if *networkName == "" {
			log.Fatal("❌ --network required")
		}
		err := nm.DeactivateNetwork(*networkName)
		if err != nil {
			log.Fatalf("❌ Failed to deactivate: %v", err)
		}

	case "list":
		fmt.Println("\n🌐 === NETWORKS ===")
		networks := nm.ListNetworks()
		if len(networks) == 0 {
			fmt.Println("No networks created")
			return
		}
		for name, net := range networks {
			fmt.Printf("\n🌐 %s\n", name)
			fmt.Printf("   Status: %s\n", net.Status)
			fmt.Printf("   Domains: %d\n", len(net.Domains))
			fmt.Printf("   Funnels: %d\n", len(net.Funnels))
		}

	case "stats":
		if *networkName == "" {
			log.Fatal("❌ --network required")
		}
		stats := nm.GetNetworkStats(*networkName)
		if stats == nil {
			log.Fatal("❌ Network not found")
		}
		fmt.Println("\n📊 Network Statistics:")
		for k, v := range stats {
			fmt.Printf("   %s: %v\n", k, v)
		}

	default:
		flag.Usage()
	}
}

func parseDomainList(domainStr string) []string {
	var domains []string
	var current string
	for i := 0; i < len(domainStr); i++ {
		if domainStr[i] == ',' {
			if current != "" {
				domains = append(domains, current)
			}
			current = ""
		} else if domainStr[i] != ' ' {
			current += string(domainStr[i])
		}
	}
	if current != "" {
		domains = append(domains, current)
	}
	return domains
}
