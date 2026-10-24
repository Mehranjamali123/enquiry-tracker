import { markCategorized, markCategorizationFailed } from "@/lib/db";
import { categorize } from "@/lib/categorizer";

// Used by both POST (first attempt) and retry. Always updates the EXISTING record.
export async function categorizeAndSave(enquiry) {
  const result = await categorize({ id: enquiry.id, message: enquiry.message });

  if (result.ok) {
    return markCategorized(enquiry.id, result.category);
  }

  console.error(`Categorization failed for ${enquiry.id}: ${result.reason}`); // server log only
  return markCategorizationFailed(enquiry.id);
}