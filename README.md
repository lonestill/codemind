<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CodeMind AI - Snippet Manager

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

An AI-powered code snippet manager built with Angular and Google Gemini AI.

## 🌐 Live Demo

**GitHub Pages:** [View Live App](https://lonestill.github.io/codemind/)

**AI Studio:** [View in AI Studio](https://ai.studio/apps/drive/1Rz6EuBAgXL4-v9PWRgrv4szro9awNe1C)

## 🚀 Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

## 📦 Build for Production

```bash
npm run build
```

## 🚢 GitHub Pages Deployment

This repository is automatically deployed to GitHub Pages using GitHub Actions. The deployment workflow:

- Builds the app on every push to the `main` branch
- Deploys the production build to GitHub Pages
- The app is available at: `https://lonestill.github.io/codemind/`

To enable GitHub Pages manually:
1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The workflow will automatically deploy on the next push to `main`
