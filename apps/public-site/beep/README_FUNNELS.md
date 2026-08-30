# WholeDonut Money Funnels Management

## Overview

This domain manager module automates the setup and management of money-making funnels across your 28 WholeDonut domains. It integrates with the Porkbun DNS API to programmatically create, update, and delete DNS records for funnel subdomains.

## Features

✅ **Automated Funnel Setup** — Create multi-step funnels with DNS routing
✅ **Subdomain Management** — Auto-create landing pages, checkout, and thank-you pages
✅ **DNS Integration** — Porkbun API integration for automated DNS records
✅ **Funnel Status Control** — Activate/deactivate funnels instantly
✅ **SSL Management** — Retrieve SSL certificates for each domain
✅ **CLI Tooling** — Command-line interface for funnel operations

## Quick Start

### 1. Set Environment Variables

```bash
export PORKBUN_API_KEY="your_api_key"
export PORKBUN_SECRET_KEY="your_secret_key"
```

### 2. Add Domains

```bash
go run cmd/funnel-cli/main.go -cmd=add-domain -domain=wholedonuts.org
go run cmd/funnel-cli/main.go -cmd=add-domain -domain=wholedonuts.buzz
go run cmd/funnel-cli/main.go -cmd=add-domain -domain=thenutur3dchef.com
```

### 3. Create a Funnel

```bash
go run cmd/funnel-cli/main.go \
  -cmd=create-funnel \
  -funnel-id=lead-capture-1 \
  -funnel-name="Lead Capture Funnel" \
  -domain=wholedonuts.org \
  -ip=192.168.1.100
```

This automatically creates DNS records for:
- **landing-capture-1.wholedonuts.org** → Landing page
- **checkout-capture-1.wholedonuts.org** → Checkout page  
- **thankyou-capture-1.wholedonuts.org** → Thank you page

### 4. List Domains & Funnels

```bash
go run cmd/funnel-cli/main.go -cmd=list-domains
go run cmd/funnel-cli/main.go -cmd=list-funnels
```

### 5. Activate a Funnel

```bash
go run cmd/funnel-cli/main.go -cmd=activate -funnel-id=lead-capture-1
```

## Funnel Structure

Each funnel consists of three steps:

### 1. Landing Page
- **Purpose**: Capture leads and interest
- **Subdomain**: `landing-{funnelID}.{domain}`
- **Function**: Present offer, build desire

### 2. Checkout Page
- **Purpose**: Collect payment/information
- **Subdomain**: `checkout-{funnelID}.{domain}`
- **Function**: Process transactions or registrations

### 3. Thank You Page
- **Purpose**: Confirmation and upsells
- **Subdomain**: `thankyou-{funnelID}.{domain}`
- **Function**: Deliver digital products, send confirmation emails

## Example: Lead Capture Funnel

```
┌─────────────────────────────────────────────┐
│  landing-capture.wholedonuts.org            │
│  ↓                                          │
│  User sees offer, enters email              │
│  ↓                                          │
├─────────────────────────────────────────────┤
│  checkout-capture.wholedonuts.org           │
│  ↓                                          │
│  User completes purchase/registration       │
│  ↓                                          │
├─────────────────────────────────────────────┤
│  thankyou-capture.wholedonuts.org           │
│  ↓                                          │
│  Confirmation, email sequence triggered    │
│  Upsell opportunities presented            │
└─────────────────────────────────────────────┘
```

## API Methods

### Manager Methods

```go
// Add a domain
manager.AddDomain(ctx, "wholedonuts", "org")

// Create a funnel with DNS records
manager.CreateFunnel(ctx, funnelID, funnelName, domain, ipAddress, config)

// Update funnel step target IP
manager.UpdateFunnelStep(ctx, funnelID, "checkout", "192.168.1.200")

// Delete a funnel step
manager.DeleteFunnelStep(ctx, funnelID, "landing")

// Activate/Deactivate funnel
manager.ActivateFunnel(funnelID)
manager.DeactivateFunnel(funnelID)

// Retrieve funnel details
manager.GetFunnel(funnelID)

// List all domains/funnels
manager.ListDomains()
manager.ListFunnels()

// Get DNS records for domain
manager.GetDomainRecords(ctx, domain)

// Get SSL certificate
manager.GetSSLBundle(ctx, domain)
```

## Configuration (config/funnels.yaml)

The YAML configuration defines:

- **Domains**: Porkbun-managed domains with their status, registrar, and assigned funnels
- **Funnels**: Each funnel's configuration, steps, email providers, and tracking
- **Steps**: Landing, checkout, and confirmation page routing

## Workflow for Money Funnels

### Step 1: Lead Generation
```
User clicks ad → Landing Page (wholedonuts.org/landing-*)
↓
Email collected + lead info stored
```

### Step 2: Conversion
```
Automatic email sent → Checkout Page (wholedonuts.org/checkout-*)
↓
Payment/registration processed
```

### Step 3: Fulfillment
```
Transaction confirmed → Thank You Page (wholedonuts.org/thankyou-*)
↓
Digital product delivered + upsell email triggered
```

## Integration with Email Providers

The funnel manager supports:

- **SendGrid** — Email delivery and tracking
- **Mailchimp** — Email marketing automation
- **ActiveCampaign** — Advanced automation and CRM
- **Klaviyo** — E-commerce email marketing

## Monitoring & Analytics

Each funnel tracks:

- Page views per step
- Conversion rates (landing → checkout → confirmation)
- Email delivery status
- Payment success/failure rates
- Funnel performance metrics

## Scaling to 28 Domains

With the domain manager, you can:

```bash
# Create 28+ funnels across all domains
for i in {1..28}; do
  go run cmd/funnel-cli/main.go \
    -cmd=create-funnel \
    -funnel-id=funnel-$i \
    -funnel-name="Funnel $i" \
    -domain=domain$i.org \
    -ip=192.168.1.$(($i % 254 + 1))
done
```

## Troubleshooting

### DNS Not Resolving
```bash
# Verify Porkbun API connectivity
go run cmd/funnel-cli/main.go -cmd=list-domains
```

### Funnel Not Active
```bash
# Activate the funnel
go run cmd/funnel-cli/main.go -cmd=activate -funnel-id=your-funnel-id
```

### Missing SSL Certificate
```bash
# Retrieve SSL bundle for domain
manager.GetSSLBundle(ctx, "wholedonuts.org")
```

## Next Steps

1. ✅ Domain manager module created
2. ⏳ GitHub Actions automation for funnel deployment
3. ⏳ Web dashboard for funnel analytics
4. ⏳ Automated email sequencing integration
5. ⏳ Multi-domain funnel templates
