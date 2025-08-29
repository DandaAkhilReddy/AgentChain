# 🔧 AgentChains.ai DNS Troubleshooting Guide

## 🚨 **URGENT DNS FIX**

You need to configure **both** the apex domain (@) and www subdomain correctly.

## 📋 **EXACT DNS RECORDS TO ADD IN GODADDY:**

### **Method 1: CNAME + A Record (Recommended)**

1. **For the apex domain (agentchains.ai):**
   ```
   Type: A
   Name: @ 
   Value: 20.33.134.204
   TTL: 1 Hour
   ```

2. **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: agentchains-website.azurestaticapps.net
   TTL: 1 Hour
   ```

### **Method 2: All CNAME (Alternative)**

1. **For apex domain:**
   ```
   Type: CNAME
   Name: @
   Value: agentchains-website.azurestaticapps.net
   TTL: 1 Hour
   ```

2. **For www subdomain:**
   ```
   Type: CNAME
   Name: www  
   Value: agentchains-website.azurestaticapps.net
   TTL: 1 Hour
   ```

## 🔍 **STEP-BY-STEP GODADDY SETUP:**

### **Step 1: Login to GoDaddy**
1. Go to: https://dcc.godaddy.com/
2. Login with your credentials
3. Find "agentchains.ai" domain
4. Click "DNS" or "Manage DNS"

### **Step 2: Clear Existing Records**
1. **DELETE** any existing A, CNAME, or AAAA records for "@" and "www"
2. Keep only NS and MX records (if you have email)

### **Step 3: Add New Records**
1. Click "Add Record"
2. Add the A record for @ (apex)
3. Add the CNAME record for www
4. Save changes

## 🕒 **COMMON ISSUES & SOLUTIONS:**

### **Issue 1: DNS Not Propagating**
- **Wait Time**: DNS can take 24-48 hours to propagate
- **Check Status**: Use https://dnschecker.org
- **Flush DNS**: Run `ipconfig /flushdns` on your computer

### **Issue 2: Azure Static Web App Not Found**
Get your correct Azure hostname:
```bash
# In PowerShell/CMD:
az staticwebapp show --name agentchains-website --resource-group AgentChains-RG --query "defaultHostname" -o tsv
```

### **Issue 3: GoDaddy Interface Issues**
- Use "Advanced" DNS editor
- Set TTL to 600 seconds (10 minutes) for faster updates
- Clear browser cache after changes

## ⚡ **INSTANT VERIFICATION:**

### **Check Your Settings:**
1. **Ping Test**: `ping agentchains.ai`
2. **DNS Lookup**: `nslookup agentchains.ai`
3. **Online Check**: https://mxtoolbox.com/dnscheck.aspx

### **What You Should See:**
```
agentchains.ai → 20.33.134.204 (A record)
www.agentchains.ai → agentchains-website.azurestaticapps.net (CNAME)
```

## 🔧 **ALTERNATIVE: Use Azure DNS**

If GoDaddy is giving you issues:

### **Step 1: Create Azure DNS Zone**
```bash
az network dns zone create --resource-group AgentChains-RG --name agentchains.ai
```

### **Step 2: Get Name Servers**
```bash
az network dns zone show --resource-group AgentChains-RG --name agentchains.ai --query "nameServers"
```

### **Step 3: Update GoDaddy Name Servers**
1. In GoDaddy, go to "Nameservers"
2. Change to "Custom"
3. Enter the Azure name servers
4. Save

### **Step 4: Add DNS Records in Azure**
```bash
# Add A record for apex
az network dns record-set a add-record --resource-group AgentChains-RG --zone-name agentchains.ai --record-set-name "@" --ipv4-address 20.33.134.204

# Add CNAME for www
az network dns record-set cname set-record --resource-group AgentChains-RG --zone-name agentchains.ai --record-set-name "www" --cname agentchains-website.azurestaticapps.net
```

## 📞 **IMMEDIATE HELP:**

### **If Still Not Working:**
1. **Check Azure Portal**: Verify your Static Web App is running
2. **Contact GoDaddy**: Their DNS support can help
3. **Use Cloudflare**: Free alternative to GoDaddy DNS

### **Emergency Workaround:**
Use your direct Azure URL while DNS propagates:
- https://agentchains-website.azurestaticapps.net

## 🎯 **EXPECTED TIMELINE:**
- **Immediate**: Changes saved in GoDaddy
- **5-10 minutes**: Some locations see changes
- **1-4 hours**: Most locations updated  
- **24-48 hours**: Worldwide propagation complete

## ✅ **SUCCESS INDICATORS:**
- https://agentchains.ai loads your website
- https://www.agentchains.ai redirects properly
- No DNS errors in browser
- SSL certificate shows as valid

---

**Need immediate help? The issue is likely:**
1. Missing apex domain (@) record
2. Wrong CNAME target
3. DNS propagation delay
4. Browser cache

Follow the exact records above and wait 10-30 minutes! 🚀