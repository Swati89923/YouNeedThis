# Feedback Exchange Platform

A two-sided feedback marketplace that connects **developers/companies** with **verified reviewers** to collect **authentic, structured, and high-quality product feedback**, while fairly compensating reviewers through an escrow-based payment system.

---

## 🚀 Project Overview

Modern developers struggle to get **actionable and trustworthy feedback** for their apps and websites.  
At the same time, skilled reviewers often spend time reviewing products without proper recognition or incentives.

This platform solves both problems by creating a **controlled feedback economy** where:

- Developers pay for **validated feedback**
- Reviewers earn money for **genuine, effort-based reviews**
- Payments are released only after **quality verification**

---

## 🎯 Key Objectives

- Ensure **authentic and meaningful feedback**
- Prevent spam, fake reviews, and copy-paste submissions
- Provide **structured review workflows**
- Implement **secure escrow-based payments**
- Build a **scalable, AI-ready architecture**

---

## 👥 User Roles

### 1️⃣ Developer / Company

Developers can:
- Submit their **app (Play Store only)** or **verified website**
- Define **what needs to be reviewed** (UX, bugs, performance, accessibility, etc.)
- Set:
  - Reviewer quality tier
  - Pay per feedback
  - Number of reviewers required
  - Proof requirements (screenshots, steps, recordings)
- Deposit the total payment upfront (escrow)
- View verified feedback and analytics
- Rate reviewers and request clarifications
- Withdraw unused funds if the feedback request is closed early

---

### 2️⃣ Reviewer

Reviewers can:
- Browse available feedback projects
- See:
  - Company/Developer name
  - Review difficulty level
  - Payment per review
  - Remaining review slots
  - Estimated time to complete
- Accept a project and follow **structured review tasks**
- Submit feedback with required proofs
- Receive a **review quality score**
- Get paid if the submission meets quality standards
- Build a **reputation score** to unlock better-paying tasks

---

## 🔐 Security & Trust Measures

- Only **Google Play Store apps** are allowed (no APK uploads)
- Websites must be served over **HTTPS**
- No direct file uploads from developers
- Escrow-based payment flow ensures fairness for both parties

---

## 🧠 Review Authenticity & Quality Verification

To ensure feedback is real and effort-based, the platform analyzes:

### ✔ Structured Task Completion
- Mandatory steps defined by the developer
- Section-wise minimum content requirements

### ✔ Behavioral Analysis
- Time spent on each task
- Sudden long text pastes
- Extremely fast submissions
- Inactivity or abnormal typing patterns

### ✔ Originality Checks
- Similarity comparison with other reviews on the same project
- Comparison with reviewer’s past submissions

### ✔ Final Review Score
Each review is scored using a rule-based system:



---

## 🧱 Architecture

| Part | Tech | Folder |
| --- | --- | --- |
| API | Spring Boot 3, Spring Security (JWT), Spring Data JPA | [`backend/`](backend) |
| Web app | React 18, TypeScript, Vite, React Router | [`frontend/`](frontend) |
| Database | H2 in memory for local work, PostgreSQL in production | |

The web app talks to the API over HTTPS with a bearer token. There are no cookies.

## ▶️ Run it locally

You need Java 17+, Maven (or the included `mvnw`) and Node 20+.

```bash
# 1. API on http://localhost:8080 (dev profile, in-memory H2, demo data included)
cd backend
mvn spring-boot:run

# 2. Web app on http://localhost:5173
cd frontend
cp .env.example .env
npm install
npm run dev
```

Demo logins (dev profile only, recreated on every start):

| Role | Email | Password |
| --- | --- | --- |
| Developer | `developer@demo.dev` | `Demo@1234` |
| Reviewer | `reviewer@demo.dev` | `Demo@1234` |

Swagger UI for the API: http://localhost:8080/swagger-ui.html

## ✅ Checks

```bash
cd backend  && mvn verify                                  # integration tests
cd frontend && npm run typecheck && npm test && npm run build
```

The same checks run in GitHub Actions on every pull request (`.github/workflows/ci.yml`).

## ⚙️ Configuration

### Backend

| Variable | Used when | Meaning |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | always | `dev` (default) or `prod` |
| `JWT_SECRET` | prod | Signing secret, at least 32 characters |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | prod | PostgreSQL connection |
| `CORS_ALLOWED_ORIGINS` | prod | Comma separated frontend origins, for example `https://my-app.vercel.app`. Defaults to `*` |

### Frontend

| Variable | Meaning |
| --- | --- |
| `VITE_API_URL` | Base URL of the API, no trailing slash. Defaults to `http://localhost:8080` |

## 🔌 API overview

All endpoints except sign up and login need `Authorization: Bearer <token>`.

| Method and path | Who | What |
| --- | --- | --- |
| `POST /api/v1/auth/register`, `POST /api/v1/auth/login` | anyone | Create an account, get a token |
| `GET /users/me` | any | Current profile |
| `POST /projects` | developer | Create a project |
| `GET /projects/mine` | developer | My projects |
| `POST /payments/deposit/{projectId}` | developer (owner) | Fund the escrow once |
| `GET /projects` | reviewer | Funded projects with open slots |
| `POST /projects/{id}/assign` | reviewer | Take a project |
| `GET /projects/assigned` | reviewer | Projects I took |
| `GET /projects/{id}` | any | One project |
| `POST /api/v1/feedback/project/{id}` | reviewer | Submit feedback (one per project) |
| `GET /api/v1/feedback/mine` | reviewer | My feedback |
| `GET /api/v1/feedback/received`, `GET /api/v1/feedback/project/{id}` | developer | Feedback on my projects |
| `POST /api/v1/feedback/{id}/approve`, `.../reject` | developer (owner) | Decide. Approve pays the reviewer from escrow |
| `GET`, `POST /feedback-comments/{feedbackId}` | the two people involved | Conversation about a feedback |
| `GET /wallet` | any | Wallet balance |
| `GET /api/v1/dashboard/developer`, `.../reviewer` | matching role | Dashboard numbers |
| `GET /notifications`, `POST /notifications/read-all` | any | Notifications |

Errors look like `{"message": "...", "timestamp": "..."}` with a 400, 401, 403, 404 or 409 status.
