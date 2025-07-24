# AWS Deployment Guide

This guide will help you deploy the Attendance Tracker application to AWS using multiple deployment options.

## Prerequisites

1. **AWS Account** - You'll need an active AWS account
2. **AWS CLI** - Install and configure AWS CLI
3. **Git Repository** - Your code should be in GitHub, GitLab, or AWS CodeCommit
4. **Node.js** - Version 16+ for local development and testing

## Deployment Options

We'll cover three main deployment approaches:
1. **AWS Elastic Beanstalk** (Recommended for beginners)
2. **AWS EC2** (More control and customization)
3. **AWS App Runner** (Container-based, simple setup)

---

## Option 1: AWS Elastic Beanstalk (Recommended)

### 1.1 Install AWS CLI and EB CLI

```bash
# Install AWS CLI (if not already installed)
# Windows (PowerShell)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and Default region

# Install EB CLI
pip install awsebcli --upgrade --user
```

### 1.2 Initialize Elastic Beanstalk Application

```bash
# In your project directory
eb init

# Follow the prompts:
# - Select a default region (e.g., us-east-1)
# - Create new application: attendance-tracker
# - Platform: Node.js
# - Platform version: Node.js 18 running on 64bit Amazon Linux 2
# - Setup SSH: yes (recommended)
```

### 1.3 Create Environment and Deploy

```bash
# Create environment
eb create attendance-app-prod

# Deploy your application
eb deploy

# Open application in browser
eb open
```

### 1.4 Configure Environment Variables

```bash
# Set environment variables (if needed)
eb setenv NODE_ENV=production PORT=8080

# View current environment variables
eb printenv
```

---

## Option 2: AWS EC2 Manual Deployment

### 2.1 Launch EC2 Instance

