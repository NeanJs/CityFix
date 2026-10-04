# CityFix Backend API Routes

# CityFix API Route Map

## Base URL

**Production**

`https://cityfix-ztj9.onrender.com`

**Local Development**

`http://localhost:5001`

---

# Reports

## Analyze Report

`POST /api/reports/analyze`

Analyzes a citizen's input and generates a structured report draft using AI.

The endpoint accepts **one input at a time**:

- Text
- Image

### Text Input

**Content-Type:** `application/json`

**Body:**

```json
{
  "text": "There's a really large pothole here near the right lane."
}
```

### Image Input

**Content-Type:** `multipart/form-data`

**Field:**

- `file` - Image file

### Returns

```json
{
  "draft": {
    "issue_type": "pothole",
    "title": "Large pothole on paved road",
    "description": "A large pothole is visible on the road surface.",
    "severity": "high",
    "recommended_action": "Dispatch road maintenance crew to repair the pothole.",
    "confidence": 0.99
  }
}
```

> The AI generates a draft only. It does not create or save a report in the database.
> 

---

## Transcribe Voice Report

`POST /api/reports/transcribe`

Converts a citizen's voice recording into text using ElevenLabs speech-to-text.

The returned transcript can then be sent to `/api/reports/analyze` for AI report generation.

### Request

**Content-Type:** `multipart/form-data`

**Field:**

- `file` - Audio file

Supported audio types include:

- `audio/mpeg`
- `audio/wav`
- `audio/mp4`
- `audio/webm`
- `audio/ogg`

### Example

```bash
curl -X POST http://localhost:5001/api/reports/transcribe \
  -F "file=@$HOME/Desktop/audio.mpeg;type=audio/mpeg"
```

### Returns

```json
{
  "transcript": "There's a really large pothole here near the right lane."
}
```

> This endpoint only transcribes the audio. It does not create or save a report.
> 

### Voice Flow

```
Voice Recording
      ↓
POST /api/reports/transcribe
      ↓
ElevenLabs Speech-to-Text
      ↓
Transcript
      ↓
POST /api/reports/analyze
      ↓
Gemini AI Draft
```

---

## Create Report

`POST /api/reports`

Creates and saves an approved citizen report.

The frontend should send this request **after the citizen reviews and approves the AI-generated draft**.

### Body

- `issue_type`
- `title`
- `description`
- `severity`
- `location`
- `recommended_action`
- `transcript` (optional)
- `photo_url` (optional)
- `audio_url` (optional)

### Sample Data

```json
{
  "issue_type": "pothole",
  "title": "Large pothole on Main Street",
  "description": "There is a large pothole near the right lane.",
  "severity": "high",
  "location": {
    "description": "Main Street near 12th Avenue",
    "latitude": 49.261,
    "longitude": -123.113
  },
  "recommended_action": "Inspect and repair the damaged road surface",
  "transcript": "There's a really large pothole here near the right lane.",
  "photo_url": null,
  "audio_url": null
}
```

### Returns

- Created report
- Tracking ID
- Report status

Example:

```json
{
  "report": {
    "id": "8d3c2f91-4c2d-4e8a-a5f7-91c8e21b7d42",
    "tracking_id": "CF-A1B2C3",
    "issue_type": "pothole",
    "title": "Large pothole on Main Street",
    "description": "There is a large pothole near the right lane.",
    "severity": "high",
    "status": "queued",
    "latitude": 49.261,
    "longitude": -123.113,
    "location_description": "Main Street near 12th Avenue",
    "created_at": "2026-10-03T22:30:00.000Z",
    "updated_at": "2026-10-03T22:30:00.000Z"
  }
}
```

---

## Track Report

`GET /api/reports/track/:trackingId`

Gets a report using its public tracking ID.

### Example

```
GET /api/reports/track/CF-A1B2C3
```

### Returns

- Report details
- Current status
- Issue information
- Location
- Created timestamp
- Updated timestamp

### Possible Statuses

- `queued`
- `in_progress`
- `resolved`
- `rejected`

### Sample Response

```json
{
  "report": {
    "id": "8d3c2f91-4c2d-4e8a-a5f7-91c8e21b7d42",
    "tracking_id": "CF-A1B2C3",
    "issue_type": "pothole",
    "title": "Large pothole on Main Street",
    "description": "There is a large pothole near the right lane.",
    "severity": "high",
    "recommended_action": "Inspect and repair the damaged road surface",
    "status": "in_progress",
    "latitude": 49.261,
    "longitude": -123.113,
    "location_description": "Main Street near 12th Avenue",
    "created_at": "2026-10-03T22:30:00.000Z",
    "updated_at": "2026-10-03T23:05:00.000Z"
  }
}
```

