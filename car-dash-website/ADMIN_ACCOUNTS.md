# Admin accounts

Owner-only admin management is available at `/owner/admins`.

Admin accounts can:
- View and update bookings
- View support chats, reply, and change ticket status

Admin accounts cannot:
- Edit website text or photos
- Manage gallery, services, reviews, or settings
- Block/unblock visitors
- Delete support chats
- Create or delete admin accounts

The owner can delete an admin account at any time from the Admin Accounts panel. No Prisma schema change is required because `User.role` is already a string field.
