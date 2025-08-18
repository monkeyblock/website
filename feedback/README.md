# Monkey Block - Uninstall Feedback System

## Übersicht

Das Uninstall Feedback System sammelt strukturiertes Feedback von Nutzern bei der Deinstallation der Extension. Es nutzt **Amplitude Analytics** für detailliertes Tracking und **Web3Forms** für E-Mail-Benachrichtigungen.

## Technische Implementierung

### 1. Extension Integration (background-unified.js)

Die Extension setzt beim Start und bei Installation die Uninstall-URL mit wichtigen Tracking-Parametern:

```javascript
// Function to update uninstall URL with tracking data
async function updateUninstallURL() {
  const data = await chrome.storage.local.get(['installDate', 'mb_amplitude_user_id', 'mb_amplitude_device_id']);
  
  let url = `https://monkeyblock.github.io/feedback/?v=${version}&install_date=${encodedDate}&ext_id=${extensionId}`;
  
  // Add user tracking IDs for Amplitude continuity
  if (data.mb_amplitude_user_id) {
    url += `&uid=${encodeURIComponent(data.mb_amplitude_user_id)}`;
  }
  if (data.mb_amplitude_device_id) {
    url += `&did=${encodeURIComponent(data.mb_amplitude_device_id)}`;
  }
  
  chrome.runtime.setUninstallURL(url);
}
```

### 2. Feedback-Seite Komponenten

- **index.html**: Two-Step UI mit Quick-Feedback Option
- **feedback.js**: Haupt-Logik mit Event Tracking
- **amplitude-feedback.js**: Amplitude Analytics Integration
- **media/**: Monkey-Grafiken für emotionale Verbindung

### 3. Amplitude Analytics Events

Alle Events nutzen "Uninstall -" Prefix für klare Kategorisierung:

| Event Name | Beschreibung | Key Properties |
|------------|--------------|----------------|
| `Uninstall - Feedback Opened` | Seite wurde geladen | install_date, days_used |
| `Uninstall - Reason - Missing Feature` | Feature fehlt | reason, step |
| `Uninstall - Reason - Complicated` | Zu kompliziert | reason, step |
| `Uninstall - Reason - Tech Issue` | Technische Probleme | reason, step |
| `Uninstall - Reason - Better App` | Bessere Alternative | reason, step |
| `Uninstall - Reason - Something Else` | Anderer Grund | reason, step |
| `Uninstall - Reason - Quick Submitted` | Quick-Input ausgefüllt | input_text, input_type |
| `Uninstall - Feedback Input Skipped` | Input übersprungen | skipped_field |
| `Uninstall - Feedback Step 2` | Detailformular geöffnet | has_missing_feature, has_technical_issue |
| `Uninstall - Abandonment Step 2` | Text eingegeben aber nicht gesendet | abandoned_text, text_length |
| `Uninstall - Feedback Submitted` | Erfolgreich abgeschickt | detailed_feedback, has_email |
| `Extension Uninstalled` | Finale Deinstallation | uninstall_reason, days_until_uninstall |

### 4. User Journey Tracking

Die User ID und Device ID werden über URL-Parameter übergeben, wodurch alle Uninstall-Events dem bestehenden Amplitude User Profile zugeordnet werden:

```
https://monkeyblock.github.io/feedback/
  ?v=3.1.4                              // Extension Version
  &install_date=2025-01-01T10:00:00Z   // Installation Date
  &ext_id=EXTENSION_ID                  // For Message Passing
  &uid=user_a1b2c3d4_1234567890        // Amplitude User ID
  &did=device_1234567890_abc           // Amplitude Device ID
```

### 5. Web3Forms Integration

Feedback wird zusätzlich per E-Mail versendet:

```javascript
const WEB3FORMS_ACCESS_KEY = '533613f5-b3b1-4ca4-9240-dda0a4087686';

