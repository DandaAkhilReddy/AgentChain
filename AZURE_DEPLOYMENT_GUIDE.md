# 🚀 AgentChains Azure Deployment Guide

Deploy your revolutionary AI-powered blockchain platform to Azure Static Web Apps with full functionality!

## 🎯 Quick Deploy Options

### Option 1: One-Click PowerShell Deploy (Windows)
```powershell
# Run in PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\deploy-azure.ps1
```

### Option 2: Bash Script Deploy (Linux/Mac/WSL)
```bash
chmod +x deploy-azure.sh
./deploy-azure.sh
```

### Option 3: Manual Azure CLI Deploy
```bash
# Login to Azure
az login

# Create resource group
az group create --name agentchains-rg --location eastus2

# Deploy Static Web App
az staticwebapp create \
    --name agentchains-ai-platform \
    --resource-group agentchains-rg \
    --source https://github.com/dandaakhilreddy/agentchains \
    --location eastus2 \
    --branch main \
    --app-location "website" \
    --api-location "api"
```

## 🔧 Prerequisites

### Required Software
- ✅ **Azure CLI** - [Download](https://aka.ms/installazurecliwindows)
- ✅ **Azure Account** - [Free Account](https://azure.microsoft.com/free/)
- ✅ **GitHub Account** - Repository access
- ✅ **PowerShell 5.1+** (Windows) or **Bash** (Linux/Mac)

### Azure Resources Needed
- ✅ **Azure Static Web Apps** (Free tier available)
- ✅ **Azure Functions** (for API backend)
- ✅ **Custom Domain** (optional)
- ✅ **SSL Certificate** (automatically provided)

## 📋 Step-by-Step Manual Deployment

### Step 1: Prepare Azure Environment
```bash
# Login to Azure
az login

# List subscriptions
az account list --output table

# Set subscription (if multiple)
az account set --subscription "Your-Subscription-ID"

# Create resource group
az group create --name agentchains-rg --location eastus2
```

### Step 2: Deploy Static Web App
```bash
# Deploy with automatic GitHub integration
az staticwebapp create \
    --name agentchains-ai-platform \
    --resource-group agentchains-rg \
    --source https://github.com/dandaakhilreddy/agentchains \
    --location eastus2 \
    --branch main \
    --app-location "website" \
    --api-location "api" \
    --login-with-github
```

### Step 3: Configure GitHub Secrets
1. Go to: `https://github.com/dandaakhilreddy/agentchains/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
4. Value: Copy from Azure portal or CLI output

### Step 4: Verify Deployment
```bash
# Get app details
az staticwebapp show \
    --name agentchains-ai-platform \
    --resource-group agentchains-rg \
    --query "{name:name,url:defaultHostname,status:repositoryUrl}" \
    --output table
```

## 🌐 Custom Domain Configuration

### Step 1: Add Custom Domain
```bash
# Add custom domain to Static Web App
az staticwebapp hostname set \
    --hostname agentchains.ai \
    --name agentchains-ai-platform \
    --resource-group agentchains-rg
```

### Step 2: Configure DNS Records
Add these DNS records to your domain provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | `your-app.azurestaticapps.net` | 3600 |
| CNAME | @ | `your-app.azurestaticapps.net` | 3600 |

### Step 3: Verify SSL Certificate
Azure automatically provides SSL certificates for custom domains.

## ⚙️ Environment Configuration

### Production Environment Variables
Create these in Azure Static Web Apps configuration:

```json
{
    "NODE_ENV": "production",
    "API_BASE_URL": "https://your-app.azurestaticapps.net/api",
    "BLOCKCHAIN_NETWORK": "mainnet",
    "AI_SERVICE_ENDPOINT": "https://your-app.azurestaticapps.net/api/ai"
}
```

### Application Settings
```json
{
    "KAMIKAZE_TOKEN_ADDRESS": "0x...",
    "STAKING_CONTRACT_ADDRESS": "0x...",
    "AI_AGENT_REGISTRY_ADDRESS": "0x...",
    "WEB3_PROVIDER_URL": "https://mainnet.infura.io/v3/YOUR_KEY"
}
```

## 🔄 Continuous Deployment

### Automatic Deployment Triggers
- ✅ Push to `main` branch
- ✅ Pull request merge
- ✅ GitHub Actions workflow
- ✅ Manual deployment via Azure portal

### GitHub Actions Workflow
The deployment includes an automated workflow that:
1. **Builds** the website and API
2. **Tests** all functionality
3. **Deploys** to Azure Static Web Apps
4. **Updates** the live environment

## 📊 Monitoring & Analytics

### Azure Application Insights
```bash
# Enable Application Insights
az monitor app-insights component create \
    --app agentchains-insights \
    --location eastus2 \
    --resource-group agentchains-rg
```

### Performance Monitoring
- ✅ **Real-time metrics** for AI agents
- ✅ **Web3 transaction** monitoring  
- ✅ **API performance** tracking
- ✅ **User analytics** dashboard

## 🛡️ Security Configuration

### HTTPS Enforcement
```json
{
    "routes": [
        {
            "route": "/*",
            "headers": {
                "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block"
            }
        }
    ]
}
```

### API Security
- ✅ **CORS configuration** for Web3
- ✅ **Rate limiting** for AI endpoints
- ✅ **Authentication** for admin features
- ✅ **Input validation** for all APIs

## 🧪 Testing Deployment

### Automated Tests
```bash
# Run deployment tests
npm run test:deployment

# Test AI functionality
npm run test:ai-agents

# Test Web3 integration
npm run test:web3

# Test blockchain features
npm run test:blockchain
```

### Manual Testing Checklist
- [ ] Homepage loads with AI animations
- [ ] MetaMask connection works
- [ ] KAMIKAZE token transfers function
- [ ] AI agents display correctly
- [ ] Real-time analytics update
- [ ] Mobile responsiveness
- [ ] SSL certificate valid
- [ ] Custom domain resolves

## 📈 Performance Optimization

### Azure CDN Configuration
```bash
# Create CDN profile
az cdn profile create \
    --name agentchains-cdn \
    --resource-group agentchains-rg \
    --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
    --name agentchains-endpoint \
    --profile-name agentchains-cdn \
    --resource-group agentchains-rg \
    --origin your-app.azurestaticapps.net
```

### Caching Strategy
- ✅ **Static assets**: 1 year cache
- ✅ **API responses**: 5 minute cache
- ✅ **AI data**: Real-time updates
- ✅ **Blockchain data**: 30 second cache

## 🚨 Troubleshooting

### Common Issues

#### Deployment Fails
```bash
# Check deployment status
az staticwebapp show --name agentchains-ai-platform --resource-group agentchains-rg

# View deployment logs
az staticwebapp functions show --name agentchains-ai-platform --resource-group agentchains-rg
```

#### Custom Domain Issues
```bash
# Verify DNS propagation
nslookup agentchains.ai
dig agentchains.ai

# Check domain status
az staticwebapp hostname show --hostname agentchains.ai --name agentchains-ai-platform --resource-group agentchains-rg
```

#### API Not Working
- Check function app status
- Verify CORS settings
- Check environment variables
- Review application logs

## 📞 Support & Resources

### Azure Resources
- **Static Web Apps Docs**: [docs.microsoft.com/azure/static-web-apps](https://docs.microsoft.com/azure/static-web-apps)
- **Azure CLI Reference**: [docs.microsoft.com/cli/azure](https://docs.microsoft.com/cli/azure)
- **GitHub Actions**: [docs.github.com/actions](https://docs.github.com/actions)

### AgentChains Support
- **GitHub Repository**: [github.com/dandaakhilreddy/agentchains](https://github.com/dandaakhilreddy/agentchains)
- **Documentation**: [agentchains.ai/docs](https://agentchains.ai/docs)
- **Community Discord**: [discord.gg/agentchains](https://discord.gg/agentchains)

## 🎉 Post-Deployment Success

Once deployed, your AgentChains platform will have:

### ✅ Live Features
- **🌐 Production Website** at your custom domain
- **🤖 6 AI Agents** fully operational
- **🔗 Web3 Integration** with MetaMask support  
- **💎 KAMIKAZE Token** with 2% burn mechanism
- **📊 Real-time Analytics** and neural networks
- **👥 Principal Scientist Team** showcase
- **🚀 AI Dashboard** with trading features

### ✅ Enterprise Features
- **🛡️ SSL Security** with automatic certificates
- **⚡ Global CDN** for optimal performance
- **📈 Application Insights** monitoring
- **🔄 Automatic Updates** via GitHub Actions
- **📱 Mobile Responsive** design
- **🎯 SEO Optimized** for search engines

---

## 🚀 Ready to Deploy?

Choose your deployment method:

1. **Windows**: Run `.\deploy-azure.ps1`
2. **Linux/Mac**: Run `./deploy-azure.sh`  
3. **Manual**: Follow the step-by-step guide above

**The future of AI-powered blockchain awaits on Azure! 🤖✨**