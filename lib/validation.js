export const STATUSES = ["New", "In Progress", "Resolved"];

export const LIMITS = { name: 100, email: 254, message: 2000 };

// Simple, practical email check: something@something.something, no spaces
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns { valid, errors, value }
// - errors: one message per bad field
// - value: cleaned data (trimmed strings), only meaningful when valid
export function validateEnquiryInput(body) {
  const input = body && typeof body === "object" ? body : {};
  const errors = {};

  const clean = (v) => (typeof v === "string" ? v.trim() : "");
  const name = clean(input.name);
  const email = clean(input.email);
  const message = clean(input.message);

  if (!name) errors.name = "Name is required.";
  else if (name.length > LIMITS.name)
    errors.name = `Name must be at most ${LIMITS.name} characters.`;

  if (!email) errors.email = "Email is required.";
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email))
    errors.email = "Please enter a valid email address.";

  if (!message) errors.message = "Message is required.";
  else if (message.length > LIMITS.message)
    errors.message = `Message must be at most ${LIMITS.message} characters.`;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { name, email, message },
  };
}

export function isValidStatus(status) {
  return STATUSES.includes(status);
}