---

# Admin

Admin endpoints require a valid Supabase access token.

### Authorization Header

```
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

The frontend should obtain the access token from the authenticated Supabase admin session.

---

## Get All Reports

`GET /api/admin/reports`

Gets all reports for the admin dashboard.

### Returns

A list of reports ordered by newest first.

---

## Get Report by ID

`GET /api/admin/reports/:id`

Gets the full details of a specific report.

### Example

```
GET /api/admin/reports/8d3c2f91-4c2d-4e8a-a5f7-91c8e21b7d42
```

### Returns

- Full report details
- Citizen-provided information
- AI-generated information
- Location
- Media URLs
- Current status
- Timestamps

---

## Update Report Status

`PATCH /api/admin/reports/:id/status`

Updates the status of a report.

### Body

```json
{
  "status": "in_progress"
}
```

### Possible Statuses

- `queued`
- `in_progress`
- `resolved`
- `rejected`

### Example

```
PATCH /api/admin/reports/8d3c2f91-4c2d-4e8a-a5f7-91c8e21b7d42/status
```

### Sample Response

```json
{
  "report": {
    "id": "8d3c2f91-4c2d-4e8a-a5f7-91c8e21b7d42",
    "tracking_id": "CF-A1B2C3",
    "status": "in_progress",
    "updated_at": "2026-10-03T23:05:00.000Z"
  }
}
```

---

# Frontend Report Flow

## Citizen Flow

```
Citizen Input
     ↓
Text / Image / Audio
     ↓
     ├── Text → POST /api/reports/analyze
     │
     ├── Image → POST /api/reports/analyze
     │
     └── Audio → POST /api/reports/transcribe
                         ↓
                    Transcript
                         ↓
                POST /api/reports/analyze
     ↓
AI Draft
     ↓
Citizen Reviews / Edits
     ↓
Get Browser Location
     ↓
POST /api/reports
     ↓
Report Saved
     ↓
Tracking ID Generated
     ↓
Display Tracking ID
     ↓
GET /api/reports/track/:trackingId
```

---

# Admin Flow

```
Admin Login
     ↓
Supabase Authentication
     ↓
Get Access Token
     ↓
GET /api/admin/reports
     ↓
Admin Dashboard
     ↓
Select Report
     ↓
GET /api/admin/reports/:id
     ↓
View Report Details
     ↓
PATCH /api/admin/reports/:id/status
     ↓
Status Updated
     ↓
Citizen Can See Updated Status
```

---

# Endpoint Summary

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Check API status |
| `POST` | `/api/reports/analyze` | Public | Analyze text/image with AI |
| `POST` | `/api/reports/transcribe` | Public | Transcribe voice with ElevenLabs |
| `POST` | `/api/reports` | Public | Create report |
| `GET` | `/api/reports/track/:trackingId` | Public | Track citizen report |
| `GET` | `/api/admin/reports` | Admin | Get all reports |
| `GET` | `/api/admin/reports/:id` | Admin | Get specific report |
| `PATCH` | `/api/admin/reports/:id/status` | Admin | Update report status |

---

# Important Frontend Notes

### Voice

The frontend should upload the recorded audio as `multipart/form-data` using the field name:

```
file
```

Example:

```tsx
const formData = new FormData();

formData.append("file", audioBlob, "recording.webm");

const response = await fetch(
  `${API_URL}/api/reports/transcribe`,
  {
    method: "POST",
    body: formData
  }
);

const data = await response.json();
```

Do **not** manually set the `Content-Type` header when sending `FormData`. The browser will set the correct multipart boundary automatically.

The returned `transcript` should be passed into the existing `/api/reports/analyze` endpoint.

### Location

The frontend should obtain the user's location through the browser's Geolocation API and send:

```json
{
  "latitude": 49.261,
  "longitude": -123.113,
  "description": "Main Street near 12th Avenue"
}
```

The backend stores the coordinates with the report.

### AI Analysis

AI analysis **does not save anything**.

The frontend should treat the returned `draft` as editable data:

```
AI Draft
   ↓
User edits/approves
   ↓
Create Report
```

### Tracking ID

The backend generates the tracking ID when the report is created.

Example:

```
CF-A1B2C3
```

The frontend should display this to the citizen and use it for the tracking page.

### Admin Authentication

Only the admin frontend needs Supabase authentication.

Citizen reporting and tracking remain public.

### Admin Status Updates

When an admin changes a report's status, the citizen can see the updated status through:

```
GET /api/reports/track/:trackingId
```