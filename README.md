# Rememory

Rememory is a time-limited grief support application that allows a user to create a single AI persona representing a deceased loved one and interact with it over a 30-day period. The project uses a TypeScript stack with a React frontend, Node/Express backend, Firebase Authentication, Firestore for storage, and an LLM integration for conversation.

## Repository Structure

```
frontend/            # React application (Vercel deployment target)
backend/             # Node/Express API (Firebase Cloud Functions or Cloud Run)
docs/                # Architecture, data model, prompts, policies, plans
.github/workflows/   # CI configuration
.env.example         # Environment variable template
```

## Prerequisites

- Node.js ≥ 18
- Yarn or npm
- Firebase project with Authentication & Firestore enabled
- OpenAI (or compatible) API key for LLM integration

## Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/your-org/rememory.git
   cd rememory
   ```

2. Copy `.env.example` to `.env` and fill in the required variables.

3. Install dependencies separately in `frontend` and `backend`:

   ```bash
   cd frontend
   yarn install
   cd ../backend
   yarn install
   ```

4. Start the development servers:

   ```bash
   # Frontend (Vite)
   cd frontend
   yarn dev

   # Backend (Express with ts-node-dev)
   cd ../backend
   yarn dev
   ```

5. Configure Firebase CLI for Cloud Functions deployment if needed:

   ```bash
   firebase login
   firebase use <your-project-id>
   ```

## Testing

- **Frontend**: `cd frontend && yarn test`
- **Backend (unit & integration)**: `cd backend && yarn test`
- **E2E (Playwright)**: `cd frontend && yarn test:e2e`

Refer to `docs/testing.md` for detailed scenarios and commands.

## Deployment

- **Frontend**: Deploy `frontend` to Vercel (configure environment variables via project settings).
- **Backend**: Deploy `backend` as Firebase Cloud Functions or build container for Cloud Run. See `docs/deployment.md`.

## Documentation

Key documents are stored in `docs/`:

- `architecture.md` — diagrams and component architecture
- `firestore-schema.md` — data model with sample documents
- `api-design.md` — REST API specification
- `prompts.md` — system prompts and context policies
- `policies.md` — privacy, security, and ethical safeguards
- `project-plan.md` — timeline, backlog, milestones
- `testing.md` — unit, integration, e2e, and a11y testing strategy

---

> **Disclaimer**: Rememory personas are simulations. Always display messaging that the AI persona is a supportive simulation, not the real individual, and provide links to grief support resources.

# Rememory
Grief App for people say their "last word"
