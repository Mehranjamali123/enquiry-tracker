import { NextResponse } from "next/server";
import { createEnquiry, listEnquiries } from "@/lib/db";
import { validateEnquiryInput, isValidStatus } from "@/lib/validation";
import { categorizeAndSave } from "@/lib/enquiry-service";

// POST /api/enquiries -> validate, SAVE (New/Pending), THEN categorize
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { valid, errors, value } = validateEnquiryInput(body);
  if (!valid) {
    return NextResponse.json({ error: "Validation failed.", fields: errors }, { status: 400 });
  }

  // 1. Persist first. If this fails, we must NOT report success.
  let saved;
  try {
    saved = createEnquiry(value);
  } catch (err) {
    console.error("Failed to save enquiry:", err);
    return NextResponse.json(
      { error: "Could not save your enquiry. Please try again." },
      { status: 500 }
    );
  }

  // 2. Categorize. A failure here never loses the enquiry.
  let final = saved;
  try {
    final = await categorizeAndSave(saved);
  } catch (err) {
    console.error("Unexpected error while categorizing:", err);
  }

  return NextResponse.json({ enquiry: final }, { status: 201 });
}

// GET /api/enquiries?status=New -> newest first, filter optional
export async function GET(request) {
  const status = new URL(request.url).searchParams.get("status");

  if (status && !isValidStatus(status)) {
    return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  }

  try {
    return NextResponse.json({ enquiries: listEnquiries(status || undefined) });
  } catch (err) {
    console.error("Failed to list enquiries:", err);
    return NextResponse.json({ error: "Could not load enquiries." }, { status: 500 });
  }
}