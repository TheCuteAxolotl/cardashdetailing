import StaffQuoteInbox from "@/components/StaffQuoteInbox";
import StaffSmsInbox from "@/components/StaffSmsInbox";

export default function OwnerMessagesPage() {
  return <><StaffSmsInbox role="owner" /><StaffQuoteInbox category="messages" backHref="/owner/dashboard" canDelete /></>;
}
