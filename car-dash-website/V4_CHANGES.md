# Car Dash Detailing V4

V4 refreshes the public site around an obsidian / slate / white / electric-cyan visual system and adds the new information architecture requested for Car Dash Detailing.

## Marine pricing
- Added a dedicated Marine Add-Ons section to the Services page.
- Added per-foot, starting, and custom-quote add-on prices.
- Added the marine pricing-condition note and typical 20-foot planning examples.
- Added Marine Add-Ons navigation from the Services menu and footer.

## Estimate copy
- Removed internal/admin wording from the public estimator.
- Customer-facing estimate language now explains that vehicle/boat type and condition affect the planning range and that final pricing is confirmed before booking.

## Explore menu and education pages
- Replaced the single About navigation item with an Explore dropdown.
- Added dedicated About Car Dash, Ceramic Coatings, and Products We Use destinations.
- Ceramic Coatings explains the GYEON Synchro and Gtechniq coating families used by Car Dash.
- Products We Use explains the Koch-Chemie-led detailing system and supporting protection products.

## V4 visual system
- Obsidian Black: #0D0D0D
- Metallic Slate: #4A5568
- Pristine White: #FFFFFF
- Electric Cyan: #00F2FE
- Updated public/customer accent colors, panels, calls-to-action, links, forms, and Google review UI.

## Interaction polish
- Added smoother hover timing and soft lift/glow behavior to rounded buttons and links.
- Added a smoother dropdown entrance for Services and Explore.
- Login and register forms now use the V4 visual system and cyan focus states.
- The floating Need Help launcher is hidden on login, register, booking, estimate, quote/chat, and staff pages where it could obstruct the primary task; Support remains available from the site navigation.

## Preserved from V3.2
- Twilio SMS notifications and consent flow.
- Discord booking/quote notifications.
- Booking chat.
- Exact booking totals and quote-to-booking flow.
- Google Reviews integration.
- Privacy Policy and Terms and Conditions.
- Existing Prisma/database/auth recovery work.

No new Prisma schema migration is required for V4.
