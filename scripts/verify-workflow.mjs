import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { starterTasks } from "../src/lib/constants.ts";
import { defaultConcept } from "../src/lib/site-design.ts";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert(url && key, "Load .env.local before running.");
const db = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const a = db(),
  b = db();
const accountFile = ".codex-test-session.json";
const account = JSON.parse(fs.readFileSync(accountFile, "utf8"));
const report = [];
function ok(name) {
  report.push(name);
  console.log("PASS", name);
}
const login = await a.auth.signInWithPassword(account);
assert.ifError(login.error);
assert(login.data.session);
const owner = login.data.user.id;
const profile = await a
  .from("profiles")
  .select("id,full_name")
  .eq("id", owner)
  .single();
assert.ifError(profile.error);
assert.equal(profile.data.full_name, "Bouldrr QA");
ok("sign in + profile creation");
const name = "QA workflow " + randomUUID().slice(0, 8);
const input = {
  projectType: "Evaluate Property",
  addressLine1: name,
  city: "San Francisco",
  state: "CA",
  county: "San Francisco",
  postalCode: "94102",
  latitude: 37.7793,
  longitude: -122.4193,
  description:
    "Disposable QA test of persisted development workflows. Not a development proposal.",
  formattedAddress: "",
  googlePlaceId: "",
};
const tasks = starterTasks.map((t, i) => ({
  ...t,
  dependencyIndex: i ? i - 1 : null,
}));
let projectId;
const attacker = {
  email: "bouldrr-rls-" + randomUUID() + "@example.com",
  password: randomUUID() + "aA1!",
};
fs.writeFileSync(".codex-test-attacker.json", JSON.stringify(attacker));
try {
  const created = await a.rpc("create_project_workspace", { input, tasks });
  assert.ifError(created.error);
  projectId = created.data;
  assert(projectId);
  ok("atomic project + property + starter tasks");
  const second = await a.rpc("create_project_workspace", {
    input: { ...input, addressLine1: name + " second project" },
    tasks,
  });
  assert.ifError(second.error);
  const portfolio = await a
    .from("projects")
    .select("id")
    .in("id", [projectId, second.data]);
  assert.ifError(portfolio.error);
  assert.equal(portfolio.data.length, 2);
  ok("multiple independent projects persist for the same account");
  fs.writeFileSync(".codex-test-project.json", JSON.stringify({ projectId }));
  const property = await a
    .from("properties")
    .select("*")
    .eq("project_id", projectId)
    .single();
  assert.ifError(property.error);
  assert.equal(Number(property.data.longitude), -122.4193);
  let plan = await a
    .from("project_tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");
  assert.ifError(plan.error);
  assert.equal(plan.data.length, tasks.length);
  assert.equal(plan.data[1].depends_on_id, plan.data[0].id);
  ok("saved address + coordinates + dependency");
  const failureName = name + " rollback";
  const failure = await a.rpc("create_project_workspace", {
    input: { ...input, addressLine1: failureName },
    tasks: [{ ...tasks[0], priority: "invalid" }],
  });
  assert(failure.error);
  const partial = await a
    .from("projects")
    .select("id")
    .ilike("name", failureName + "%");
  assert.equal(partial.data.length, 0);
  ok("transaction rollback leaves no partial project");
  const completed = await a
    .from("project_tasks")
    .update({ status: "complete" })
    .eq("id", plan.data[0].id)
    .select("status")
    .single();
  assert.ifError(completed.error);
  assert.equal(completed.data.status, "complete");
  ok("task completion persists");

  const cycle = await a
    .from("project_tasks")
    .update({ depends_on_id: plan.data[1].id })
    .eq("id", plan.data[0].id);
  assert(cycle.error?.message.includes("cycle"));
  ok("database rejects cyclic task dependencies");
  const cost = await a
    .from("project_costs")
    .insert({
      project_id: projectId,
      category: "Design",
      item_name: "QA estimate",
      estimated_amount: 500,
    })
    .select("*")
    .single();
  assert.ifError(cost.error);
  assert.equal(Number(cost.data.estimated_amount), 500);
  assert.ifError(
    (await a.from("project_costs").delete().eq("id", cost.data.id)).error,
  );
  const milestone = await a
    .from("project_milestones")
    .insert({
      project_id: projectId,
      phase: "Design",
      title: "QA design review",
      due_date: "2026-11-01",
    })
    .select("*")
    .single();
  assert.ifError(milestone.error);
  const milestoneUpdate = await a
    .from("project_milestones")
    .update({ status: "complete", completed_at: "2026-10-20" })
    .eq("id", milestone.data.id)
    .select("status")
    .single();
  assert.ifError(milestoneUpdate.error);
  assert.equal(milestoneUpdate.data.status, "complete");
  assert.ifError(
    (await a.from("project_milestones").delete().eq("id", milestone.data.id))
      .error,
  );
  ok("existing cost and milestone CRUD preserved");

  const feature = {
    id: randomUUID(),
    name: "QA conceptual structure",
    feature_type: "building",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-122.4194, 37.7792],
          [-122.4192, 37.7792],
          [-122.4192, 37.7794],
          [-122.4194, 37.7794],
          [-122.4194, 37.7792],
        ],
      ],
    },
    coordinate_space: "wgs84",
    provenance: "user",
  };

  const design = {
    projectId,
    revision: 0,
    configuration: defaultConcept,
    features: [feature],
  };

  const save = await a.rpc("save_site_design", { input: design });
  assert.ifError(save.error);
  assert.equal(save.data, 1);
  const shapes = await a
    .from("map_features")
    .select("*")
    .eq("project_id", projectId);
  assert.equal(shapes.data.length, 1);
  assert.deepEqual(shapes.data[0].geometry, feature.geometry);
  ok("GeoJSON concept and configuration persist");
  const conflict = await a.rpc("save_site_design", { input: design });
  assert(conflict.error?.message.includes("another session"));
  ok("stale design save is rejected");

  const invalid = await a.rpc("save_site_design", {
    input: {
      ...design,
      revision: 1,
      features: [
        {
          ...feature,
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [2, 2],
              ],
            ],
          },
        },
      ],
    },
  });
  assert(invalid.error);
  const afterInvalid = await a
    .from("map_features")
    .select("geometry")
    .eq("project_id", projectId)
    .single();
  assert.deepEqual(afterInvalid.data.geometry, feature.geometry);
  ok("invalid geometry is rejected without deleting saved design");

  const forged = await a
    .from("map_features")
    .update({ provenance: "official" })
    .eq("id", feature.id)
    .select("id");
  assert(forged.error);
  ok("user cannot relabel a concept as official");
  const signup = await b.auth.signUp({
    ...attacker,
    options: { data: { full_name: "Disposable RLS QA" } },
  });
  assert.ifError(signup.error);
  assert(signup.data.session);
  ok("second real account for isolation checks");
  for (const table of [
    "projects",
    "properties",
    "project_tasks",
    "map_features",
    "site_designs",
    "project_activity",
  ]) {
    const field = table === "projects" ? "id" : "project_id";
    const denied = await b.from(table).select("*").eq(field, projectId);
    assert.ifError(denied.error);
    assert.equal(denied.data.length, 0, table + " leaked rows");
  }
  const deniedSave = await b.rpc("save_site_design", {
    input: { ...design, revision: 1 },
  });
  assert(deniedSave.error);
  ok(
    "RLS prevents cross-account project, property, task, design and activity access",
  );
  const content = new Blob(
    ["Disposable Bouldrr QA document. No private project information."],
    { type: "text/plain" },
  );
  const path = owner + "/" + projectId + "/" + randomUUID() + "-qa.txt";
  const signed = await a.storage
    .from("project-documents")
    .createSignedUploadUrl(path);
  assert.ifError(signed.error);
  const uploadForm = new FormData();
  uploadForm.append("cacheControl", "3600");
  uploadForm.append("", content, "qa.txt");
  const upload = await fetch(signed.data.signedUrl, {
    method: "PUT",
    headers: { "x-upsert": "false" },
    body: uploadForm,
  });
  assert(upload.ok, "signed upload HTTP " + upload.status);
  const document = await a
    .from("documents")
    .insert({
      project_id: projectId,
      uploaded_by: owner,
      name: "QA source record.txt",
      storage_path: path,
      document_type: "Other",
    })
    .select("id")
    .single();
  assert.ifError(document.error);
  const preview = await a.storage
    .from("project-documents")
    .createSignedUrl(path, 30);
  assert.ifError(preview.error);
  const download = await fetch(preview.data.signedUrl);
  assert.equal(await download.text(), await content.text());
  ok("private signed upload + document record + signed preview");
  const leaked = await b
    .from("documents")
    .select("*")
    .eq("project_id", projectId);
  assert.equal(leaked.data.length, 0);
  const blockedFile = await b.storage
    .from("project-documents")
    .createSignedUrl(path, 30);
  assert(blockedFile.error);
  const blockedUpload = await b.storage
    .from("project-documents")
    .upload(signup.data.user.id + "/" + projectId + "/attack.txt", content);
  assert(blockedUpload.error);
  ok("RLS prevents cross-owner file read/upload");
  assert.ifError(
    (await a.storage.from("project-documents").remove([path])).error,
  );
  assert.ifError(
    (await a.from("documents").delete().eq("id", document.data.id)).error,
  );
  ok("private document delete");
  const activity = await a
    .from("project_activity")
    .select("event_type")
    .eq("project_id", projectId);
  assert.ifError(activity.error);
  for (const event of [
    "project_created",
    "property_added",
    "task_updated",
    "site_concept_updated",
    "document_uploaded",
  ])
    assert(
      activity.data.some((a) => a.event_type === event),
      event,
    );
  ok("activity captures actual project events");
  await a.auth.signOut();
  const returning = db();
  const again = await returning.auth.signInWithPassword(account);
  assert.ifError(again.error);
  const persisted = await returning
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  assert.ifError(persisted.error);
  assert.equal(persisted.data.id, projectId);
  const secondPersisted = await returning
    .from("projects")
    .select("id")
    .eq("id", second.data)
    .single();
  assert.ifError(secondPersisted.error);
  await returning.auth.signOut();
  ok("sign out → fresh sign in → project still present");
  fs.mkdirSync("codex-logs", { recursive: true });
  fs.writeFileSync(
    "codex-logs/workflow-results.json",
    JSON.stringify(
      { testedAt: new Date().toISOString(), checks: report },
      null,
      2,
    ),
  );
  console.log(
    "All",
    report.length,
    "workflow checks passed. Disposable QA project retained for browser verification.",
  );
} finally {
  await a.auth.signOut();
  await b.auth.signOut();
}
