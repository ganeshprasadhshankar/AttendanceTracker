# Azure Deployment Guide - AttendanceTracker

This guide will help you deploy the Attendance Tracker application to Microsoft Azure using multiple deployment options.

## Prerequisites

1. **Azure Account** - You'll need an active Azure subscription
2. **Azure CLI** - Install Azure CLI for command-line deployment
3. **Git Repository** - Your code should be in GitHub, Azure DevOps, or another Git provider
4. **Node.js** - Version 16+ for local development and testing

## Quick Start - Azure App Service (Recommended)

### Option 1: Azure Portal Deployment (Easiest)

1. **Sign in to Azure Portal**: https://portal.azure.com

2. **Create Azure App Service**:
   - Click "Create a resource" → "Web App"
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new "attendance-tracker-rg"
   - **Name**: "attendance-tracker-app" (must be globally unique)
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux
   - **Region**: Choose closest to your users (e.g., East US)
   - **Pricing plan**: F1 (Free) for testing, B1 (Basic) for production

3. **Deploy your code**:
   - Go to your App Service → "Deployment Center"
   - **Source**: GitHub (or your preferred Git provider)
   - **Organization**: Your GitHub username
   - **Repository**: Your AttendanceTracker repository
   - **Branch**: main
   - Click "Save"

4. **Configure Application Settings**:
   - Go to "Configuration" → "Application settings"
   - Add: `NODE_ENV` = `production`
   - Add: `WEBSITE_NODE_DEFAULT_VERSION` = `18.x`
   - Click "Save"

Your app will be available at: `https://attendance-tracker-app.azurewebsites.net`

### Option 2: Azure CLI Deployment

```bash
# 1. Install Azure CLI (if not already installed)
# Windows (PowerShell as Administrator)
Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi; Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'

# 2. Login to Azure
az login

# 3. Create Resource Group
az group create --name attendance-tracker-rg --location eastus

# 4. Create App Service Plan
az appservice plan create --name attendance-tracker-plan --resource-group attendance-tracker-rg --sku F1 --is-linux

# 5. Create Web App
az webapp create --resource-group attendance-tracker-rg --plan attendance-tracker-plan --name attendance-tracker-app --runtime "NODE|18-lts"

# 6. Configure deployment from GitHub
az webapp deployment source config --name attendance-tracker-app --resource-group attendance-tracker-rg --repo-url https://github.com/YOUR_USERNAME/AttendanceTracker --branch main --manual-integration

# 7. Set application settings
az webapp config appsettings set --resource-group attendance-tracker-rg --name attendance-tracker-app --settings NODE_ENV=production

# 8. Browse to your app
az webapp browse --name attendance-tracker-app --resource-group attendance-tracker-rg
```

## Advanced Deployment Options

### Option 3: Azure Container Instances (Using Dockerfile)

```bash
# 1. Build and push container to Azure Container Registry
az acr create --resource-group attendance-tracker-rg --name attendanceregistry --sku Basic
az acr login --name attendanceregistry

# 2. Build and push image
docker build -t attendanceregistry.azurecr.io/attendance-tracker:v1 .
docker push attendanceregistry.azurecr.io/attendance-tracker:v1

# 3. Create container instance
az container create --resource-group attendance-tracker-rg --name attendance-tracker-container --image attendanceregistry.azurecr.io/attendance-tracker:v1 --dns-name-label attendance-tracker --ports 3001
```

### Option 4: Azure Container Apps (Most Advanced)

```bash
# 1. Install Container Apps extension
az extension add --name containerapp

# 2. Create Container Apps environment
az containerapp env create --name attendance-tracker-env --resource-group attendance-tracker-rg --location eastus

# 3. Deploy container app
az containerapp create --name attendance-tracker --resource-group attendance-tracker-rg --environment attendance-tracker-env --image attendanceregistry.azurecr.io/attendance-tracker:v1 --target-port 3001 --ingress external
```

## CI/CD Setup with Azure DevOps

### Create Azure DevOps Pipeline

1. **Sign in to Azure DevOps**: https://dev.azure.com
2. **Create new project**: "AttendanceTracker"
3. **Import repository** or connect to your existing repo
4. **Create pipeline** using the configuration below:

```yaml
# azure-pipelines-azure.yml
trigger:
- main

variables:
  # Azure configuration
  azureSubscription: 'your-azure-subscription'
  webAppName: 'attendance-tracker-app'
  resourceGroupName: 'attendance-tracker-rg'
  
  # Agent VM image name
  vmImageName: 'ubuntu-latest'

stages:
- stage: Build
  displayName: Build stage
  jobs:
  - job: Build
    displayName: Build
    pool:
      vmImage: $(vmImageName)

    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
      displayName: 'Install Node.js'

    - script: |
        npm ci
        npm run build --if-present
      displayName: 'npm install and build'

    - script: |
        npm run test --if-present
      displayName: 'npm test'

    - task: ArchiveFiles@2
      displayName: 'Archive files'
      inputs:
        rootFolderOrFile: '$(System.DefaultWorkingDirectory)'
        includeRootFolder: false
        archiveType: zip
        archiveFile: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
        replaceExistingArchive: true

    - upload: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
      artifact: drop

- stage: Deploy
  displayName: Deploy stage
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: Deploy
    displayName: Deploy
    environment: 'production'
    pool:
      vmImage: $(vmImageName)
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Azure Web App Deploy'
            inputs:
              azureSubscription: $(azureSubscription)
              appType: 'webAppLinux'
              appName: $(webAppName)
              runtimeStack: 'NODE|18-lts'
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
```

