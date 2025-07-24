# Azure DevOps Deployment Guide

This guide will help you deploy the Attendance Tracker application to Azure using Azure DevOps pipelines.

## Prerequisites

1. **Azure Subscription** - You'll need an active Azure subscription
2. **Azure DevOps Account** - Sign up at [dev.azure.com](https://dev.azure.com)
3. **Git Repository** - Your code should be in Azure Repos, GitHub, or another Git provider

## Step 1: Set Up Azure Resources

### 1.1 Create Azure App Service
1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"** → **"Web App"**
3. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `attendance-app-[your-suffix]` (must be globally unique)
   - **Publish**: Code
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux (recommended) or Windows
   - **Region**: Choose closest to your users
   - **App Service Plan**: Create new (Basic B1 or higher)

4. Click **"Review + create"** → **"Create"**

### 1.2 Note Down App Service Details
- **App Name**: `attendance-app-[your-suffix]`
- **Resource Group**: Your resource group name
- **Subscription ID**: Found in subscription overview

## Step 2: Set Up Azure DevOps Project

### 2.1 Create New Project
1. Go to [Azure DevOps](https://dev.azure.com)
2. Click **"New Project"**
3. Enter project name: `attendance-tracker`
4. Set visibility to **Private**
5. Click **"Create"**

### 2.2 Import or Create Repository
**Option A: Import from existing repository**
1. Go to **Repos** → **Import**
2. Enter your repository URL
3. Click **Import**

**Option B: Upload your code**
1. Go to **Repos** → **Files**
2. Click **"Upload files"**
3. Upload all your project files

## Step 3: Create Service Connection

### 3.1 Set Up Azure Service Connection
1. Go to **Project Settings** (gear icon) → **Service connections**
2. Click **"New service connection"** → **"Azure Resource Manager"**
3. Choose **"Service principal (automatic)"**
4. Select your **Azure subscription**
5. Select your **Resource group**
6. Name it: `azure-subscription-connection`
7. Click **"Save"**

## Step 4: Configure Pipeline

### 4.1 Update Pipeline Variables
Edit the `azure-pipelines.yml` file in your repository:

```yaml
variables:
  # Update this to match your service connection name
  azureSubscription: 'azure-subscription-connection'
  
  # Update this to match your App Service name
  webAppName: 'attendance-app-[your-suffix]'
  
  # Update this to match your environment name
  environmentName: 'attendance-app-production'
```

### 4.2 Create Pipeline
1. Go to **Pipelines** → **Create Pipeline**
2. Choose **"Azure Repos Git"** (or your repository source)
3. Select your repository
4. Choose **"Existing Azure Pipelines YAML file"**
5. Select `/azure-pipelines.yml`
6. Click **"Continue"** → **"Run"**

## Step 5: Configure Environment

### 5.1 Create Environment
1. Go to **Pipelines** → **Environments**
2. Click **"New environment"**
3. Name: `attendance-app-production`
4. Resource: **None**
5. Click **"Create"**

### 5.2 Add Approval (Optional)
1. Click on your environment
2. Go to **Approvals and checks**
3. Add **"Approvals"** if you want manual approval before deployment

## Step 6: Configure App Service Settings

### 6.1 Set Environment Variables (if needed)
1. Go to Azure Portal → Your App Service
2. Go to **Configuration** → **Application settings**
3. Add any environment variables your app needs:
   - `NODE_ENV`: `production`
   - `PORT`: `8080` (or leave default)

### 6.2 Configure Startup Command
1. In **Configuration** → **General settings**
2. Set **Startup Command**: `npm start`

## Step 7: Deploy

### 7.1 Trigger Deployment
1. Make a change to your code
2. Commit and push to your main/master branch
3. The pipeline will automatically trigger
4. Monitor the deployment in **Pipelines** → **Runs**

### 7.2 Verify Deployment
1. Once deployment completes, visit your App Service URL:
   `https://attendance-app-[your-suffix].azurewebsites.net`
2. Test the attendance marking functionality

## Step 8: Set Up Continuous Deployment

The pipeline is configured to automatically deploy when you push to the main/master branch. To modify this:

1. Edit `azure-pipelines.yml`
2. Modify the `trigger` section:
```yaml
trigger:
- main      # Deploy on push to main branch
- develop   # Also deploy on push to develop branch
```

## Troubleshooting

### Common Issues

1. **Deployment fails with "Resource not found"**
   - Verify your App Service name in `azure-pipelines.yml`
   - Check service connection permissions

2. **Build fails on npm install**
   - Check Node.js version compatibility in pipeline
   - Verify package.json is valid

3. **App doesn't start**
   - Check App Service logs in Azure Portal
   - Verify startup command is set correctly
   - Check if all dependencies are installed

4. **Database/JSON file not persisting**
   - Consider using Azure SQL Database or Cosmos DB for production
   - Current JSON file storage will reset on each deployment

### Viewing Logs
1. Go to Azure Portal → Your App Service
2. Go to **Monitoring** → **Log stream**
3. Or use **Advanced Tools** → **Kudu** → **Debug console**

## Production Considerations

### 1. Database Upgrade
For production, consider upgrading from JSON file storage to:
- **Azure SQL Database** (recommended for enterprise)
- **Azure Cosmos DB** (NoSQL option)
- **PostgreSQL** (open source option)

### 2. Security
- Enable HTTPS only in App Service
- Configure CORS properly
- Add authentication if needed
- Set up proper error handling

### 3. Monitoring
- Enable Application Insights
- Set up alerts for downtime
- Monitor performance metrics

### 4. Scaling
- Configure auto-scaling rules
- Consider App Service Plan upgrade for higher traffic

## Environment Variables

For production deployment, you may want to set these environment variables in Azure App Service:

```
NODE_ENV=production
PORT=8080
```

## Support

If you encounter issues:
1. Check Azure DevOps pipeline logs
2. Check Azure App Service logs
3. Verify all configuration steps
4. Check Azure service health status

Your application should now be successfully deployed and accessible via the Azure App Service URL! 