#!/bin/bash
# AgentChains Azure Deployment Script
# Deploy the revolutionary AI-powered blockchain platform to Azure Static Web Apps

echo "🤖 AgentChains Azure Deployment - Principal Scientist Edition"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="agentchains-rg"
LOCATION="eastus2"
APP_NAME="agentchains-ai-platform"
SUBSCRIPTION_ID=""
GITHUB_REPO="dandaakhilreddy/agentchains"

echo -e "${CYAN}🔧 Step 1: Installing Azure CLI (if needed)${NC}"
# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${YELLOW}Installing Azure CLI...${NC}"
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
else
    echo -e "${GREEN}✅ Azure CLI already installed${NC}"
fi

echo -e "${CYAN}🔐 Step 2: Azure Login${NC}"
echo "Please login to your Azure account..."
az login

echo -e "${CYAN}📋 Step 3: Selecting Azure Subscription${NC}"
az account list --output table
echo "Enter your subscription ID (or press Enter for default):"
read -r user_subscription_id
if [ ! -z "$user_subscription_id" ]; then
    SUBSCRIPTION_ID=$user_subscription_id
    az account set --subscription $SUBSCRIPTION_ID
fi

echo -e "${CYAN}🏗️ Step 4: Creating Resource Group${NC}"
echo "Creating resource group: $RESOURCE_GROUP in $LOCATION"
az group create --name $RESOURCE_GROUP --location $LOCATION

echo -e "${CYAN}🌐 Step 5: Creating Azure Static Web App${NC}"
echo "Creating Static Web App: $APP_NAME"
DEPLOYMENT_TOKEN=$(az staticwebapp create \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --source https://github.com/$GITHUB_REPO \
    --location $LOCATION \
    --branch main \
    --app-location "website" \
    --api-location "api" \
    --login-with-github \
    --query "properties.repositoryToken" -o tsv)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    echo -e "${RED}❌ Failed to create Static Web App${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Azure Static Web App created successfully!${NC}"
echo -e "${YELLOW}📋 Deployment Details:${NC}"
echo -e "App Name: ${BLUE}$APP_NAME${NC}"
echo -e "Resource Group: ${BLUE}$RESOURCE_GROUP${NC}"
echo -e "GitHub Repository: ${BLUE}$GITHUB_REPO${NC}"

echo -e "${CYAN}🔑 Step 6: Getting App Information${NC}"
APP_URL=$(az staticwebapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostname" -o tsv)
API_KEY=$(az staticwebapp secrets list --name $APP_NAME --resource-group $RESOURCE_GROUP --query "properties.apiKey" -o tsv)

echo -e "${GREEN}🚀 Deployment Information:${NC}"
echo -e "Website URL: ${BLUE}https://$APP_URL${NC}"
echo -e "API Token: ${YELLOW}(Add this to GitHub Secrets as AZURE_STATIC_WEB_APPS_API_TOKEN)${NC}"

echo -e "${CYAN}⚙️ Step 7: Configure GitHub Repository Secrets${NC}"
echo "To complete the deployment, add these secrets to your GitHub repository:"
echo "1. Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions"
echo "2. Add new secret: AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "3. Value: $DEPLOYMENT_TOKEN"

echo -e "${CYAN}🔄 Step 8: Setting up Custom Domain (Optional)${NC}"
echo "Enter custom domain (e.g., agentchains.ai) or press Enter to skip:"
read -r custom_domain
if [ ! -z "$custom_domain" ]; then
    echo "Setting up custom domain: $custom_domain"
    az staticwebapp hostname set --hostname $custom_domain --name $APP_NAME --resource-group $RESOURCE_GROUP
    echo -e "${YELLOW}📋 DNS Configuration Required:${NC}"
    echo "Add the following DNS records:"
    echo "Type: CNAME"
    echo "Name: www (or @)"
    echo "Value: $APP_URL"
fi

echo -e "${CYAN}🎯 Step 9: Deployment Verification${NC}"
echo "Checking deployment status..."
az staticwebapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "{name:name,status:repositoryUrl,url:defaultHostname}" -o table

echo -e "${GREEN}🎉 AGENTCHAINS DEPLOYMENT COMPLETE!${NC}"
echo "=============================================================="
echo -e "${BLUE}🌐 Website URL: https://$APP_URL${NC}"
echo -e "${BLUE}🤖 AI Dashboard: https://$APP_URL/dapp/dashboard.html${NC}"
echo -e "${BLUE}🧪 Test Suite: https://$APP_URL/test-functionality.html${NC}"
echo -e "${BLUE}📊 Status Page: https://$APP_URL/status.html${NC}"
echo ""
echo -e "${YELLOW}🔄 Next Steps:${NC}"
echo "1. Add the deployment token to GitHub secrets"
echo "2. Push changes to trigger automatic deployment"
echo "3. Configure custom domain if desired"
echo "4. Test all AI features and Web3 integration"
echo ""
echo -e "${CYAN}🚀 The future of AI-powered blockchain is now LIVE on Azure!${NC}"