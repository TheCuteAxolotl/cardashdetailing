# Closed support chat deletion

Owner Support Inbox now allows permanent deletion of a support ticket only after its status is set to `closed`.

Security behavior:
- DELETE `/api/support/[id]` is owner-only.
- The API refuses to delete tickets that are not closed.
- Deleting a ticket also deletes its support messages through the existing Prisma cascade relation.
- No Prisma schema migration is required for this feature.
