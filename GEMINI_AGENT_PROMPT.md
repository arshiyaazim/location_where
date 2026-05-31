# Gemini Agent Prompt: Complete the "Location_Where" Employee Monitoring App

## Project Overview
This is an **Employee Monitoring Android App** (Kotlin, Hilt, Room, Retrofit) with a **Node.js/Express backend** (Prisma, PostgreSQL, Redis, Firebase FCM, AWS S3). The app tracks employee location, detects SIM changes, logs calls, enforces geofences, and supports remote device commands (lock/wipe/siren).

## What's Already Built

### Android App (package: `com.example.location_where`)
- **Auth flow:** SplashActivity → LoginActivity → MainActivity (employee code + password login via `/api/v1/auth/mobile/login`)
- **TokenManager** (DataStore-based) with AuthInterceptor for JWT refresh
- **LocationService** (foreground service): GPS tracking every 30s (60s on low battery), geofence registration from server, battery-adaptive intervals
- **GeofenceBroadcastReceiver**: Reports EXIT breaches to backend, shows local notification
- **SimCheckWorker**: Periodic (1hr) SIM ICCID comparison, alerts on change
- **LocationSyncWorker**: Periodic sync of locally-cached locations (Room DB) when network available
- **Room DB**: LocationEntity/Dao/Database for offline location caching
- **LocationRepository**: Saves locally + attempts immediate API upload
- **Hilt DI**: NetworkModule (Retrofit + OkHttp), DatabaseModule (Room)
- **DeviceAdminReceiver**: Registered for uninstall prevention
- **BootReceiver**: Restarts service on device boot
- **ApiService endpoints defined**: login, refreshToken, updateLocation, reportSimChange, uploadCallLog, getPendingCommands, markCommandExecuted, getGeofences, reportGeofenceBreach

### Backend (Node.js + Express + Prisma)
- Full Prisma schema with models: Employee, AdminUser, LocationLog, Geofence, GeofenceAlert, SimChangeLog, CallLog, DeviceInfo, RemoteCommand, Alert, AuditLog
- Module structure with service/controller/routes for: auth, employee, location, sim, call, device, alert, report
- Middleware: JWT auth, RBAC, Zod validation, rate limiting
- Config: PostgreSQL (Prisma), Redis, Firebase Admin, AWS S3
- Utilities: logger, encryption (AES-256-CBC), SMS sender, PDF generator

## What Needs to Be Built (Remaining Work)

### Android App — HIGH PRIORITY

1. **Call Log Monitoring Service**
   - A service/worker that periodically reads the device call log (`CallLog.Calls`) and uploads new entries to `/api/v1/calls/log`
   - Track last-synced call timestamp in SharedPreferences/DataStore to avoid duplicates
   - Fields needed: callType (INCOMING/OUTGOING/MISSED), phoneNumber, duration, startedAt, endedAt

2. **Call Recording (if legally permitted)**
   - Use `MediaRecorder` or accessibility approach to record calls
   - Encrypt recording with AES-256 before upload
   - Upload encrypted file to `/api/v1/calls/upload-recording` (multipart)
   - Store recording status in local DB

3. **Remote Command Execution**
   - A periodic worker (every 5 min) that polls `/api/v1/device/commands/pending`
   - Execute commands based on `commandType`:
     - `LOCK`: Use DevicePolicyManager to lock screen
     - `UNLOCK`: Remove lock (if admin active)
     - `WIPE`: Factory reset via DevicePolicyManager
     - `SIREN`: Play loud alarm sound using MediaPlayer
     - `MESSAGE`: Show full-screen alert dialog
   - After execution, call `/api/v1/device/commands/executed` with commandId
   - Handle failures gracefully, retry logic

4. **Device Info Registration**
   - On first login or app update, send device info to backend: model, manufacturer, Android version, app version, IMEI (if accessible), FCM token
   - Create a `POST /api/v1/device/register` endpoint call

5. **FCM Push Notification Integration**
   - Add Firebase Cloud Messaging dependency
   - `FirebaseMessagingService` subclass to receive push notifications
   - Handle incoming remote command pushes (instead of just polling)
   - Update FCM token on refresh → send to backend

