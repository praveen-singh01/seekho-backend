#!/bin/bash

# Seekho Backend Setup Script

echo "🚀 Setting up Seekho Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is running (optional)
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB is available"
else
    echo "⚠️  MongoDB not found locally. Make sure you have a MongoDB connection string in .env"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration before starting the server"
    echo "   Required variables:"
    echo "   - MONGODB_URI"
    echo "   - JWT_SECRET"
    echo "   - GOOGLE_CLIENT_ID"
    echo "   - GOOGLE_CLIENT_SECRET"
    echo "   - RAZORPAY_KEY_ID"
    echo "   - RAZORPAY_KEY_SECRET"
else
    echo "✅ .env file exists"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the required configuration"
echo "2. Start MongoDB (if using local instance)"
echo "3. Run 'npm run seed' to populate sample data"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "Available commands:"
echo "  npm run dev     - Start development server with nodemon"
echo "  npm start       - Start production server"
echo "  npm run seed    - Populate database with sample data"
echo ""
echo "API will be available at: http://localhost:5000"
echo "Health check: http://localhost:5000/health"
