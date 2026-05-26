/**
 * End-to-end API binding test for Darotech backend.
 * Run: node scripts/api-integration-test.mjs
 */
const BASE = process.env.API_BASE ?? "http://localhost:5000/api/v1";
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? "admin@darotech.com";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "admin123";

let passed = 0;
let failed = 0;
let token = "";
let refreshCookie = "";

function fail(name, err) {
  failed++;
  console.log(`  FAIL  ${name}: ${err}`);
}

function pass(name) {
  passed++;
  console.log(`  OK    ${name}`);
}

async function req(path, { method = "GET", body, auth = false, blob = false } = {}) {
  const headers = {};
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (blob) {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? res.statusText);
    }
    return { res, blob: await res.blob() };
  }
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) {
    if (c.startsWith("refreshToken=")) refreshCookie = c.split(";")[0];
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? res.statusText);
  return json;
}

async function run() {
  console.log(`\nAPI integration tests → ${BASE}\n`);

  try {
    const health = await fetch("http://localhost:5000/health").then((r) => r.json());
    if (!health.ok) throw new Error("health check failed");
    pass("GET /health");
  } catch (e) {
    fail("GET /health", e.message);
    console.log("\nBackend not running on :5000. Start with: npm run dev\n");
    process.exit(1);
  }

  // Public reads
  for (const [name, path] of [
    ["GET /settings (public)", "/settings"],
    ["GET /services (public)", "/services?page=1&limit=5"],
    ["GET /packages (public)", "/packages?page=1&limit=5"],
    ["GET /blogs (public)", "/blogs?page=1&limit=5&status=Published"],
  ]) {
    try {
      const j = await req(path, { auth: false });
      if (!j.success || !j.data) throw new Error("bad envelope");
      pass(name);
    } catch (e) {
      fail(name, e.message);
    }
  }

  // Public lead create
  let leadId;
  try {
    const j = await req("/leads", {
      method: "POST",
      auth: false,
      body: {
        name: "API Test User",
        email: `test-${Date.now()}@example.com`,
        phone: "9999999999",
        service: "Website Development",
        source: "Contact Form",
        budget: "₹2–5 lakh",
        notes: "integration test",
      },
    });
    leadId = j.data?._id ?? j.data?.id;
    if (!leadId) throw new Error("no lead id");
    pass("POST /leads (contact form)");
  } catch (e) {
    fail("POST /leads (contact form)", e.message);
  }

  // Chatbot
  try {
    const j = await req("/chatbot/message", {
      method: "POST",
      auth: false,
      body: { message: "What services do you offer?" },
    });
    if (!j.data?.reply) throw new Error("no reply");
    pass("POST /chatbot/message");
  } catch (e) {
    fail("POST /chatbot/message", e.message);
  }

  // Payment order (Manual)
  let paymentId;
  try {
    const j = await req("/payments/order", {
      method: "POST",
      auth: false,
      body: {
        amount: 41300,
        customerName: "API Test User",
        email: `pay-${Date.now()}@example.com`,
        phone: "9999999999",
        service: "Website Development",
        pkg: "Standard",
        gateway: "Manual",
      },
    });
    paymentId = j.data?.payment?._id ?? j.data?.payment?.id;
    if (!paymentId) throw new Error("no payment id");
    pass("POST /payments/order (Manual)");
  } catch (e) {
    fail("POST /payments/order (Manual)", e.message);
  }

  // Login
  try {
    const j = await req("/auth/login", {
      method: "POST",
      auth: false,
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    token = j.data?.accessToken;
    if (!token) throw new Error("no access token");
    pass(`POST /auth/login (${ADMIN_EMAIL})`);
  } catch (e) {
    fail("POST /auth/login", e.message);
    console.log("\n  Hint: run seed — node src/utils/seedDatabase.js\n");
  }

  if (!token) {
    console.log(`\n${passed} passed, ${failed} failed (stopped — no auth token)\n`);
    process.exit(1);
  }

  // Authenticated flows
  const authed = [
    ["GET /auth/me", "/auth/me"],
    ["GET /leads", "/leads?page=1&limit=5"],
    ["GET /payments", "/payments?page=1&limit=5"],
    ["GET /reports/summary", "/reports/summary"],
    ["GET /reports/leads/by-status", "/reports/leads/by-status"],
    ["GET /settings/admin", "/settings/admin"],
    ["GET /media", "/media?page=1&limit=5"],
  ];
  for (const [name, path] of authed) {
    try {
      const j = await req(path, { auth: true });
      if (!j.success) throw new Error("bad envelope");
      pass(name);
    } catch (e) {
      fail(name, e.message);
    }
  }

  if (leadId) {
    try {
      const j = await req(`/leads/${leadId}`, {
        method: "PATCH",
        auth: true,
        body: { status: "Contacted" },
      });
      if (j.data?.status !== "Contacted") throw new Error("status not updated");
      pass("PATCH /leads/:id (status)");
    } catch (e) {
      fail("PATCH /leads/:id (status)", e.message);
    }
  }

  try {
    const { blob } = await req("/leads/export/csv", { auth: true, blob: true });
    if (blob.size < 10) throw new Error("empty csv");
    pass("GET /leads/export/csv");
  } catch (e) {
    fail("GET /leads/export/csv", e.message);
  }

  if (paymentId) {
    try {
      const j = await req(`/payments/${paymentId}`, {
        method: "PATCH",
        auth: true,
        body: { status: "Paid", paymentDate: new Date().toISOString() },
      });
      if (j.data?.status !== "Paid") throw new Error("not paid");
      pass("PATCH /payments/:id (mark paid)");
    } catch (e) {
      fail("PATCH /payments/:id (mark paid)", e.message);
    }

    try {
      const { blob } = await req(`/payments/${paymentId}/invoice`, { auth: true, blob: true });
      if (blob.size < 100) throw new Error("pdf too small");
      pass("GET /payments/:id/invoice (PDF)");
    } catch (e) {
      fail("GET /payments/:id/invoice (PDF)", e.message);
    }
  }

  // Service slug (public)
  try {
    const list = await req("/services?page=1&limit=1&status=Published", { auth: false });
    const slug = list.data?.items?.[0]?.slug;
    if (!slug) throw new Error("no published service");
    const j = await req(`/services/slug/${slug}`, { auth: false });
    if (!j.data?.slug) throw new Error("slug lookup failed");
    pass(`GET /services/slug/${slug}`);
  } catch (e) {
    fail("GET /services/slug/:slug", e.message);
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
