# Jay Downes Client Dashboard

React/Vite dashboard backed by Firebase Authentication and Firestore.

## Run locally

1. Install Node.js 20.19+ and run `npm install`.
2. Copy `.env.example` to `.env` and supply the Firebase web app configuration. Do not commit environment files.
3. Enable Email/Password sign-in in Firebase Authentication and add the local and deployed domains to authorised domains.
4. Bootstrap Jay's administrator profile and deploy the rules as described in [ACCESS_MODEL.md](ACCESS_MODEL.md).
5. Run `npm run dev`. Use `npm test` for regression tests and `npm run build` for a production build. `npm run preview` serves that build.

## Administrator view

Clients contains organisation profiles plus **Client logins and access**. Create the organisation first, then create a client login using an initial password, or assign a contact who has already signed up. Account creation uses a separate in-memory Auth instance so Jay stays signed in. No invitation emails are sent automatically. Share credentials privately; clients can use Forgot password to choose their own password.

Open an organisation to edit its details, create projects and add resources. Project rows offer Edit, status/progress controls, Delete and navigation to project resources. Resources support editing their title, description, type, project, link, thumbnail and testimonial text. Replacing a resource link updates both legacy and current URL fields.

Client/project deletion asks for confirmation and atomically removes related database records. Organisation deletion also unassigns client accounts; their Authentication logins remain available but have no organisation access. Original files hosted on external services are not deleted. Large deletions (450+ related records) fail without partially deleting data; remove smaller projects first or use a trusted administrative migration.

## Client view

Login opens the assigned organisation, all its projects and resources grouped under each project. Unassigned accounts see a clear waiting message. Clients cannot access admin routes or mutation controls. Assignment changes update live and remount the data provider, clearing the previous account's data. The content library remains a searchable secondary view.

The resource viewer has a visible Close button, Escape and backdrop exit, focus restoration, image previews, video controls, text testimonials and a link to the original resource. Escape events inside third-party embedded players may be handled by the provider; the visible Close button remains available.

## Deployment

Run tests and build before release. Deploy Firestore rules separately from Vercel:

`npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID`

For Vercel, connect this GitHub repository, use framework Vite, build command `npm run build`, output directory `dist`, and configure the same VITE_FIREBASE_* environment variables. The included vercel.json supports deep links. Push to the connected production branch, or run `npx vercel --prod` after linking the correct project. A Vercel build does not deploy Firebase rules.

## Review checklist

- As Jay, create an organisation and login, create/edit a project and all resource types, replace a link, cancel deletion, then confirm deletion on disposable data.
- Sign in as two clients in separate browser profiles. Each must see only its own organisation/projects/resources, including direct routes and Firestore requests. Verify an unassigned client sees no organisation data.
- Reassign a signed-in client and confirm old data disappears. Sign out and switch accounts in the same tab.
- At desktop and mobile widths, open/close a video via Close, backdrop and Escape; pause/resume without restarting; check image/document/link/testimonial previews.
- Confirm saves show feedback and empty/search states are understandable.

Automated UI tests use mocked authentication/data. They do not replace Firebase Emulator or live-account verification of deployed security rules. See [CHANGELOG.md](CHANGELOG.md) for the implementation list and verification status.
