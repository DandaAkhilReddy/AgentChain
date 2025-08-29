# 🚀 Deploy AgentChains.ai to Azure - QUICK SETUP

## 🎯 **IMMEDIATE DEPLOYMENT STEPS**

### **Step 1: Prepare Your Files (ALREADY DONE!)**
✅ Website is ready at: `C:\Users\akhil\AgentChain\website\`
✅ Azure configuration created
✅ Domain routing configured

### **Step 2: Create Azure Static Web App (5 minutes)**

1. **Login to Azure Portal**
   - Go to: https://portal.azure.com
   - Sign in with your Microsoft account

2. **Create Static Web App**
   ```
   Click "Create a resource" → Search "Static Web Apps" → Create
   ```

3. **Fill Configuration:**
   ```
   Subscription: Your subscription
   Resource Group: Create new "AgentChains-RG"
   Name: agentchains-website
   Plan type: Free
   Region: East US 2
   Source: Other (for now)
   ```

4. **Click "Review + Create" → Create**

### **Step 3: Deploy Your Website (2 minutes)**

**Option A: Upload via Azure Portal**
1. After creation, go to your Static Web App
2. Click "Browse" to see the default page
3. Go to "Overview" → "Manage deployment token"
4. Copy the deployment token
5. Use Azure CLI or upload files directly

**Option B: Drag & Drop (FASTEST)**
1. Zip your entire `website` folder
2. In Azure Portal, go to your Static Web App
3. Go to "Configuration" → "Application settings"
4. Add: `WEBSITE_RUN_FROM_PACKAGE = 1`
5. Use Kudu or deployment center to upload

### **Step 4: Configure Custom Domain (10 minutes)**

1. **In Azure Portal:**
   ```
   Go to your Static Web App → Custom domains → Add
   Domain type: Custom domain on other DNS
   Domain name: agentchains.ai
   ```

2. **In GoDaddy DNS Management:**
   ```
   Add CNAME record:
   Type: CNAME
   Name: www
   Value: [your-azure-app-name].azurestaticapps.net
   
   Add A record for apex domain:
   Type: A
   Name: @
   Value: [Get IP from Azure Static Web Apps docs]
   ```

3. **Add Subdomain for dApp:**
   ```
   CNAME record:
   Name: app
   Value: [your-azure-app-name].azurestaticapps.net
   ```

## 🔥 **SUPER FAST METHOD - Deploy RIGHT NOW!**

### **Use Azure CLI (Fastest):**

1. **Install Azure CLI** (if not installed):
   ```bash
   # Download from: https://aka.ms/installazurecliwindows
   ```

2. **Login & Deploy:**
   ```bash
   # Login to Azure
   az login
   
   # Create resource group
   az group create --name AgentChains-RG --location eastus2
   
   # Create static web app
   az staticwebapp create \
     --name agentchains-website \
     --resource-group AgentChains-RG \
     --source C:\Users\akhil\AgentChain\website \
     --location eastus2 \
     --branch main \
     --token [YOUR_GITHUB_TOKEN]
   ```

3. **Upload Files:**
   ```bash
   cd C:\Users\akhil\AgentChain\website
   az staticwebapp deploy --name agentchains-website --source .
   ```

## ⚡ **ALTERNATIVE: Use GitHub (Automated)**

1. **Push to GitHub:**
   ```bash
   cd C:\Users\akhil\AgentChain
   git init
   git add .
   git commit -m "Deploy AgentChains website"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/agentchains.git
   git push -u origin main
   ```

2. **Create Static Web App with GitHub:**
   - In Azure Portal: Create Static Web App
   - Choose "GitHub" as source
   - Connect your repository
   - Build details:
     ```
     App location: /website
     Api location: (empty)
     Output location: (empty)
     ```

3. **Auto-deployment will start immediately!**

## 🌐 **Domain Configuration in GoDaddy**

### **DNS Records to Add:**

1. **For agentchains.ai:**
   ```
   Type: A
   Name: @
   Value: 20.33.134.204 (Azure Static Apps IP)
   TTL: 1 Hour
   ```

2. **For www.agentchains.ai:**
   ```
   Type: CNAME  
   Name: www
   Value: agentchains-website.azurestaticapps.net
   TTL: 1 Hour
   ```

3. **For app.agentchains.ai (dApp):**
   ```
   Type: CNAME
   Name: app
   Value: agentchains-website.azurestaticapps.net  
   TTL: 1 Hour
   ```

## 🎯 **Expected Results:**

After deployment (5-30 minutes for DNS propagation):

✅ **https://agentchains.ai** → Main website
✅ **https://www.agentchains.ai** → Main website  
✅ **https://app.agentchains.ai** → dApp interface
✅ **SSL Certificate** → Automatic via Azure
✅ **CDN** → Global distribution
✅ **99.9% Uptime** → Azure SLA

## 🔧 **Troubleshooting:**

**If domain doesn't work:**
1. Check DNS propagation: https://dnschecker.org
2. Verify CNAME in Azure Static Web Apps
3. Wait 24 hours for full propagation

**If deployment fails:**
1. Check file permissions
2. Verify Azure subscription limits
3. Try different region

## 💰 **Cost:**
- Azure Static Web Apps: **FREE** (up to 100GB bandwidth)
- Custom domain: **FREE** 
- SSL Certificate: **FREE**
- Global CDN: **FREE**

## 🚀 **LAUNCH COMMAND:**
```bash
# Navigate to your website folder
cd C:\Users\akhil\AgentChain\website

# Deploy to Azure (replace with your details)
az staticwebapp create --name agentchains --resource-group AgentChains-RG --location eastus2 --source .
```

**Your website will be LIVE in 5-15 minutes at agentchains.ai! 🚀**