1. Go to [AWS Console](https://console.aws.amazon.com) → EC2
2. Click **"Launch Instance"**
3. Configure instance:
   - **Name**: `attendance-app-server`
   - **AMI**: Amazon Linux 2023 AMI
   - **Instance Type**: t2.micro (free tier) or t3.small
   - **Key Pair**: Create new or use existing
   - **Security Group**: Allow HTTP (80), HTTPS (443), SSH (22), and Custom TCP (3001)
   - **Storage**: 8 GB (default)

4. Click **"Launch Instance"**

### 2.2 Connect and Set Up Server

```bash
# Connect to your instance
ssh -i "your-key.pem" ec2-user@your-instance-public-ip

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo yum install -y git

# Clone your repository
git clone https://github.com/yourusername/attendance-app.git
cd attendance-app

# Install dependencies
npm install

# Start application with PM2
pm2 start server.js --name "attendance-app"
pm2 startup
pm2 save
```

### 2.3 Set Up Nginx (Optional but Recommended)

```bash
# Install Nginx
sudo yum install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure Nginx
sudo nano /etc/nginx/conf.d/attendance-app.conf
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or public IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Option 3: AWS App Runner

### 3.1 Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

### 3.2 Deploy with App Runner

1. Go to AWS Console → App Runner
2. Click **"Create service"**
3. Choose **"Source code repository"**
4. Connect your GitHub repository
5. Configure:
   - **Runtime**: Node.js 18
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Port**: 3001
6. Click **"Create & deploy"**

---

## CI/CD Setup

### Option A: GitHub Actions (Recommended)

Create `.github/workflows/deploy-aws.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main, master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Deploy to Elastic Beanstalk
      run: |
        pip install awsebcli
        eb deploy attendance-app-prod
```

Add these secrets to your GitHub repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Option B: AWS CodePipeline

1. Go to AWS Console → CodePipeline
2. Click **"Create pipeline"**
3. Configure pipeline:
   - **Pipeline name**: `attendance-app-pipeline`
   - **Service role**: Create new role
4. Add source stage:
   - **Source provider**: GitHub
   - **Repository**: Your repository
   - **Branch**: main
5. Add build stage:
   - **Build provider**: AWS CodeBuild
   - **Create build project**: attendance-app-build
6. Add deploy stage:
   - **Deploy provider**: AWS Elastic Beanstalk
   - **Application**: attendance-tracker
   - **Environment**: attendance-app-prod

---

## Database Upgrade for Production

### Option A: Amazon RDS (Relational Database)

1. Create RDS MySQL instance:
```bash
aws rds create-db-instance \
    --db-instance-identifier attendance-db \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --master-username admin \
    --master-user-password YourSecurePassword123 \
    --allocated-storage 20
```

2. Update your application to use MySQL:
```bash
npm install mysql2
```

### Option B: Amazon DynamoDB (NoSQL)

1. Create DynamoDB table:
```bash
aws dynamodb create-table \
    --table-name attendance-records \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

2. Update your application to use DynamoDB:
```bash
npm install aws-sdk
```

---

## Security Best Practices

### 1. Environment Variables
```bash
# For Elastic Beanstalk
eb setenv NODE_ENV=production
eb setenv DB_HOST=your-rds-endpoint
eb setenv DB_PASSWORD=your-secure-password

# For EC2 (add to ~/.bashrc)
export NODE_ENV=production
export DB_HOST=your-rds-endpoint
export DB_PASSWORD=your-secure-password
```

### 2. Security Groups
- **Web servers**: Allow HTTP (80), HTTPS (443)
- **Application servers**: Allow custom port (3001) only from load balancer
- **Database**: Allow MySQL (3306) only from application servers

### 3. SSL Certificate
```bash
# For custom domain with Certificate Manager
aws acm request-certificate \
    --domain-name yourdomain.com \
    --validation-method DNS
```

---

## Monitoring and Logging

### 1. CloudWatch Logs
```bash
# Install CloudWatch agent on EC2
sudo yum install -y amazon-cloudwatch-agent

# Configure log collection
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### 2. Application Monitoring
Add to your `package.json`:
```json
{
  "dependencies": {
    "winston": "^3.8.2",
    "aws-cloudwatch-log": "^1.0.0"
  }
}
```

---

## Scaling and Performance

### 1. Load Balancer (for multiple instances)
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
    --name attendance-app-alb \
    --subnets subnet-12345 subnet-67890 \
    --security-groups sg-12345
```

### 2. Auto Scaling (Elastic Beanstalk)
```bash
# Configure auto scaling
eb config
# Edit the configuration file to set min/max instances
```

---

## Cost Optimization

### 1. Instance Types
- **Development**: t2.micro (free tier)
- **Production (low traffic)**: t3.small
- **Production (high traffic)**: t3.medium or higher

### 2. Reserved Instances
For predictable workloads, consider 1-year reserved instances for 30-40% cost savings.

### 3. Spot Instances
For non-critical environments, use Spot instances for up to 70% cost savings.

---

## Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Check logs
   eb logs
   # or for EC2
   pm2 logs
   ```

2. **Database connection fails**
   - Check security groups
   - Verify connection string
   - Test connectivity: `telnet db-host 3306`

3. **High response times**
   - Check CloudWatch metrics
   - Consider auto-scaling
   - Optimize database queries

### Useful Commands

```bash
# Elastic Beanstalk
eb status          # Check environment status
eb health          # Check application health
eb logs            # View application logs
eb ssh             # SSH into instance

# EC2
pm2 status         # Check PM2 processes
pm2 logs           # View application logs
pm2 restart all    # Restart all processes
```

---

## Production Checklist

- [ ] Set up proper database (RDS/DynamoDB)
- [ ] Configure environment variables
- [ ] Set up SSL certificate
- [ ] Configure monitoring and alerts
- [ ] Set up automated backups
- [ ] Configure auto-scaling
- [ ] Set up CI/CD pipeline
- [ ] Security group configuration
- [ ] Load testing completed
- [ ] Disaster recovery plan

## Support

For additional help:
1. Check AWS documentation
2. Review CloudWatch logs and metrics
3. Use AWS Support (if you have a support plan)
4. AWS Community forums

Your application should now be successfully deployed on AWS! The URL will be provided by your chosen deployment method (Elastic Beanstalk, EC2 with domain, or App Runner). 