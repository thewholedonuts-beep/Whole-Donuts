package domains

import (
	"context"
	"fmt"

	"github.com/nrdcg/porkbun"
)

// Manager handles domain and DNS record management for WholeDonut funnels
type Manager struct {
	client    *porkbun.Client
	domains   map[string]*Domain
	funnels   map[string]*Funnel
	apiKey    string
	secretKey string
}

// Domain represents a registered domain
type Domain struct {
	Name       string
	TLD        string
	FullDomain string
	Status     string
	Records    []porkbun.Record
	Funnels    []string // List of funnel IDs using this domain
}

// Funnel represents a money funnel setup with DNS routing
type Funnel struct {
	ID            string                // Unique funnel identifier
	Name          string                // Funnel name (e.g., "lead-capture", "checkout")
	Domain        string                // Primary domain for funnel
	LandingPage   string                // Landing page subdomain
	Checkout      string                // Checkout subdomain
	ThankYouPage  string                // Thank you page subdomain
	IPAddress     string                // Server IP address
	EmailProvider string                // Email provider for integration
	Status        string                // active, inactive, testing
	Config        map[string]interface{} // Custom configuration
}

// FunnelStep defines each step in a money-making funnel
type FunnelStep struct {
	StepName  string // "landing", "checkout", "confirmation"
	Subdomain string // Subdomain for this step
	TargetIP  string // Where this step redirects to
	RecordID  string // Porkbun DNS record ID
}

// NewManager creates a new domain manager with Porkbun credentials
func NewManager(apiKey, secretKey string) *Manager {
	return &Manager{
		client:    porkbun.New(secretKey, apiKey),
		domains:   make(map[string]*Domain),
		funnels:   make(map[string]*Funnel),
		apiKey:    apiKey,
		secretKey: secretKey,
	}
}

// AddDomain registers a domain in the manager
func (m *Manager) AddDomain(ctx context.Context, name, tld string) (*Domain, error) {
	fullDomain := name + "." + tld
	
	// Verify connectivity with Porkbun API
	_, err := m.client.Ping(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Porkbun API: %w", err)
	}

	// Retrieve existing records for this domain
	records, err := m.client.RetrieveRecords(ctx, fullDomain)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve DNS records for %s: %w", fullDomain, err)
	}

	domain := &Domain{
		Name:       name,
		TLD:        tld,
		FullDomain: fullDomain,
		Status:     "active",
		Records:    records,
		Funnels:    []string{},
	}

	m.domains[fullDomain] = domain
	return domain, nil
}

// CreateFunnel sets up a complete money funnel with DNS records
func (m *Manager) CreateFunnel(ctx context.Context, funnelID, funnelName, domain, ipAddress string, config map[string]interface{}) (*Funnel, error) {
	domainObj, exists := m.domains[domain]
	if !exists {
		return nil, fmt.Errorf("domain %s not registered in manager", domain)
	}

	emailProvider, ok := config["emailProvider"].(string)
	if !ok {
		return nil, fmt.Errorf("config missing required string field emailProvider")
	}

	funnel := &Funnel{
		ID:            funnelID,
		Name:          funnelName,
		Domain:        domain,
		LandingPage:   "landing-" + funnelID,
		Checkout:      "checkout-" + funnelID,
		ThankYouPage:  "thankyou-" + funnelID,
		IPAddress:     ipAddress,
		EmailProvider: emailProvider,
		Status:        "testing",
		Config:        config,
	}

	// Create DNS records for funnel steps
	steps := []FunnelStep{
		{
			StepName:  "landing",
			Subdomain: funnel.LandingPage,
			TargetIP:  ipAddress,
		},
		{
			StepName:  "checkout",
			Subdomain: funnel.Checkout,
			TargetIP:  ipAddress,
		},
		{
			StepName:  "confirmation",
			Subdomain: funnel.ThankYouPage,
			TargetIP:  ipAddress,
		},
	}

	for i, step := range steps {
		recordID, err := m.createDNSRecord(ctx, domain, step.Subdomain, "A", step.TargetIP)
		if err != nil {
			return nil, fmt.Errorf("failed to create DNS record for %s: %w", step.Subdomain, err)
		}
		steps[i].RecordID = recordID
		fmt.Printf("✓ Created DNS record: %s.%s -> %s (ID: %s)\n", step.Subdomain, domain, step.TargetIP, recordID)
	}

	m.funnels[funnelID] = funnel
	domainObj.Funnels = append(domainObj.Funnels, funnelID)

	return funnel, nil
}

// createDNSRecord creates an A record pointing to the target IP
func (m *Manager) createDNSRecord(ctx context.Context, domain, subdomain, recordType, content string) (string, error) {
	record := porkbun.Record{
		Name:    subdomain,
		Type:    recordType,
		Content: content,
		TTL:     "300", // 5 minute TTL for fast propagation
	}

	id, err := m.client.CreateRecord(ctx, domain, record)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%d", id), nil
}

