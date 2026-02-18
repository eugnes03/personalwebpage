# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website and interactive blog platform using Clojure notebooks rendered to static HTML. Built with Clay (Clojure notebook renderer) + Quarto (document publishing) and deployed to Netlify.

## Build Commands

**Full build** (runs on Netlify CI):
```bash
bash build.sh
```

**Build and serve locally:**
```bash
bash build.sh --serve        # Build then serve on port 8000
bash build.sh --serve-only   # Just serve (skip build)
bash build.sh --serve --port=3000  # Custom port
```

**Individual steps for local development:**

1. Download Clojure dependencies:
   ```bash
   clojure -P -M:render/notebooks
   ```

2. Render Clay notebooks to Quarto markdown:
   ```bash
   clojure -M:render/notebooks -A:markdown
   ```

3. Render Quarto to HTML:
   ```bash
   quarto render site/notebooks
   ```

4. Generate blog index JSON:
   ```bash
   node generate-blog-index.js
   ```

**Start REPL for notebook development:**
```bash
clojure -M:repl/notebooks
```

## Architecture

### Build Pipeline

```
notebooks/*.clj  →  Clay  →  site/notebooks/notebook/*.qmd  →  Quarto  →  site/notebooks/_site/*.html
                                                                              ↓
                                                          generate-blog-index.js
                                                                              ↓
                                                              site/js/blog-posts.json
```

Post-build steps in `build.sh`:
1. Copy `site/notebooks/_site/site_libs` → `site/site_libs`
2. Copy `site/notebooks/_site/notebook/*.html` → `site/notebooks/`
3. Remove utility-only files (`tikz.html`, `math.html`, `text.html`)
4. Generate blog index JSON

### Directory Structure

```
├── notebooks/                 # Source Clojure notebooks (blog posts only)
│   ├── example.clj
│   ├── example2.clj
│   ├── latex-demo.clj
│   ├── rep-theory-category-theory.clj
│   └── week1.clj
│
├── src/                       # Helper namespaces (not rendered by Clay)
│   ├── math.clj               # Theorem/proof environments
│   ├── tikz.clj               # TikZ diagram rendering
│   └── text.clj               # Titles, quotes, citations, downloads
│
├── scripts/
│   └── render-tikz.sh         # TikZ → PNG shell script
│
├── site/                      # Published static site (Netlify publish dir)
│   ├── index.html             # Home page
│   ├── blog.html              # Blog listing page
│   ├── about.html
│   ├── cv.html
│   ├── portfolio.html
│   │
│   ├── css/
│   │   ├── main.css           # Main styles (light/dark theme CSS vars)
│   │   └── blog.css           # Blog card & filter styles
│   │
│   ├── js/
│   │   ├── theme.js           # Dark/light mode toggle
│   │   ├── main.js            # General page logic
│   │   ├── blog.js            # Blog post loading & category filtering
│   │   └── blog-posts.json    # Auto-generated blog index (DO NOT EDIT)
│   │
│   ├── assets/
│   │   ├── images/            # Static images (portrait, etc.)
│   │   ├── pdfs/              # Downloadable PDFs (cv.pdf, etc.)
│   │   └── data/              # Downloadable data files
│   │
│   ├── notebooks/
│   │   ├── _quarto.yml        # Quarto config for notebook rendering
│   │   ├── custom.scss        # Quarto custom theme overrides
│   │   ├── notebook/          # Intermediate .qmd files (Clay output)
│   │   ├── _site/             # Quarto HTML output (git-ignored)
│   │   ├── images/tikz/       # Pre-rendered TikZ diagram PNGs
│   │   └── *.html             # Final rendered notebook pages
│   │
│   └── site_libs/             # Quarto framework assets (git-ignored)
```

### Key Paths

- `notebooks/` - Source Clojure notebook files (on classpath via deps.edn `:paths`)
- `site/` - Static website root (Netlify publish directory)
- `site/notebooks/notebook/*.qmd` - Intermediate Quarto markdown (Clay output)
- `site/notebooks/_site/notebook/*.html` - Quarto HTML output (copied up post-build)
- `site/notebooks/*.html` - Final rendered notebook HTML pages
- `site/js/blog-posts.json` - Auto-generated blog post index
- `site/assets/pdfs/` - Downloadable PDF files
- `site/notebooks/images/tikz/` - Pre-rendered TikZ diagram PNGs

### Notebook Metadata Format

Notebooks use Clay metadata at the top of the file:
```clojure
^{:kindly/hide-code true
  :clay {:title  "Post Title"
         :quarto {:author      :Eugen
                  :description "Description"
                  :type        :post
                  :date        "YYYY-MM-DD"
                  :category    :category-name
                  :tags        [:tag1 :tag2]}}}
```

### Utility Namespaces

All three live in `src/` so Clay never renders them. They are on the classpath via `deps.edn` `:paths ["src"]`.

- **`math`** (`math.clj`) — Quarto theorem environments: `definition`, `theorem`, `lemma`, `corollary`, `proposition`, `conjecture`, `example`, `exercise`, `proof`, `remark`. Emits fenced divs via `kind/md` with auto-numbering and cross-references (`@def-label`, `@thm-label`, etc.).
- **`tikz`** (`tikz.clj`) — TikZ diagram rendering. Compiles LaTeX to PNG via pdflatex + ImageMagick/pdftoppm. Returns `kind/hiccup` images. Caches output in `site/notebooks/images/tikz/`. Functions: `render`, `render-raw`, `node-diagram`.
- **`text`** (`text.clj`) — Text rendering helpers. Functions:
  - `text/title` — markdown headings at any level
  - `text/blockquote` — blockquotes with optional `:cite` attribution
  - `text/cite` — formatted citations with `:year`, `:url`, `:journal`, `:volume`, `:pages`, `:publisher`, `:doi`
  - `text/bibliography` — numbered reference list from a seq of strings
  - `text/download` — styled download link for PDFs/files

Usage in any notebook:
```clojure
(ns my-post
  (:require [math :as math]
            [tikz :as tikz]
            [text :as text]))
```

### Including Downloadable PDFs

1. Place the PDF in `site/assets/pdfs/`
2. In a notebook, use `text/download` with relative path from rendered HTML (`site/notebooks/<name>.html`):
   ```clojure
   (text/download "../../assets/pdfs/my-doc.pdf" "Download PDF")
   ```
   The `../../` is needed because rendered HTML is two directories below `site/`.

### Configuration Files

- `clay.edn` - Clay notebook rendering config (source path: `notebooks/`, target: `.clay-temp/`, output to `site/notebooks/notebook/`)
- `deps.edn` - Clojure dependencies and aliases (`:paths` includes `notebooks/` and `site/`)
- `netlify.toml` - Netlify build config (Java 17, Node 18, publish dir: `site/`)
- `site/notebooks/_quarto.yml` - Quarto rendering config (theme, MathJax macros, navbar)

## Dependencies

Requires: Clojure CLI, Quarto, Node.js, pdflatex (for TikZ)

Key Clojure libraries: Clay v2, Tablecloth, Kindly, scicloj/noj (data science stack), next.jdbc + PostgreSQL (database), clj-http (HTTP), jsonista (JSON), nippy (serialisation), jdsp (signal processing), commons-math3 (numerics), eclipse.elk (graph layout)
