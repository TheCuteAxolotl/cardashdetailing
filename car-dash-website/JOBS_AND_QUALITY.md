# Jobs & Quality

Open `/owner/jobs` from Operations → Jobs & Quality. Staff use the same page; server-side authorization only returns their assignments. Staff home also links to My assigned jobs.

## Owner setup

1. Open Team setup and create a detailer account with a unique email and a password of at least 12 characters. Share credentials yourself; the application sends no invitation. Employees can change their password in their account.
2. For existing accounts, use Staff & accounts. Grant Assigned jobs and optionally Staff guide. The Detailer template now contains only these permissions. Existing roles and admin grants are not silently changed. Do not grant Bookings, pricing, or customer messaging to detailers who should only perform assigned work.
3. Confirm appointments using the existing booking workflow, then assign each confirmed booking to an eligible employee. Add work/access instructions and select required photo areas. Each selected area requires a before and an after image.
4. Review Awaiting review jobs. Inspect matching photo groups and recorded checklist/notes; choose Approve work or Needs touch-up with feedback.

## Employee workflow

Record existing damage or explicitly state no damage observed. Upload required before photos and save notes before Start job. Complete work, upload matching after photos, and save the completion checklist. Submit for owner review locks notes/photos. A touch-up request reopens the job and clears the checklist; resubmission requires at least one fresh after photo after the request. Original photos remain in the evidence history.

## Controls

- One current assignee per booking. Reassignment revokes the former employee's access to that job.
- Only the owner assigns, reviews, and reopens work. Employees cannot change bookings, prices, addresses, or their assignment through the jobs API.
- Job approval is separate from appointment status. No customer messages, booking confirmations, or booking changes are triggered by this feature.
- Cancelled or pending appointments block work mutations. Missing addresses, schedule fields, employee access and required evidence are flagged.
- Updates use row locking plus version checks. Stale edits return HTTP 409 for refresh/review.
- Photos are stored privately as bounded JPEG bytes, accessed through authenticated, assignment-checked, no-store responses. No public gallery or public blob links are created. Client resizes to 1,600 px; server limits each photo to 1 MB and each job to 60 images.
- Upload time and uploader are recorded. Capture time, location, and authenticity are not independently verified.
- Removing staff permissions immediately blocks future requests. Prefer removing access to deleting an employee account: assigned-job foreign keys preserve the employee relationship. Existing booking deletion can cascade to its job/evidence; use cancellation when retaining history is needed.

## Storage and validation

`DetailJob` and `DetailJobPhoto` are declared in Prisma. Idempotent initialization follows the existing access-control schema pattern; no existing records are rewritten. The database account must allow creation of these tables/indexes on first use. No new service credentials are required.

Run `node --import tsx --test tests/job-workflow.test.ts tests/job-api-access.test.ts tests/booking-safety.test.ts tests/quote-booking.test.ts`, then `npm run build`.

Tests exercise workflow requirements, session/permission gates, private-photo ownership, cross-origin rejection, stale versions, and booking/quote regressions. Database interactions in API tests are mocked. A signed-in production upload/review cycle is still required to verify deployment-specific database permissions and device image handling.
