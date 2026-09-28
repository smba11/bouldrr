import type { TaskPriority } from "@/lib/types";

export const projectTypes = [
  "New Construction",
  "Renovation",
  "Fix & Flip",
  "Addition",
  "ADU",
  "Multifamily Development",
  "Commercial Development",
  "Land Evaluation",
  "Other",
] as const;

export const documentTypes = [
  "Survey",
  "Site Plan",
  "Permit",
  "Inspection",
  "Contract",
  "Estimate",
  "Engineering",
  "Architecture",
  "Tax",
  "Other",
] as const;

export const taskCategories = [
  "Due Diligence",
  "Zoning",
  "Design",
  "Financing",
  "Permits",
  "Construction",
  "Inspections",
  "Completion",
] as const;

export type TaskSeed = {
  category: (typeof taskCategories)[number];
  title: string;
  description: string;
  instructions: string;
  priority: TaskPriority;
  sortOrder: number;
};

export const starterTasks: TaskSeed[] = [
  {
    category: "Due Diligence",
    title: "Confirm ownership and parcel basics",
    description:
      "Gather the baseline facts for the property before spending money on design or permits.",
    instructions:
      "Find the county assessor record, confirm the parcel number, compare the listed address with your project address, and save any assessor or title documents to the project.",
    priority: "high",
    sortOrder: 10,
  },
  {
    category: "Zoning",
    title: "Identify zoning and overlays",
    description:
      "Confirm the zoning district and any overlay rules that could affect use, size, parking, or review path.",
    instructions:
      "Search the official city or county planning site for the parcel, note the zoning district, and attach a link or PDF source before relying on any summary.",
    priority: "high",
    sortOrder: 20,
  },
  {
    category: "Design",
    title: "Prepare a concept scope",
    description:
      "Turn the project idea into a scope that can be reviewed by designers, lenders, and permitting staff.",
    instructions:
      "Write the intended use, approximate unit count or square footage, known constraints, and open questions. Upload sketches or site plans when available.",
    priority: "medium",
    sortOrder: 30,
  },
  {
    category: "Financing",
    title: "Estimate budget and funding path",
    description:
      "Build an early cost picture so the project can be checked against financing and return expectations.",
    instructions:
      "List acquisition, design, permit, utility, construction, contingency, and carrying costs. Mark unknown line items instead of guessing.",
    priority: "medium",
    sortOrder: 40,
  },
  {
    category: "Permits",
    title: "Confirm permit path",
    description:
      "Determine which local approvals are required before construction or occupancy.",
    instructions:
      "Check the official building or planning department website for required applications. Capture the source URL and note whether planning review is separate from building permits.",
    priority: "high",
    sortOrder: 50,
  },
  {
    category: "Construction",
    title: "Build pre-construction document list",
    description:
      "Organize the documents likely needed before a contractor can price or start work.",
    instructions:
      "Create a list for plans, engineering, survey, site plan, energy documents, contractor bids, and insurance requirements.",
    priority: "medium",
    sortOrder: 60,
  },
  {
    category: "Inspections",
    title: "Map inspection milestones",
    description:
      "Plan for inspections that may affect schedule and payment milestones.",
    instructions:
      "Use the local building department source to identify likely inspections such as foundation, framing, rough MEP, insulation, and final.",
    priority: "medium",
    sortOrder: 70,
  },
  {
    category: "Completion",
    title: "Plan closeout and records",
    description:
      "Prepare for final approvals, recordkeeping, and handoff when the project is finished.",
    instructions:
      "Track certificate of occupancy or final signoff requirements, warranty documents, lien releases, and final plan sets.",
    priority: "low",
    sortOrder: 80,
  },
];
