# Car Dash Owner/Admin quick guide

Admin URL: `/login`

After signing in as the configured owner, use `/owner/dashboard`.

## Photos
Owner Dashboard > Gallery lets you:
- upload a photo from your computer/phone
- set title
- choose Gallery, Before & After, Portfolio, or Homepage Hero
- change a photo's placement later
- rename and delete photos

The newest `Homepage Hero` photo becomes the main homepage photo. Other uploaded photos automatically appear in the homepage gallery and `/gallery`.

## Bookings
The booking form now submits FormData correctly and the owner Bookings page displays the customer, phone, email, vehicle, selected service, method, preferred date/time, conditions, add-ons, and notes.

## Owner credentials
Never hard-code the password in the repository. Configure the owner account with environment variables and run the seed command as described in `SETUP_FOR_VERCEL.md`.
