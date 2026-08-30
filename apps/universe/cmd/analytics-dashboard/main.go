package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"sync"
	"time"
)

type AnalyticsDashboard struct {
	domainMetrics map[string]*DomainMetrics
	funnelMetrics map[string]*FunnelMetrics
	mu            sync.RWMutex
}

type DomainMetrics struct {
	Domain          string
	Status          string
	RecordsCount    int
	FunnelsDeployed int
	LastUpdated     time.Time
}

type FunnelMetrics struct {
	FunnelID     string
	Domain       string
	Status       string
	LandingURL   string
	CheckoutURL  string
	ThankYouURL  string
	CreatedAt    time.Time
	LastModified time.Time
}

type Report struct {
	Timestamp           time.Time
	TotalDomains        int
	TotalFunnels        int
	ActiveFunnels       int
	InactiveFunnels     int
	AverageFunnelsPerDomain float64
	NetworkHealth       string
}

func NewAnalyticsDashboard() *AnalyticsDashboard {
	return &AnalyticsDashboard{
		domainMetrics: make(map[string]*DomainMetrics),
		funnelMetrics: make(map[string]*FunnelMetrics),
	}
}

func (ad *AnalyticsDashboard) RecordDomainMetric(metric *DomainMetrics) {
	ad.mu.Lock()
	defer ad.mu.Unlock()
	metric.LastUpdated = time.Now()
	ad.domainMetrics[metric.Domain] = metric
	fmt.Printf("📊 Recorded metrics for domain: %s\n", metric.Domain)
}

func (ad *AnalyticsDashboard) RecordFunnelMetric(metric *FunnelMetrics) {
	ad.mu.Lock()
	defer ad.mu.Unlock()
	metric.CreatedAt = time.Now()
	metric.LastModified = time.Now()
	ad.funnelMetrics[metric.FunnelID] = metric
	fmt.Printf("📊 Recorded metrics for funnel: %s\n", metric.FunnelID)
}

func (ad *AnalyticsDashboard) GenerateReport() *Report {
	ad.mu.RLock()
	defer ad.mu.RUnlock()

	totalDomains := len(ad.domainMetrics)
	totalFunnels := len(ad.funnelMetrics)
	activeFunnels := 0
	inactiveFunnels := 0
	totalDeployed := 0

	for _, funnel := range ad.funnelMetrics {
		if funnel.Status == "active" {
			activeFunnels++
		} else {
			inactiveFunnels++
		}
	}

	for _, domain := range ad.domainMetrics {
		totalDeployed += domain.FunnelsDeployed
	}

	avgFunnels := 0.0
	if totalDomains > 0 {
		avgFunnels = float64(totalFunnels) / float64(totalDomains)
	}

	networkHealth := "healthy"
	if inactiveFunnels > activeFunnels {
		networkHealth = "degraded"
	}

	return &Report{
		Timestamp:           time.Now(),
		TotalDomains:        totalDomains,
		TotalFunnels:        totalFunnels,
		ActiveFunnels:       activeFunnels,
		InactiveFunnels:     inactiveFunnels,
		AverageFunnelsPerDomain: avgFunnels,
		NetworkHealth:       networkHealth,
	}
}

func (ad *AnalyticsDashboard) PrintDashboard() {
	ad.mu.RLock()
	defer ad.mu.RUnlock()

	fmt.Println("\n" + "="*60)
	fmt.Println("📊 WholeDonut Analytics Dashboard")
	fmt.Println("="*60)

	report := ad.GenerateReport()

	fmt.Printf("\n⏰ Report Generated: %s\n", report.Timestamp.Format(time.RFC3339))
	fmt.Printf("🌐 Total Domains: %d\n", report.TotalDomains)
	fmt.Printf("💰 Total Funnels: %d\n", report.TotalFunnels)
	fmt.Printf("🟢 Active Funnels: %d\n", report.ActiveFunnels)
	fmt.Printf("🔴 Inactive Funnels: %d\n", report.InactiveFunnels)
	fmt.Printf("📈 Avg Funnels per Domain: %.2f\n", report.AverageFunnelsPerDomain)
	fmt.Printf("💚 Network Health: %s\n", report.NetworkHealth)

	fmt.Println("\n" + "-"*60)
	fmt.Println("📍 Domain Metrics")
	fmt.Println("-"*60)

	for _, metric := range ad.domainMetrics {
		fmt.Printf("\n  %s\n", metric.Domain)
		fmt.Printf("    Status: %s\n", metric.Status)
		fmt.Printf("    DNS Records: %d\n", metric.RecordsCount)
		fmt.Printf("    Funnels Deployed: %d\n", metric.FunnelsDeployed)
		fmt.Printf("    Last Updated: %s\n", metric.LastUpdated.Format(time.RFC3339))
	}

	fmt.Println("\n" + "-"*60)
	fmt.Println("🔗 Funnel Metrics")
	fmt.Println("-"*60)

	for _, metric := range ad.funnelMetrics {
		fmt.Printf("\n  %s\n", metric.FunnelID)
		fmt.Printf("    Domain: %s\n", metric.Domain)
		fmt.Printf("    Status: %s\n", metric.Status)
		fmt.Printf("    Landing: %s\n", metric.LandingURL)
		fmt.Printf("    Checkout: %s\n", metric.CheckoutURL)
		fmt.Printf("    Thank You: %s\n", metric.ThankYouURL)
	}

	fmt.Println("\n" + "="*60 + "\n")
}

func main() {
	var (
		command = flag.String("cmd", "dashboard", "Command: dashboard, export-report, health-check")
	)
	flag.Parse()

	dashboard := NewAnalyticsDashboard()

	switch *command {
	case "dashboard":
		dashboard.PrintDashboard()

	case "export-report":
		report := dashboard.GenerateReport()
		fmt.Printf("\n📄 Generated Report:\n")
		fmt.Printf("Timestamp: %s\n", report.Timestamp)
		fmt.Printf("Total Domains: %d\n", report.TotalDomains)
		fmt.Printf("Total Funnels: %d\n", report.TotalFunnels)
		fmt.Printf("Network Health: %s\n", report.NetworkHealth)

	case "health-check":
		report := dashboard.GenerateReport()
		if report.NetworkHealth == "healthy" {
			fmt.Println("✅ Network is HEALTHY")
			os.Exit(0)
		} else {
			fmt.Println("⚠️  Network is DEGRADED")
			os.Exit(1)
		}

	default:
		flag.Usage()
	}
}
