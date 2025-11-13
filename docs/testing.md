# Testing Strategy

## Unit Tests (Jest)

- `personaService.test.ts`: validates persona creation constraints, single persona per user, timer initialization.
- `timerService.test.ts`: ensures `expiresAt` = `startedAt + 30 days`, handles edge cases (repeated start calls).
- `llmService.test.ts`: checks prompt assembly, summarization logic, moderation fallback.

Run: `cd backend && yarn test`

## Integration Tests (Supertest + Jest)

- `chatRoutes.int.test.ts`: mock LLM response, ensure messages stored, timer set, rate limit enforced, expiration blocking.
- Use Firebase emulator or mock Firestore using `firebase-mock`.

## End-to-End Tests (Playwright)

Scenario: `tests/e2e/chat.spec.ts`
1. User signs up via Firebase emulator.
2. Creates persona with required fields.
3. Sends first chat message → verify countdown appears.
4. Simulate time advance (mock expiry) → check UI updates to final week prompts and closure screen.
5. Trigger transcript download (stub).
6. Perform persona deletion flow.

Run: `cd frontend && yarn test:e2e`

## Accessibility Testing

- Integrate `axe-core` via Playwright for automated accessibility assertions on dashboard and chat.
- Manual keyboard navigation checklist to ensure focus management.

## Continuous Integration

- GitHub Actions workflow (`.github/workflows/ci.yml`) runs:
  - `yarn lint`
  - `yarn test`
  - `yarn build`
  - `yarn test:e2e --config tests/e2e/playwright.config.ts` (headless)

## Load & Cost Monitoring

- Add unit tests to confirm rate-limit logic rejects >12 requests/minute.
- Mock token usage to ensure summarization triggers after threshold.

## Error Handling Verification

- Ensure LLM failure path returns system message with retry hint.
- Validate crisis content triggers resource banner in UI (mock flagged response).

