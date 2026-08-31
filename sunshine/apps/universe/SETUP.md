# WholeDonut Funnel Management - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Go 1.21 or higher
- Git
- GitHub account with repository access
- Porkbun account with API access

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/thewholedonuts-beep/wholedonuts-sunshine.git
cd wholedonuts-sunshine/apps/universe

# Setup environment
make setup
```

### Step 2: Configure Environment Variables

```bash
# Copy example to actual config
cp .env.example .env

# Edit .env with your credentials
vim .env
```

**Required fields:**
```
PORKBUN_API_KEY=your_porkbun_api_key
PORKBUN_SECRET_KEY=your_porkbun_secret_key
```

**Get Porkbun credentials:**
1. Log in to https://porkbun.com/
2. Go to Account > API
3. Copy your API Key and Secret API Key

### Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add two secrets:
   - `PORKBUN_API_KEY` (your API key)
   - `PORKBUN_SECRET_KEY` (your secret key)

### Step 4: Deploy Funnels

```bash
# Build the CLI tools
make build

# Deploy funnels from config
make deploy

# List all domains and funnels
make list

# Activate funnels
make activate
```

---

## 📋 Configuration

### Edit `config/funnels.yaml`

```yaml
domains:
  - name: wholedonuts
    tld: org
    status: active
    funnels:
      - lead-capture-org
      - webinar-org

funnels:
  lead-capture-org:
    name: Lead Capture - WholeDonut Org
    domain: wholedonuts.org
    status: active
    server_ip: ${SERVER_IP_1}
    email_provider: sendgrid
    tracking_id: lead-capture-org
```

**Key fields:**
- `name`: Domain name (e.g., "wholedonuts")
- `tld`: Top-level domain (e.g., "org", "buzz", "com")
- `status`: "active" or "inactive"
- `server_ip`: Target server IP address for DNS routing, typically sourced from an env var like `${SERVER_IP_1}`
- `email_provider`: "sendgrid", "mailchimp", or "activecampaign"

---

## 🎯 Creating Your First Funnel

### Method 1: CLI Tool

```bash
# Create a new funnel
go run cmd/funnel-cli/main.go \
  -cmd=create-funnel \
  -funnel-id=my-first-funnel \
  -funnel-name="My First Funnel" \
  -domain=wholedonuts.org \
  -ip=192.168.1.100
```

This automatically creates:
- `landing-my-first-funnel.wholedonuts.org`
- `checkout-my-first-funnel.wholedonuts.org`
- `thankyou-my-first-funnel.wholedonuts.org`

### Method 2: Configuration File + Deploy

1. Edit `config/funnels.yaml` and add your funnel
2. Run: `make deploy`

---

## 🔧 CLI Commands

### List All Domains
```bash
go run cmd/funnel-cli/main.go -cmd=list-domains
```

### List All Funnels
```bash
go run cmd/funnel-cli/main.go -cmd=list-funnels
```

### Add a Domain
```bash
go run cmd/funnel-cli/main.go -cmd=add-domain -domain=newdomain.com
```

### Create a Funnel
```bash
go run cmd/funnel-cli/main.go \
  -cmd=create-funnel \
  -funnel-id=funnel-1 \
  -funnel-name="My Funnel" \
  -domain=wholedonuts.org \
  -ip=192.168.1.100
