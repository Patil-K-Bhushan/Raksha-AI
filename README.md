# Raksha

**Every scam detector answers one question: is this a scam? Raksha answers the one that actually protects you: *why*?**

Raksha performs a structured scam autopsy: it labels the manipulative text in a suspicious message, identifies the scam type, and gives one clear action. It never calls anything completely safe.

## Day 1

- Paste an SMS, WhatsApp forward, email, or offer.
- Receive a structured verdict and a basic Trap Map with exact highlighted message text.
- Messages are analyzed as untrusted adversarial data; Raksha never gives their contents instruction authority.
- No database, account, or message history. Input is analyzed and discarded.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `OPENAI_API_KEY` in `.env.local` before analyzing messages.

## Deploy to Vercel

1. Push this repository to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. Vercel detects Next.js automatically; leave the build settings unchanged.
3. In **Project Settings → Environment Variables**, add `OPENAI_API_KEY` with your OpenAI API key for Production (and Preview if needed).
4. Deploy. Vercel runs `npm run build` and hosts the app.

Never commit `.env.local` or expose the API key in browser code.
