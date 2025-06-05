#!/bin/bash

# Google OAuth Setup Script for Seekho Android Backend
# This script helps you set up Google OAuth credentials for your Android app

echo "🔐 Google OAuth Setup for Seekho Android Backend"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed.${NC}"
    echo "Please install it first:"
    echo ""
    echo "macOS: brew install --cask google-cloud-sdk"
    echo "Linux: curl https://sdk.cloud.google.com | bash"
    echo "Windows: Download from https://cloud.google.com/sdk/docs/install"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Google Cloud CLI found${NC}"

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Not logged in to Google Cloud${NC}"
    echo "Logging you in..."
    gcloud auth login
fi

ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1)
echo -e "${GREEN}✅ Logged in as: ${ACCOUNT}${NC}"

# Get or create project
echo ""
echo "📋 Project Setup"
echo "=================="

# List existing projects
echo "Your existing projects:"
gcloud projects list --format="table(projectId,name,projectNumber)" 2>/dev/null || echo "No projects found"

echo ""
read -p "Enter your project ID (or press Enter to create new): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    # Create new project
    echo ""
    read -p "Enter new project name (e.g., 'Seekho Backend'): " PROJECT_NAME
    PROJECT_ID="seekho-backend-$(date +%s)"
    
    echo -e "${BLUE}Creating project: ${PROJECT_ID}${NC}"
    gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Project created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create project${NC}"
        exit 1
    fi
fi

# Set current project
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✅ Using project: ${PROJECT_ID}${NC}"

# Enable required APIs
echo ""
echo "🔌 Enabling Required APIs"
echo "=========================="

APIS=(
    "oauth2.googleapis.com"
    "people.googleapis.com"
    "plus.googleapis.com"
)

for api in "${APIS[@]}"; do
    echo "Enabling $api..."
    gcloud services enable $api
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $api enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to enable $api (might already be enabled)${NC}"
    fi
done

# Get Android package name and SHA1
echo ""
echo "📱 Android App Configuration"
echo "============================="

read -p "Enter your Android app package name (e.g., com.seekho.app): " PACKAGE_NAME
echo ""
echo "For SHA1 fingerprint, run one of these commands:"
echo ""
echo -e "${BLUE}Debug keystore:${NC}"
echo "keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android"
echo ""
echo -e "${BLUE}Release keystore:${NC}"
echo "keytool -list -v -keystore /path/to/your/release.keystore -alias your_alias_name"
echo ""
read -p "Enter your SHA1 fingerprint: " SHA1_FINGERPRINT

# Create OAuth credentials
echo ""
echo "🔑 Creating OAuth Credentials"
echo "=============================="

echo "Opening Google Cloud Console to create OAuth credentials..."
echo "Please follow these steps:"
echo ""
echo "1. Go to APIs & Services → Credentials"
echo "2. Click 'Create Credentials' → 'OAuth 2.0 Client IDs'"
echo "3. Create TWO OAuth clients:"
echo ""
echo -e "${BLUE}   A) Web Application (for backend):${NC}"
echo "      - Application type: Web application"
echo "      - Name: Seekho Backend Web"
echo "      - Authorized redirect URIs:"
echo "        • http://localhost:5000/api/auth/google/callback"
echo "        • https://yourdomain.com/api/auth/google/callback"
echo ""
echo -e "${BLUE}   B) Android Application:${NC}"
echo "      - Application type: Android"
echo "      - Name: Seekho Android App"
echo "      - Package name: $PACKAGE_NAME"
echo "      - SHA-1 certificate fingerprint: $SHA1_FINGERPRINT"
echo ""

# Open Google Cloud Console
if command -v open &> /dev/null; then
    # macOS
    open "https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
elif command -v start &> /dev/null; then
    # Windows
    start "https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
else
    echo "Please manually open: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
fi

echo ""
read -p "Press Enter after you've created both OAuth clients..."

# Get credentials from user
echo ""
echo "📝 Enter Your OAuth Credentials"
echo "==============================="

read -p "Web Client ID (for backend): " WEB_CLIENT_ID
read -p "Web Client Secret (for backend): " WEB_CLIENT_SECRET
read -p "Android Client ID: " ANDROID_CLIENT_ID

# Update .env file
echo ""
echo "📄 Updating .env File"
echo "====================="

if [ -f .env ]; then
    # Backup existing .env
    cp .env .env.backup
    echo -e "${GREEN}✅ Backed up existing .env to .env.backup${NC}"
fi

# Update or create .env
cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/seekho-backend

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d

# Google OAuth (Web - for backend authentication)
GOOGLE_CLIENT_ID=$WEB_CLIENT_ID
GOOGLE_CLIENT_SECRET=$WEB_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Android App Configuration
ANDROID_CLIENT_ID=$ANDROID_CLIENT_ID
ANDROID_PACKAGE_NAME=$PACKAGE_NAME

# Frontend URL (for web dashboard)
CLIENT_URL=http://localhost:3000
# Android App Deep Link
ANDROID_DEEP_LINK=seekho://auth/callback

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# AWS S3 Configuration (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=seekho-uploads

# Admin Configuration
ADMIN_EMAIL=admin@seekho.com
ADMIN_PASSWORD=admin123

# Subscription Configuration
TRIAL_PRICE=100  # ₹1 in paise
MONTHLY_PRICE=19900  # ₹199 in paise
TRIAL_DURATION_DAYS=7
EOF

echo -e "${GREEN}✅ .env file updated successfully${NC}"

# Summary
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo -e "${GREEN}✅ Google Cloud Project: ${PROJECT_ID}${NC}"
echo -e "${GREEN}✅ Required APIs enabled${NC}"
echo -e "${GREEN}✅ OAuth credentials configured${NC}"
echo -e "${GREEN}✅ .env file updated${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Complete Razorpay and AWS S3 setup in .env"
echo "2. Install dependencies: npm install"
echo "3. Seed database: npm run seed"
echo "4. Start server: npm run dev"
echo "5. Test Android auth: POST /api/auth/android/google"
echo ""
echo "📱 For Android Integration:"
echo "• Use Android Client ID: $ANDROID_CLIENT_ID"
echo "• Package name: $PACKAGE_NAME"
echo "• Backend endpoint: http://localhost:5000/api/auth/android/google"
echo ""
echo "📚 API Documentation: http://localhost:5000/api-docs"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
