# AgentChains Azure Deployment Script
# Run this as Administrator in PowerShell

Write-Host "🚀 AgentChains.ai - Azure Deployment Script" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Check if Azure CLI is installed
Write-Host "Checking Azure CLI..." -ForegroundColor Yellow
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI not found. Installing..." -ForegroundColor Red
    
    # Download and install Azure CLI
    $progressPreference = 'silentlyContinue'
    Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi
    Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'
    Remove-Item .\AzureCLI.msi
    
    Write-Host "✅ Azure CLI installed successfully!" -ForegroundColor Green
}

# Login to Azure
Write-Host "Logging into Azure..." -ForegroundColor Yellow
az login

# Set variables
$resourceGroup = "AgentChains-RG"
$appName = "agentchains-website"
$location = "eastus2"
$websitePath = ".\website"

Write-Host "Creating Azure resources..." -ForegroundColor Yellow

# Create resource group
Write-Host "Creating resource group: $resourceGroup" -ForegroundColor Blue
az group create --name $resourceGroup --location $location

# Create static web app
Write-Host "Creating Static Web App: $appName" -ForegroundColor Blue
az staticwebapp create `
    --name $appName `
    --resource-group $resourceGroup `
    --location $location `
    --source $websitePath `
    --branch main

# Get the URL
$appUrl = az staticwebapp show --name $appName --resource-group $resourceGroup --query "defaultHostname" --output tsv
Write-Host "✅ Static Web App created!" -ForegroundColor Green
Write-Host "🌐 URL: https://$appUrl" -ForegroundColor Cyan

# Deploy the website files
Write-Host "Deploying website files..." -ForegroundColor Yellow

# Check if website directory exists
if (Test-Path $websitePath) {
    # Get deployment token
    $deployToken = az staticwebapp secrets list --name $appName --resource-group $resourceGroup --query "properties.apiKey" --output tsv
    
    Write-Host "Uploading files to Azure..." -ForegroundColor Blue
    
    # Create zip file
    $zipPath = ".\agentchains-website.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath }
    
    # Compress website folder
    Compress-Archive -Path "$websitePath\*" -DestinationPath $zipPath -Force
    
    Write-Host "✅ Files compressed successfully!" -ForegroundColor Green
    Write-Host "📦 Upload the zip file manually to your Azure Static Web App" -ForegroundColor Yellow
    
} else {
    Write-Host "❌ Website directory not found at $websitePath" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 DEPLOYMENT INSTRUCTIONS:" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "1. Your Azure Static Web App is created!" -ForegroundColor White
Write-Host "2. URL: https://$appUrl" -ForegroundColor Cyan
Write-Host "3. Upload the zip file: agentchains-website.zip" -ForegroundColor White
Write-Host "4. Configure custom domain in Azure Portal" -ForegroundColor White

Write-Host "`n🌐 DOMAIN CONFIGURATION (GoDaddy):" -ForegroundColor Magenta
Write-Host "===================================" -ForegroundColor Magenta
Write-Host "Add these DNS records in GoDaddy:" -ForegroundColor White
Write-Host "Type: CNAME, Name: www, Value: $appUrl" -ForegroundColor Yellow
Write-Host "Type: CNAME, Name: @, Value: $appUrl" -ForegroundColor Yellow
Write-Host "Type: CNAME, Name: app, Value: $appUrl" -ForegroundColor Yellow

Write-Host "`n🚀 Your website will be live at:" -ForegroundColor Green
Write-Host "• https://agentchains.ai (after DNS setup)" -ForegroundColor Cyan
Write-Host "• https://www.agentchains.ai" -ForegroundColor Cyan  
Write-Host "• https://app.agentchains.ai" -ForegroundColor Cyan
Write-Host "• https://$appUrl (immediate)" -ForegroundColor Cyan

Write-Host "`nPress any key to open Azure Portal..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2FstaticSites"

Write-Host "`n✨ Deployment complete! Your AgentChains website is ready!" -ForegroundColor Green