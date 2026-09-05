# Database and access model

| Collection | Relationship |
| --- | --- |
| users/{uid} | role: administrator or client; clientId: organisation document ID or null |
| clients/{clientId} | Organisation profile and optional createdAt timestamp |
| projects/{projectId} | Required clientId; name, description, status, due, progress |
| content/{resourceId} | Required clientId and projectId; title, type, description, externalUrl, thumbnailUrl; optional quoteText and quoteAuthor |
| activities | Administrator-only internal notes |

The display-only client name is not an access boundary. All joins and queries use document IDs. Photo remains supported for older records; new Image and Other resource types are also available.

## Provisioning

Bootstrap Jay in the Firebase console by setting his existing users/{uid} profile to role administrator and clientId null. Clients cannot promote themselves. In Clients, Jay can create a login and assign its organisation, or assign an existing self-signup account. Self-signup always starts as client with no organisation. Removing an assignment immediately revokes access on subsequent server requests.

## Rules

Deploy firestore.rules before granting client access. Rules restrict client reads to the assigned existing organisation and its scoped projects/content, deny client writes, prevent self-assignment/role changes, validate project ownership when resources are saved, and prevent projects/resources moving across organisations. Profile owners may update only displayName/contact/photoURL. Roles are bootstrapped outside this UI.

Firebase enforces query rules on the server; filtering in React alone is insufficient. See [Firebase security-rule conditions](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Existing data

Before deployment, audit existing projects for a valid clientId and content for a valid clientId/projectId pair. No automatic reassignment by organisation name is performed because duplicate names could expose another client's work. Existing content without a project remains visible in the scoped content library; Jay can edit it to assign the correct project. Existing mismatched clientId/projectId records must be corrected using a trusted administrative migration before real client access is enabled.

No live migration is run by this change. Existing seed behaviour remains: an empty database gets starter organisations/projects on the first administrator visit. Organisation creation now records createdAt; older records display Not recorded instead of a fabricated start date.

## Boundaries

External share links retain the host's own access policy. Dashboard permissions do not make a public YouTube/Drive/Dropbox link private. Configure the original provider's sharing permissions for confidential resources.

Deletion batches are atomic for the records queried. Concurrent administrative creation during deletion can require orphan cleanup; a trusted backend transaction/workflow is the next step for high-concurrency production use. Very large batches are refused before any write. Organisation deletion unassigns profiles but does not delete Firebase Authentication users or hosted files.

The checked-in rules require separate deployment and emulator/live validation. Browser unit tests cannot prove production database policy.
