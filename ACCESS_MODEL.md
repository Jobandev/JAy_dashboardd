# Access model

The portal has two production roles, stored in `users/{uid}` in Firestore.

| Role | Scope | Permissions |
| --- | --- | --- |
| `administrator` | Every organisation | Manage clients, projects, content, activity, and user assignments. |
| `client` | The organisation in `clientId` | Read only that organisation, its projects, and its content. |

Every project and content record must contain a `clientId`. This is the organisation boundary used by both the React data subscriptions and `firestore.rules`; a client browser only subscribes to records where `clientId` matches its own user profile.

## Provisioning a client

1. Have the contact create an account.
2. As an administrator, update their `users/{uid}` document in Firestore:

   ```json
   { "role": "client", "clientId": "wolfgramm-holdings" }
   ```

3. The client’s dashboard will open on `/clients/wolfgramm-holdings`, and the navigation will expose only My organisation, Content library, and Projects.

## First administrator

Before deploying the Firestore rules, create Jay’s `users/{uid}` document with `{ "role": "administrator", "clientId": null }` through the Firebase console or an Admin SDK script. Firestore rules intentionally do not let a user grant themselves administrator access.
