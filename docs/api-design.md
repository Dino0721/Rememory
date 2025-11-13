# REST API Design

All endpoints require HTTPS and Firebase Authentication Bearer token unless noted otherwise. Base URL: `/api`.

## Auth

### `POST /auth/signup`
- **Description**: Create Firebase Auth user (proxy to Firebase Admin SDK).
- **Request**:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongP@ssw0rd",
    "displayName": "User Name"
  }
  ```
- **Response**:
  ```json
  {
    "uid": "firebase-uid",
    "email": "user@example.com"
  }
  ```

### `POST /auth/login`
- Utilize Firebase client SDK on frontend; endpoint provided for completeness if using custom token exchange.

## Persona

### `GET /persona`
- **Description**: Return current user persona (only one allowed).
- **Response**:
  ```json
  {
    "id": "personaId",
    "name": "Grandpa Joe",
    "relationship": "Grandfather",
    "traits": ["patient", "storyteller"],
    "status": "active",
    "startedAt": "2024-11-03T18:15:00Z",
    "expiresAt": "2024-12-03T18:15:00Z",
    "remainingMs": 123456789
  }
  ```

### `POST /persona`
- **Description**: Create persona (enforce one per user).
- **Request** aligns with Firestore schema; voiceSampleUrl optional.
- **Response**: Persona document.

### `PUT /persona`
- **Description**: Update persona fields (traits, memories, phrases).

### `DELETE /persona`
- **Description**: Delete persona after confirmation sentence.
- **Request**:
  ```json
  {
    "confirmation": "I understand this will permanently delete my persona and messages."
  }
  ```

### `POST /persona/start`
- **Description**: Idempotent endpoint to mark `startedAt` (called automatically on first chat).

## Chat

### `GET /persona/:id/chat`
- **Query Params**: `limit`, `cursor`.
- **Response**:
  ```json
  {
    "messages": [
      {"id": "msg1", "sender": "user", "text": "...", "timestamp": "..."},
      {"id": "msg2", "sender": "ai", "text": "...", "timestamp": "..."}
    ],
    "nextCursor": "..."
  }
  ```

### `POST /persona/:id/chat`
- **Request**:
  ```json
  {
    "text": "Hi Grandpa, I miss you.",
    "clientMessageId": "uuid"
  }
  ```
- **Response**:
  ```json
  {
    "personaStatus": "active",
    "remainingMs": 2592000000,
    "messages": [
      {"id": "uuid", "sender": "user", "text": "Hi Grandpa, I miss you."},
      {"id": "newId", "sender": "ai", "text": "I'm always with you in your heart.", "meta": {"ttsUrl": null}}
    ],
    "summaryAppended": false
  }
  ```
- **Behavior**:
  - Starts timer if `startedAt` unset.
  - Applies rate limiting and token caps.
  - Handles LLM errors with graceful fallback message stored as `sender: "system"`.

## Voice

### `POST /persona/:id/voice`
- **Description**: Accepts metadata or uploads to Cloud Storage (URL stored on persona).

### `GET /persona/:id/transcript`
- **Description**: Returns transcript (`text/plain` or CSV) if persona not expired or if requested before expiry.

## Timer & Status

### `GET /persona/:id/time`
- **Response**:
  ```json
  {
    "status": "active",
    "startedAt": "...",
    "expiresAt": "...",
    "remainingMs": 123456789
  }
  ```

## Notifications

### `POST /notifications/email`
- **Description**: Trigger email send (secured; used by scheduled job).
- **Request**:
  ```json
  {
    "userId": "uid",
    "personaId": "pid",
    "type": "3day_reminder"
  }
  ```

## Webhooks

### `POST /webhook/llm`
- Placeholder for async LLM responses if needed; requires HMAC validation.

## Error Handling

- Standard error envelope:
  ```json
  {
    "error": {
      "code": "persona_expired",
      "message": "This persona has reached the end of its session."
    }
  }
  ```

## Rate Limiting

- Global per-user: 12 requests/minute (configurable).
- Chat endpoint enforces minimum 5 seconds between user messages.
- LLM token usage tracked in `meta.llmTokens` and aggregated per persona.

