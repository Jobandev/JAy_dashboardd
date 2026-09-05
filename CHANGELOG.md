# Requested dashboard changes - 5 September 2026

Built on the existing dashboard and preserved the pre-existing work in the workspace.

## Completed implementation

1. **Client dashboard:** assigned organisation, all projects, grouped project resources, unassigned-account welcome state and missing/empty states.
2. **Client isolation:** live profile subscriptions; clear old data when accounts or assignments change; scoped Firestore subscriptions; updated server rules preventing client writes, self-promotion and mismatched resource ownership.
3. **Admin accounts:** create a client login without signing Jay out; assign or unassign existing client accounts from Clients.
4. **Client CRUD:** create/edit profiles, timestamps, accurate deletion confirmation, atomically remove related projects/resources and unassign accounts.
5. **Project CRUD:** expose Edit; update descriptions, due dates and all statuses; preserve progress controls; navigate directly to project resources; delete related resources with confirmation.
6. **Resource CRUD:** client-filtered project selection, relationship validation, edit/replace links, assign legacy resources to projects, edit testimonial text, Image and Other types while preserving Photo compatibility.
7. **Viewer:** high-contrast Close control above embedded media, backdrop and Escape exit, focus restoration, uninterrupted pause/resume, image and testimonial display, original-resource link fallback.
8. **Usability:** save notifications, disabled submit buttons while saving, search/empty states, back-to-clients navigation, scrollable mobile forms and wrapping actions, generic form Escape/backdrop dismissal.
9. **Database safeguards:** atomic deletion size guard, protect populated starter organisations from demo-data cleanup, validate parent records including same-batch seed creation.
10. **Documentation:** README setup/testing/deployment instructions and updated database/access model with migration notes.

## Verification

- Final production build passed (Vite reports the existing large JavaScript bundle warning).
- All 20 regression tests passed across five test files: resource validation, viewer interactions, account isolation, resource forms and deletion.
- git diff --check passed. Deletion tests cover cascading removal, account unassignment, oversized batches and query failure before writes.
- No production records were created, edited, migrated or deleted during implementation.
- Live Firebase security rules, real-account browser flows and Vercel deployment require authenticated project access; no local Firebase/Vercel CLI login was found. Rules must be deployed separately from the frontend.

## Remaining production checks

Audit old content for correct clientId/projectId values, deploy/test Firestore rules with two client accounts, run the README desktop/mobile checklist, and verify the production deployment. External resource providers retain their own sharing permissions. Authentication-account deletion is not part of organisation deletion.

## Button and account-list polish

- Back to clients is a compact outlined button with an arrow.
- Resource cards use responsive widths and wrapping actions so Delete remains visible.
- Long organisation names no longer squeeze Edit/Delete/New project buttons.
- Account dropdowns match the dark theme; Save access and Delete access align and wrap on mobile.
- Delete access confirms removal, clears organisation assignment and archives the portal profile. Firebase Authentication logins are retained; organisation/project records are untouched. No new Firestore rule deployment is required for this action.

## Navigation and client project panels

- Dashboard summary cards link to Clients, Projects and Content library.
- Entire client rows are keyboard-accessible profile links, including contact/status areas.
- Project names and Edit/Delete controls fit inside the client profile panel using a responsive two-column layout.

## Client contact numbers

- Added contact number fields when creating and editing an organisation.
- Added contact number when creating a client login and showed it in the account list.
- Organisation profiles display the saved contact number.
