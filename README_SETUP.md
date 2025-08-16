# SupplementIQ - AI-Powered Supplement Intelligence Platform

Stop wasting money on junk supplements. Get AI-powered analysis, personalized recommendations, and find better alternatives.

## 🚀 Features

- **Barcode Scanning**: Instantly scan supplement barcodes for comprehensive analysis
- **AI-Powered Scoring**: Get scores for Purity, Efficacy, Safety, and Value (0-100)
- **Personalized Recommendations**: Based on your goals, budget, and preferences
- **Scientific Validation**: PubMed integration for evidence-based insights
- **Smart Alternatives**: Find better products that save you money
- **Supplement Stack Management**: Track what you're taking and optimize your routine

## 📱 Screenshots

The app features:
- Beautiful animated score displays with A+ to F grades
- Comprehensive onboarding for personalization
- Clean, modern UI with smooth transitions
- Detailed product analysis with warnings and recommendations

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **AI/ML**: OpenRouter (GPT-4/Claude)
- **APIs**: 
  - Firecrawl (web scraping)
  - OCR.space (label extraction)
  - PubMed API (scientific validation)
  - UPC Database (barcode lookup)

## 📋 Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account
- API keys for external services

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
cd Suppclaude
npm install -g expo-cli
cd expo-app
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migration:
   ```bash
   cd supabase
   supabase link --project-ref your-project-ref
   supabase db push
   ```

3. Deploy Edge Functions:
   ```bash
   supabase functions deploy extract-supplement
   supabase functions deploy analyze-product
   ```

4. Set Edge Function environment variables in Supabase dashboard:
   - `FIRECRAWL_API_KEY`
   - `OCR_SPACE_API_KEY`
   - `OPENROUTER_API_KEY`
   - `PUBMED_API_KEY` (optional)

### 3. Configure Environment

1. Copy `.env.example` to `.env` in expo-app:
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### 4. API Keys Setup

1. **Firecrawl**: Get API key from [firecrawl.dev](https://firecrawl.dev)
2. **OCR.space**: Get free API key from [ocr.space](https://ocr.space/ocrapi)
3. **OpenRouter**: Get API key from [openrouter.ai](https://openrouter.ai)
4. **UPC Database**: Get API key from [upcdatabase.com](https://upcdatabase.com)

### 5. Run the App

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📊 Database Schema

The app uses these main tables:
- `profiles`: User demographics, goals, and preferences
- `products`: Supplement data with AI analysis scores
- `user_products`: Scan history and user's supplement stack
- `product_alternatives`: Better product recommendations
- `ingredients`: Ingredient safety and efficacy database

## 🔑 Key Features Implementation

### Barcode Scanning
- Uses `expo-camera` and `expo-barcode-scanner`
- Fallback to manual entry via product name or URL
- Real-time product lookup and analysis

### AI Analysis Engine
- Calculates 4 sub-scores: Purity, Efficacy, Safety, Value
- Penalizes proprietary blends and underdosed ingredients
- Validates claims against PubMed studies
- Generates personalized insights based on user goals

### Personalization
- 5-step onboarding captures user profile
- Goals: muscle gain, fat loss, energy, sleep, etc.
- Preferences: avoid ingredients, price sensitivity
- Current stack audit for optimization

### Alternative Recommendations
- Finds products with higher scores in same category
- Filters based on user's avoided ingredients
- Calculates potential monthly savings
- Shows improvement areas and benefits

## 💰 Monetization

- **Free Tier**: 10 scans/month, basic scores
- **Premium**: $9.99/month for unlimited scans, alternatives, AI coach
- **Affiliate**: Amazon, iHerb, Vitacost links
- **B2B**: Clinic partnerships for patient recommendations

## 🚀 Deployment

### Expo/React Native
```bash
# Build for production
expo build:ios
expo build:android

# Publish OTA updates
expo publish
```

### Supabase
- Database and Edge Functions auto-deploy on push
- Monitor usage in Supabase dashboard
- Scale as needed

## 📈 Success Metrics

- Onboarding completion: >70%
- D7 retention: >40%
- Scans per user per week: >3
- Premium conversion: >5%
- Average user savings: >$30/month

## 🤝 Contributing

This is a production-ready implementation. Key areas for enhancement:
- More supplement categories
- Expanded ingredient database
- Integration with more retailers
- Social features (share stacks)
- Wearable integration for tracking effects

## 📝 License

Proprietary - All rights reserved

---

Built with ❤️ to help people stop wasting money on ineffective supplements.