## Database Upgrade for Production

Your current app uses JSON files for data storage. For production, consider upgrading to:

### Azure Cosmos DB (Recommended)

```bash
# Create Cosmos DB account
az cosmosdb create --name attendance-tracker-cosmos --resource-group attendance-tracker-rg --kind MongoDB

# Get connection string
az cosmosdb keys list --name attendance-tracker-cosmos --resource-group attendance-tracker-rg --type connection-strings
```

Update your app to use Cosmos DB:
```bash
npm install mongodb
```

### Azure Database for PostgreSQL

```bash
# Create PostgreSQL server
az postgres flexible-server create --resource-group attendance-tracker-rg --name attendance-tracker-db --admin-user dbadmin --admin-password SecurePassword123! --public-access 0.0.0.0
```

## Environment Configuration

### Application Settings in Azure App Service

Set these in Azure Portal → App Service → Configuration:

```
NODE_ENV=production
PORT=3001
COSMOS_CONNECTION_STRING=your-connection-string
WEBSITE_NODE_DEFAULT_VERSION=18.x
```

### Using Azure Key Vault (Recommended for secrets)

```bash
# Create Key Vault
az keyvault create --name attendance-tracker-vault --resource-group attendance-tracker-rg --location eastus

# Add secrets
az keyvault secret set --vault-name attendance-tracker-vault --name "database-password" --value "your-secure-password"

# Grant App Service access to Key Vault
az webapp identity assign --name attendance-tracker-app --resource-group attendance-tracker-rg
```

## Monitoring and Logging

### Application Insights

```bash
# Create Application Insights
az extension add --name application-insights
az monitor app-insights component create --app attendance-tracker-insights --location eastus --resource-group attendance-tracker-rg
```

Add to your app:
```bash
npm install applicationinsights
```

```javascript
// Add to server.js (top of file)
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
appInsights.start();
```

## Security Best Practices

### 1. Enable HTTPS Only
```bash
az webapp update --resource-group attendance-tracker-rg --name attendance-tracker-app --https-only true
```

### 2. Set up Custom Domain (Optional)
```bash
# Add custom domain
az webapp config hostname add --webapp-name attendance-tracker-app --resource-group attendance-tracker-rg --hostname yourdomain.com

# Create SSL certificate
az webapp config ssl upload --certificate-file path/to/certificate.pfx --certificate-password password --name attendance-tracker-app --resource-group attendance-tracker-rg
```

### 3. Configure Authentication (Optional)
- Azure Portal → App Service → Authentication
- Add Azure Active Directory, Google, Facebook, etc.

## Scaling and Performance

### Auto-scaling Rules
```bash
# Create auto-scale setting
az monitor autoscale create --resource-group attendance-tracker-rg --name attendance-tracker-autoscale --resource /subscriptions/YOUR_SUBSCRIPTION/resourceGroups/attendance-tracker-rg/providers/Microsoft.Web/serverFarms/attendance-tracker-plan
```

### Performance Monitoring
- Enable Application Insights
- Set up alerts for response time, errors, availability
- Use Azure Monitor for infrastructure metrics

## Cost Optimization

### Pricing Tiers
- **Free (F1)**: Development/testing - 1GB storage, 165MB memory
- **Basic (B1)**: Small production apps - Custom domains, SSL
- **Standard (S1)**: Production apps - Auto-scaling, staging slots
- **Premium (P1V2)**: High-performance - Advanced features

### Cost Management
```bash
# Set up budget alerts
az consumption budget create --budget-name attendance-tracker-budget --resource-group attendance-tracker-rg --amount 50 --time-grain Monthly
```

## Troubleshooting

### Common Issues

1. **App won't start**
   ```bash
   # Check logs
   az webapp log tail --name attendance-tracker-app --resource-group attendance-tracker-rg
   ```

2. **Database connection issues**
   - Check connection strings in Configuration
   - Verify firewall rules for database
   - Test connectivity from App Service

3. **Performance issues**
   - Check Application Insights metrics
   - Review resource utilization
   - Consider scaling up/out

### Useful Commands

```bash
# View app logs
az webapp log download --name attendance-tracker-app --resource-group attendance-tracker-rg

# Restart app
az webapp restart --name attendance-tracker-app --resource-group attendance-tracker-rg

# Check app status
az webapp show --name attendance-tracker-app --resource-group attendance-tracker-rg --query state

# SSH into App Service (Linux)
az webapp ssh --name attendance-tracker-app --resource-group attendance-tracker-rg
```

## Production Checklist

- [ ] Choose appropriate pricing tier
- [ ] Set up custom domain and SSL
- [ ] Configure authentication if needed
- [ ] Upgrade to production database (Cosmos DB/PostgreSQL)
- [ ] Set up Application Insights monitoring
- [ ] Configure CI/CD pipeline
- [ ] Set up backup strategy
- [ ] Configure auto-scaling rules
- [ ] Set up alerts and notifications
- [ ] Test disaster recovery
- [ ] Security review and penetration testing

## Support and Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)
- [Azure DevOps Documentation](https://docs.microsoft.com/en-us/azure/devops/)
- [Azure Support](https://azure.microsoft.com/en-us/support/)

Your AttendanceTracker application will be live at: `https://your-app-name.azurewebsites.net` 