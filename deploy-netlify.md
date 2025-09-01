# Deploy SoundMath to Netlify

## Option 1: Drag & Drop (Easiest)

1. **Build the project:**
   ```bash
   NODE_ENV=production npm run build
   ```

2. **Go to Netlify:**
   - Visit: https://app.netlify.com/
   - Sign up/Login with GitHub

3. **Deploy:**
   - Drag the `dist/public` folder to the Netlify dashboard
   - Your site will be live instantly!

## Option 2: Connect GitHub Repository

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Netlify configuration"
   git push
   ```

2. **Connect to Netlify:**
   - Go to: https://app.netlify.com/
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your `Sound-Math` repository

3. **Configure build settings:**
   - Build command: `NODE_ENV=production npm run build`
   - Publish directory: `dist/public`
   - Click "Deploy site"

## Option 3: Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login and deploy:**
   ```bash
   netlify login
   netlify deploy --prod --dir=dist/public
   ```

## Your site will be live at:
`https://your-site-name.netlify.app`

## Features:
- ✅ Automatic deployments on git push
- ✅ Custom domain support
- ✅ HTTPS by default
- ✅ Free hosting
- ✅ Audio-reactive harmonograph included!
