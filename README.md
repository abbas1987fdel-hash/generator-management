# نظام إدارة المولدات الأهلية

React/Vite application connected to Firestore project `abbas-generators`.

## Local preview

Run `npm ci`, then `npm run dev`. Run `npm run lint` and `npx tsx --test tests/data.test.ts` before release.

## Deployment

Push main to deploy GitHub Pages through `.github/workflows/pages.yml`. Deploy Firestore rules separately using the intended project and account.

## Access model

The owner explicitly requested direct access: anyone with the site URL can read and update the shared generator data. There is no Google sign-in screen. Cabin passwords are interface locks, not server-side access control. Rules restrict writes to the single ledger document and require sequential revisions. Other database paths are denied.

The initial ledger has no cabins, subscribers, or receipts. Updates require internet access. Concurrent stale writes are rejected; failed edits can be exported before reload. The current aggregate document is limited to 800 KB; larger deployments need a per-record storage migration.

Firebase web configuration is public client configuration, not an admin credential. Never commit private credentials or CLI logs.
