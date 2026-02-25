#!/usr/bin/env node
/**
 * Convert TeX posts in tex-posts/ to .qmd files in site/notebooks/notebook/
 *
 * Each .tex file must begin with a YAML frontmatter block:
 *
 *   ---
 *   title: "Post Title"
 *   author: "Eugen Nesbakken"
 *   date: "2026-02-23"
 *   description: "Short description shown in blog listing."
 *   category: mathematics
 *   tags: [algebra, groups, topology]
 *   ---
 *
 * The rest of the file is standard LaTeX. Pandoc converts it to Markdown;
 * this script wraps it in the same YAML frontmatter format that Clay uses,
 * and fixes up theorem environments so they match the math.clj output exactly.
 *
 * Theorem environments supported (same as math.clj):
 *   definition, theorem, lemma, corollary, proposition,
 *   conjecture, example, exercise, proof, remark
 *
 * Display names work the same as in LaTeX:
 *   \begin{theorem}[Lagrange's Theorem] ... \end{theorem}
 *
 * MathJax macros defined in site/notebooks/_quarto.yml are available
 * in the rendered HTML. Local .sty packages are NOT supported — define
 * custom macros in the MathJax config instead.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEX_DIR = 'tex-posts';
const OUT_DIR = 'site/notebooks/notebook';

// Quarto theorem environment prefixes — mirrors math.clj env-prefixes
const ENV_PREFIXES = {
  definition:  'def',
  theorem:     'thm',
  lemma:       'lem',
  corollary:   'cor',
  proposition: 'prp',
  conjecture:  'cnj',
  example:     'exm',
  exercise:    'exr',
  proof:       null,
  remark:      null,
};
const KNOWN_ENVS = new Set(Object.keys(ENV_PREFIXES));

// ── YAML frontmatter parser ───────────────────────────────────────────────────
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([\w-]+):\s*(.+)$/);
    if (!m) continue;
    let val = m[2].trim().replace(/^["']|["']$/g, '');
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    meta[m[1]] = val;
  }
  return { meta, body: match[2] };
}

// ── Extract display names from LaTeX source ───────────────────────────────────
// Pandoc drops \begin{theorem}[Name] optional arguments, so we pre-extract
// them in document order so we can re-inject them during post-processing.
//
// Returns { definition: ['Name1', ...], theorem: ['T1', ...], ... }
// where each array is the ordered list of display names (null = unnamed).
function extractEnvNames(texBody) {
  const envNames = {};
  // Match \begin{ENV} and \begin{ENV}[Name] in document order
  const regex = /\\begin\{(definition|theorem|lemma|corollary|proposition|conjecture|example|exercise|proof|remark)\}(?:\[([^\]]*)\])?/g;
  let m;
  while ((m = regex.exec(texBody)) !== null) {
    const type = m[1];
    const name = m[2] ? m[2].trim() : null;
    if (!envNames[type]) envNames[type] = [];
    envNames[type].push(name);
  }
  return envNames;
}

// ── Post-process Pandoc markdown output ──────────────────────────────────────
// Pandoc converts LaTeX theorem environments to bare `::: envname` fenced divs.
// Quarto requires `::: {.envname}` (with dot) to trigger theorem styling.
// This function:
//   1. Converts `::: envname` → `::: {#prefix-N .envname}` with auto IDs
//   2. Re-injects display names as `## Name` headers (dropped by Pandoc)
//   3. Fixes proof blocks: strips Pandoc's added *Proof.* prefix and ◻ suffix
//      (Quarto adds these itself when it renders `::: {.proof}`)
function postProcessEnvs(mdBody, envNames) {
  const lines = mdBody.split('\n');
  const result = [];
  // Per-type occurrence counters for display-name lookup and auto-ID generation
  const nameCounters = {};
  const idCounters = {};

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Match bare Pandoc fenced-div openers: "::: envname"
    const divMatch = line.match(/^:::\s+(\w+)\s*$/);

    if (divMatch && KNOWN_ENVS.has(divMatch[1])) {
      const envType = divMatch[1];
      const prefix = ENV_PREFIXES[envType];

      // Collect body lines until the matching closing :::
      const bodyLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        bodyLines.push(lines[i]);
        i++;
      }
      i++; // skip closing :::

      if (envType === 'proof') {
        // Quarto's proof renderer adds "Proof." and ◻ itself, so strip what
        // Pandoc already added to avoid duplication.
        let content = bodyLines.join('\n');
        content = content
          .replace(/^\*Proof\.\*\s+/, '')
          .replace(/\s*◻\s*$/, '')
          .trim();
        result.push('::: {.proof}');
        if (content) result.push(content);
        result.push(':::');
      } else {
        // Look up display name (ordered by occurrence within this type)
        nameCounters[envType] = (nameCounters[envType] || 0);
        const names = envNames[envType] || [];
        const displayName = names[nameCounters[envType]] || null;
        nameCounters[envType]++;

        // Generate a stable auto-ID (e.g. def-1, thm-2) when a prefix exists.
        // These won't be as readable as hand-written labels but are unique.
        idCounters[envType] = (idCounters[envType] || 0) + 1;
        const attrs = prefix
          ? `{#${prefix}-${idCounters[envType]} .${envType}}`
          : `{.${envType}}`;

        result.push(`::: ${attrs}`);
        if (displayName) result.push(`## ${displayName}`);
        result.push(...bodyLines);
        result.push(':::');
      }
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join('\n');
}

// ── QMD frontmatter builder ───────────────────────────────────────────────────
function escapeForYamlSingleQuote(str) {
  return str.replace(/'/g, "''");
}

function buildFrontmatter(meta, base) {
  const title = meta.title || base;
  const author = meta.author || 'Eugen';
  const description = meta.description || '';
  const date = meta.date || new Date().toISOString().split('T')[0];
  const category = meta.category || 'general';
  const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);
  const tagsStr = tags.length ? `[${tags.join(', ')}]` : '[]';

  return [
    '---',
    'format:',
    `  html: {toc: true, toc-depth: 4, theme: cosmo, title: '${escapeForYamlSingleQuote(title)}'}`,
    `author: ${author}`,
    `description: ${description}`,
    'type: post',
    `date: '${date}'`,
    `category: ${category}`,
    `tags: ${tagsStr}`,
    '',
    '---',
  ].join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
if (!fs.existsSync(TEX_DIR)) {
  console.log(`No ${TEX_DIR}/ directory found — skipping TeX conversion.`);
  process.exit(0);
}

const texFiles = fs.readdirSync(TEX_DIR).filter(f => f.endsWith('.tex'));

if (texFiles.length === 0) {
  console.log('No .tex files found in tex-posts/ — skipping.');
  process.exit(0);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

let converted = 0;
let failed = 0;

for (const file of texFiles) {
  const texPath = path.join(TEX_DIR, file);
  const base = path.basename(file, '.tex');
  const qmdPath = path.join(OUT_DIR, `${base}.qmd`);

  try {
    const raw = fs.readFileSync(texPath, 'utf-8');
    const { meta, body } = parseFrontmatter(raw);

    // Pre-extract display names before Pandoc drops them
    const envNames = extractEnvNames(body);

    // Write the YAML-stripped body to a temp file for Pandoc
    const tmpTex = path.join(TEX_DIR, `_tmp_${base}.tex`);
    fs.writeFileSync(tmpTex, body);

    // Use Quarto's bundled pandoc — available everywhere Quarto is installed
    let mdBody;
    try {
      mdBody = execSync(
        `quarto pandoc "${tmpTex}" -f latex -t markdown --wrap=none`,
        { encoding: 'utf-8' }
      );
    } finally {
      fs.unlinkSync(tmpTex);
    }

    // Fix theorem environments to match math.clj Quarto fenced-div format
    mdBody = postProcessEnvs(mdBody, envNames);

    // HTML comment for generate-blog-index.js (Quarto doesn't emit category/tags as meta tags)
    const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);
    const metaComment =
      `<!-- tex-post-meta: category="${meta.category || 'general'}" tags="${tags.join(',')}" -->`;

    const qmd = buildFrontmatter(meta, base) + '\n' + metaComment + '\n\n' + mdBody;
    fs.writeFileSync(qmdPath, qmd);

    console.log(`  ✓ ${file} → ${base}.qmd`);
    converted++;
  } catch (err) {
    console.error(`  ✗ Failed to convert ${file}: ${err.message}`);
    failed++;
  }
}

console.log(`\nTeX conversion: ${converted} converted, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
