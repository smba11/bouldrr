import fs from "node:fs";
import { createServerClient } from "@supabase/ssr";
const account = JSON.parse(fs.readFileSync(".codex-test-session.json", "utf8"));
const { projectId } = JSON.parse(
  fs.readFileSync(".codex-test-project.json", "utf8"),
);
const jar = new Map();
const db = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    cookies: {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll: (items) => items.forEach((c) => jar.set(c.name, c.value)),
    },
  },
);
const login = await db.auth.signInWithPassword(account);
if (login.error) throw Error("QA login failed.");
const cookie = Array.from(jar, ([k, v]) => k + "=" + v).join("; ");
const origin = process.argv[2] ?? "http://127.0.0.1:3000";
const label = process.argv[3] ?? "local";
const results = [];
for (const suffix of [
  "/dashboard",
  "/projects/" + projectId,
  "/projects/" + projectId + "/property",
  "/projects/" + projectId + "/tasks",
]) {
  for (let round = 0; round < 3; round++) {
    const start = performance.now();
    const response = await fetch(origin + suffix, {
      headers: { Cookie: cookie },
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
    });
    const body = await response.text();
    const elapsed = Math.round(performance.now() - start);
    const result = {
      route: suffix.replace(projectId, "[projectId]"),
      round,
      status: response.status,
      ms: elapsed,
      htmlBytes: Buffer.byteLength(body),
      loginRedirect:
        response.headers.get("location")?.includes("login") ?? false,
    };
    results.push(result);
    console.log(JSON.stringify(result));
  }
}
fs.writeFileSync(
  "codex-logs/response-benchmark-" + label + ".json",
  JSON.stringify(
    { origin, testedAt: new Date().toISOString(), results },
    null,
    2,
  ),
);
await db.auth.signOut();
