import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
const file = ".codex-test-session.json";
let account;
if (fs.existsSync(file)) account = JSON.parse(fs.readFileSync(file, "utf8"));
else {
  account = {
    email: "bouldrr-qa-" + randomUUID() + "@example.com",
    password: randomUUID() + "aA1!",
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(file, JSON.stringify(account));
}
const result = fs.existsSync(".codex-test-created")
  ? await client.auth.signInWithPassword(account)
  : await client.auth.signUp({
      ...account,
      options: { data: { full_name: "Bouldrr QA" } },
    });
console.log(
  "Auth",
  result.error?.message ?? "success",
  "session",
  Boolean(result.data.session),
);
if (result.data.session) {
  fs.writeFileSync(".codex-test-created", "created");
  for (const table of [
    "profiles",
    "projects",
    "properties",
    "project_tasks",
    "project_costs",
    "project_milestones",
    "documents",
  ]) {
    const r = await client.from(table).select("*").limit(1);
    console.log(
      table,
      r.error?.message ?? "accessible",
      r.data?.length ?? 0,
      r.data?.[0] ? Object.keys(r.data[0]) : [],
    );
  }
  await client.auth.signOut();
  console.log("Sign out complete");
}
