# Car Dash V5 — Fixed Pricing Pages + Photos & Media

## New public pricing pages
- `/car-detailing-packages`
- `/exterior-detailing`
- `/interior-detailing`

Each page has a Coupe / Sedan / Truck & SUV selector and shows an exact fixed price for every package.

## Owner customization
Owner Dashboard now has **Pricing Pages** at `/owner/pricing-pages`.
The owner can edit page copy, package names, tier labels, descriptions, badges, exact vehicle-class prices, included items, CTA labels, highlighted packages, order, add packages, and delete packages.

Pricing-page configuration is stored in the existing `SiteContent` table as JSON, so V5 does not require a Prisma schema migration.

## Exact-price booking
Pricing-page booking links carry the selected page, package, and vehicle class into the booking form. The booking API verifies the current package price server-side from `SiteContent` before saving the booking total. Customers cannot change the total simply by editing the displayed price.

## Photos & Media
`/owner/gallery` is relabeled **Photos & Media** and now shows clear destinations in the form `Page → Section → Placement`.

Pricing pages support multiple photos for:
- Hero background
- Intro photo strip
- Every individual package card
- Recent-results section

Package-photo destinations are generated from the package names configured in Owner → Pricing Pages.

## Navigation
Desktop and mobile Services menus now link directly to Car Detailing Packages, Exterior Detailing, Interior Detailing, Car Add-Ons, and the separate Marine Detailing page.
