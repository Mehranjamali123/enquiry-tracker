"use client";

import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: "", email: "", message: "" };

// Client-side checks: fast feedback only. The server re-validates everything.
function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Name is required.";
  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(values.email.trim()))
    errors.email = "Please enter a valid email address.";
  if (!values.message.trim()) errors.message = "Message is required.";
  return errors;
}

export default function EnquiryForm() {
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [state, setState] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setFieldErrors((errs) => ({ ...errs, [name]: undefined })); // clear that field's error
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (state === "loading") return; // block double submit

    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setState("idle");
      return;
    }

    setState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        setValues(EMPTY);
        setState("success");
        return;
      }

      if (res.status === 400 && data.fields) {
        setFieldErrors(data.fields); // show the server's field messages
        setState("idle");
        return;
      }

      setErrorMessage(data.error || "Something went wrong. Please try again.");
      setState("error");
    } catch {
      setErrorMessage("Could not reach the server. Please try again.");
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card">
      <label htmlFor="name">Name</label>
      <input id="name" name="name" value={values.name} onChange={handleChange} />
      {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}

      <label htmlFor="email">Email</label>
      <input id="email" name="email" value={values.email} onChange={handleChange} />
      {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}

      <label htmlFor="message">Message</label>
      <textarea id="message" name="message" rows={5} value={values.message} onChange={handleChange} />
      {fieldErrors.message && <p className="field-error">{fieldErrors.message}</p>}

      <button type="submit" disabled={state === "loading"}>
        {state === "loading" ? "Sending..." : "Send enquiry"}
      </button>

      {state === "success" && (
        <p className="banner success" role="status">
          Thank you! Your enquiry has been received.
        </p>
      )}
      {state === "error" && (
        <p className="banner error" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );


}