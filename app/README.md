This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Music → 3D Prototype

Set the following environment variables before running:

- `OPENAI_API_KEY`: your OpenAI API key
- `MESHY_API_KEY`: your Meshy API key

Endpoints:
- `POST /api/music3d` (multipart/form-data): fields `audio` (File), `notes` (string). Returns `{ analysis, meshyParams, meshy: { taskId } }`.
- `GET /api/music3d?taskId=...`: polls Meshy job status; returns Meshy task JSON.

UI:
- Navigate to `/music3d` to upload or record audio, add notes, submit, and view the generated model or download link when ready.

Notes:
- Audio is sent to OpenAI Responses API (gpt-4o-mini) with `input_audio` and your prompt. The model output is parsed for a Meshy JSON block; if parsing fails, we still start a Meshy job with the raw prompt fallback.
- Meshy API fields and response structure may vary by account; adjust the request/response mapping in `src/app/api/music3d/route.ts` as needed.
