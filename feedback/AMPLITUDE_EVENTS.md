# Amplitude Events Übersicht - Uninstall Feedback

## Event Namen und Properties

### 1. **Uninstall - Feedback Opened**
Wird getrackt wenn die Feedback-Seite geladen wird.

**Properties:**
- `source`: 'uninstall'
- `page_type`: 'two_step_feedback'
- `install_date`: Installations-Datum (aus URL)
- `days_used`: Anzahl Tage seit Installation
- `time_since_install_minutes`: Zeit seit Installation in Minuten (für schnelle Deinstallationen)
- `time_since_install_hours`: Zeit seit Installation in Stunden
- `time_since_install_ms`: Zeit seit Installation in Millisekunden (für präzise Analysen)
- `time_since_install_formatted`: Menschenlesbare Zeit (z.B. "2 hours 30 minutes")
- `uninstall_date`: Aktuelles Datum
- `extension_version`: Version der Extension
- `install_date_source`: Quelle des Installationsdatums (url_parameter, extension_message, user_id_timestamp, fallback_estimate)

---

### 2. **Uninstall - Reason - [Type]**
Wird getrackt wenn ein Grund ausgewählt wird. Spezifische Events:
- `Uninstall - Reason - Missing Feature`
- `Uninstall - Reason - Complicated`
- `Uninstall - Reason - Tech Issue`
- `Uninstall - Reason - Better App`
- `Uninstall - Reason - Something Else`

**Properties:**
- `reason`: Der ausgewählte Grund (z.B. 'missing-feature')
- `step`: 1

---

### 3. **Uninstall - Reason - Quick Submitted**
Wird getrackt wenn der User Text in die Quick-Input-Felder eingibt (Missing Feature, Tech Issue, Something Else).

**Properties:**
- `reason`: Der Hauptgrund
- `input_type`: 'feature' | 'issue' | 'other'
- `input_text`: Der eingegebene Text
- `input_length`: Länge des Textes

---

### 4. **Uninstall - Feedback Input Skipped**
Wird getrackt wenn der "Skip" Button geklickt wird.

**Properties:**
- `reason`: Der ausgewählte Grund
- `skipped_field`: 'feature' | 'issue' | 'other' | 'none'

---

### 5. **Uninstall - Feedback Step 2**
Wird getrackt wenn Step 2 (Detailformular) geöffnet wird.

**Properties:**
- `reason`: Der ausgewählte Grund
- `has_missing_feature`: Boolean
- `has_technical_issue`: Boolean
- `has_other_reason`: Boolean

---

### 6. **Uninstall - Abandonment Step 2**
Wird getrackt wenn der User Text in Step 2 eingibt aber die Seite verlässt ohne zu submitten.

**Properties:**
- `reason`: Der ausgewählte Grund
- `abandoned_text`: Der eingegebene Text im Textarea
- `text_length`: Länge des Textes
- `has_email`: Boolean (ob Email eingegeben wurde)

---

### 7. **Uninstall - Feedback Submitted**
Wird getrackt wenn das Feedback erfolgreich abgeschickt wurde.

**Properties:**
- `reason`: Der ausgewählte Grund
- `has_detailed_feedback`: Boolean
- `has_email`: Boolean
- `feedback_length`: Länge des Detail-Feedbacks
- `detailed_feedback`: Der komplette Feedback-Text

---

### 8. **Extension Uninstalled**
Hauptevent für die Deinstallation mit allen Details.

**Properties:**
- `uninstall_reason`: Der Hauptgrund
- `days_until_uninstall`: Tage zwischen Installation und Deinstallation
- `missing_feature`: Text aus Missing Feature Input (oder null)
- `technical_issue`: Text aus Tech Issue Input (oder null)
- `other_reason`: Text aus Other Reason Input (oder null)
- `detailed_feedback`: Text aus Step 2 Textarea (oder null)
- `has_email`: Boolean

---

## User Properties (werden gesetzt bei Uninstall)

- `churned`: true
- `churn_date`: ISO Datum der Deinstallation
- `churn_reason`: Der Hauptgrund
- `lifetime_days`: Gesamte Nutzungsdauer in Tagen

---

## User Journey Tracking

Durch die Übergabe der User ID und Device ID in der URL werden alle Events dem bestehenden User Profile zugeordnet:

```
https://monkeyblock.github.io/feedback/two-step-feedback.html
  ?v=3.1.4
  &install_date=2025-01-01T10:00:00Z
  &ext_id=EXTENSION_ID
  &uid=user_a1b2c3d4_1234567890     // User ID aus Extension
  &did=device_1234567890_abc        // Device ID aus Extension
```

Dies ermöglicht eine lückenlose Analyse:
1. **Pre-Uninstall Behavior**: Was hat der User vor der Deinstallation gemacht?
2. **Churn Reason**: Warum hat er deinstalliert?
3. **Feedback Quality**: Wie detailliert ist das Feedback?
4. **Abandonment Rate**: Wie viele brechen das Feedback ab?

---

## Amplitude Dashboard Queries

### Wichtige Funnels:
1. `Uninstall - Feedback Opened` → `Uninstall - Reason - *` → `Uninstall - Feedback Step 2` → `Uninstall - Feedback Submitted`

### Segmentierungen:
- By Reason (Missing Feature vs Tech Issue vs Better App)
- By Days Used (<1 Tag, 1-7 Tage, 7-30 Tage, >30 Tage)
- By Quick Submit (haben sie Details eingegeben?)
- By Abandonment (Step 2 Text aber kein Submit)

### Key Metrics:
- **Feedback Completion Rate**: Submitted / Opened
- **Quick Submit Rate**: Quick Submitted / Reason Selected
- **Step 2 Abandonment Rate**: Abandonment Step 2 / Step 2 Started
- **Average Days Until Churn**: Durchschnitt von days_until_uninstall
