import Link from "next/link";
import EnquiryForm from "@/components/EnquiryForm";

export default function Home() {
  return (
    <main className="container">
      <h1>Contact us</h1>
      <p className="muted">Send us your enquiry and we will get back to you.</p>
      <EnquiryForm />
      <p className="muted">
        <Link href="/dashboard">Staff dashboard</Link>
      </p>
    </main>
  );
}