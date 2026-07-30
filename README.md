# Personal Website

A personal website built with Clojure Clay notebooks and Quarto, deployed to GitHub Pages via GitHub Actions.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Important Commands](#important-commands)
- [Customizing the Website](#customizing-the-website)
  - [Main Pages (HTML/CSS)](#main-pages-htmlcss)
  - [Blog Notebooks (Clojure/Quarto)](#blog-notebooks-clojurequarto)
  - [Styling](#styling)
- [LaTeX Configuration](#latex-configuration)
  - [MathJax Setup](#mathjax-setup)
  - [Custom Macros](#custom-macros)
  - [Adding New LaTeX Packages](#adding-new-latex-packages)
- [Utility Namespaces](#utility-namespaces)
  - [Math Environments (`math.clj`)](#math-environments-mathclj)
  - [Text Rendering (`text.clj`)](#text-rendering-textclj)
  - [TikZ Diagrams (`tikz.clj`)](#tikz-diagrams-tikzclj)
- [Including Downloadable PDFs](#including-downloadable-pdfs)
- [Managing Dependencies](#managing-dependencies)
- [Quarto Configuration](#quarto-configuration)
- [Blog System](#blog-system)
- [Deployment](#deployment)

---

## Quick Start

```bash
# Full build
./build.sh

# Build and serve locally
./build.sh --serve

# Serve only (no rebuild)
./build.sh --serve-only

# Custom port
./build.sh --serve --port=3000
```

---

## Project Structure

```
personalwebpage/
├── build.sh                    # Main build script
├── clay.edn                    # Clay notebook rendering config
├── deps.edn                    # Clojure dependencies
├── generate-blog-index.js      # Generates blog-posts.json from HTML
├── .github/workflows/deploy.yml # GitHub Actions build + deploy to GitHub Pages
│
├── notebooks/                  # SOURCE: Clojure blog post notebooks
│   ├── latex_demo.clj
│   ├── modules.clj
│   ├── rep_theory_category_theory.clj
│   ├── subgroup_lattice.clj
│   ├── visualizing_random_walks.clj
│   └── week1.clj
│
├── tex-posts/                   # SOURCE: TeX blog posts (converted via scripts/convert-tex.js)
│
├── src/                        # Helper namespaces (not rendered by Clay)
│   ├── math.clj                # Theorem/proof environments
│   ├── tikz.clj                # TikZ diagram rendering
│   └── text.clj                # Titles, quotes, citations, downloads
│
├── scripts/
│   ├── convert-tex.js          # TeX post → Quarto .qmd conversion
│   └── render-tikz.sh          # TikZ → PNG shell script
│
└── site/                       # OUTPUT: Final website (GitHub Pages publish dir)
    ├── index.html              # Home page
    ├── blog.html               # Blog listing page
    ├── portfolio.html          # Portfolio page
    ├── cv.html                 # CV page
    ├── about.html              # About page
    │
    ├── css/
    │   ├── main.css            # Design tokens, nav/footer/hero/CV/About/Portfolio styles
    │   └── blog.css            # Blog listing (featured post, filters, post rows)
    │
    ├── js/
    │   ├── blog.js             # Blog post loading & category/year filtering
    │   ├── portfolio.js        # Portfolio filtering & PDF modal
    │   ├── github-repos.js     # Pinned GitHub repo list
    │   └── blog-posts.json     # Auto-generated blog index (DO NOT EDIT)
    │
    ├── assets/
    │   ├── images/             # Static images (portrait.jpeg, etc.)
    │   ├── pdfs/               # Downloadable PDFs (cv.pdf, etc.)
    │   └── data/               # Downloadable data files
    │
    └── notebooks/              # Quarto project for notebooks
        ├── _quarto.yml         # Quarto configuration
        ├── custom.scss         # Notebook styling overrides
        ├── notebook/           # Clay output (.qmd intermediate files)
        ├── _site/              # Quarto HTML output (git-ignored)
        ├── images/tikz/        # Pre-rendered TikZ diagram PNGs
        └── *.html              # Final rendered notebook pages
```

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
3. Remove utility-only files (`tikz.html`, `math.html`, `text.html`) so they don't appear as blog posts
4. Generate blog index JSON via `node generate-blog-index.js`

---

## Important Commands

### Build Commands

| Command | Description |
|---------|-------------|
| `./build.sh` | Full build (Clay → Quarto → copy files → blog index) |
| `./build.sh --serve` | Build and start local server |
| `./build.sh --serve-only` | Start server without rebuilding |
| `./build.sh --port=3000` | Use custom port (default: 8000) |

### Development Commands

| Command | Description |
|---------|-------------|
| `clojure -M:repl/notebooks` | Start REPL for interactive development |
| `clojure -M:render/notebooks -A:markdown` | Render Clay notebooks to Quarto |
| `quarto render site/notebooks` | Render Quarto to HTML |
| `quarto preview site/notebooks` | Live preview with hot reload |
| `node generate-blog-index.js` | Regenerate blog-posts.json |

### Dependency Commands

| Command | Description |
|---------|-------------|
| `clojure -P` | Download all dependencies |
| `clojure -P -M:render/notebooks` | Download render dependencies |
| `clojure -Sdeps '{:deps {new/dep {:mvn/version "x.y.z"}}}' -P` | Test adding a dep |

---

## Customizing the Website

### Main Pages (HTML/CSS)

The main website pages are plain HTML files in `site/`:

| File | Purpose |
|------|---------|
| `site/index.html` | Home page with profile, social links, recent posts |
| `site/blog.html` | Blog listing with search and category filters |
| `site/portfolio.html` | Project portfolio grid |
| `site/cv.html` | Curriculum vitae |
| `site/about.html` | About me page |

**To modify a page:**
1. Edit the HTML file directly
2. Refresh browser (no build needed for static pages)

### Blog Notebooks (Clojure/Quarto)

Blog posts are written as Clojure notebooks in `notebooks/`:

**Creating a new post:**

```clojure
;; notebooks/my-new-post.clj

^{:kindly/hide-code true
  :clay {:title  "My New Post"
         :quarto {:author      :Eugen
                  :description "Description for SEO and previews"
                  :type        :post
                  :date        "2025-01-25"
                  :category    :math
                  :tags        [:clojure :data-science]}}}

(ns my-new-post
  (:require [scicloj.kindly.v4.kind :as kind]
            [math :as math]
            [text :as text]
            [tikz :as tikz]))

;; # My New Post
;;
;; Write content using markdown in comments.
;; Code blocks are automatically rendered.

(+ 1 2 3)

;; ## Math
;;
;; Use LaTeX: $E = mc^2$
;;
;; Display math:
;;
;; $$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
```

**Notebook metadata fields:**

| Field | Purpose |
|-------|---------|
| `:title` | Post title |
| `:author` | Author name (use `:Eugen` keyword) |
| `:description` | SEO description and post excerpt |
| `:date` | Publication date (YYYY-MM-DD) |
| `:category` | Post category for filtering |
| `:tags` | Keywords for search |

### Styling

**Main site CSS:** `site/css/main.css`
- Navbar, hero section, numbered Contents/Recent Entries lists, CV, About, Portfolio
- Paper/ink/oxblood design tokens via CSS custom properties (single theme, no dark mode)

**Blog CSS:** `site/css/blog.css`
- Featured post, sidebar category/archive filters, post rows, tag pills

**Notebook CSS:** `site/notebooks/custom.scss`
- Typography (Source Serif 4), content width (1040px max)
- Code blocks, math display, tables
- Navbar/footer matching main site
- Note to render code blocks on our blog, we need to wrap code into 
```
 (kind/md "<div class=\"show-code\">")

  (defn foo [x] (* x x))   ;; this cell's
  code will be visible

  (kind/md "</div>")
```

---

## LaTeX Configuration

### MathJax Setup

MathJax is configured in `site/notebooks/_quarto.yml`:

```yaml
html-math-method:
  method: mathjax
  url: "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
```

**Loaded packages:**
- `ams` - American Mathematical Society
- `physics` - Physics notation (bra-ket, etc.)
- `boldsymbol` - Bold math symbols
- `mathtools` - Extended math tools
- `cancel` - Strikethrough in math

### Custom Macros

Pre-defined macros in `site/notebooks/_quarto.yml`:

| Macro | Output | Example |
|-------|--------|---------|
| `\R` | R (blackboard) | `$x \in \R$` |
| `\N` | N (blackboard) | `$n \in \N$` |
| `\Z` | Z (blackboard) | `$k \in \Z$` |
| `\C` | C (blackboard) | `$z \in \C$` |
| `\Q` | Q (blackboard) | `$q \in \Q$` |
| `\vec{x}` | **x** (bold) | `$\vec{v}$` |
| `\norm{x}` | \|\|x\|\| | `$\norm{x}_2$` |
| `\abs{x}` | \|x\| | `$\abs{z}$` |
| `\inner{u}{v}` | <u,v> | `$\inner{f}{g}$` |
| `\dd{x}` | dx | `$\int f \dd{x}$` |
| `\dv{f}{x}` | df/dx | `$\dv{y}{t}$` |
| `\pdv{f}{x}` | df/dx (partial) | `$\pdv{u}{x}$` |
| `\E{X}` | E[X] | `$\E{X^2}$` |
| `\Var{X}` | Var(X) | `$\Var{X}$` |
| `\Cov{X}{Y}` | Cov(X,Y) | `$\Cov{X}{Y}$` |
| `\Prob{A}` | P(A) | `$\Prob{X > 0}$` |

### Adding New LaTeX Packages

**For MathJax (web):**

Edit `site/notebooks/_quarto.yml`:

```yaml
include-in-header:
  - text: |
      <script>
      window.MathJax = {
        tex: {
          packages: {'[+]': ['ams', 'physics', 'NEW_PACKAGE']},
          // ...
        },
        loader: {
          load: ['[tex]/ams', '[tex]/physics', '[tex]/NEW_PACKAGE']
        }
      };
      </script>
```

**Adding custom macros:**

```yaml
macros: {
  // Add your macro
  myMacro: ['\\text{Result: }#1', 1],  // 1 argument
  myOp: ['#1 \\circ #2', 2],           // 2 arguments
}
```

---

## Utility Namespaces

The `notebooks/` directory contains three utility namespaces alongside blog post notebooks. They are on the classpath via `deps.edn` `:paths ["notebooks"]` and can be required from any notebook. Their rendered HTML is automatically removed by `build.sh` so they don't appear as blog posts.

```clojure
(ns my-post
  (:require [math :as math]
            [tikz :as tikz]
            [text :as text]))
```

### Math Environments (`math.clj`)

Quarto theorem environments with auto-numbering and cross-references. Each function emits a Quarto fenced div via `kind/md`.

**Functions:**

| Function | Cross-ref prefix | Example |
|----------|-----------------|---------|
| `math/definition` | `@def-` | `(math/definition "group" "A **group** is..." :name "Group")` |
| `math/theorem` | `@thm-` | `(math/theorem "maschke" "Let $G$ be..." :name "Maschke's Theorem")` |
| `math/lemma` | `@lem-` | `(math/lemma "schur" "..." :name "Schur's Lemma")` |
| `math/corollary` | `@cor-` | `(math/corollary "label" "...")` |
| `math/proposition` | `@prp-` | `(math/proposition "label" "...")` |
| `math/conjecture` | `@cnj-` | `(math/conjecture "label" "...")` |
| `math/example` | `@exm-` | `(math/example "label" "...")` |
| `math/exercise` | `@exr-` | `(math/exercise "label" "...")` |
| `math/proof` | — | `(math/proof "Consider the left cosets...")` |
| `math/remark` | — | `(math/remark "This follows from...")` |

All except `proof` and `remark` take `(label body & {:keys [name]})`. The `:name` option sets the display name in the header. Cross-reference in text with Quarto syntax like `@def-group` or `@thm-maschke`.

### Text Rendering (`text.clj`)

Helpers for rendering titles, blockquotes, citations, and download links. Each function emits `kind/md` or `kind/hiccup` with `:kindly/hide-code true`.

**`text/title`** — Render a markdown heading:

```clojure
(text/title "Main Heading")          ;; h1
(text/title "Subsection" 2)          ;; h2
(text/title "Sub-subsection" 3)      ;; h3
```

**`text/blockquote`** — Render a blockquote with optional attribution:

```clojure
(text/blockquote "The purpose of computation is insight, not numbers.")
(text/blockquote "Mathematics is the queen of the sciences." :cite "Gauss")
```

**`text/cite`** — Render a formatted citation:

```clojure
(text/cite "Serre" "Linear Representations of Finite Groups"
           :year 1977
           :publisher "Springer")

(text/cite "Atiyah & MacDonald" "Introduction to Commutative Algebra"
           :year 1969
           :publisher "Addison-Wesley"
           :url "https://example.com")

(text/cite "Smith et al." "On the structure of groups"
           :year 2023
           :journal "Journal of Algebra"
           :volume 42
           :pages "1-25"
           :doi "10.1234/example")
```

Supported options: `:year`, `:url`, `:journal`, `:volume`, `:pages`, `:publisher`, `:doi`.

**`text/bibliography`** — Render a numbered reference list:

```clojure
(text/bibliography
  ["Serre, *Linear Representations of Finite Groups*, Springer, 1977."
   "Atiyah & MacDonald, *Introduction to Commutative Algebra*, 1969."])
```

**`text/download`** — Render a styled download link for a file:

```clojure
(text/download "../../assets/pdfs/notes.pdf" "Download Lecture Notes")
```

### TikZ Diagrams (`tikz.clj`)

TikZ diagrams are pre-rendered to PNG because MathJax doesn't support TikZ natively. Requires pdflatex (TeX Live/MacTeX) and ImageMagick or pdftoppm. PNGs are cached in `site/notebooks/images/tikz/`.

```bash
# macOS
brew install --cask mactex    # or basictex
brew install imagemagick

# Linux
sudo apt install texlive-full imagemagick
```

**`tikz/render`** — Render TikZ code to a PNG image:

```clojure
(tikz/render
  "\\begin{tikzpicture}
    \\draw[->] (0,0) -- (1,1);
   \\end{tikzpicture}"
  "my-diagram"
  :caption "A simple arrow"
  :width "50%"
  :dpi 300)
```

**`tikz/render-raw`** — Same but auto-wraps in `\begin{tikzpicture}`:

```clojure
(tikz/render-raw
  "\\draw (0,0) circle (1cm);"
  "circle-diagram")
```

**`tikz/node-diagram`** — Convenience helper for node-and-edge diagrams:

```clojure
(tikz/node-diagram
  "flow-chart"
  [["A" "Start" 0 0]
   ["B" "Process" 2 0]
   ["C" "End" 4 0]]
  [["A" "B"]
   ["B" "C" "next"]]
  :caption "Simple flow")
```

**Pre-loaded TikZ libraries:** `arrows.meta`, `positioning`, `calc`, `shapes`, `backgrounds`, `decorations.pathmorphing`, `decorations.markings`, `patterns`, `matrix`, `fit`, `chains`, `pgfplots`.

To add more, edit the `\\usetikzlibrary{...}` line in `src/tikz.clj`.

Manual rendering: `./scripts/render-tikz.sh input.tikz output.png [dpi]`

---

## Including Downloadable PDFs

1. Place the PDF in `site/assets/pdfs/`
2. In a notebook, use `text/download` with a relative path:

```clojure
(text/download "../../assets/pdfs/my-doc.pdf" "Download PDF")
```

The path is `../../assets/pdfs/` because rendered HTML lives at `site/notebooks/<name>.html` — two directories up reaches `site/`.

You can also use a plain markdown link in a comment:

```clojure
;; [Download the PDF](../../assets/pdfs/my-doc.pdf)
```

---

## Managing Dependencies

### Clojure Dependencies

Edit `deps.edn`:

```clojure
{:deps {
  ;; Data science
  org.scicloj/noj {:mvn/version "2-beta19.1"}

  ;; Add new dependencies here
  some-lib/some-lib {:mvn/version "1.0.0"}
}}
```

**Finding versions:**
- [Clojars](https://clojars.org/) - Clojure libraries
- [Maven Central](https://search.maven.org/) - Java libraries

### Current Dependencies

| Library | Purpose |
|---------|---------|
| `scicloj/noj` | Data science (includes Clay, Tablecloth, Kindly, etc.) |
| `next.jdbc` | Database connections |
| `postgresql` | PostgreSQL driver |
| `hikari-cp` | Connection pooling |
| `hugsql` | SQL query management |
| `clj-http` | HTTP client |
| `jsonista` | JSON parsing |
| `nippy` | Binary serialisation |
| `jdsp` | Digital signal processing |
| `commons-math3` | Numerical methods |
| `eclipse.elk` | Graph layout algorithms |

### Configuration Files

| File | Purpose |
|------|---------|
| `clay.edn` | Clay config: source path `notebooks/`, output to `site/notebooks/notebook/` |
| `deps.edn` | Clojure deps & aliases. `:paths` includes `notebooks/` and `site/` |
| `.github/workflows/deploy.yml` | GitHub Actions: Java 17, Node 18, deploys `site/` to GitHub Pages |
| `site/notebooks/_quarto.yml` | Quarto: theme, MathJax, macros, navbar |

---

## Quarto Configuration

### Main Config: `site/notebooks/_quarto.yml`

**Key sections:**

```yaml
# Project type
project:
  type: website

# Site navigation
website:
  title: "Eugen Nesbakken"
  navbar:
    left:
      - text: "Home"
        href: ../index.html
    # ...

# HTML output format
format:
  html:
    theme:
      - cosmo           # Base theme
      - custom.scss     # Custom overrides
    toc: true           # Table of contents
    toc-depth: 4        # TOC heading depth
    number-sections: true
    code-fold: false    # Don't collapse code
    code-tools: true    # Show code tools
    fontsize: 17px
    mainfont: "Source Serif 4"
```

### Changing the Theme

Available Quarto themes:
- `cosmo`, `flatly`, `journal`, `lumen`, `minty`, `pulse`, `sandstone`, `simplex`, `sketchy`, `slate`, `solar`, `spacelab`, `superhero`, `united`, `yeti`

```yaml
format:
  html:
    theme:
      - flatly          # Change base theme
      - custom.scss
```

---

## Blog System

### How It Works

1. **Write** notebooks in `notebooks/*.clj`
2. **Build** runs Clay → Quarto → HTML
3. **Index** script extracts metadata from HTML
4. **Frontend** loads `blog-posts.json` dynamically

### Blog Index Generation

`generate-blog-index.js` extracts:
- Title (from `<title>` or `<h1>`)
- Date (from meta tags or filename)
- Description (from meta tags or first `<p>`)
- Author, category, tags

**Excluding files from blog:**

Edit `generate-blog-index.js`:

```javascript
const EXCLUDED_FILES = ['tikz.html', 'utilities.html'];
```

Utility namespaces (`tikz.html`, `math.html`, `text.html`) are also removed by `build.sh` before index generation.

### Frontend: `site/js/blog.js`

**Key functions:**
- `loadBlogPosts()` - Fetches and renders all posts
- `loadRecentPosts(n)` - Loads n most recent posts
- `filterByCategory(cat)` - Category filtering
- `searchPosts(query)` - Text search

---

## Deployment

### GitHub Pages (Current)

Configured in `.github/workflows/deploy.yml`, which runs `bash build.sh` and publishes `site/` via `actions/deploy-pages`.

**Deploy:**
1. Push to `main`
2. GitHub Actions builds and deploys automatically (or trigger manually via `workflow_dispatch`)

Notebook pages (`site/notebooks/_quarto.yml`) hardcode absolute `https://eugnes03.github.io/personalwebpage/...` URLs for the nav and "Back to Blog" link — update these if the GitHub Pages path ever changes.

### Manual Deployment

The `site/` directory is the complete static website. Copy it anywhere:

```bash
# Build
./build.sh

# Deploy to any static host
rsync -avz site/ user@server:/var/www/html/
```

---

## Troubleshooting

### Notebooks not rendering

```bash
# Check Clay output
ls site/notebooks/notebook/*.qmd

# Check Quarto output
ls site/notebooks/_site/notebook/*.html

# Rebuild Quarto only
quarto render site/notebooks
```

### CSS not loading on notebooks

Ensure `site_libs` is copied:
```bash
cp -r site/notebooks/_site/site_libs site/
```

### TikZ diagrams failing

```bash
# Check pdflatex
which pdflatex

# Check ImageMagick
which convert

# Manual test
pdflatex test.tex
convert -density 300 test.pdf test.png
```

### MathJax not rendering

1. Check browser console for errors
2. Verify MathJax URL in `_quarto.yml`
3. Check for malformed LaTeX

---

## File Reference

| File | Edit for... |
|------|-------------|
| `site/index.html` | Home page layout, social links |
| `site/css/main.css` | Site-wide design tokens, nav, hero, CV/About/Portfolio |
| `site/css/blog.css` | Blog listing styling (featured post, filters, post rows) |
| `site/notebooks/_quarto.yml` | LaTeX config, MathJax macros, navbar |
| `site/notebooks/custom.scss` | Notebook typography, colors, layout |
| `src/math.clj` | Theorem/proof environments, add new math env types |
| `src/text.clj` | Titles, blockquotes, citations, download links |
| `src/tikz.clj` | TikZ rendering, add TikZ libraries |
| `clay.edn` | Clay rendering config (source/target paths) |
| `deps.edn` | Clojure dependencies |
| `generate-blog-index.js` | Blog index generation, excluded files |
| `build.sh` | Build process, server options |
