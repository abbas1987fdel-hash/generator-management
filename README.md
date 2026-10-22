# نظام إدارة المولدات الأهلية

React/Vite application connected to Firestore project `abbas-generators`.

## Local preview

Run `npm ci`, then `npm run dev`. Run `npm run lint` and `npx tsx --test tests/data.test.ts` before release.

## Deployment

Push main to deploy GitHub Pages through `.github/workflows/pages.yml`. Deploy Firestore rules separately using the intended project and account.

## Access model

The owner explicitly requested direct access: anyone with the site URL can read and update the shared generator data. There is no Google sign-in screen. The global entry code is an interface lock, not server-side access control. Cabin password prompts have been removed. Rules restrict writes to the single ledger document and require sequential revisions. Other database paths are denied.

The initial ledger has no cabins, subscribers, or receipts. Updates require internet access. Concurrent stale writes are rejected; failed edits can be exported before reload. The current aggregate document is limited to 800 KB; larger deployments need a per-record storage migration.

Firebase web configuration is public client configuration, not an admin credential. Never commit private credentials or CLI logs.

## Install, update, and offline operation

- Version: package.json. Increment with npm version patch --no-git-tag-version before a release. Vite generates sw.js from the built assets and version; the user accepts an update before activation/reload.
- Publish compatible firestore.rules before Pages. The offline commit protocol adds lastMutationId to the ledger document to make retries idempotent. Never deploy the offline client against the older rules.
- The install/skip panel uses the supplied brand and real 192/512 PNG icons. Native installation depends on browser support; unsupported/in-app browsers show manual instructions.
- Open once online on each device. IndexedDB stores both the last server baseline and local pending changes. Service worker caches only the same-origin app shell, never Firebase requests.
- Data writes are saved locally before a cloud transaction. Offline writes sync on reconnect, with a one-minute retry for pending work. The app fetches on first open, reconnect, manual sync, and return to the foreground after at least one minute. There is no permanent Firestore snapshot listener or idle database polling.
- Separate-record changes can merge. Conflicting records or concurrent cleanup stop synchronization and preserve the local draft. Export the draft before explicitly choosing the cloud version; reconciliation from the export is manual.
- One active editing tab per browser origin/project is enforced with Web Locks. Close the other tab to edit from another tab.
- Do not erase browser site storage while unsynced changes exist. Local storage is device-specific, is not a replacement for backups, and is cleared when the user clears site data.
- Updating preserves IndexedDB. The update action is disabled during local writes, synchronization, or conflict. Unsubmitted form fields must be saved before applying an update.
- Storage meter measures the existing 800,000-byte ledger guard, not Firebase's billing quota. Offline caching reduces reads; it cannot make storage or quotas unlimited.

Validation: unit/integration tests include offline restart, lost acknowledgement retry, conflicts, storage failure, and install icon dimensions. Isolated browser tests use .review (excluded from Git), never customer data.
