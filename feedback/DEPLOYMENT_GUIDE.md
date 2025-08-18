# Testing & Deployment Guide

## 🧪 Lokales Testing

### 1. Extension Setup für Test

```javascript
// In background-unified.js temporär für lokalen Test
chrome.runtime.setUninstallURL(
  'http://localhost:8000/?v=' + version + '&uid=' + userId + '&did=' + deviceId
);
```

### 2. Lokalen Server starten

```bash
# Im website/feedback Ordner
cd /Users/samialtunsaray/CODING/focus-timer-extension/website/feedback

# Mit Python
python3 -m http.server 8000

# Oder mit Node.js
npx serve .

# Öffne: http://localhost:8000/
```

### 3. Test-Szenarien

#### Vollständiger Flow Test
1. Extension installieren
2. Extension deinstallieren (chrome://extensions/ → Remove)
3. Feedback-Seite sollte sich öffnen
4. Grund auswählen
5. Quick-Input testen (sollte "Quick Submitted" Event tracken)
6. Step 2 öffnen
7. Text eingeben und absenden
8. Amplitude Dashboard prüfen

#### Abandonment Test
1. Feedback-Seite öffnen
2. Grund auswählen
3. In Step 2 Text eingeben
4. Tab schließen OHNE zu submitten
5. "Abandonment Step 2" Event in Amplitude prüfen

#### URL Parameter Test
```
http://localhost:8000/
  ?v=3.1.4
  &install_date=2025-01-01T10:00:00Z
  &uid=user_test_123456
  &did=device_test_789
```

## 🚀 Production Deployment

### 1. GitHub Pages Setup (Einmalig)

```bash
# Repository erstellen
# Gehe zu: https://github.com/new
# Name: feedback (unter monkeyblock Organisation)
# Public, mit README

# Clone und initial setup
git clone https://github.com/monkeyblock/feedback.git
cd feedback

# Wichtig: .nojekyll Datei erstellen
touch .nojekyll

# GitHub Pages aktivieren
# Settings → Pages → Source: main branch → Save
```

### 2. Deploy Script

Erstelle `deploy.sh` im website/feedback Ordner:

```bash
#!/bin/bash
# Deploy Feedback Form to GitHub Pages

echo "🐵 Deploying Monkey Block Feedback..."

# Variables
SOURCE_DIR="/Users/samialtunsaray/CODING/focus-timer-extension/website/feedback"
DEPLOY_DIR="/tmp/feedback-deploy-$(date +%s)"

# Clone repository
git clone https://github.com/monkeyblock/feedback.git "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Copy files
echo "📁 Copying files..."
cp "$SOURCE_DIR/index.html" .
cp "$SOURCE_DIR/feedback.js" .
cp "$SOURCE_DIR/amplitude-feedback.js" .
cp -r "$SOURCE_DIR/media" .

# Ensure .nojekyll exists
touch .nojekyll

# Git operations
git add .
git commit -m "Update: $(date '+%Y-%m-%d %H:%M') - Amplitude tracking improvements"
git push origin main

# Cleanup
cd /
rm -rf "$DEPLOY_DIR"

echo "✅ Deployed successfully!"
echo "🔗 Live at: https://monkeyblock.github.io/feedback/"
echo "⏱️  Changes will be live in ~2 minutes"
```

### 3. Extension Release Checklist

Vor jedem Extension Release:

- [ ] Amplitude API Key korrekt in `amplitude-feedback.js`
- [ ] Web3Forms Access Key korrekt in `two-step-feedback.js`
- [ ] Uninstall URL in `background-unified.js` zeigt auf Production
- [ ] Alle Events in Amplitude Dashboard angelegt
- [ ] Test mit echter Deinstallation durchgeführt

## 📊 Amplitude Verification

### Dashboard Setup

1. **Create Event Types** (in Amplitude):
   - Alle "Uninstall -" Events anlegen
   - Event Properties definieren
   - User Properties für Churn markieren

2. **Create Charts**:
   ```
   - Uninstall Reasons (Pie Chart)
   - Days Until Uninstall (Histogram)
   - Feedback Completion Funnel
   - Quick Submit Rate Over Time
   - Abandonment Analysis
   ```

3. **Create Cohorts**:
   - Quick Churners (<1 Tag)
   - Week One Churners (1-7 Tage)
   - Established Users (>30 Tage)
   - Feature Requesters (Missing Feature)
   - Technical Issues Users

### Event Testing

Test ob Events ankommen:

```javascript
// Browser Console auf Feedback-Seite
amplitudeTracker.track('Test Event', { test: true });

// Check in Amplitude:
// Events → User Lookup → Search by User ID
```

## 🐛 Debugging

### Häufige Probleme

#### Events kommen nicht in Amplitude an
- Check API Key in `amplitude-feedback.js`
- Check Browser Console für Fehler
- Verify User ID wird korrekt übergeben
- Test mit direktem API Call

#### Feedback-Seite öffnet sich nicht
- Check chrome://extensions → Inspect Service Worker
- Verify `setUninstallURL` wird aufgerufen
- Check URL Parameter Encoding

#### User ID Mismatch
- Verify URL Parameter `uid` und `did`
- Check Extension Message Handler
- Test Fingerprint Fallback

### Debug Mode

Aktiviere Debug Logs:

```javascript
// In amplitude-feedback.js
async init() {
  const DEBUG = true; // Set to true for debugging
  
  if (DEBUG) {
    console.log('[Amplitude Debug] URL Params:', 
      Object.fromEntries(new URLSearchParams(window.location.search)));
    console.log('[Amplitude Debug] User ID:', this.userId);
    console.log('[Amplitude Debug] Device ID:', this.deviceId);
  }
}
```

## 📝 Maintenance Tasks

### Wöchentlich
- [ ] Check Amplitude Dashboard für neue Insights
- [ ] Review Abandonment Events für UX-Probleme
- [ ] Analyse Top Uninstall Reasons

### Monatlich
- [ ] Export Feedback-Daten für Deep Analysis
- [ ] Update AMPLITUDE_EVENTS.md bei Änderungen
- [ ] Review Web3Forms E-Mails

### Bei Extension Updates
- [ ] Test Uninstall Flow mit neuer Version
- [ ] Verify URL Parameter werden korrekt gesetzt
- [ ] Check Event Tracking funktioniert

## 🔐 Security & Privacy

### Datenschutz-Checkliste
- [ ] Keine PII (Personally Identifiable Information) in Events
- [ ] E-Mail nur bei explizitem Opt-in
- [ ] User IDs sind anonymisiert (Hashes)
- [ ] SSL/HTTPS für alle Requests
- [ ] GDPR-konforme Datenverarbeitung

### API Keys Management
- Web3Forms Key: Nur für E-Mail-Versand
- Amplitude Key: Public Key, safe im Frontend
- Keine sensitiven Keys im Code

## 📚 Weitere Ressourcen

- [Amplitude HTTP API Docs](https://www.docs.developers.amplitude.com/analytics/apis/http-v2/)
- [Web3Forms Documentation](https://docs.web3forms.com/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Chrome Extension Uninstall URL](https://developer.chrome.com/docs/extensions/reference/runtime/#method-setUninstallURL)
