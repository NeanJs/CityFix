# 🏙️ OpenBlock

### A voice-first civic reporting platform that turns everyday city issues into actionable service requests.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-open--block.tech-000000?style=for-the-badge)](https://open-block.tech/)
[![GitHub](https://img.shields.io/badge/GitHub-OpenBlock-181717?style=for-the-badge\&logo=github)](https://github.com/NeanJs/OpenBlock)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-YouTube-FF0000?style=for-the-badge\&logo=youtube\&logoColor=white)](https://youtu.be/fvUpdfLLd7Y)
[![Presentation](https://img.shields.io/badge/Presentation-Google%20Slides-4285F4?style=for-the-badge\&logo=google-slides\&logoColor=white)](https://docs.google.com/presentation/d/e/2PACX-1vR89BBHoRsEkXe2X9KrSuXWrmYP3eO53HZ-SPGxe7x6rwYsSClfDpbi7kHBLQfYyU5S0YEU9gPxhzQ-/pub?start=false&loop=false&delayms=60000)

> **Photo + Voice → AI → Service Request → City Dashboard**

---

## 🚀 What is OpenBlock?

City issues are everywhere.

Potholes. Overflowing garbage bins. Broken streetlights. Damaged sidewalks.

Reporting them, however, is often slow, fragmented, and opaque.

**OpenBlock** is a civic reporting platform designed to make that process dramatically simpler.

Residents can capture a problem with a **photo and short voice note**, while OpenBlock uses AI to turn that raw input into a structured service request that city teams can actually work with.

The result is a simple civic inbox connecting:

**Residents → AI Processing → Structured Tickets → City Teams**

---

## 🎥 Project Demo

<a href="https://youtu.be/fvUpdfLLd7Y">
  <img src="https://img.youtube.com/vi/fvUpdfLLd7Y/maxresdefault.jpg" alt="OpenBlock Demo" width="800">
</a>

**▶️ [Watch the OpenBlock Demo on YouTube](https://youtu.be/fvUpdfLLd7Y)**

---

## ✨ The Experience

### 👤 For Residents

OpenBlock keeps reporting friction to a minimum.

1. 📸 **Capture** a photo of the issue
2. 🎙️ **Describe** it with a short voice note
3. 🤖 **Review** the AI-generated information
4. ✅ **Confirm** the report
5. 🎫 **Receive** a tracking code

The entire process is designed to take **less than 30 seconds**.

### 🏛️ For City Teams

City staff receive structured service requests containing:

* Tracking code
* Issue category
* Priority
* Description
* Location
* Address
* Photo/media
* Current status
* Timestamps

Requests can then be viewed through:

**Table View** → Recent service requests

**Kanban View** → Reported → Triaged → In Progress → Resolved

---

## 🧠 How It Works

```text
┌──────────────────────┐
│       Resident       │
│                      │
│   📸 Photo           │
│   🎙️ Voice Note      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      AI Pipeline     │
│                      │
│  Gemini              │
│  • Transcription     │
│  • Classification    │
│  • Priority          │
│  • Summary           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   ServiceRequest     │
│                      │
│  Category            │
│  Priority            │
│  Location            │
│  Description         │
│  Media               │
│  Status              │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    City Dashboard    │
│                      │
│  📋 Table             │
│  📌 Kanban            │
│  🗺️ Location          │
│  📊 Workflow          │
└──────────────────────┘
```

---

## 🛠️ How We Built It

### Frontend

A mobile-first web experience designed around fast reporting.

Residents can:

* Upload photos
* Record voice notes
* Review AI-generated information
* Confirm reports
* Receive tracking IDs

### Backend

OpenBlock uses a REST API centered around a single `ServiceRequest` model.

```text
ServiceRequest
├── trackingCode
├── createdAt
├── updatedAt
├── category
├── priority
├── description
├── location
├── address
├── mediaUrls
└── status
```

This shared model allows both the resident-facing application and city dashboard to work from the same structured data.

### 🤖 AI Pipeline

OpenBlock uses **Google Gemini** to process resident submissions.

Gemini handles:

* Voice transcription
* Issue classification
* Priority inference
* Short descriptions
* Image + transcript analysis

This transforms unstructured citizen input into structured civic data.

### 🎙️ Voice Layer

**ElevenLabs** can generate natural confirmation messages such as:

> "Your report CFX-2026-0007 has been logged for the Streets team."

### 📊 City Dashboard

Staff receive a lightweight dashboard with:

* Recent requests
* Table view
* Kanban workflow
* Request details
* Photos
* Maps
* Status
* Priority
* Routing information

---

## 🧩 Tech Stack

| Layer    | Technology                     |
| -------- | ------------------------------ |
| Frontend | Vue.js + TypeScript            |
| Backend  | Node.js + Express.js           |
| API      | REST                           |
| Database | PostgreSQL                     |
| AI       | Google Gemini                  |
| Voice    | ElevenLabs                     |
| Location | GPS / Maps                     |
| UX       | Mobile-first responsive design |

---

## 🎯 Why OpenBlock?

Traditional reporting systems often create friction at the exact moment a resident wants to report something.

Long forms.

Too many categories.

Unclear departments.

No immediate feedback.

OpenBlock takes a different approach:

> **Let people explain the problem naturally. Let technology structure it.**

The resident doesn't need to know which department handles a broken streetlight.

They just need to point their phone at it and explain what's wrong.

---

## 🏆 What We're Proud Of

### End-to-End Prototype

We turned a vague "smart 311" concept into a working flow:

**Resident Input → AI Enrichment → Structured Ticket → Live Dashboard**

### Realistic Data Model

Instead of building a toy reporting system, we designed a `ServiceRequest` model capable of mapping Vancouver-style 3-1-1 requests to departments and routing rules.

### Low-Friction UX

The reporting flow focuses on:

**Photo + Voice + Confirm**

rather than forcing residents through complicated forms.

### Civic Impact

OpenBlock is designed around:

* Sustainable cities
* Transparent public services
* Strong institutions
* Citizen participation
* Faster issue triage

---

## 🧱 Challenges

<details>
<summary><strong>⏱️ Scoping a 24-hour build</strong></summary>

It was tempting to support every possible city issue and feature.

We eventually focused on one golden path:

**Photo + Voice → Structured Ticket → Dashboard**

Everything else became a potential version-two feature.

</details>

<details>
<summary><strong>🏙️ Modeling real city systems</strong></summary>

Mapping Vancouver-style 3-1-1 request types and departments into a single `ServiceRequest` schema required balancing realism with the constraints of a 24-hour prototype.

</details>

<details>
<summary><strong>🤖 AI reliability</strong></summary>

Real-world descriptions are messy.

Getting Gemini to consistently classify issues, infer priority, and generate useful summaries required several prompt and schema iterations.

</details>

<details>
<summary><strong>📡 Demo resilience</strong></summary>

API limits, model latency, and unreliable Wi-Fi were all concerns during a live demonstration.

We built seeded demo data and fallbacks into the dashboard to keep the experience reliable.

</details>

---

## 💡 What We Learned

### Feedback loops matter

In civic technology, responsiveness isn't just about processing requests quickly.

People also need to know **what happened after they reported something**.

### Good data models unlock features

A well-designed `ServiceRequest` model creates a foundation for:

* Routing
* Analytics
* Dashboards
* Notifications
* Department integrations
* Status tracking

### Voice + AI reduces friction

Voice-first reporting can make civic services much more accessible, but AI should remain assistive.

The resident gets a confirmation step and retains the ability to review the generated information.

### Hackathons reward focus

A 24-hour build forces you to answer one important question:

> **What is the smallest complete experience that proves the idea?**

For OpenBlock, that was:

**Capture → Understand → Submit → Track**

---

## 🔮 What's Next?

### 🔌 Deeper City Integrations

Connect OpenBlock with existing:

* 311 systems
* Asset management platforms
* Work-order systems
* Department databases

The goal is to make OpenBlock a **plug-in civic inbox**, rather than another isolated system.

### 📈 Richer Analytics

Aggregate ServiceRequest data to identify:

* Issue hotspots
* Recurring problems
* Department trends
* Response times
* Contractor performance

### 🗺️ Smarter Routing

Expand categories across:

* Streets
* Sanitation
* Parks
* Water
* Lighting
* Transportation

Then improve AI-assisted routing from issue → department → contractor.

### 🎫 Resident Status Portal

Residents could enter their tracking code and see:

```text
Reported
   ↓
Triaged
   ↓
Assigned
   ↓
In Progress
   ↓
Resolved
```

### 🏙️ Real-World Pilots

Run focused **60–90 day pilots** with one or two city departments and measure:

* Time-to-triage
* Resolution time
* Reporting volume
* Resident satisfaction
* Department workload

---

## 🌐 Try OpenBlock

### 🔴 Live Website

**[open-block.tech](https://open-block.tech/)**

### 🎥 Demo Video

**[Watch the OpenBlock Demo](https://youtu.be/fvUpdfLLd7Y)**

### 📖 Demo Presentation

**[View the OpenBlock Presentation](https://docs.google.com/presentation/d/e/2PACX-1vR89BBHoRsEkXe2X9KrSuXWrmYP3eO53HZ-SPGxe7x6rwYsSClfDpbi7kHBLQfYyU5S0YEU9gPxhzQ-/pub?start=false&loop=false&delayms=60000)**

### 💻 Source Code

**[GitHub → NeanJs/OpenBlock](https://github.com/NeanJs/OpenBlock)**

---

## 🏗️ Project Structure

```text
OpenBlock/
│
├── client/          # Resident + dashboard frontend
│
├── server/          # REST API and backend services
│
├── database/        # Database models / configuration
│
└── README.md
```

> Repository structure may evolve as OpenBlock moves beyond the hackathon prototype.

---

## 🏷️ Built With

`Vue.js` `TypeScript` `JavaScript` `Node.js` `Express.js` `PostgreSQL` `REST API` `Google Gemini` `ElevenLabs` `GPS` `Maps` `Civic Tech` `Smart Cities` `Citizen Engagement` `Crowdsourcing` `Issue Reporting` `Data Visualization` `Accessibility` `Public Services` `Social Impact` `Open Source` `Responsive Design`

---

## 🌍 Built for Better Cities

OpenBlock started as a **24-hour hackathon project**.

The bigger idea is simple:

**Cities already have the people, infrastructure, and data.**

What is often missing is a better connection between the person who notices a problem and the team responsible for fixing it.

OpenBlock is our attempt to build that connection.

---

<p align="center">

### 🏙️ OpenBlock

**See it. Say it. Fix it.**

[🌐 Website](https://open-block.tech/) · [💻 GitHub](https://github.com/NeanJs/OpenBlock) · [🎥 Demo](https://youtu.be/fvUpdfLLd7Y) · [📖 Presentation](https://docs.google.com/presentation/d/e/2PACX-1vR89BBHoRsEkXe2X9KrSuXWrmYP3eO53HZ-SPGxe7x6rwYsSClfDpbi7kHBLQfYyU5S0YEU9gPxhzQ-/pub?start=false&loop=false&delayms=60000)

</p>
