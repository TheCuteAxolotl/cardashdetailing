export type CertificateBooking = {
  serviceName: string; preferredDate: string | null; status: string;
  vehicleYear: string; vehicleMake: string; vehicleModel: string; vehicleTrim: string | null;
  notes: string | null;
};

export function certificateDetails(booking: CertificateBooking, number: string) {
  const addOns = booking.notes?.match(/^Add-ons: (.+)$/m)?.[1];
  return {
    number,
    serviceDate: booking.preferredDate,
    status: booking.status,
    vehicle: [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel, booking.vehicleTrim]
      .filter(part => part && !/^not specified$/i.test(part)).join(" "),
    services: [booking.serviceName, ...(addOns && addOns !== "None" ? [addOns.replace(/\s*\(\+\$[\d.,]+\)/g, "")] : [])],
  };
}
export function escapeCertificateHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