6. **Anti-Tamper / Uninstall Prevention**
   - Detect if Device Admin is disabled → send alert
   - Root detection using RootBeer (already in dependencies) → alert on rooted device
   - Detect app being force-stopped or cleared (use AlarmManager heartbeat)
   - Package removal detection via `ACTION_PACKAGE_REMOVED` (limited on newer Android)

7. **Fix SimCheckWorker**
   - Currently uses `RetrofitClient.instance` directly instead of Hilt-injected ApiService
   - Convert to `@HiltWorker` with `@AssistedInject`
   - Use TokenManager for actual auth token instead of hardcoded "YOUR_MOCK_TOKEN"

8. **Consent Screen**
   - Before activating monitoring, show a legal consent screen
   - Employee must acknowledge monitoring terms
   - Send consent confirmation to `POST /api/v1/employees/:id/consent`
   - Store consent status locally

9. **Proper Dashboard UI (MainActivity)**
   - Show: tracking status (active/inactive), last known location, battery level, SIM status, geofence status
   - The current UI is mostly scaffold/template; replace with a proper monitoring dashboard
   - Make the FAB action contextual (start/stop is admin-controlled)

10. **Network State Awareness**
    - Detect connectivity changes, queue all API calls when offline
    - Flush queue when connectivity returns (WorkManager constraints partially handle this, but direct API calls in LocationService don't)

### Backend — HIGH PRIORITY

1. **Admin Web Dashboard API endpoints** (if not already complete in controllers):
   - Live location map data: `GET /api/v1/location/live` should return latest location per employee with Redis caching
   - Employee list with last-seen, status
   - Alert management: mark read, filter by type/severity
   - Remote command issuance: `POST /api/v1/device/commands` (admin creates command)
   - Report generation: attendance reports, location history, call logs as PDF

2. **Firebase Push Notification Sending**
   - When a remote command is created, push notification to employee's device via FCM
   - Alert notifications to admin devices on critical events (SIM change, geofence breach)

3. **Geofence CRUD**
   - `POST /api/v1/geofence` - Create geofence
   - `PUT /api/v1/geofence/:id` - Update
   - `DELETE /api/v1/geofence/:id` - Delete
   - `GET /api/v1/geofence` - List (already called by app)

4. **Call Recording Upload & Storage**
   - `POST /api/v1/calls/upload-recording` - Accept multipart encrypted audio
   - Store in AWS S3 with server-side encryption
   - Link recording to CallLog entry

5. **Device Heartbeat & Offline Detection**
   - Track last communication timestamp per device
   - Background job that flags devices offline after X minutes → create APP_OFFLINE alert

6. **Report Module Implementation**
   - Daily/weekly attendance reports based on location data
   - Export as PDF (pdf.generator.ts utility exists)
   - Employee movement history with timestamps

7. **WebSocket/SSE for Real-time Dashboard**
   - Live location updates pushed to admin dashboard
   - Real-time alert notifications

### Build & Configuration Issues to Fix

1. **Kotlin plugin is commented out** in `app/build.gradle.kts` — uncomment `id("org.jetbrains.kotlin.android")`
2. **kotlinOptions block is missing** — add `kotlinOptions { jvmTarget = "11" }`
3. **Hardcoded admin password** in MainActivity (`"admin123"`) — move to server-side verification
4. **No ProGuard/R8 rules** for Retrofit, Gson, Hilt — app will crash in release build
5. **BASE_URL not configured** in RetrofitClient — needs to point to actual backend

## Architecture Notes
- Package: `com.example.location_where`
- DI: Dagger Hilt (`@AndroidEntryPoint`, `@HiltWorker`)
- Local DB: Room (LocationEntity with lat, lng, accuracy, battery, timestamp, synced flag)
- Network: Retrofit2 + OkHttp + Gson + AuthInterceptor (auto token refresh)
- Background: WorkManager for periodic tasks, foreground Service for continuous GPS
- Min SDK: 26, Target SDK: 35

## Priority Order for Implementation
1. Fix build issues (Kotlin plugin, kotlinOptions)
2. Fix SimCheckWorker (Hilt injection, real token)
3. Call log monitoring worker
4. Remote command execution worker + FCM
5. Device info registration
6. Anti-tamper improvements
7. Consent screen
8. Dashboard UI
9. Backend: FCM push, geofence CRUD, call recording upload, heartbeat detection
10. Backend: WebSocket for real-time, report generation
