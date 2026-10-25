# Verification Notes

Manual verification of the assessment checklist (A to H).

- **Date tested:** [FILL IN, e.g. 25 Oct 2026]
- **Environment:** Windows, Node.js v22.13.1, Next.js 16.4.3, `npm run dev`
- **Mock service:** `node mock-ai-service.mjs` on `127.0.0.1:8787`, restarted before the run so attempt counts were clean
- **Rule for the run:** every `[FAIL_ONCE]` and `[INVALID_ONCE]` test used a **new** enquiry, because the mock counts attempts per enquiry id

> **Mark each result honestly.** Change `[ ]` to `[x]` only for checks you actually ran and saw pass. If something failed, write that and what you did about it.

## Summary

| ID | Check | Result |
|---|---|---|
| A | Valid enquiry saves and survives refresh | [ ] PASS  [ ] FAIL |
| B | Empty fields and malformed email rejected by the server | [ ] PASS  [ ] FAIL |
| C | Valid category stored and shown | [ ] PASS  [ ] FAIL |
| D | `[FAIL_ONCE]` preserves the record and shows Failed | [ ] PASS  [ ] FAIL |
| E | Retry recovers without creating a duplicate | [ ] PASS  [ ] FAIL |
| F | `[INVALID_ONCE]` rejected, then recovers on retry | [ ] PASS  [ ] FAIL |
| G | Status changes survive refresh | [ ] PASS  [ ] FAIL |
| H | Status filter returns the correct enquiries | [ ] PASS  [ ] FAIL |

## Details

### A. Valid enquiry saves and survives refresh

1. Submitted the form at `/` with valid data.
2. Opened `/dashboard`, found the enquiry, pressed F5.
3. Also stopped and restarted `npm run dev`, then listed with `curl http://localhost:3000/api/enquiries`.

**Expected:** the enquiry is returned with `status: New` and the same `id` and `createdAt` after refresh and restart.
**Observed:** [FILL IN]

### B. Server rejects empty fields and malformed email

```cmd
curl -i -X POST http://localhost:3000/api/enquiries -H "Content-Type: application/json" -d "{\"name\":\"\",\"email\":\"\",\"message\":\"\"}"
curl -i -X POST http://localhost:3000/api/enquiries -H "Content-Type: application/json" -d "{\"name\":\"Ali\",\"email\":\"not-an-email\",\"message\":\"Hello\"}"
```

**Expected:** `400 Bad Request` with a `fields` object for each. No row is created.
**Observed:** [FILL IN: status line and body]. Confirmed the list endpoint did not gain a new row: [yes / no].

### C. Valid category stored and shown

Message: `Please send pricing for your automation service.`

**Expected:** `category: Sales`, `categorizationState: Completed`, shown on the dashboard.
**Observed:** [FILL IN]

### D. `[FAIL_ONCE]` preserves the record and shows Failed

Message: `[FAIL_ONCE] I have an invoice question.` (new enquiry)

**Expected:** the mock returns HTTP 503. The enquiry is still saved with `category: null` and `categorizationState: Failed`, `status: New`. The dashboard shows a **Retry categorization** button.
**Observed:** [FILL IN]

### E. Retry recovers without creating a duplicate

Clicked Retry on the record from check D.

**Expected:** the same card becomes `Billing` / `Completed`. The Retry button disappears. The list contains exactly one record for that enquiry id (no duplicate).
**Observed:** [FILL IN]. Record count before retry: [n]. After retry: [n].

### F. `[INVALID_ONCE]` rejected, then recovers on retry

Message: `[INVALID_ONCE] My login is broken.` (new enquiry)

**Expected:** the mock returns category `Unexpected`, which is not in the allowed list. The record shows `Failed` with `category: null` (the invalid value is not stored). After retry it becomes `Support` / `Completed`.
**Observed:** [FILL IN]

### G. Status changes survive refresh

Changed an enquiry to `In Progress` with the dashboard dropdown, then pressed F5 and also checked `curl http://localhost:3000/api/enquiries`.

**Expected:** status remains `In Progress`. `category` and `categorizationState` are unchanged by the status update.
**Observed:** [FILL IN]

### H. Status filter returns the correct enquiries

With at least one enquiry in each of New and In Progress:

```cmd
curl "http://localhost:3000/api/enquiries?status=In%20Progress"
curl "http://localhost:3000/api/enquiries?status=New"
```

Also used the dashboard filter dropdown.

**Expected:** each response contains only enquiries with that status, newest first.
**Observed:** [FILL IN]

## Extra error-handling checks

| Check | Expected | Result |
|---|---|---|
| `POST /api/enquiries/does-not-exist/retry` | 404 JSON error | [ ] |
| Retry on a `Completed` record | 409 JSON error | [ ] |
| `PATCH` with status `Done` | 400 JSON error | [ ] |
| `PATCH` on an unknown id | 404 JSON error | [ ] |
| `GET /api/enquiries?status=Bogus` | 400 JSON error | [ ] |
| Mock service stopped, then submit | Enquiry saved, shows `Failed`, no internal error text shown to the user | [ ] |

## Problems found and fixed during testing

- `better-sqlite3` crashed silently on this Windows machine. Switched to Node's built-in `node:sqlite`.
- `export const dynamic = "force-dynamic"` raised a build error under this project's Next.js 16 configuration. Removed it.
- A PATCH request returned an HTML 404 because the route file was not in `app/api/enquiries/[id]/`. Moved it to the correct folder.
- [ADD any others you hit.]

## Not tested / known gaps

- No automated tests (time limit).
- No load, concurrency or browser-compatibility testing.
- [ADD anything else honestly.]
