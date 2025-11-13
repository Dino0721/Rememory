# Deployment Guide

## Frontend (Vercel)

1. Create new Vercel project connected to repository.
2. Set root directory to `frontend`.
3. Configure build command: `yarn build`.
4. Set output directory: `dist`.
5. Add environment variables via Vercel dashboard:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_API_BASE_URL`
   - `VITE_SENTRY_DSN` (optional)
6. Enable preview deployments; require review before production promotion.

## Backend (Firebase Cloud Functions)

1. Ensure Firebase CLI and project setup:
   ```bash
   firebase login
   firebase use <project-id>
   ```
2. Deploy configuration:
   ```bash
   cd backend
   yarn build
   firebase deploy --only functions
   ```
3. Set environment variables using Firebase Functions config:
   ```bash
   firebase functions:config:set openai.key="..." sendgrid.key="..." app.frontend_url="https://rememory.app"
   ```
4. Schedule jobs (Cloud Scheduler):
   ```bash
   firebase deploy --only functions:scheduledPersonaMonitor
   ```

## Alternative Backend (Cloud Run)

- Build container:
  ```bash
  gcloud builds submit --tag gcr.io/<project-id>/rememory-backend
  ```
- Deploy:
  ```bash
  gcloud run deploy rememory-backend --image gcr.io/<project-id>/rememory-backend --region us-central1 --platform managed --allow-unauthenticated
  ```
- Configure IAM to require Firebase Auth tokens (verify in middleware).

## CI/CD (GitHub Actions)

- Workflow `.github/workflows/ci.yml` runs lint, test, build.
- Add deployment job triggered on `main`:
  - Use `Firebase Deploy` action with service account.
  - Use `Vercel Action` with `VERCEL_TOKEN`.

## Environment Variables Summary

| Variable | Description |
| -------- | ----------- |
| `LLM_API_KEY` | OpenAI/Gemini API key |
| `LLM_MODEL` | Model identifier (`gpt-4o-mini`, `gemini-pro`) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `SENDGRID_API_KEY` | Transactional email key |
| `EMAIL_FROM` | Default sender address |
| `FRONTEND_URL` | Domain for CORS |
| `BACKEND_URL` | Base URL for API |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | Requests per window |
| `TTS_PROVIDER` | `webspeech` or `google` |
| `GOOGLE_TTS_API_KEY` | Optional for Google Cloud TTS |

## Monitoring & Rollback

- Enable Firebase Crashlytics for mobile clients (if any) and Sentry for web.
- Cloud Functions logs accessible via Google Cloud Logging.
- Use `firebase functions:log` for real-time monitoring.
- Vercel provides deployment rollbacks via dashboard.

