import { NextResponse } from "next/server";
import { getEnquiry } from "@/lib/db";
import { categorizeAndSave } from "@/lib/enquiry-service";

// POST /api/enquiries/:id/retry -> retry categorization for a Failed record
export async function POST(_request, { params }) {
  const { id } = await params; // params is a Promise in Next 15/16

  try {
    const enquiry = getEnquiry(id);
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }
    if (enquiry.categorizationState !== "Failed") {
      return NextResponse.json(
        { error: "Only enquiries with failed categorization can be retried." },
        { status: 409 }
      );
    }

    const updated = await categorizeAndSave(enquiry); // same id, UPDATE not INSERT
    return NextResponse.json({ enquiry: updated });
  } catch (err) {
    console.error("Retry failed unexpectedly:", err);
    return NextResponse.json({ error: "Could not retry categorization." }, { status: 500 });
  }
}