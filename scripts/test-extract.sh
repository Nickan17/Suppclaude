#!/bin/bash

# Test script for firecrawl-extract edge function
# Usage: ./scripts/test-extract.sh

SUPABASE_URL="https://gjegtqxzqzjihthfardi.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZWd0cXh6cXpqaWh0aGZhcmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzIwNTcsImV4cCI6MjA3MDk0ODA1N30.UsqIDkWKDY4Glk1OOuNGODByqvsifEVaqFwcZFsj6_M"

echo "Testing firecrawl-extract function..."
echo "URL: $SUPABASE_URL/functions/v1/firecrawl-extract"
echo ""

curl -s -X POST "$SUPABASE_URL/functions/v1/firecrawl-extract" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://magnumsupps.com/en-us/products/quattro"}' \
| jq '{
    title, 
    _meta: {
      factsTokens, 
      factsSource, 
      ocrTried, 
      ocrPicked
    }, 
    hasFacts: (.supplementFacts.raw|length>0),
    hasIngredients: (.ingredients|length//0)
  }'

echo ""
echo "Test complete!"
