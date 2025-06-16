#!/bin/bash

# Deploy webhook fix to production server
# This script will help you deploy the webhook filtering changes

echo "🚀 Deploying Webhook Fix to Production"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Changes being deployed:${NC}"
echo "1. ✅ Webhook filtering for Suvichar app"
echo "2. ✅ Enhanced logging for webhook debugging"
echo "3. ✅ Temporary signature verification bypass"
echo "4. ✅ Better error handling"
echo ""

# Commit changes
echo -e "${YELLOW}📝 Committing changes...${NC}"
git add .
git commit -m "Fix webhook processing - filter Suvichar app webhooks and improve logging"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Changes committed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  No new changes to commit or commit failed${NC}"
fi

# Push to repository
echo -e "${YELLOW}🔄 Pushing to repository...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Changes pushed to repository${NC}"
else
    echo -e "${RED}❌ Failed to push changes${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps on your production server:${NC}"
echo "1. Pull the latest changes: git pull origin main"
echo "2. Restart PM2: pm2 restart seekho-backend"
echo "3. Check logs: pm2 logs seekho-backend"
echo ""
echo -e "${YELLOW}🔍 What to look for in logs:${NC}"
echo "• 🚫 Ignoring webhook: Different app: SUVICHAR"
echo "• ✅ Processing webhook for Seekho app"
echo "• 📋 Subscription ID: [your-subscription-id]"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "• Webhook signature verification is temporarily disabled"
echo "• Re-enable it once webhook source is confirmed"
echo "• Monitor logs to ensure Suvichar webhooks are being filtered"
echo ""
echo -e "${GREEN}✅ Ready to test payment flow!${NC}"
