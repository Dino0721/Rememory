# Architecture Overview

## Component Diagram

```mermaid
flowchart LR
    subgraph Frontend [Frontend (Vercel)]
        UI[React App]
        Chat[PersonaChat Component]
        Dashboard[Dashboard Component]
    end

    subgraph Backend [Backend (Firebase Cloud Functions / Cloud Run)]
        API[Express API]
        AuthMiddleware[Firebase Auth Middleware]
        LLMService[LLM Service]
        Scheduler[Scheduled Jobs]
    end

    subgraph Firebase [Firebase Services]
        Firestore[(Firestore)]
        Auth[(Firebase Auth)]
        Storage[(Cloud Storage)]
    end

    subgraph External [External Services]
        OpenAI[(LLM Provider)]
        SendGrid[(Email Provider)]
    end

    UI --> Chat
    UI --> Dashboard
    Chat -->|REST| API
    Dashboard -->|REST| API
    API --> AuthMiddleware
    AuthMiddleware --> Firestore
    API --> LLMService --> OpenAI
    API --> Firestore
    API --> Storage
    Scheduler --> Firestore
    Scheduler --> SendGrid
    Firestore --> Auth
```

## Sequence Diagram — Chat Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React Frontend
    participant BE as Express API
    participant FB as Firestore
    participant AI as LLM Provider

    U->>FE: Submit message
    FE->>BE: POST /api/persona/:id/chat (message)
    BE->>FB: Verify persona ownership & status
    alt persona not started
        BE->>FB: set startedAt & expiresAt
    end
    BE->>FB: Store user message
    BE->>AI: send prompt + context
    AI-->>BE: AI response
    BE->>FB: Store AI response + metadata
    BE-->>FE: Return AI response + remaining time
    FE-->>U: Render AI message, trigger TTS
```

## Timer & Expiration Flow

```mermaid
sequenceDiagram
    participant Cron as Cloud Scheduler
    participant Job as Expiration Function
    participant FB as Firestore
    participant Email as SendGrid

    Cron->>Job: Trigger every 6 hours
    Job->>FB: Query personas close to expiration
    alt 3 days remaining
        Job->>FB: Create notification record
        Job->>Email: Send 3-day reminder
    end
    alt expired
        Job->>FB: Update status=expired
        Job->>Email: Send closure email
    end
```

## Data Flow

```mermaid
graph TD
    UserInput[User Input] --> ReactState[React State & Context]
    ReactState --> RESTCall[REST API Call]
    RESTCall --> Middleware[Auth & Rate Limit]
    Middleware --> Controller[Chat Controller]
    Controller --> FirestoreWrite[Firestore Message Write]
    Controller --> LLMRequest[LLM Request Builder]
    LLMRequest --> LLM[(LLM Provider)]
    LLM --> Controller
    Controller --> FirestoreWrite
    FirestoreWrite --> Response[API Response]
    Response --> ReactState
    ReactState --> UIUpdate[UI Update & TTS Playback]
```

## Hosting & Deployment

- **Frontend**: Deployed on Vercel; environment variables injected via Vercel dashboard.
- **Backend**: Deployed as Firebase Cloud Functions (Express app wrapped with `functions.https.onRequest`) or containerized for Cloud Run.
- **Scheduler**: Firebase Scheduled Functions drive expiration and notification jobs.
- **Firestore**: Primary data store for users, personas, messages, notifications, audit logs.