// Sendet strukturiertes Feedback
await fetch('https://api.web3forms.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: 'Monkey Block - Complete Uninstall Feedback',
    reason: selectedReason,
    missing_feature: missingFeature,
    detailed_feedback: feedbackText,
    user_email: userEmail,
    version: extensionVersion
  })
});
```

## Features

### Two-Step Feedback Process
1. **Step 1**: Quick reason selection mit optionalen Input-Feldern
2. **Step 2**: Detailliertes Feedback und E-Mail (optional)

### Abandonment Tracking
- Automatisches Speichern von Drafts
- Tracking von unvollständigen Feedbacks
- Abandoned Text wird in Amplitude gespeichert

### Smart User Identification
1. **Priorität 1**: User/Device ID aus URL-Parametern
2. **Priorität 2**: Extension Message Passing (falls noch installiert)
3. **Priorität 3**: Browser Fingerprint für Konsistenz

## Deployment

### GitHub Pages Hosting

Die Feedback-Seite wird auf GitHub Pages gehostet:
- Repository: https://github.com/monkeyblock/feedback
- Live URL: https://monkeyblock.github.io/feedback/

### Deployment Script

```bash
#!/bin/bash
# Upload latest version to GitHub Pages

cd ~/Desktop
rm -rf feedback-deploy
git clone https://github.com/monkeyblock/feedback.git feedback-deploy
cd feedback-deploy

# Copy current files
cp /Users/samialtunsaray/CODING/focus-timer-extension/website/feedback/index.html .
cp /Users/samialtunsaray/CODING/focus-timer-extension/website/feedback/feedback.js .
cp /Users/samialtunsaray/CODING/focus-timer-extension/website/feedback/amplitude-feedback.js .
cp -r /Users/samialtunsaray/CODING/focus-timer-extension/website/feedback/media .

# Create .nojekyll for GitHub Pages
touch .nojekyll

# Deploy
git add .
git commit -m "Update feedback form with latest Amplitude tracking"
git push origin main

echo "✅ Deployed to: https://monkeyblock.github.io/feedback/"
```

## Amplitude Dashboard Analyse

### Key Metrics
- **Feedback Completion Rate**: Wie viele User komplettieren das Feedback?
- **Quick Submit Rate**: Wie viele geben Details in Step 1 ein?
- **Abandonment Rate**: Wie viele brechen in Step 2 ab?
- **Average Days Until Churn**: Nach wie vielen Tagen deinstallieren User?

### Funnel Analysis
```
Uninstall - Feedback Opened
    ↓ (Reason Selection)
Uninstall - Reason - [Type]
    ↓ (Quick Input)
Uninstall - Reason - Quick Submitted
    ↓ (Step 2)
Uninstall - Feedback Step 2
    ↓ (Submit)
Uninstall - Feedback Submitted
```

### User Segmentation
- **By Churn Reason**: Missing Feature vs Tech Issue vs Better App
- **By Usage Duration**: <1 Tag, 1-7 Tage, 7-30 Tage, >30 Tage  
- **By Feedback Quality**: Mit/ohne Details, Mit/ohne E-Mail
- **By Abandonment**: Completed vs Abandoned mit Text

## Datenschutz & Compliance

- Keine personenbezogenen Daten ohne Einwilligung
- E-Mail nur bei expliziter Eingabe
- Anonymisierte User IDs (keine echten Namen)
- GDPR-konform durch Opt-in Design
- Transparente Datennutzung

## Wartung & Updates

### Bei Änderungen an Events
1. Update `feedback.js` mit neuen Event-Namen
2. Update `AMPLITUDE_EVENTS.md` Dokumentation
3. Deploy zu GitHub Pages
4. Teste mit echter Deinstallation

### Bei Extension Updates
- Die `updateUninstallURL()` Funktion läuft bei jedem Start
- URL-Parameter werden automatisch aktualisiert
- Keine manuellen Änderungen nötig

## Kontakt & Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/monkeyblock/feedback/issues
- Amplitude Dashboard: https://analytics.amplitude.com
- Web3Forms Dashboard: https://web3forms.com/dashboard
