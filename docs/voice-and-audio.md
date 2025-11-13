# Voice & Audio Integration

## MVP (Browser Native)

- **Text-to-Speech (TTS)**: Utilize Web Speech API (`SpeechSynthesisUtterance`) to vocalize AI responses (implemented in `frontend/src/hooks/useTTS.ts`).
- **Speech-to-Text (STT)**: Use Web Speech API `webkitSpeechRecognition` (Chrome) as an optional input mode during chat.

### Sample STT Hook (pseudo-code)

```typescript
export const useSTT = () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.lang = 'en-US';

  const start = () => recognition.start();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onTranscript(transcript);
  };

  return { start, stop: () => recognition.stop() };
};
```

## Enhanced Cloud Providers (Optional Stretch)

- **Google Cloud TTS**:
  - Use `@google-cloud/text-to-speech`.
  - Store output audio in Cloud Storage and reference via `meta.ttsUrl`.
  - Requires user consent for storing generated audio.

- **Google Cloud Speech-to-Text**:
  - Capture audio via `MediaRecorder`, upload to Cloud Functions endpoint, forward to Cloud STT.
  - Handle long-running recognition with Pub/Sub callback if needed.

## Consent & Ethics

- Voice cloning **not allowed** by default.
- If future iteration includes voice cloning:
  - Collect explicit written consent from persona owner and deceased’s estate.
  - Provide legal review and supervisor/IRB approval.
  - Offer opt-out and delete voice assets upon request.

## Accessibility Considerations

- Provide captions while audio plays.
- Offer playback controls (pause/stop) and volume hints.
- Respect reduced motion/audio preferences by checking `prefers-reduced-motion` and storing user audio preferences.

