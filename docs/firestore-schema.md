# Firestore Data Model

## Collections Overview

- `users/{userId}`
- `personas/{personaId}`
- `conversations/{personaId}/messages/{messageId}`
- `notifications/{notificationId}`
- `audit/deletionRequests/{requestId}`

## Documents & Fields

### `users/{userId}`

| Field        | Type      | Description                           |
| ------------ | --------- | ------------------------------------- |
| `email`      | string    | User email (from Firebase Auth)       |
| `displayName`| string    | Optional display name                 |
| `createdAt`  | timestamp | Creation timestamp                    |
| `deletedAt`  | timestamp | Set when account deletion requested   |

#### Sample

```json
{
  "email": "jane@example.com",
  "displayName": "Jane Doe",
  "createdAt": "2024-11-01T12:00:00Z"
}
```

### `personas/{personaId}`

| Field             | Type       | Description                                        |
| ----------------- | ---------- | -------------------------------------------------- |
| `ownerId`         | string     | User ID (matches `userId`)                         |
| `name`            | string     | Persona name                                       |
| `relationship`    | string     | Relationship to user                               |
| `traits`          | string[]   | Personality traits                                 |
| `keyMemories`     | string[]   | Key shared memories                                |
| `commonPhrases`   | string[]   | Frequently used phrases                            |
| `voiceSampleUrl`  | string     | Optional reference to voice sample                 |
| `status`          | string     | `"active" | "expired" | "deleted"`                |
| `createdAt`       | timestamp  | Persona creation timestamp                         |
| `startedAt`       | timestamp  | First chat timestamp (start of 30-day timer)       |
| `expiresAt`       | timestamp  | `startedAt + 30 days`                              |
| `guidanceLevel`   | number     | 0-3 scale for guided closure prompts               |
| `transcriptReady` | boolean    | Flag when transcript export is generated           |

#### Sample

```json
{
  "ownerId": "uid_123",
  "name": "Grandpa Joe",
  "relationship": "Grandfather",
  "traits": ["patient", "storyteller", "humorous"],
  "keyMemories": ["Fishing trips", "Holiday dinners"],
  "commonPhrases": ["You betcha!", "Proud of you"],
  "status": "active",
  "createdAt": "2024-11-01T12:00:00Z",
  "startedAt": "2024-11-03T18:15:00Z",
  "expiresAt": "2024-12-03T18:15:00Z",
  "guidanceLevel": 1
}
```

### `conversations/{personaId}/messages/{messageId}`

| Field     | Type      | Description                                       |
| --------- | --------- | ------------------------------------------------- |
| `sender`  | string    | `"user" | "ai" | "system"`                         |
| `text`    | string    | Message content                                   |
| `timestamp`| timestamp| Message timestamp                                 |
| `meta`    | map       | Optional metadata (`llmTokens`, `llmModel`, `ttsUrl`) |

#### Sample

```json
{
  "sender": "ai",
  "text": "I'm proud of how far you've come.",
  "timestamp": "2024-11-10T10:05:00Z",
  "meta": {
    "llmTokens": 220,
    "llmModel": "gpt-4o-mini"
  }
}
```

### `notifications/{notificationId}`

| Field     | Type      | Description                          |
| --------- | --------- | ------------------------------------ |
| `userId`  | string    | Recipient user ID                    |
| `personaId`| string   | Persona related to the notification  |
| `type`    | string    | `"3day_reminder" | "expired"`        |
| `sentAt`  | timestamp | When email was sent                  |
| `delivered`| boolean  | Delivery status                      |

### `audit/deletionRequests/{requestId}`

| Field             | Type      | Description                               |
| ----------------- | --------- | ----------------------------------------- |
| `userId`          | string    | User requesting deletion                  |
| `personaId`       | string    | Persona deleted (if applicable)           |
| `confirmationText`| string    | The exact sentence entered by user        |
| `createdAt`       | timestamp | When the request was made                 |
| `type`            | string    | `"persona"` or `"account"`                |

## Indexing

Recommended composite indexes:

- `personas`: `ownerId` ASC, `status` ASC
- `notifications`: `userId` ASC, `type` ASC
- `conversations`: `personaId` ASC, `timestamp` ASC

## Firestore Security Rules (Snippet)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, update, delete: if isOwner(userId);
      allow create: if isSignedIn() && request.auth.uid == userId;
    }

    match /personas/{personaId} {
      allow read, update, delete: if isOwner(resource.data.ownerId);
      allow create: if isSignedIn() && request.resource.data.ownerId == request.auth.uid;
    }

    match /conversations/{personaId}/messages/{messageId} {
      allow read, create: if isOwner(get(/databases/$(database)/documents/personas/$(personaId)).data.ownerId);
      allow delete: if false; // Deletion handled via backend to ensure cascading deletes
    }

    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.userId);
      allow create, update: if request.auth.token.admin == true;
    }

    match /audit/deletionRequests/{requestId} {
      allow create: if isSignedIn();
      allow read: if false;
    }
  }
}
```

