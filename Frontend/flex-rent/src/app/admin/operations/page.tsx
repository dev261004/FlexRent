import { PageHeader } from "@/components/admin/PageHeader";
import { OperationsTable } from "@/components/rental/OperationsTable";
export default function AdminOperationsPage() { return <div><PageHeader title="Pickup & Return" description="Live customer bookings across all vendors. Update equipment handoffs as they happen."/><OperationsTable/></div>; }
