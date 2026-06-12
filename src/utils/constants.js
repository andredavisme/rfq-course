/* ============================================================
   CONSTANTS — Enum arrays mirroring Supabase custom types
   Keep in sync with database enum definitions.
   ============================================================ */

export const DIFFICULTY_LEVELS = [
  { value: 'beginner',     label: 'Beginner',     cssClass: 'diff-beginner' },
  { value: 'intermediate', label: 'Intermediate', cssClass: 'diff-intermediate' },
  { value: 'advanced',     label: 'Advanced',     cssClass: 'diff-advanced' },
  { value: 'expert',       label: 'Expert',       cssClass: 'diff-expert' },
];

export const ENTRY_STATUSES = [
  { value: 'draft',      label: 'Draft',      cssClass: 'status-draft' },
  { value: 'published',  label: 'Published',  cssClass: 'status-published' },
  { value: 'archived',   label: 'Archived',   cssClass: 'status-archived' },
  { value: 'deprecated', label: 'Deprecated', cssClass: 'status-deprecated' },
];

export const CONTENT_FORMATS = [
  { value: 'text',    label: 'Text' },
  { value: 'code',    label: 'Code' },
  { value: 'formula', label: 'Formula' },
  { value: 'table',   label: 'Table' },
  { value: 'diagram', label: 'Diagram' },
  { value: 'mixed',   label: 'Mixed' },
];

export const RELATIONSHIP_TYPES = [
  { value: 'related',     label: 'Related' },
  { value: 'prerequisite',label: 'Prerequisite' },
  { value: 'extends',     label: 'Extends' },
  { value: 'contradicts', label: 'Contradicts' },
  { value: 'supersedes',  label: 'Supersedes' },
  { value: 'equivalent',  label: 'Equivalent' },
];

export const SOURCE_TYPES = [
  { value: 'book',          label: 'Book' },
  { value: 'article',       label: 'Article' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'standard',      label: 'Standard' },
  { value: 'dataset',       label: 'Dataset' },
  { value: 'video',         label: 'Video' },
  { value: 'course',        label: 'Course' },
  { value: 'original',      label: 'Original' },
];

// Supabase project reference
export const SUPABASE_PROJECT_REF = 'nmemmfblpzrkwyljpmvp';
export const SUPABASE_REGION = 'us-east-2';
