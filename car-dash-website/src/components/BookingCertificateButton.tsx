export default function BookingCertificateButton({ booking }: { booking: { id: string; status: string; bookingNumber?: string } }) {
  return <div className="space-y-2">
    {booking.bookingNumber && <p className="break-all text-xs text-[#d6b779]">Booking / invoice: {booking.bookingNumber}</p>}
    {booking.status === "completed" ? <a href={`/api/bookings/${encodeURIComponent(booking.id)}/certificate`} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-[#d6b779]/40 bg-[#d6b779]/10 px-4 py-3 text-center text-sm font-semibold text-[#d6b779]">Print certificate</a> : <button disabled title="Mark this booking completed to print a certificate" className="w-full rounded-lg border border-white/20 px-4 py-3 text-sm text-white/45">Certificate · Complete booking first</button>}
  </div>;
}
