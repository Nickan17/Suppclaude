# SupplementIQ - AI-Powered Supplement Analysis Platform

A comprehensive full-stack application that helps users make informed decisions about supplements through AI-powered analysis, barcode scanning, and URL extraction.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase CLI
- API Keys: Firecrawl, OCR.space, OpenRouter

### Environment Setup

1. **Supabase Edge Functions Environment**:
```bash
# Set secrets for edge functions
npx supabase secrets set \
  FIRECRAWL_API_KEY=<YOUR_FIRECRAWL_KEY> \
  OCRSPACE_API_KEY=<YOUR_OCR_SPACE_KEY> \
  OPENROUTER_API_KEY=<YOUR_OPENROUTER_KEY> \
  --project-ref <YOUR_PROJECT_REF>
```

2. **Expo App Environment** (create `expo-app/.env`):
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_EXTRACT_FN_URL=https://your-project.supabase.co/functions/v1/firecrawl-extract
```

### Database Setup

```bash
# Link to your Supabase project
npx supabase link --project-ref <YOUR_PROJECT_REF>

# Deploy database schema
npx supabase db push

# Deploy edge functions
npx supabase functions deploy firecrawl-extract --no-verify-jwt
npx supabase functions deploy analyze-product --no-verify-jwt
npx supabase functions deploy extract-supplement --no-verify-jwt
```

### Running the App

```bash
# Install dependencies
cd expo-app
npm install

# Start development server
npm run web  # For web
npx expo start  # For mobile
```

## 🛠 Architecture

### Frontend (Expo/React Native)
- **Home Dashboard**: Personalized landing with stats, quick actions, and educational tips
- **URL Analysis**: Paste URLs to extract supplement information
- **Barcode Scanner**: Camera-based product scanning
- **Onboarding**: 5-step user profiling for personalized recommendations
- **Authentication**: Skip mode for testing, full auth for production

### Backend (Supabase)
- **Database**: PostgreSQL with comprehensive supplement and user schemas
- **Edge Functions**: 
  - `firecrawl-extract`: URL scraping with Firecrawl + OCR fallback
  - `analyze-product`: AI analysis using OpenRouter
  - `extract-supplement`: Multi-source product extraction
- **Storage**: Product images and supplement facts
- **Auth**: User management with Row Level Security

### Key Features
- **Smart URL Extraction**: Firecrawl for web scraping + OCR.space for images
- **AI Analysis**: GPT-4/Claude integration for supplement scoring
- **Barcode Support**: UPC/EAN scanning with multiple databases
- **Educational Content**: Daily rotating tips and insights
- **Progress Tracking**: User stats, savings calculations, and achievements

## 🧪 Testing

### Test URL Extraction Function
```bash
# Run test script
./scripts/test-extract.sh

# Expected output: title, metadata, and extraction status
```

### Test Frontend URL Flow
1. Open app → Home tab
2. Click "Paste URL" 
3. Enter: `https://magnumsupps.com/en-us/products/quattro`
4. Should return extracted product info or meaningful error

## 📁 Project Structure

```
├── expo-app/                  # React Native frontend
│   ├── src/
│   │   ├── screens/          # Screen components
│   │   ├── components/       # Reusable UI components
│   │   ├── services/         # API clients and utilities
│   │   └── theme/           # Design system
├── supabase/
│   ├── functions/           # Edge functions
│   │   ├── firecrawl-extract/  # URL extraction service
│   │   ├── analyze-product/    # AI analysis service
│   │   └── extract-supplement/ # Multi-source extraction
│   └── migrations/          # Database schema
└── scripts/                 # Testing and deployment scripts
```

## 🔧 API Reference

### Firecrawl Extract Function

**Endpoint**: `POST /functions/v1/firecrawl-extract`

**Request**:
```json
{
  "url": "https://example.com/product"
}
```

**Response (200)**:
```json
{
  "title": "Product Name",
  "ingredients": ["ingredient1", "ingredient2"],
  "ingredients_raw": "Raw ingredients text",
  "supplementFacts": { "raw": "Supplement facts panel text" },
  "warnings": ["Warning text"],
  "_meta": {
    "chain": "firecrawl-extract",
    "secondPass": false,
    "factsTokens": 45,
    "factsSource": "html_pattern",
    "ocrTried": true,
    "ocrPicked": false
  }
}
```

**Error Responses**:
- `400`: Missing/invalid URL or configuration
- `422`: Empty parse (no meaningful content extracted)
- `502`: External service error

## 🚀 Deployment

### Edge Functions
```bash
# Deploy all functions
npx supabase functions deploy firecrawl-extract --no-verify-jwt
npx supabase functions deploy analyze-product --no-verify-jwt
npx supabase functions deploy extract-supplement --no-verify-jwt
```

### Frontend
```bash
# Build for production
cd expo-app
npx expo build:web

# Deploy to your preferred hosting (Vercel, Netlify, etc.)
```

## 🔑 Environment Variables

### Required for Edge Functions
- `FIRECRAWL_API_KEY`: Web scraping service
- `OCRSPACE_API_KEY`: OCR for supplement facts images
- `OPENROUTER_API_KEY`: AI analysis service
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: For database operations

### Required for Frontend
- `EXPO_PUBLIC_SUPABASE_URL`: Public Supabase URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key
- `EXPO_PUBLIC_EXTRACT_FN_URL`: URL extraction function endpoint

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure edge function includes proper CORS headers
2. **400 Errors**: Check API keys are set correctly in Supabase secrets
3. **Empty Parse (422)**: URL may not contain supplement information
4. **Timeout**: Try shorter URLs or check Firecrawl service status

### Debug Commands
```bash
# Check edge function logs
npx supabase functions logs firecrawl-extract

# Test with verbose output
curl -v -X POST "your-url/functions/v1/firecrawl-extract" \
  -H "Content-Type: application/json" \
  -d '{"url":"test-url"}'
```

## 📈 Performance

- **URL Processing**: ~5-15 seconds depending on page complexity
- **OCR Fallback**: +3-8 seconds if needed
- **Database Queries**: <100ms for typical operations
- **AI Analysis**: 2-5 seconds for comprehensive scoring

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Service role key properly isolated in edge functions
- Input validation on all user-provided URLs
- Rate limiting through Supabase built-in protection

## 📊 Monitoring

Track these key metrics:
- URL extraction success rate
- OCR fallback usage
- User engagement with educational tips
- Product scan frequency
- Analysis accuracy feedback

---

Built with ❤️ using Expo, Supabase, and modern web technologies.