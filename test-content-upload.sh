#!/bin/bash

API_BASE="https://server.drhelalahmed.com/api"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MTQ2NzI0NGEzYjJjOTMwN2NjNjkzNiIsImVtYWlsIjoiZG9jdG9yQGRyaGVsYWwuY29tIiwicm9sZSI6ImRvY3RvciIsImlhdCI6MTcyOTYxNzgwMCwiZXhwIjoxNzI5NzA0MjAwfQ.oyx8KLH9zCrw5JPdMs1Wc7roo8Q-C6ksDFoTSpmt_xw"

echo "🚀 Starting content upload tests..."
echo "🔗 API Base: $API_BASE"
echo "🔑 Using auth token: ${AUTH_TOKEN:0:20}..."
echo ""

# Test 1: Valid content
echo "🧪 Test 1: Valid Article Content"
echo "📤 Request data:"
cat << 'EOF'
{
  "title": "Test Health Article - Valid Format",
  "description": "This is a test article about health tips and wellness advice from Dr. Helal.",
  "content_type": "article",
  "content_url": "https://example.com/health-article",
  "thumbnail_url": "https://example.com/thumbnail.jpg",
  "category": "health",
  "tags": ["health", "wellness", "tips"],
  "is_published": false,
  "is_featured": false
}
EOF
echo ""
echo "📡 Making API request..."

curl -X POST "$API_BASE/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "title": "Test Health Article - Valid Format",
    "description": "This is a test article about health tips and wellness advice from Dr. Helal.",
    "content_type": "article",
    "content_url": "https://example.com/health-article",
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "category": "health",
    "tags": ["health", "wellness", "tips"],
    "is_published": false,
    "is_featured": false
  }' \
  -w "\n📊 Status: %{http_code}\n" \
  -s

echo -e "\n" && echo "="*50

# Test 2: Missing required fields
echo "🧪 Test 2: Missing Required Fields"
echo "📤 Request data:"
cat << 'EOF'
{
  "description": "Testing with missing title and content_url"
}
EOF
echo ""
echo "📡 Making API request..."

curl -X POST "$API_BASE/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "description": "Testing with missing title and content_url"
  }' \
  -w "\n📊 Status: %{http_code}\n" \
  -s

echo -e "\n" && echo "="*50

# Test 3: Title too short
echo "🧪 Test 3: Title Too Short"
echo "📤 Request data:"
cat << 'EOF'
{
  "title": "Hi",
  "content_type": "article",
  "content_url": "https://example.com/article"
}
EOF
echo ""
echo "📡 Making API request..."

curl -X POST "$API_BASE/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "title": "Hi",
    "content_type": "article",
    "content_url": "https://example.com/article"
  }' \
  -w "\n📊 Status: %{http_code}\n" \
  -s

echo -e "\n" && echo "="*50

# Test 4: Invalid URL format
echo "🧪 Test 4: Invalid URL Format"
echo "📤 Request data:"
cat << 'EOF'
{
  "title": "Test with Invalid URL Format",
  "description": "Testing invalid URL format",
  "content_type": "article",
  "content_url": "not-a-valid-url",
  "category": "test"
}
EOF
echo ""
echo "📡 Making API request..."

curl -X POST "$API_BASE/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "title": "Test with Invalid URL Format",
    "description": "Testing invalid URL format",
    "content_type": "article",
    "content_url": "not-a-valid-url",
    "category": "test"
  }' \
  -w "\n📊 Status: %{http_code}\n" \
  -s

echo -e "\n" && echo "="*50

# Test 5: Invalid content_type
echo "🧪 Test 5: Invalid Content Type"
echo "📤 Request data:"
cat << 'EOF'
{
  "title": "Test with Invalid Content Type",
  "description": "Testing invalid content type",
  "content_type": "invalid_type",
  "content_url": "https://example.com/test",
  "category": "test"
}
EOF
echo ""
echo "📡 Making API request..."

curl -X POST "$API_BASE/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "title": "Test with Invalid Content Type",
    "description": "Testing invalid content type",
    "content_type": "invalid_type",
    "content_url": "https://example.com/test",
    "category": "test"
  }' \
  -w "\n📊 Status: %{http_code}\n" \
  -s

echo -e "\n" && echo "="*50

# Test 6: YouTube content with wrong URL format
echo "🧪 Test 6: YouTube Content with Wrong URL"
echo "📤 Request data:"
cat << 'EOF'
{
  "title": "YouTube Video with Wrong URL",
  "description": "Testing YouTube content type with non-YouTube URL",
  "content_type": "youtube",
  "content_url": "https://example.com/video",
  "category": "education"
}
EOF
echo ""
echo "📡 Making API request..."

curl -X POST "$API_BASE/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "title": "YouTube Video with Wrong URL",
    "description": "Testing YouTube content type with non-YouTube URL",
    "content_type": "youtube",
    "content_url": "https://example.com/video",
    "category": "education"
  }' \
  -w "\n📊 Status: %{http_code}\n" \
  -s

echo -e "\n" && echo "="*50

# Test 7: Valid YouTube content
echo "🧪 Test 7: Valid YouTube Content"
echo "📤 Request data:"
cat << 'EOF'
{
  "title": "Valid YouTube Health Video",
  "description": "Educational video about health from YouTube",
  "content_type": "youtube",
  "content_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "category": "education"
}
EOF
echo ""
echo "📡 Making API request..."

curl -X POST "$API_BASE/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "title": "Valid YouTube Health Video",
    "description": "Educational video about health from YouTube",
    "content_type": "youtube",
    "content_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "category": "education"
  }' \
  -w "\n📊 Status: %{http_code}\n" \
  -s

echo -e "\n✨ All tests completed!"
