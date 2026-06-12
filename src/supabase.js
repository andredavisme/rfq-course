/* ============================================================
   SUPABASE CLIENT + QUERY HELPERS
   Project: nmemmfblpzrkwyljpmvp (us-east-2)
   ============================================================ */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://nmemmfblpzrkwyljpmvp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Lc7rXKQ-1TJaQFu7a-nOVQ_5Sf3x__M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ── DOMAINS ────────────────────────────────────────────── */
export async function getDomains() {
  const { data, error } = await supabase
    .from('domains')
    .select('id, name, slug, description, icon, color, parent_id, sort_order')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function getDomainBySlug(slug) {
  const { data, error } = await supabase
    .from('domains').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}

/* ── CONCEPTS ────────────────────────────────────────────── */
export async function getConcepts({ domainId, difficulty, status, format, search } = {}) {
  let query = supabase
    .from('concepts')
    .select(`
      id, name, slug, summary, difficulty, status, format, created_at,
      domain:domains(id, name, slug, color),
      tags:concept_tags(tag:tags(id, name, color))
    `)
    .order('created_at', { ascending: false });
  if (status)     query = query.eq('status', status);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (format)     query = query.eq('format', format);
  if (domainId)   query = query.eq('domain_id', domainId);
  if (search)     query = query.ilike('name', `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getConceptById(id) {
  const { data, error } = await supabase
    .from('concepts')
    .select(`
      id, name, slug, summary, body, difficulty, status, format, created_at,
      domain:domains(id, name, slug, color),
      source:sources(id, title, author, url, year, type),
      tags:concept_tags(tag:tags(id, name, color)),
      glossary_terms:glossary(id, term, slug, definition, status)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getConceptBySlug(slug) {
  const { data, error } = await supabase
    .from('concepts')
    .select(`
      *,
      domain:domains(id, name, slug, color),
      source:sources(id, title, author, url, year, type),
      tags:concept_tags(tag:tags(id, name, color)),
      examples(id, title, body, format, language, order_index, status),
      glossary_terms:glossary(id, term, slug, definition, status)
    `)
    .eq('slug', slug).single();
  if (error) throw error;
  return data;
}

export async function getConceptRelationships(conceptId) {
  const { data, error } = await supabase
    .from('concept_relationships')
    .select(`
      id, relationship, notes,
      from_concept:concepts!from_concept_id(id, name, slug, difficulty),
      to_concept:concepts!to_concept_id(id, name, slug, difficulty)
    `)
    .or(`from_concept_id.eq.${conceptId},to_concept_id.eq.${conceptId}`);
  if (error) throw error;
  return data;
}

/* ── GLOSSARY ────────────────────────────────────────────── */
export async function getGlossaryTerms({ domainId, search, status = 'published' } = {}) {
  let query = supabase
    .from('glossary')
    .select(`
      id, term, slug, definition, status, created_at,
      domain:domains(id, name, slug),
      concept:concepts(id, name, slug)
    `)
    .eq('status', status)
    .order('term');
  if (domainId) query = query.eq('domain_id', domainId);
  if (search)   query = query.ilike('term', `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/* ── EXAMPLES ────────────────────────────────────────────── */
export async function getExamples({ conceptId, format, status = 'published' } = {}) {
  let query = supabase
    .from('examples')
    .select(`id, title, body, format, language, order_index, status,
      concept:concepts(id, name, slug)`)
    .eq('status', status)
    .order('order_index');
  if (conceptId) query = query.eq('concept_id', conceptId);
  if (format)    query = query.eq('format', format);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getExampleById(id) {
  const { data, error } = await supabase
    .from('examples')
    .select(`id, title, body, format, language, order_index, status,
      concept:concepts(id, name, slug)`)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/* ── SOURCES ────────────────────────────────────────────── */
export async function getSources({ type, search } = {}) {
  let query = supabase
    .from('sources')
    .select('id, title, author, publisher, year, url, isbn, type, notes')
    .order('year', { ascending: false });
  if (type)   query = query.eq('type', type);
  if (search) query = query.ilike('title', `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/* ── TAGS ────────────────────────────────────────────── */
export async function getTags({ domainId } = {}) {
  let query = supabase.from('tags').select('id, name, slug, color, domain_id').order('name');
  if (domainId) query = query.eq('domain_id', domainId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/* ── COUNTS ────────────────────────────────────────────── */
export async function getCounts() {
  const [domains, concepts, glossary, examples, sources] = await Promise.all([
    supabase.from('domains').select('*', { count: 'exact', head: true }),
    supabase.from('concepts').select('*', { count: 'exact', head: true }),
    supabase.from('glossary').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('examples').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('sources').select('*', { count: 'exact', head: true }),
  ]);
  return {
    domains:  domains.count  ?? 0,
    concepts: concepts.count ?? 0,
    glossary: glossary.count ?? 0,
    examples: examples.count ?? 0,
    sources:  sources.count  ?? 0,
  };
}
