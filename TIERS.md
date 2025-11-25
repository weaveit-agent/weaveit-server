# Pricing & Frontend Integration

This document explains the pricing tiers, credit model, and how the frontend should interact with the backend API to award credits and use them for audio/video generation.

**Pricing Overview**

- **7-Day Free Trial (New users)**: $0 — 28 credits total, with a daily soft-limit of 4 credits/day during the trial window.
- **Starter Plan**: $5 — 30 credits / month
- **Growth Plan**: $10 — 80 credits / month
- **Pro Plan**: $20 — 150 credits / month

**Credit costs**

- Audio generation: 1 credit
- Video generation: 2 credits

Frontend integration guide

- Awarding credits after payment

  - When a payment is confirmed on the frontend (webhook or client-confirmed), call the backend endpoint to award credits for the user's wallet address. The backend endpoint is:
    - `POST /api/payments/award`
    - Body JSON (examples):
      - By tier:
        ```json
        { "walletAddress": "0xabc...", "tier": 5 }
        ```
      - By explicit points (useful for webhooks or custom promo credits):
        ```json
        { "walletAddress": "0xabc...", "points": 150 }
        ```
  - The response contains the awarded points and the user's new total points:
    ```json
    {
      "walletAddress": "0xabc...",
      "awardedPoints": 30,
      "newTotalPoints": 123,
      "contentType": null,
      "contentCredits": null
    }
    ```

- Trial handling (new users)

  - The backend automatically grants 28 trial credits to newly-seen wallet addresses (this is implemented by `ensureUser`). The server also attempts to set a `trial_expires_at` timestamp 7 days after account creation when the database schema supports it.
  - Frontend should not call `POST /api/payments/award` for trial credits — they are created automatically on first use.

- Using credits for generation (recommended frontend flow)

  1.  Frontend asks the backend to create a generation job (audio/video) via:
      - `POST /api/generate` for videos (costs 2 credits)
      - `POST /api/generate/audio` for audio (costs 1 credit)
      - Body: `{ "walletAddress": "0xabc...", "script": "..." }`
  2.  Backend will:
      - Check the user's credit balance and **deduct credits atomically** before processing.
      - Return HTTP `402 Payment Required` if insufficient credits with error details.
      - On success, generate the content, store it, and return the job details **with remaining credits**.
  3.  Frontend error handling:
      - If `402` is received, show user a message: _"Insufficient credits. You need X more credits for this."_ and prompt to purchase.
      - On success, update UI to reflect the new credit balance from the response.
  4.  Example response on success:
      ```json
      {
        "jobId": "...",
        "videoId": "...",
        "status": "completed",
        "creditsDeducted": 2,
        "remainingCredits": 10,
        "message": "Educational tutorial video generated successfully"
      }
      ```

- Checking balance
  - The backend now exposes a dedicated balance endpoint:
    - `GET /api/users/:walletAddress/points`
    - Returns `{ walletAddress, points, trial_expires_at }` and automatically enforces trial expiry before returning the balance.
    - Example:
      ```json
      {
        "walletAddress": "0xabc...",
        "points": 12,
        "trial_expires_at": "2025-11-29T12:34:56.000Z"
      }
      ```
  - `POST /api/payments/award` still returns the latest total after awarding credits.

Security and best practices

- Verify payments server-side: For real payments, prefer handling and verifying provider webhooks on the backend and awarding credits only after verifying the provider signature. Do not rely solely on client-reported success.
- Use idempotency keys: When handling webhooks or award requests, use an idempotency token so duplicate webhook deliveries don't double-award credits.
- Wallet verification: If you need to ensure the caller owns the wallet, require a signed message and verify ownership before awarding large amounts or performing critical actions.
- Audit logs: Store awarding events (who/when/amount/payment provider id) for later reconciliation.

Next steps / Completed items

- Completed: `GET /api/users/:walletAddress/points` endpoint implemented in `src/usersRoute.ts`.
- Completed: safe migration added at `migrations/001_add_trial_expires_at.sql` to add `trial_expires_at` to `users` if missing.
- Completed: trial-expiry enforcement implemented (`expireTrialsForWallet`) and is called from `ensureUser` and the balance endpoint so expiry is applied automatically when users are touched.
