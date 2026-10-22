import type { ConceptConfiguration, MapFeature } from "@/lib/site-design";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = "planning" | "active" | "blocked" | "complete";
export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "blocked"
  | "submitted"
  | "approved"
  | "complete";
export type TaskPriority = "low" | "medium" | "high";
export type MessageRole = "user" | "assistant" | "system";
export type MilestoneStatus =
  "not_started" | "in_progress" | "blocked" | "complete";

export type ProjectRecord = {
  id: string;
  user_id: string;
  name: string;
  project_type: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export type PropertyRecord = {
  id: string;
  project_id: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  parcel_number: string | null;
  google_place_id: string | null;
  jurisdiction_id?: string | null;
  formatted_address: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectTaskRecord = {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  category: string;
  title: string;
  description: string | null;
  instructions: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  regulation_source_id: string | null;
  local_authority: string | null;
  documents_needed: string[];
  fee_estimate: number | null;
  processing_time: string | null;
  dependency_notes: string | null;
  assigned_to: string | null;
  notes: string | null;
  source_url: string | null;
  depends_on_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DocumentRecord = {
  id: string;
  project_id: string;
  uploaded_by: string;
  name: string;
  storage_path: string;
  document_type: string;
  created_at: string;
};

export type ProjectMessageRecord = {
  id: string;
  project_id: string;
  user_id: string | null;
  role: MessageRole;
  content: string;
  created_at: string;
};

export type JurisdictionRecord = {
  id: string;
  name: string;
  type: string;
  state: string | null;
  county: string | null;
  city: string | null;
  official_website: string | null;
  created_at: string;
};

export type RegulationSourceRecord = {
  verification_status: "verified" | "needs_review" | "missing_source";
  id: string;
  jurisdiction_id: string;
  title: string;
  source_type: string;
  url: string;
  publisher: string | null;
  effective_date: string | null;
  last_checked_at: string | null;
  created_at: string;
};

export type RegulationRecord = {
  id: string;
  jurisdiction_id: string;
  source_id: string | null;
  category: string;
  title: string;
  summary: string;
  raw_reference: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectCostRecord = {
  id: string;
  project_id: string;
  category: string;
  item_name: string;
  estimated_amount: number;
  quoted_amount: number;
  committed_amount: number;
  paid_amount: number;
  final_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectMilestoneRecord = {
  id: string;
  project_id: string;
  phase: string;
  title: string;
  status: MilestoneStatus;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      site_designs: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          configuration: ConceptConfiguration;
          revision: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          name?: string;
          configuration?: Json;
          revision?: number;
        };
        Update: { name?: string; configuration?: Json; revision?: number };
        Relationships: [];
      };
      map_features: {
        Row: MapFeature & {
          design_id: string;
          project_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: MapFeature & { design_id: string; project_id: string };
        Update: Partial<MapFeature>;
        Relationships: [];
      };
      project_activity: {
        Row: {
          id: string;
          project_id: string;
          actor_id: string | null;
          event_type: string;
          description: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          actor_id?: string;
          event_type: string;
          description: string;
        };
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          preferred_language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          preferred_language?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: ProjectRecord;
        Insert: Omit<ProjectRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProjectRecord, "id" | "user_id">>;
        Relationships: [];
      };
      properties: {
        Row: PropertyRecord;
        Insert: Omit<PropertyRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PropertyRecord, "id" | "project_id">>;
        Relationships: [
          {
            foreignKeyName: "properties_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_tasks: {
        Row: ProjectTaskRecord;
        Insert: Omit<ProjectTaskRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProjectTaskRecord, "id" | "project_id">>;
        Relationships: [];
      };
      documents: {
        Row: DocumentRecord;
        Insert: Omit<DocumentRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Omit<DocumentRecord, "id" | "project_id" | "uploaded_by">
        >;
        Relationships: [];
      };
      project_costs: {
        Row: ProjectCostRecord;
        Insert: Omit<ProjectCostRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProjectCostRecord, "id" | "project_id">>;
        Relationships: [];
      };
      project_milestones: {
        Row: ProjectMilestoneRecord;
        Insert: Omit<
          ProjectMilestoneRecord,
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProjectMilestoneRecord, "id" | "project_id">>;
        Relationships: [];
      };
      project_messages: {
        Row: ProjectMessageRecord;
        Insert: Omit<ProjectMessageRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ProjectMessageRecord, "id" | "project_id">>;
        Relationships: [];
      };
      jurisdictions: {
        Row: JurisdictionRecord;
        Insert: Omit<JurisdictionRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<JurisdictionRecord, "id">>;
        Relationships: [];
      };
      regulation_sources: {
        Row: RegulationSourceRecord;
        Insert: Omit<RegulationSourceRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<RegulationSourceRecord, "id">>;
        Relationships: [];
      };
      regulations: {
        Row: RegulationRecord;
        Insert: Omit<RegulationRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<RegulationRecord, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_project_workspace: {
        Args: { input: Json; tasks: Json };
        Returns: string;
      };
      save_site_design: { Args: { input: Json }; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
