#!/bin/bash

# 🧪 Seekho Backend - Authentication Testing Script
# This script tests all authentication endpoints with various scenarios

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server configuration
SERVER_URL="http://localhost:8000"
API_BASE="$SERVER_URL/api"

echo -e "${BLUE}🧪 Seekho Backend Authentication Testing Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print test results
print_result() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    
    echo -e "${YELLOW}Test: $test_name${NC}"
    echo -e "Expected: $expected"
    echo -e "Actual: $actual"
    
    if [[ "$actual" == *"$expected"* ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
    echo ""
}

# Function to make API call and extract status
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local headers="$4"
    
    if [ -n "$data" ]; then
        if [ -n "$headers" ]; then
            curl -s -X "$method" "$API_BASE$endpoint" \
                -H "Content-Type: application/json" \
                -H "$headers" \
                -d "$data"
        else
            curl -s -X "$method" "$API_BASE$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        fi
    else
        if [ -n "$headers" ]; then
            curl -s -X "$method" "$API_BASE$endpoint" -H "$headers"
        else
            curl -s -X "$method" "$API_BASE$endpoint"
        fi
    fi
}

echo -e "${BLUE}🔍 Testing Server Health${NC}"
echo "----------------------------------------"

# Test 1: Server Health Check
response=$(curl -s "$SERVER_URL/health" 2>/dev/null || echo '{"error": "Server not responding"}')
if [[ "$response" == *'"status":"success"'* ]]; then
    echo -e "${GREEN}✅ Server is running${NC}"
    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
else
    echo -e "${RED}❌ Server is not responding${NC}"
    echo "Response: $response"
    echo "Please start the server with: npm start"
    exit 1
fi
echo ""

echo -e "${BLUE}📱 Testing Android Authentication Endpoints${NC}"
echo "----------------------------------------"

# Test 2: Android Config Endpoint
echo -e "${YELLOW}Test 2: Get Android Configuration${NC}"
response=$(make_request "GET" "/auth/android/config")
if [[ "$response" == *'"success":true'* ]] && [[ "$response" == *'"androidClientId"'* ]]; then
    echo -e "${GREEN}✅ Android config endpoint working${NC}"
    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
else
    echo -e "${RED}❌ Android config endpoint failed${NC}"
    echo "Response: $response"
fi
echo ""

# Test 3: Missing ID Token
echo -e "${YELLOW}Test 3: Missing ID Token${NC}"
response=$(make_request "POST" "/auth/android/google" '{}')
expected="MISSING_ID_TOKEN"
print_result "Missing ID Token" "$expected" "$response"

# Test 4: Invalid Token Format
echo -e "${YELLOW}Test 4: Invalid Token Format${NC}"
response=$(make_request "POST" "/auth/android/google" '{"idToken": "invalid-token"}')
expected="INVALID_TOKEN_FORMAT"
print_result "Invalid Token Format" "$expected" "$response"

# Test 5: Empty Token
echo -e "${YELLOW}Test 5: Empty Token${NC}"
response=$(make_request "POST" "/auth/android/google" '{"idToken": ""}')
expected="MISSING_ID_TOKEN"
print_result "Empty Token" "$expected" "$response"

# Test 6: Malformed JSON
echo -e "${YELLOW}Test 6: Malformed JSON${NC}"
response=$(curl -s -X POST "$API_BASE/auth/android/google" \
    -H "Content-Type: application/json" \
    -d '{"idToken":}' 2>/dev/null || echo '{"error": "malformed"}')
if [[ "$response" == *"error"* ]] || [[ "$response" == *"400"* ]]; then
    echo -e "${GREEN}✅ Properly handles malformed JSON${NC}"
else
    echo -e "${RED}❌ Should handle malformed JSON${NC}"
fi
echo "Response: $response"
echo ""

echo -e "${BLUE}🔐 Testing Authentication Flow${NC}"
echo "----------------------------------------"

# Test 7: Refresh Token without Authorization
echo -e "${YELLOW}Test 7: Refresh Token (No Auth)${NC}"
response=$(make_request "POST" "/auth/android/refresh")
if [[ "$response" == *"Access denied"* ]] || [[ "$response" == *"401"* ]]; then
    echo -e "${GREEN}✅ Properly requires authentication${NC}"
else
    echo -e "${RED}❌ Should require authentication${NC}"
fi
echo "Response: $response"
echo ""

# Test 8: Logout without Authorization
echo -e "${YELLOW}Test 8: Logout (No Auth)${NC}"
response=$(make_request "POST" "/auth/android/logout")
if [[ "$response" == *"Access denied"* ]] || [[ "$response" == *"401"* ]]; then
    echo -e "${GREEN}✅ Properly requires authentication${NC}"
else
    echo -e "${RED}❌ Should require authentication${NC}"
fi
echo "Response: $response"
echo ""

# Test 9: Delete Account without Authorization
echo -e "${YELLOW}Test 9: Delete Account (No Auth)${NC}"
response=$(make_request "DELETE" "/auth/android/account")
if [[ "$response" == *"Access denied"* ]] || [[ "$response" == *"401"* ]]; then
    echo -e "${GREEN}✅ Properly requires authentication${NC}"
else
    echo -e "${RED}❌ Should require authentication${NC}"
fi
echo "Response: $response"
echo ""

echo -e "${BLUE}📊 Test Summary${NC}"
echo "----------------------------------------"
echo -e "${GREEN}✅ All basic endpoint tests completed${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. To test with real Google ID tokens, set up your Android app"
echo "2. Use the Google Sign-In library to get valid ID tokens"
echo "3. Replace 'YOUR_REAL_GOOGLE_ID_TOKEN' in the commands below:"
echo ""
echo -e "${BLUE}Real Token Test Command:${NC}"
echo "curl -X POST $API_BASE/auth/android/google \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"idToken\": \"YOUR_REAL_GOOGLE_ID_TOKEN\"}' \\"
echo "  -v"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- Check server logs for detailed error messages with emoji indicators"
echo "- Verify your ANDROID_CLIENT_ID in .env matches your Google Cloud Console"
echo "- Ensure your Android app SHA-1 fingerprint is added to Google Cloud Console"
echo "- Google ID tokens expire after 1 hour"
echo ""
echo -e "${BLUE}🔧 Environment Check:${NC}"
if [ -f ".env" ]; then
    echo "ANDROID_CLIENT_ID: $(grep ANDROID_CLIENT_ID .env | cut -d'=' -f2)"
    echo "MONGODB_URI: $(grep MONGODB_URI .env | cut -d'=' -f2)"
    echo "JWT_SECRET: $(grep JWT_SECRET .env | cut -d'=' -f2 | sed 's/./*/g')"
else
    echo -e "${RED}❌ .env file not found${NC}"
fi
echo ""
echo -e "${GREEN}🎉 Testing completed!${NC}"
