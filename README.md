This repository is automatically deployed to GitHub Pages using GitHub Actions. The deployment workflow:

- Builds the app on every push to the `main` branch
- Deploys the production build to GitHub Pages
- The app is available at: `https://lonestill.github.io/codemind/`

To enable GitHub Pages manually:
1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The workflow will automatically deploy on the next push to `main`
