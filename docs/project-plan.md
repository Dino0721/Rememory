# Project Plan

## Implementation Timeline (6 Weeks)

### Week 1
- Finalize requirements & UI wireframes.
- Set up repo, CI/CD, Firebase project, authentication.
- Implement user signup/login flows.

### Week 2
- Build persona creation wizard (frontend + backend).
- Define Firestore rules and seed data.
- Implement persona CRUD endpoints and limit enforcement (one persona per user).

### Week 3
- Develop chat interface with real-time updates.
- Integrate LLM service with prompt template.
- Initialize timer on first chat; show countdown in UI.

### Week 4
- Implement guided closure logic and final week behaviors.
- Build transcript export and storage cleanup routines.
- Set up scheduled functions for notifications and expiration.

### Week 5
- Add TTS playback, STT input option.
- Implement deletion flows (persona + account) with confirmation sentence.
- Integrate content moderation and crisis response messaging.

### Week 6
- Complete testing suite (unit, integration, e2e, accessibility).
- Polish accessibility, error states, and resource links.
- Conduct security review & finalize deployment.

## Prioritized Backlog

1. Firebase Auth integration & protected routes.
2. Persona Firestore model with enforcement of single persona.
3. Chat API with LLM integration and timer activation.
4. Countdown UI and Guided Closure mode.
5. Notification scheduler (3-day reminder, expiry email).
6. Transcript export & download interface.
7. Persona/account deletion with audit logging.
8. Accessibility enhancements and crisis resources.
9. Voice features (Web Speech API TTS/STT).
10. Stretch: External TTS/STT providers, consent workflows.

## Acceptance Criteria (MVP)

- User can sign up, create exactly one persona, and chat with LLM-based responses.
- First successful chat sets `startedAt` and calculates `expiresAt`.
- Remaining time displayed; 3-day reminder email sent automatically.
- Within final 7 days, AI prompts incorporate reflective questions.
- On expiry, chat disabled and closure screen presented.
- User can download transcript before expiry.
- Persona/account deletion removes data and logs audit entry.
- API endpoints secured with Firebase Auth; Firestore rules enforced.

## Risks & Mitigations

- **LLM Cost Overruns**: Implement strict rate limits and token caps per persona.
- **Emotional Harm**: Include crisis detection, disclaimers, and guided closure.
- **Data Privacy**: Ensure encryption at rest, secure deletion, minimal logging.
- **Scheduler Reliability**: Implement idempotent cron job and monitoring alerts.

## Dependencies

- Firebase (Auth, Firestore, Functions, Scheduler)
- OpenAI / Gemini API
- SendGrid (or similar) for transactional email
- Vercel for frontend hosting
- Google Cloud Storage for optional voice assets

