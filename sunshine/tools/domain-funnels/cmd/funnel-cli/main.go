package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/thewholedonuts-beep/wholedonuts-sunshine/tools/domain-funnels/pkg/domains"
)

func main() {
	configFile := flag.String("config", "config/examples/funnels.example.yaml", "Path to an inactive funnel configuration")
	action := flag.String("action", "validate", "Action: validate or list")
	flag.Parse()

	cfg, err := domains.LoadConfig(*configFile)
	if err != nil {
		log.Fatalf("failed to read configuration: %v", err)
	}
	if err := domains.ValidateConfig(cfg); err != nil {
		log.Fatalf("configuration validation failed: %v", err)
	}

	switch *action {
	case "validate":
		fmt.Println("Configuration is valid and inactive.")
	case "list":
		for id, funnel := range cfg.Funnels {
			fmt.Printf("%s: %s (%s)\n", id, funnel.Name, funnel.Status)
		}
	default:
		flag.Usage()
	}
}
