# AgentChains Azure Deployment Script - PowerShell Edition
# Deploy the revolutionary AI-powered blockchain platform to Azure Static Web Apps

Write-Host "🤖 AgentChains Azure Deployment - Principal Scientist Edition" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan

# Configuration
$ResourceGroup = "agentchains-rg"
$Location = "eastus2"  
$AppName = "agentchains-ai-platform"
$GitHubRepo = "dandaakhilreddy/agentchains"

Write-Host "🔧 Step 1: Checking Azure CLI Installation" -ForegroundColor Cyan
try {
    $azVersion = az --version
    Write-Host "✅ Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install from: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}

Write-Host "🔐 Step 2: Azure Login" -ForegroundColor Cyan
Write-Host "Please login to your Azure account..."
az login

Write-Host "📋 Step 3: Selecting Azure Subscription" -ForegroundColor Cyan
az account list --output table
$subscriptionId = Read-Host "Enter your subscription ID (or press Enter for default)"
if ($subscriptionId) {
    az account set --subscription $subscriptionId
}

Write-Host "🏗️ Step 4: Creating Resource Group" -ForegroundColor Cyan
Write-Host "Creating resource group: $ResourceGroup in $Location"
az group create --name $ResourceGroup --location $Location

Write-Host "🌐 Step 5: Creating Azure Static Web App" -ForegroundColor Cyan
Write-Host "Creating Static Web App: $AppName"

$createResult = az staticwebapp create `
    --name $AppName `
    --resource-group $ResourceGroup `
    --source "https://github.com/$GitHubRepo" `
    --location $Location `
    --branch main `
    --app-location "website" `
    --api-location "api" `
    --login-with-github

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Static Web App" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Azure Static Web App created successfully!" -ForegroundColor Green

Write-Host "🔑 Step 6: Getting App Information" -ForegroundColor Cyan
$appUrl = az staticwebapp show --name $AppName --resource-group $ResourceGroup --query "defaultHostname" -o tsv
$deploymentToken = az staticwebapp secrets list --name $AppName --resource-group $ResourceGroup --query "properties.apiKey" -o tsv

Write-Host ""
Write-Host "🚀 DEPLOYMENT INFORMATION:" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Website URL: https://$appUrl" -ForegroundColor Blue
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "GitHub Repository: $GitHubRepo" -ForegroundColor Yellow

Write-Host ""
Write-Host "⚙️ Step 7: Configure GitHub Repository Secrets" -ForegroundColor Cyan
Write-Host "To complete the deployment, add these secrets to your GitHub repository:"
Write-Host "1. Go to: https://github.com/$GitHubRepo/settings/secrets/actions" -ForegroundColor Yellow
Write-Host "2. Add new secret: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor Yellow
Write-Host "3. Value: [Deployment Token - Check Azure Portal]" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔄 Step 8: Setting up Custom Domain (Optional)" -ForegroundColor Cyan
$customDomain = Read-Host "Enter custom domain (e.g., agentchains.ai) or press Enter to skip"
if ($customDomain) {
    Write-Host "Setting up custom domain: $customDomain"
    az staticwebapp hostname set --hostname $customDomain --name $AppName --resource-group $ResourceGroup
    Write-Host ""
    Write-Host "📋 DNS Configuration Required:" -ForegroundColor Yellow
    Write-Host "Add the following DNS records:"
    Write-Host "Type: CNAME"
    Write-Host "Name: www (or root)" -ForegroundColor Yellow
    Write-Host "Value: $appUrl"
}

Write-Host ""
Write-Host "🎯 Step 9: Deployment Verification" -ForegroundColor Cyan
Write-Host "Checking deployment status..."
az staticwebapp show --name $AppName --resource-group $ResourceGroup --query '{name:name,url:defaultHostname}' -o table

Write-Host ""
Write-Host "🎉 AGENTCHAINS DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access Your Live Website:" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "🏠 Homepage:        https://$appUrl" -ForegroundColor Blue
Write-Host "🤖 AI Dashboard:    https://$appUrl/dapp/dashboard.html" -ForegroundColor Blue
Write-Host "🧪 Test Suite:      https://$appUrl/test-functionality.html" -ForegroundColor Blue
Write-Host "📊 Status Page:     https://$appUrl/status.html" -ForegroundColor Blue
Write-Host ""
Write-Host "🔄 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add the deployment token to GitHub secrets"
Write-Host "2. Push changes to trigger automatic deployment" 
Write-Host "3. Configure custom domain if desired"
Write-Host "4. Test all AI features and Web3 integration"
Write-Host ""
Write-Host "🚀 The future of AI-powered blockchain is now LIVE on Azure!" -ForegroundColor Cyan

# Open the deployed website
$openSite = Read-Host "Would you like to open the deployed website now? (y/n)"
if ($openSite -eq "y" -or $openSite -eq "Y") {
    Start-Process "https://$appUrl"
}