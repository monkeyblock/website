# Monkey Block Website

This is the official landing page for the Monkey Block Chrome Extension.

## Setup Instructions

1. **Deploy to GitHub Pages:**
   - Push this folder to a new GitHub repository
   - Go to Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click Save

2. **Custom Domain Setup:**
   - Add your custom domain in the GitHub Pages settings
   - Create a CNAME file with your domain (already included)
   - Update your domain's DNS settings:
     - A Record: 185.199.108.153
     - A Record: 185.199.109.153
     - A Record: 185.199.110.153
     - A Record: 185.199.111.153
     - CNAME Record: [your-username].github.io

3. **SSL Certificate:**
   - GitHub Pages automatically provides SSL
   - Enable "Enforce HTTPS" in settings

## File Structure

```
website/
├── index.html          # Main landing page
├── styles.css          # All styles
├── script.js           # JavaScript functionality
├── CNAME              # Custom domain file
├── robots.txt         # SEO file
├── sitemap.xml        # SEO sitemap
├── images/            # Image assets
├── icons/             # Extension icons
└── media/             # Media files
```

## Maintenance

- Update Chrome Web Store link in HTML when extension is published
- Update meta tags and Open Graph images as needed
- Keep testimonials and stats current
- Test on multiple devices and browsers

## License

© 2024 Monkey Block. All rights reserved.