import StaffQuoteInbox from "@/components/StaffQuoteInbox";
import StaffSmsInbox from "@/components/StaffSmsInbox";

export default function AdminMessagesPage() {
  return <><StaffSmsInbox role="admin" /><StaffQuoteInbox category="messages" backHref="/admin/dashboard" /></>;
}
