/**
 * Local-only mobile audit. API calls are mocked — nothing is written to production.
 * Usage: node scripts/mobile-audit.mjs before|after
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
function loadChromium() {
  try {
    return require("playwright").chromium;
  } catch {
    if (process.env.PLAYWRIGHT_MODULE) return require(process.env.PLAYWRIGHT_MODULE).chromium;
    throw new Error("Install playwright, or set PLAYWRIGHT_MODULE to its package path.");
  }
}
const chromium = loadChromium();
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const phase = process.argv[2] === "after" ? "after" : "before";
const outDir = path.resolve("docs/mobile-audit", phase);
await mkdir(outDir, { recursive: true });

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const token = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({
  sub: "demo-owner",
  role: "owner",
  isOwner: true,
  name: "Demo Owner",
  exp: 9999999999,
})}.local`;

const PG = {
  id: "pg-demo",
  name: "Shivam Residency",
  address: "12 Koramangala 4th Block, Bengaluru",
  city: "Bengaluru",
};

const TENANT = {
  id: "t1",
  name: "Aarav Sharma",
  phone: "9876543210",
  mobileNumber: "9876543210",
  monthlyRent: 8500,
  roomNumber: "101",
  bedNumber: "2",
  kycStatus: "verified",
  kycVerified: true,
  createdAt: "2025-06-01T00:00:00.000Z",
  roomTenant: {
    id: "rt1",
    rentAmount: 8500,
    startDate: "2025-06-01",
    roomNumber: "101",
    bedNumber: 2,
  },
};

function mockBody(url, method) {
  const u = url.toLowerCase();
  if (method !== "GET" && method !== "HEAD") {
    return { success: true, message: "mocked", data: {} };
  }
  if (u.includes("/plans/current")) {
    return {
      currentPlan: { id: "pro", name: "Pro", displayName: "Pro" },
      subscriptionStatus: "pro",
      expiresAt: "2027-06-01T00:00:00.000Z",
      daysRemaining: 180,
      subscription: { status: "PRO", planName: "Pro", planDisplayName: "Pro" },
      bedsUsage: { used: 12, max: 100 },
    };
  }
  if (u.includes("/my-features")) {
    const featuresMap = {
      wifi_management: true,
      lead_crm: true,
      aadhaar_kyc: true,
      expense_tracking: true,
      staff_roles_permissions: true,
      advanced_reports: true,
      audit_logs: true,
      food_menu_planner: true,
      nightout_guest_requests: true,
      digital_notice_board: true,
      notice_period_tracker: true,
    };
    return {
      planName: "Pro",
      planDisplayName: "Pro",
      isDefault: false,
      features: Object.keys(featuresMap).map((featureKey) => ({ featureKey, enabled: true })),
      featuresMap,
      subscription: { status: "PRO", planName: "Pro" },
    };
  }
  if (u.includes("/me")) {
    return { id: "demo-owner", name: "Demo Owner", email: "owner@example.com", mobileContactNumber: "9000000000" };
  }
  if (u.includes("/properties") && !u.includes("/properties/")) {
    return [PG];
  }
  if (u.includes("/tenants")) return [TENANT];
  if (u.includes("all-rooms") || u.includes("/rooms")) {
    return [
      { roomId: "r1", id: "r1", roomNumber: 101, floorNumber: 1, block: "A", totalBeds: 3, occupiedBeds: 2, availableBeds: 1, numberOfBeds: 3 },
      { roomId: "r2", id: "r2", roomNumber: 102, floorNumber: 1, block: "A", totalBeds: 2, occupiedBeds: 0, availableBeds: 2, numberOfBeds: 2 },
    ];
  }
  if (u.includes("complaint")) {
    return [
      { id: "c1", title: "Leaking tap in bathroom", status: "open", priority: "high", roomNumber: "101", createdAt: "2026-04-01T00:00:00.000Z", description: "Tap near the wash basin has been dripping since Monday morning." },
    ];
  }
  if (u.includes("expense")) {
    return [{ id: "e1", category: "Electricity", amount: 4200, date: "2026-04-02", note: "BESCOM bill" }];
  }
  if (u.includes("notification")) {
    return [{ id: "n1", title: "Rent received", body: "Aarav Sharma paid ₹8,500", read: false, createdAt: "2026-04-03T00:00:00.000Z" }];
  }
  if (u.includes("staff") || u.includes("/team")) {
    return [{ id: "s1", name: "Meera Warden", mobileContactNumber: "9111111111", designation: "Warden", role: "warden" }];
  }
  if (u.includes("lead")) {
    return [{ id: "l1", name: "Priya Nair", phone: "9222222222", status: "new", source: "Public listing", createdAt: "2026-04-04T00:00:00.000Z" }];
  }
  return { success: true, data: [], items: [], results: [], message: "ok" };
}

const ROUTES = [
  ["login", "/login", false],
  ["signup", "/signup", false],
  ["dashboard", "/dashboard", true],
  ["my-pgs", "/my-pgs", true],
  ["rooms", "/my-pgs/structure", true],
  ["amenities", "/my-pgs/amenities", true],
  ["restrictions", "/my-pgs/restrictions", true],
  ["wifi", "/my-pgs/wifi", true],
  ["notices", "/my-pgs/notices", true],
  ["bank", "/my-pgs/bank", true],
  ["public-listing", "/post-pg", true],
  ["tenants", "/tenants", true],
  ["add-tenant", "/tenants/add", true],
  ["leads", "/leads", true],
  ["kyc", "/tenants/kyc", true],
  ["notice-period", "/tenants/notice-period", true],
  ["guests", "/tenants/guests", true],
  ["rent", "/rent-payments", true],
  ["rent-history", "/rent-payments/history", true],
  ["rent-dues", "/rent-payments/dues", true],
  ["expenses", "/expenses", true],
  ["complaints", "/complaints", true],
  ["food", "/food", true],
  ["nightout", "/nightout", true],
  ["chat", "/group-chat", true],
  ["team", "/team", true],
  ["permissions", "/team/permissions-matrix", true],
  ["reports", "/reports", true],
  ["settings", "/settings", true],
  ["plans", "/plans", true],
  ["referrals", "/referrals", true],
  ["activity", "/activity-logs", true],
  ["notifications", "/notifications", true],
  ["support", "/support", true],
  ["inventory", "/inventory", true],
  ["payment-kyc", "/settings/payment-kyc", true],
  ["privacy", "/privacy-policy", true],
  ["terms", "/terms-and-conditions", true],
  ["contact", "/contact-us", true],
];

const VIEWPORTS = [
  { name: "360x800", width: 360, height: 800 },
  { name: "412x915", width: 412, height: 915 },
];

const browser = await chromium.launch({ headless: true });
const report = [];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 PGEaseApp",
  });
  await context.addInitScript(
    ({ token, pg }) => {
      const owner = { id: "demo-owner", name: "Demo Owner", email: "owner@example.com", mobileContactNumber: "9000000000" };
      localStorage.setItem("pgease_token", token);
      localStorage.setItem("pgEase_accessToken", token);
      localStorage.setItem("pgEase_refreshToken", "refresh-local");
      localStorage.setItem("pgEase_propertyOwner", JSON.stringify(owner));
      localStorage.setItem("pgEase_selectedPgId", pg.id);
      localStorage.setItem("pgease_onboarding_carousel_seen", "1");
      localStorage.setItem("trial_expired_gate_dismissed", "true");
    },
    { token, pg: PG },
  );
  await context.route("**/*execute-api.ap-south-1.amazonaws.com/**", async (route) => {
    const req = route.request();
    const body = mockBody(req.url(), req.method());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });

  for (const [slug, routePath, authed] of ROUTES) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (err) => errors.push(String(err).slice(0, 240)));
    if (!authed) {
      await page.addInitScript(() => {
        localStorage.removeItem("pgease_token");
        localStorage.removeItem("pgEase_accessToken");
        localStorage.removeItem("pgEase_refreshToken");
        localStorage.removeItem("pgEase_propertyOwner");
      });
    }
    let finalUrl = routePath;
    try {
      await page.goto(`http://127.0.0.1:5173${routePath}`, { waitUntil: "networkidle", timeout: 25000 });
      await page.waitForTimeout(600);
      finalUrl = page.url();
    } catch (err) {
      errors.push(`nav: ${String(err).slice(0, 200)}`);
    }

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflowers = [];
      const nodes = document.querySelectorAll("body *");
      for (const el of nodes) {
        const rect = el.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) continue;
        if (rect.right > window.innerWidth + 2 || rect.left < -2) {
          const cs = getComputedStyle(el);
          if (cs.position === "fixed" && rect.width <= window.innerWidth + 1) continue;
          overflowers.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && String(el.className).slice(0, 80)) || "",
            right: Math.round(rect.right),
            left: Math.round(rect.left),
            w: Math.round(rect.width),
          });
          if (overflowers.length >= 8) break;
        }
      }
      const dialogs = document.querySelectorAll('[role="dialog"]').length;
      const tables = document.querySelectorAll("table").length;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        innerWidth: window.innerWidth,
        overflowers,
        dialogs,
        tables,
        title: document.title,
        h1: document.querySelector("h1")?.textContent?.trim()?.slice(0, 80) || "",
      };
    }).catch((err) => ({ error: String(err) }));

    const file = `${vp.name}-${slug}.jpg`;
    await page.screenshot({ path: path.join(outDir, file), type: "jpeg", quality: 55, fullPage: false }).catch(() => {});
    report.push({
      viewport: vp.name,
      route: routePath,
      slug,
      finalUrl,
      file,
      errors: errors.slice(0, 4),
      metrics,
    });
    await page.close();
    process.stdout.write(`shot ${vp.name} ${routePath}\n`);
  }

  // Menu sheet
  const menuPage = await context.newPage();
  await menuPage.goto("http://127.0.0.1:5173/dashboard", { waitUntil: "networkidle", timeout: 25000 });
  await menuPage.waitForTimeout(400);
  const menuBtn = menuPage.getByRole("button", { name: "Menu" }).last();
  if (await menuBtn.count()) {
    await menuBtn.click();
    await menuPage.waitForTimeout(300);
  }
  await menuPage.screenshot({
    path: path.join(outDir, `${vp.name}-menu.jpg`),
    type: "jpeg",
    quality: 55,
  });
  const menuText = await menuPage.locator('[role="dialog"]').innerText().catch(() => "");
  report.push({ viewport: vp.name, route: "menu", slug: "menu", menuText: menuText.slice(0, 1500) });
  await menuPage.close();
  await context.close();
}

await browser.close();
await writeFile(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
const overflowing = report.filter((r) => r.metrics && r.metrics.scrollWidth > r.metrics.clientWidth + 2);
console.log(`wrote ${report.length} entries; page-overflow ${overflowing.length}`);
for (const r of report) {
  const o = r.metrics?.overflowers?.length || 0;
  const e = r.errors?.length || 0;
  if (o || e || (r.metrics && r.metrics.scrollWidth > (r.metrics.clientWidth || 0) + 2)) {
    console.log(`${r.viewport} ${r.route} errors=${e} overflowers=${o} scroll=${r.metrics?.scrollWidth}/${r.metrics?.clientWidth}`);
    if (e) console.log("  ", r.errors[0]);
    if (o) console.log("  ", r.metrics.overflowers[0].cls || r.metrics.overflowers[0].tag);
  }
}
