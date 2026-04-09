# STYLE. — Lisa's Personal Stylist

AI-powered personal styling app. 3 looks per outfit, colour analysis for your skin tone, product photos you can shop. Free to run.

## Cost: FREE

- **Gemini API**: Free tier = 15 requests/minute, 1,500/day. More than enough.
- **Vercel**: Free tier = unlimited for personal projects
- **GitHub**: Free

## Deploy in 5 Minutes

### 1. Get your FREE Gemini API key

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account  
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

That's it. No credit card. No payment. Completely free.

### 2. Push to GitHub

Download and unzip this project, then in your terminal:

```bash
cd lisa-stylist
git init
git add .
git commit -m "Lisa's stylist app"
```

Go to **https://github.com/new**, create a repo called `lisa-stylist`, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/lisa-stylist.git
git branch -M main
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to **https://vercel.com** and sign in with GitHub
2. Click **"Add New Project"**
3. Import `lisa-stylist`
4. Under **Environment Variables**, add:
   - Name: `GEMINI_API_KEY`
   - Value: paste your `AIza...` key
5. Click **Deploy**

Your app will be live at `https://lisa-stylist.vercel.app`

### 4. Add to your phone home screen

On your iPhone, open the URL in Safari → tap Share → "Add to Home Screen". It'll look and feel like a real app.

## What It Does

- You describe an outfit → AI gives you 3 complete styled looks
- Each look includes footwear, bag, jewelry, outerwear, and a finishing touch
- Product photos pulled from real retailers with shop links
- Colour analysis for your deep warm melanin skin tone
- Petite styling tips for your 5'2" pear/hourglass frame
- References your actual jacket collection for outerwear
- Live Dublin weather factored into every recommendation

## Tech

- Next.js 14 (React)
- Google Gemini 2.0 Flash (free AI, with Google Search for products)
- Open-Meteo (free weather)
- Vercel (free hosting)
