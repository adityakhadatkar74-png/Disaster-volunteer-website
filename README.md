# Disaster Volunteer Coordination Platform

Full-stack web app for coordinating volunteers, disaster zones, task assignment, live task progress, resource stock, and map visibility.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: Firebase Firestore
- Auth: Firebase Authentication
- Maps: Google Maps JavaScript API

## Project Structure

```text
/client    React app with Firebase Auth, Firestore realtime listeners, Google Maps UI
/server    Express REST API using Firebase Admin SDK
/firebase  Firestore rules, indexes, and Firebase deploy config
```

## Firebase Setup

1. Create a Firebase project.
2. Enable Authentication with Email/Password sign-in.
3. Create a Firestore database.
4. Create a Firebase service account:
   - Firebase Console -> Project settings -> Service accounts
   - Generate a private key
   - Save it as `server/serviceAccountKey.json`
5. Copy environment examples:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

6. Fill in `client/.env` with your Firebase web app config and Google Maps browser key.
7. Fill in `server/.env`. If using the JSON file, keep:

```env
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

## Google Maps Setup

Enable these APIs in Google Cloud for the browser key:

- Maps JavaScript API
- Geolocation API, if you plan to extend server-side location features

Restrict the browser key to `http://localhost:5173/*` during local development.

## Install

```bash
npm install
npm run install:all
```

## Run Locally

```bash
npm run dev
```

Client: `http://localhost:5173`

API: `http://localhost:5000/api`

Health check: `http://localhost:5000/api/health`

## Firestore Rules and Indexes

Install Firebase CLI, login, then from the repo root:

```bash
firebase deploy --config firebase/firebase.json --only firestore
```

## Admin Accounts

For this development scaffold, the register screen allows choosing `Authority/Admin` so you can immediately test the admin dashboard. For production, remove that UI option and promote admins with Firebase custom claims or a trusted admin-only script.

## Core Features Implemented

- Volunteer registration/login through Firebase Auth
- Volunteer profile with skills and geolocation update
- Google Map with disaster pins and volunteer locations
- Admin disaster event creation using place names, geocoded into map pins
- Admin task creation and volunteer assignment by matching skill
- Volunteer task acceptance and status updates
- Firestore realtime listeners for disasters, tasks, volunteers, resources, and notifications
- Browser push-style notifications when a task assignment notification appears
- Resource CRUD through the API with low-stock alerts
- Responsive UI for desktop and mobile

## API Overview

All protected routes require a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

Routes:

- `GET /api/health`
- `GET /api/users/me`
- `PUT /api/users/me`
- `PATCH /api/users/me/location`
- `GET /api/disasters`
- `POST /api/disasters`
- `PATCH /api/disasters/:id`
- `DELETE /api/disasters/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/assign`
- `PATCH /api/tasks/:id/accept`
- `PATCH /api/tasks/:id/status`
- `GET /api/resources`
- `POST /api/resources`
- `PATCH /api/resources/:id`
- `DELETE /api/resources/:id`

## Data Model

Collections:

- `users`: role, skills, location, contact profile
- `disasters`: event metadata, status, severity, place name, mapped location
- `tasks`: disaster link, skill requirement, assignee, status, priority
- `resources`: disaster link, category, quantity, low-stock threshold
- `notifications`: user-specific task assignment alerts
