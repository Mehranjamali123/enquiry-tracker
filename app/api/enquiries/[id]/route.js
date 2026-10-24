import { NextResponse } from "next/server";
import { updateStatus } from "@/lib/db";
import { isValidStatus, STATUSES } from "@/lib/validation";

// PATCH /api/enquiries/:id  body: { "status": "In Progress" }
export async function PATCH(request, { params }) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isValidStatus(body?.status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  try {
    const enquiry = updateStatus(id, body.status);
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }
    return NextResponse.json({ enquiry });
  } catch (err) {
    console.error("Failed to update status:", err);
    return NextResponse.json({ error: "Could not update status." }, { status: 500 });
  }
}