# Account-bound private support

Support is now account-only.

- Visitors must be logged in before they can create or view support chats.
- New support tickets are cryptographically bound to the authenticated account.
- A normal customer can only list/read/reply to tickets created by that same account.
- The owner account can view and reply to all support tickets through `/owner/support`.
- Anonymous localStorage access keys are no longer used by the customer widget.
- Existing anonymous tickets remain visible to the owner, but are not exposed to customer accounts.
- New customer replies also notify the configured Discord support webhook.

This implementation reuses `SupportTicket.accessKeyHash` for the account-binding hash, so no database schema migration is required for this change.
