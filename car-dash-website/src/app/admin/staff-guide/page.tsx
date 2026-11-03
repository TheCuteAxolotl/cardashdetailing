import StaffGuidePage from "@/app/staff-guide/page";

// The underlying guide enforces its existing server-side staffGuide permission.
export const dynamic = "force-dynamic";
export default function StaffGuideWorkspacePage() {
  return <StaffGuidePage />;
}