```

### Activate a Funnel
```bash
go run cmd/funnel-cli/main.go -cmd=activate -funnel-id=funnel-1
```

### Deactivate a Funnel
```bash
go run cmd/funnel-cli/main.go -cmd=deactivate -funnel-id=funnel-1
```

---

## 🤖 GitHub Actions Workflow

### Automatic Deployment
Whenever you push changes to `config/funnels.yaml`, the workflow automatically:
1. Validates YAML syntax
2. Runs tests
3. Deploys funnels to Porkbun
4. Verifies DNS records

### Manual Workflow Dispatch
Go to: Actions → Deploy Funnels to Porkbun → Run workflow

**Options:**
- `deploy` - Deploy from config file
- `activate` - Activate all funnels
- `deactivate` - Deactivate all funnels
- `list` - Show current status

---

## 📊 Funnel Anatomy

Each funnel consists of 3 steps:

### 1. Landing Page
- **URL**: `landing-{funnel-id}.{domain}`
- **Purpose**: Capture leads, present offer
- **DNS**: A record pointing to your server IP

### 2. Checkout Page
- **URL**: `checkout-{funnel-id}.{domain}`
- **Purpose**: Process payments/registrations
- **DNS**: A record pointing to your server IP

### 3. Thank You Page
- **URL**: `thankyou-{funnel-id}.{domain}`
- **Purpose**: Confirmation, upsells, email triggers
- **DNS**: A record pointing to your server IP

---

## 🔍 Verification

### Verify DNS Records Created
```bash
# Check if subdomains are resolving
nslookup landing-funnel-1.wholedonuts.org 8.8.8.8
nslookup checkout-funnel-1.wholedonuts.org 8.8.8.8
nslookup thankyou-funnel-1.wholedonuts.org 8.8.8.8
```

### Check Porkbun DNS
1. Log in to Porkbun
2. Domain Management
3. Click on your domain
4. DNS Records
5. Verify A records for each subdomain

---

## 💰 Money Funnel Flow

```
┌─────────────────────────────────────┐
│   landing-id.domain.com             │
│   User discovers offer              │
│   Email captured                    │
│   ↓                                 │
├─────────────────────────────────────┤
│   checkout-id.domain.com            │
│   Payment/Registration processed    │
│   ↓                                 │
├─────────────────────────────────────┤
│   thankyou-id.domain.com            │
│   Confirmation + Delivery           │
│   Email sequence triggered          │
│   Upsell opportunities              │
└─────────────────────────────────────┘
```

---

## ⚙️ Advanced Configuration

### Email Provider Integration

#### SendGrid
```yaml
funnels:
  my-funnel:
    email_provider: sendgrid
    sendgrid_list_id: "d-123456789"
```

#### Mailchimp
```yaml
funnels:
  my-funnel:
    email_provider: mailchimp
    mailchimp_list_id: "a1b2c3d4e5"
```

#### ActiveCampaign
```yaml
funnels:
  my-funnel:
    email_provider: activecampaign
    activecampaign_automation_id: "12345"
```

### Multi-Server Routing
```bash
# Route different funnels to different servers
make deploy  # Creates with SERVER_IP_1

# Then update IP for specific funnel
go run cmd/funnel-cli/main.go \
  -cmd=update-ip \
  -funnel-id=checkout-buzz \
  -ip=192.168.1.200
```

---

## 🐛 Troubleshooting

### DNS Not Resolving
```bash
# Verify record was created
go run cmd/funnel-cli/main.go -cmd=list-domains

# May need to wait 5-10 minutes for propagation
watch -n 5 'nslookup landing-funnel-1.wholedonuts.org 8.8.8.8'
```

### Funnel Not Activating
```bash
# Check funnel status
go run cmd/funnel-cli/main.go -cmd=list-funnels

# Verify Porkbun API credentials
go run cmd/funnel-cli/main.go -cmd=ping
```

### YAML Configuration Error
```bash
# Validate YAML syntax
go run cmd/funnel-deploy/main.go -config=config/funnels.yaml -action=validate
```

### Permission Denied on Makefile
```bash
chmod +x Makefile
make deploy
```

---

## 📚 Additional Resources

- [Porkbun API Documentation](https://porkbun.com/api/json/v3/documentation)
- [Go Language Documentation](https://golang.org/doc/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Domain Name System (DNS) Basics](https://www.cloudflare.com/learning/dns/what-is-dns/)

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review your `.env` file for correct credentials
3. Verify Porkbun API access is enabled
4. Check GitHub Actions logs for deployment errors

---

## ✅ Checklist for Production

- [ ] Porkbun API credentials configured
- [ ] GitHub Secrets added (PORKBUN_API_KEY, PORKBUN_SECRET_KEY)
- [ ] All domains added via CLI or config file
- [ ] Funnels created and tested
- [ ] DNS records verified with nslookup
- [ ] GitHub Actions workflow enabled
- [ ] Monitoring/alerts configured
- [ ] Backup of configuration files

---

## 🎉 You're Ready!

Your WholeDonut money funnel system is now live. Start creating funnels and making money!
