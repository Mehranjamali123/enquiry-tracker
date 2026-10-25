import { markCategorized, markCategorizationFailed } from "@/lib/db";
import { categorize } from "@/lib/categorizer";

// Used by both POST (first attempt) and retry. Always updates the EXISTING record.
// Any failure, expected or not, ends as Failed so the record can be retried
// (it must never be left stuck on Pending).
export async function categorizeAndSave(enquiry) {
  try {
    const result = await categorize({ id: enquiry.id, message: enquiry.message });

    if (result.ok) {
      return markCategorized(enquiry.id, result.category);
    }

    console.error(`Categorization failed for ${enquiry.id}: ${result.reason}`); // server log only
  } catch (err) {
    console.error(`Unexpected categorization error for ${enquiry.id}:`, err); // server log only
  }

  return markCategorizationFailed(enquiry.id);
}
