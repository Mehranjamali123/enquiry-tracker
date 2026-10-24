import Link from "next/link";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  return (
    <main className="container">
      <h1>Enquiry dashboard</h1>
      <p className="muted">
        <Link href="/">Back to enquiry form</Link>
      </p>
      <Dashboard />
    </main>
  );
}