import http from "node:http";

const PORT = 8787;
const attempts = new Map(); // enquiryId -> number of attempts (reset on restart)

function classify(text) {
  const t = text.toLowerCase();
  if (/(pricing|price|quote|demo|buy|purchase)/.test(t)) return "Sales";
  if (/(invoice|refund|payment|billing|charge)/.test(t)) return "Billing";
  if (/(login|broken|error|bug|help|issue|support)/.test(t)) return "Support";
  return "Other";
}

function send(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/categorize") {
    return send(res, 404, { error: "Not found" });
  }
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return send(res, 400, { error: "Invalid JSON" });
    }
    const { enquiryId, message } = data || {};
    if (typeof enquiryId !== "string" || typeof message !== "string") {
      return send(res, 400, { error: "enquiryId and message are required" });
    }

    const attempt = (attempts.get(enquiryId) || 0) + 1;
    attempts.set(enquiryId, attempt);

    if (message.includes("[FAIL_ONCE]") && attempt === 1) {
      return send(res, 503, { error: "Temporary failure" });
    }
    if (message.includes("[INVALID_ONCE]") && attempt === 1) {
      return send(res, 200, { category: "Unexpected" });
    }
    return send(res, 200, { category: classify(message) });
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Mock AI service listening on http://127.0.0.1:${PORT}/categorize`);
});