# Privacy, Security, and Ethical Policies

## User-Facing Disclaimer

- Display prominently on dashboard and chat header:
  - “Rememory personas are compassionate simulations, not the real person. If you need urgent help, contact local emergency services or call the National Suicide & Crisis Lifeline at 988 (US) or your regional hotline.”

## Privacy Policy Highlights

- **Data Minimization**: Collect only persona details required (name, relationship, traits, memories, phrases, optional voice note description).
- **User Control**: Users may delete persona or entire account by confirming the irreversible deletion sentence.
- **Retention**: Persona and conversation data deleted immediately when requested; limited backups removed within 7 days.
- **Transcript**: Download available only before expiration or deletion; requires user confirmation.
- **Consent**: If voice features extend beyond TTS, obtain written consent and supervisor/IRB approval.

## Security Checklist (OWASP-based)

- Use HTTPS for all traffic (Vercel, Firebase provide TLS).
- Enforce Firebase Auth; backend verifies ID tokens on every request.
- Firestore rules restrict access to owner documents only.
- Hash or encrypt sensitive fields (e.g., use AES for optional notes if required).
- Implement rate limiting and input validation on all endpoints.
- Store secrets in environment variables; never commit to source.
- Apply dependency scanning (GitHub Dependabot) and run `npm audit` in CI.
- Log security events with minimal PII (use anonymized identifiers).
- Monitor for LLM abuse or policy violations; maintain audit logs.

## Data Deletion Flow

1. User initiates deletion → UI presents confirmation sentence (e.g., “I understand this will permanently delete my persona and messages.”).
2. User must type the sentence exactly; UI validates.
3. Backend endpoint verifies again; records entry in `audit/deletionRequests`.
4. Backend deletes Firestore documents in a batch (persona, conversations, summaries, notifications).
5. Trigger Cloud Function to remove associated storage files (voice samples, transcripts).
6. Respond with confirmation; UI shows final message about support resources.

Account deletion follows similar flow and additionally deletes user document and Firebase Auth account via Admin SDK.

## Content Moderation

- Integrate OpenAI/Google moderation endpoint before sending user message to persona.
- If flagged for self-harm, respond with supportive template, show resources, and log event for review.
- Optionally pause persona interactions until manual review when high-severity flags occur.

### Crisis Response Template

“I’m really sorry to hear how heavy things feel. You deserve immediate support. Please contact local emergency services or the 988 Suicide & Crisis Lifeline (US). If you’re outside the US, find help at https://www.opencounseling.com/suicide-hotlines. I’m only a supportive simulation and can’t help in emergencies.”

## Compliance Notes

- Align with GDPR principles: right to access, rectification, erasure.
- Maintain Data Processing Agreement with vendors (OpenAI, SendGrid).
- Document consent for optional features (voice, transcript download).
- Store audit logs for deletion requests for 90 days, then purge.

## Logging & Monitoring

- Use Firebase Functions logger for structured logs (`severity`, `userId`, `personaId`).
- Forward logs to Google Cloud Logging for retention.
- Configure alerts for:
  - Failed scheduled jobs
  - High rate-limit violations
  - LLM error rates >5% over 1 hour
  - Excessive deletion requests (potential abuse)

