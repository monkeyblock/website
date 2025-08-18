#!/bin/bash
# Deploy Monkey Block Feedback to GitHub Pages
# Usage: ./deploy.sh

echo "🐵 Deploying Monkey Block Feedback Form..."
echo "================================================"

# Configuration
SOURCE_DIR="/Users/samialtunsaray/CODING/focus-timer-extension/website/feedback"
GITHUB_REPO="https://github.com/monkeyblock/feedback.git"
DEPLOY_DIR="/tmp/feedback-deploy-$(date +%s)"

# Check if source files exist
if [ ! -f "$SOURCE_DIR/index.html" ]; then
    echo "❌ Error: index.html not found in $SOURCE_DIR"
    exit 1
fi

# Clone repository
echo "📥 Cloning repository..."
git clone "$GITHUB_REPO" "$DEPLOY_DIR" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Error: Could not clone repository"
    echo "Make sure you have access to: $GITHUB_REPO"
    exit 1
fi

cd "$DEPLOY_DIR"

# Copy production files
echo "📁 Copying production files..."
cp "$SOURCE_DIR/index.html" .
cp "$SOURCE_DIR/feedback.js" .
cp "$SOURCE_DIR/amplitude-feedback.js" .

# Copy media folder if exists
if [ -d "$SOURCE_DIR/media" ]; then
    echo "🖼️  Copying media folder..."
    rm -rf media
    cp -r "$SOURCE_DIR/media" .
fi

# Copy documentation
cp "$SOURCE_DIR/AMPLITUDE_EVENTS.md" .

# Ensure .nojekyll exists for GitHub Pages
touch .nojekyll

# Git operations
echo "📤 Pushing to GitHub..."
git add .

# Create meaningful commit message
COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M')"
if [ -n "$1" ]; then
    COMMIT_MSG="$COMMIT_MSG - $1"
else
    COMMIT_MSG="$COMMIT_MSG - Feedback form update"
fi

git commit -m "$COMMIT_MSG"
git push origin main

# Check if push was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "================================================"
    echo "🔗 Live URL: https://monkeyblock.github.io/feedback/"
    echo "⏱️  Changes will be live in ~2 minutes"
    echo ""
    echo "📊 Test the deployment:"
    echo "1. Open Chrome DevTools Console"
    echo "2. Check for Amplitude events"
    echo "3. Verify all form interactions work"
else
    echo "❌ Error: Push to GitHub failed"
    echo "Check your git credentials and repository access"
fi

# Cleanup
cd /
rm -rf "$DEPLOY_DIR"

echo "🧹 Cleanup complete"