// UpdateFunnelStep modifies an existing funnel step's DNS record
func (m *Manager) UpdateFunnelStep(ctx context.Context, funnelID, stepName, newIP string) error {
	funnel, exists := m.funnels[funnelID]
	if !exists {
		return fmt.Errorf("funnel %s not found", funnelID)
	}

	var subdomain string
	switch stepName {
	case "landing":
		subdomain = funnel.LandingPage
	case "checkout":
		subdomain = funnel.Checkout
	case "confirmation":
		subdomain = funnel.ThankYouPage
	default:
		return fmt.Errorf("unknown funnel step: %s", stepName)
	}

	// Find the record ID for this subdomain
	records, err := m.client.RetrieveRecords(ctx, funnel.Domain)
	if err != nil {
		return fmt.Errorf("failed to retrieve records: %w", err)
	}

	var recordID int
	for _, r := range records {
		if r.Name == subdomain {
			fmt.Sscanf(r.ID, "%d", &recordID)
			break
		}
	}

	if recordID == 0 {
		return fmt.Errorf("DNS record not found for subdomain: %s", subdomain)
	}

	// Update the record with new IP
	record := porkbun.Record{
		Name:    subdomain,
		Type:    "A",
		Content: newIP,
		TTL:     "300",
	}

	err = m.client.EditRecord(ctx, funnel.Domain, recordID, record)
	if err != nil {
		return fmt.Errorf("failed to update DNS record: %w", err)
	}

	fmt.Printf("✓ Updated DNS record: %s.%s -> %s\n", subdomain, funnel.Domain, newIP)
	return nil
}

// GetFunnel retrieves funnel details
func (m *Manager) GetFunnel(funnelID string) (*Funnel, error) {
	funnel, exists := m.funnels[funnelID]
	if !exists {
		return nil, fmt.Errorf("funnel %s not found", funnelID)
	}
	return funnel, nil
}

// ListDomains returns all registered domains
func (m *Manager) ListDomains() map[string]*Domain {
	return m.domains
}

// ListFunnels returns all configured funnels
func (m *Manager) ListFunnels() map[string]*Funnel {
	return m.funnels
}

// GetDomainRecords retrieves all DNS records for a domain
func (m *Manager) GetDomainRecords(ctx context.Context, domain string) ([]porkbun.Record, error) {
	records, err := m.client.RetrieveRecords(ctx, domain)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve records for %s: %w", domain, err)
	}
	return records, nil
}

// DeleteFunnelStep removes a funnel step's DNS record
func (m *Manager) DeleteFunnelStep(ctx context.Context, funnelID, stepName string) error {
	funnel, exists := m.funnels[funnelID]
	if !exists {
		return fmt.Errorf("funnel %s not found", funnelID)
	}

	var subdomain string
	switch stepName {
	case "landing":
		subdomain = funnel.LandingPage
	case "checkout":
		subdomain = funnel.Checkout
	case "confirmation":
		subdomain = funnel.ThankYouPage
	default:
		return fmt.Errorf("unknown funnel step: %s", stepName)
	}

	// Find and delete the record
	records, err := m.client.RetrieveRecords(ctx, funnel.Domain)
	if err != nil {
		return fmt.Errorf("failed to retrieve records: %w", err)
	}

	var recordID int
	for _, r := range records {
		if r.Name == subdomain {
			fmt.Sscanf(r.ID, "%d", &recordID)
			break
		}
	}

	if recordID == 0 {
		return fmt.Errorf("DNS record not found for subdomain: %s", subdomain)
	}

	err = m.client.DeleteRecord(ctx, funnel.Domain, recordID)
	if err != nil {
		return fmt.Errorf("failed to delete DNS record: %w", err)
	}

	fmt.Printf("✓ Deleted DNS record: %s.%s\n", subdomain, funnel.Domain)
	return nil
}

// GetSSLBundle retrieves SSL certificate for a domain
func (m *Manager) GetSSLBundle(ctx context.Context, domain string) (*porkbun.SSLBundle, error) {
	bundle, err := m.client.RetrieveSSLBundle(ctx, domain)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve SSL bundle for %s: %w", domain, err)
	}
	return &bundle, nil
}

// ActivateFunnel changes funnel status to active
func (m *Manager) ActivateFunnel(funnelID string) error {
	funnel, exists := m.funnels[funnelID]
	if !exists {
		return fmt.Errorf("funnel %s not found", funnelID)
	}
	funnel.Status = "active"
	fmt.Printf("✓ Funnel %s (%s) is now ACTIVE\n", funnelID, funnel.Name)
	return nil
}

// DeactivateFunnel changes funnel status to inactive
func (m *Manager) DeactivateFunnel(funnelID string) error {
	funnel, exists := m.funnels[funnelID]
	if !exists {
		return fmt.Errorf("funnel %s not found", funnelID)
	}
	funnel.Status = "inactive"
	fmt.Printf("✓ Funnel %s (%s) is now INACTIVE\n", funnelID, funnel.Name)
	return nil
}
