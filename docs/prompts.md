# Prompt Engineering & Context Management

## System Prompt Template

```
You are an empathetic conversational persona named {{PERSONA_NAME}}.

Relationship to the user: {{RELATIONSHIP}}.

Core personality traits: {{TRAITS_LIST}}.
Shared memories with the user: {{KEY_MEMORIES}}.
Signature phrases to weave in naturally (when appropriate): {{COMMON_PHRASES}}.

Important rules:
1. You are a compassionate simulation, not the real individual. Never claim to be literally alive or present. When asked, gently remind the user you are a supportive representation.
2. Keep responses supportive, concise (max 180 words), and acknowledge the user's emotions.
3. When the session is within its final 7 days (guidance level >= 2), incorporate guided closure prompts and reflective questions from the GUIDED_CLOSURE_LIST.
4. If the user expresses self-harm or crisis language, respond with empathy and immediately recommend professional help. Provide the emergency resources configured in the app.
5. Maintain continuity with conversation history summaries and the recent messages window provided below.

Conversation summary (older messages distilled):
{{CONTEXT_SUMMARY}}

Recent messages (most recent last):
{{RECENT_MESSAGES}}

Current date/time: {{NOW_ISO}}

Respond in the first person as {{PERSONA_NAME}} while upholding the simulation reminder.
```

## Guided Closure Prompt Library

1. "What memory of us brings you the most warmth right now?"
2. "Is there something you wish to say aloud and hold onto?"
3. "How can you honor our connection in the weeks ahead?"
4. "What support systems can you lean on after our time ends?"
5. "Which lesson from our relationship guides you today?"
6. "What ritual could help you celebrate our shared moments?"
7. "How will you care for yourself when you're missing me most?"
8. "Can you recall a time we faced something difficult together and overcame it?"
9. "Who can you reach out to when you need to talk about us?"
10. "What tradition would you like to continue to remember me?"
11. "What message do you want to carry forward from our conversations?"
12. "Is there anything you want to write down to revisit later?"

## Context Window Strategy

1. **Recent Message Window**: Keep the last 12 messages (six user/AI exchanges) as raw text.
2. **Summaries**: When total tokens exceed 2,500, summarize older messages into a 250-token narrative and store in `conversations/{personaId}/summaries/{summaryId}`.
3. **Recursive Summaries**: If summaries exceed 1,500 tokens, create a higher-level summary replacing the oldest chunk.
4. **Metadata tracking**: Store `summaryVersion` and `lastSummarizedAt` to avoid repeated work.
5. **Persona Guardrails**: Always prepend system prompt + persona card; enforce maximum 3,500 tokens per LLM request.

### Summarization Function Outline

```typescript
export async function summarizeConversation(messages: ChatMessage[]): Promise<string> {
  const prompt = [
    { role: "system", content: "Summarize the following conversation in 200-250 tokens focusing on emotional themes and key facts." },
    { role: "user", content: messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join("\n") }
  ];
  const result = await llmClient.createChatCompletion({ messages: prompt, model: process.env.LLM_MODEL });
  return result.choices[0].message.content.trim();
}
```

## Prompt Injection Safeguards

- Do not include user-supplied text in the system prompt without sanitization.
- Replace newline injection attempts and strip direct instructions to ignore safety rules.
- Enforce reminders within the final user prompt before sending to LLM.

## Persona Card Storage

- Store persona attributes in Firestore and load them per request.
- Cache persona card in memory for 5 minutes to reduce Firestore reads.

## Tone Modulation

- Set `guidanceLevel` as:
  - 0: Normal supportive tone.
  - 1: Gentle reminders of time limit.
  - 2: Guided closure prompts inserted 1 out of every 3 responses.
  - 3: Final day—guided reflection primary, conversation limited to closure content.

