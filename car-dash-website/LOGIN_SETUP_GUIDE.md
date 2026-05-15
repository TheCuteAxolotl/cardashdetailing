# Login & Owner Management System Setup Guide

## Overview
Your Car Dash Detailing website now includes a complete authentication system with owner management features. Users can register and login, and owners can manage their business content including services, pricing, images, and reviews.

## Features

### User Features
- **Registration**: Users can create an account on the site
- **Login/Logout**: Secure authentication with JWT tokens
- **Profile**: Users can view and update their profile information
- **Bookings**: Users can make booking requests

### Owner Features (Admin Access)
- **Dashboard**: Central hub for all management features
- **Services Management**: Edit service descriptions and prices
- **Gallery Management**: Upload and manage gallery images
- **Reviews Management**: Approve or reject customer reviews before they appear
- **Bookings Management**: View and manage all booking requests
- **Settings**: Update account information

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

This will install:
- `@prisma/client` - Database ORM
- `next-auth` - Authentication
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens

### 2. Set Up Database

The project uses SQLite for a file-based database. Prisma will handle the database setup:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the SQLite database file (dev.db)
- Create all necessary tables
- Set up the database schema

### 3. Environment Variables

Update `.env.local` with your configuration:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

For production:
- Change `NEXTAUTH_SECRET` to a secure random string
- Update `NEXTAUTH_URL` to your production domain
- Consider using a production database

### 4. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your site.

## User Registration & Login

### Register as a Regular User
1. Go to `/register`
2. Fill in your details (name, email, password)
3. Leave "Register as business owner" unchecked
4. Click "Create Account"
5. You'll be redirected to the home page

### Register as an Owner
1. Go to `/register`
2. Fill in your details (name, email, password)
3. Check "Register as business owner"
4. Click "Create Account"
5. You'll be redirected to the owner setup page

### Login
1. Go to `/login`
2. Enter your email and password
3. Click "Sign In"
4. If you're an owner, you'll be redirected to the dashboard
5. If you're a regular user, you'll go to the home page

### Logout
Click the "Logout" button in the header

## Owner Dashboard Features

### Services Management (`/owner/services`)
- View all current services
- **Edit**: Click "Edit" to update service title, description, or price
- **Delete**: Remove a service (use with caution!)
- All changes are saved to the database

### Gallery Management (`/owner/gallery`)
- View all uploaded images
- **Add New Image**: Click button to add a new image
  - Enter image URL
  - Add a title
  - Select category (Gallery, Before & After, Portfolio)
  - Images are immediately available
- **Delete**: Remove images that are no longer needed

### Reviews Management (`/owner/reviews`)
- **Pending Reviews**: Shows reviews waiting for approval
  - **Approve**: Click to make review visible on the site
  - **Reject**: Click to delete the review
- **Approved Reviews**: Shows accepted reviews (displayed on the site)
- Reviews section organized by status

### Bookings Management (`/owner/bookings`)
- View all customer booking requests
- **Filter by Status**: 
  - All
  - Pending (new requests)
  - Confirmed (customer confirmed)
  - Completed (service finished)
  - Cancelled (cancelled requests)
- **Change Status**:
  - Pending → Confirm or Cancel
  - Confirmed → Mark Completed or Cancel
  - Completed/Cancelled (read-only, cannot be changed)
- Shows customer name, email, service name, date, and notes

### Settings (`/owner/settings`)
- View account email
- Update full name
- View account type and member status

## Database Schema

The system uses the following tables:

### User
```
- id (unique identifier)
- email (unique, for login)
- password (hashed)
- name (full name)
- role (user or owner)
- createdAt, updatedAt
```

### Service
```
- id (unique identifier)
- title (service name)
- description (service details)
- price (numeric)
- image (optional image URL)
- createdAt, updatedAt
```

### Image
```
- id (unique identifier)
- url (image URL)
- title (display name)
- category (gallery, before-after, portfolio)
- createdAt, updatedAt
```

### Review
```
- id (unique identifier)
- name (reviewer name)
- email (reviewer email)
- rating (1-5 stars)
- comment (review text)
- approved (boolean - whether to display)
- createdAt, updatedAt
```

### Booking
```
- id (unique identifier)
- userId (customer user ID)
- serviceName (service requested)
- date (preferred date)
- notes (customer notes)
- status (pending, confirmed, completed, cancelled)
- createdAt, updatedAt
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/update-profile` - Update user profile

### Services
- `GET /api/services` - List all services
- `POST /api/services` - Create service (owner only)
- `PUT /api/services/[id]` - Update service (owner only)
- `DELETE /api/services/[id]` - Delete service (owner only)

### Images
- `GET /api/images` - List all images
- `POST /api/images` - Add image (owner only)
- `DELETE /api/images/[id]` - Delete image (owner only)

### Reviews
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/[id]` - Approve/reject review (owner only)
- `DELETE /api/reviews/[id]` - Delete review

### Bookings
- `GET /api/bookings` - List bookings (owner only)
- `PUT /api/bookings/[id]` - Update booking status (owner only)

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs before storage
- **JWT Tokens**: Secure token-based authentication
- **HTTP-Only Cookies**: Auth tokens stored in secure HTTP-only cookies
- **CSRF Protection**: Built-in protection against cross-site requests

## Troubleshooting

### Database Issues
If you see database errors, try:
```bash
rm prisma/dev.db
npx prisma migrate dev --name init
```

### Authentication Not Working
1. Check that cookies are enabled in your browser
2. Verify `.env.local` has correct `NEXTAUTH_SECRET`
3. Clear browser cache and cookies

### Can't Access Owner Dashboard
1. Make sure you registered as an owner (checked the checkbox)
2. Verify you're logged in (check header for your name)
3. Owner routes will redirect non-owners to home page

## Next Steps

To extend this system:

1. **Email Notifications**: Add email to send booking confirmations
2. **Payment Processing**: Integrate Stripe for online payments
3. **Calendar Integration**: Connect to calendar for availability
4. **Analytics**: Track bookings and revenue
5. **Custom Styling**: Modify the Tailwind CSS classes
6. **Mobile App**: Build a mobile version with React Native

## Support

For issues or questions:
1. Check the existing code comments
2. Review the database schema in `prisma/schema.prisma`
3. Check API route implementations in `src/app/api/`
4. Review component implementations in `src/app/` and `src/components/`

---

Happy managing! 🚗✨
