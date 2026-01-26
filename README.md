# Personal Website

A personal website built with Clojure Clay notebooks and Quarto, deployed to Netlify.

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
- [TikZ Diagrams](#tikz-diagrams)
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
├── deps.edn                    # Clojure dependencies
├── generate-blog-index.js      # Generates blog-posts.json from HTML
├── netlify.toml                # Netlify deployment config
│
├── notebooks/                  # SOURCE: Clojure notebooks
│   ├── example.clj             # Blog post notebook
│   ├── latex-demo.clj          # LaTeX demo notebook
│   └── tikz.clj                # TikZ rendering utilities (not a post)
│
└── site/                       # OUTPUT: Final website files
    ├── index.html              # Home page
    ├── blog.html               # Blog listing page
    ├── portfolio.html          # Portfolio page
    ├── cv.html                 # CV page
    ├── about.html              # About page
    │
    ├── css/
    │   ├── main.css            # Main site styles
    │   └── blog.css            # Blog-specific styles
    │
    ├── js/
    │   ├── main.js             # Main JavaScript
    │   ├── blog.js             # Blog loading/filtering
    │   ├── world-map.js        # Location map component
    │   └── blog-posts.json     # Generated blog index
    │
    ├── assets/
    │   ├── images/             # Images (portrait.jpeg, etc.)
    │   └── pdfs/               # PDFs (cv.pdf, etc.)
    │
    └── notebooks/              # Quarto project for notebooks
        ├── _quarto.yml         # Quarto configuration
        ├── custom.scss         # Notebook styling
        ├── notebook/           # Clay output (.qmd files)
        └── images/tikz/        # Pre-rendered TikZ diagrams
```

---

## Important Commands

### Build Commands

| Command | Description |
|---------|-------------|
| `./build.sh` | Full build (Clay -> Quarto -> copy files) |
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
| `site/index.html` | Home page with profile, map, social links, recent posts |
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
         :quarto {:author      "Eugen Nesbakken"
                  :description "Description for SEO and previews"
                  :type        :post
                  :date        "2025-01-25"
                  :category    "math"
                  :tags        [:clojure :data-science]}}}

(ns my-new-post
  (:require [scicloj.kindly.v4.kind :as kind]))

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
| `:author` | Author name |
| `:description` | SEO description and post excerpt |
| `:date` | Publication date (YYYY-MM-DD) |
| `:category` | Post category for filtering |
| `:tags` | Keywords for search |

### Styling

**Main site CSS:** `site/css/main.css`
- Navbar styling (lines 20-76)
- Hero section (lines 105-152)
- Social links (lines 154-207)
- Link cards (lines 218-241)
- Portfolio grid (lines 324-359)
- Location map (lines 369-433)

**Blog CSS:** `site/css/blog.css`
- Post cards
- Category tags
- Search bar

**Notebook CSS:** `site/notebooks/custom.scss`
- Typography (Times New Roman)
- Content width (800px max)
- Code blocks
- Math display
- Tables
- Navbar/footer matching main site

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

**For PDF output:**

```yaml
pdf:
  include-in-header:
    - text: |
        \usepackage{newpackage}
        \newcommand{\mymacro}[1]{\text{Result: }#1}
```

---

## TikZ Diagrams

TikZ diagrams are pre-rendered to PNG because MathJax doesn't support TikZ natively.

### Requirements

```bash
# macOS
brew install --cask mactex    # or basictex
brew install imagemagick

# Linux
sudo apt install texlive-full imagemagick
```

### Usage in Notebooks

```clojure
(ns my-notebook
  (:require [tikz :as tikz]))

;; Basic diagram
(tikz/render
  "\\begin{tikzpicture}
    \\draw[->] (0,0) -- (1,1);
   \\end{tikzpicture}"
  "my-diagram"
  :caption "A simple arrow"
  :width "50%")

;; Using render-raw (auto-wraps in tikzpicture)
(tikz/render-raw
  "\\draw (0,0) circle (1cm);"
  "circle-diagram")

;; Node diagrams helper
(tikz/node-diagram
  "flow-chart"
  [["A" "Start" 0 0]
   ["B" "Process" 2 0]
   ["C" "End" 4 0]]
  [["A" "B"]
   ["B" "C" "next"]]
  :caption "Simple flow")
```

### Available TikZ Libraries

Pre-loaded in `notebooks/tikz.clj`:
- `arrows.meta`
- `positioning`
- `calc`
- `shapes`
- `backgrounds`
- `decorations.pathmorphing`
- `decorations.markings`
- `patterns`
- `matrix`
- `fit`
- `chains`
- `pgfplots`

**To add more libraries**, edit `notebooks/tikz.clj`:

```clojure
(defn- create-latex-doc [tikz-code]
  (str "\\documentclass[tikz,border=10pt]{standalone}\n"
       "\\usepackage{tikz}\n"
       "\\usetikzlibrary{arrows.meta,positioning,NEW_LIBRARY}\n"  ; Add here
       ;; ...
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
| `scicloj/noj` | Data science (includes Clay, Tablecloth, etc.) |
| `next.jdbc` | Database connections |
| `postgresql` | PostgreSQL driver |
| `clj-http` | HTTP client |
| `jsonista` | JSON parsing |

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
    fontsize: 1.1em
    mainfont: "Times New Roman"
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

### Adding Site-Wide Features

**Add search:**
```yaml
website:
  search: true
```

**Add RSS feed:**
```yaml
website:
  site-url: "https://yourdomain.com"
  feed: true
```

---

## Blog System

### How It Works

1. **Write** notebooks in `notebooks/*.clj`
2. **Build** runs Clay -> Quarto -> HTML
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

### Frontend: `site/js/blog.js`

**Key functions:**
- `loadBlogPosts()` - Fetches and renders all posts
- `loadRecentPosts(n)` - Loads n most recent posts
- `filterByCategory(cat)` - Category filtering
- `searchPosts(query)` - Text search

---

## Deployment

### Netlify (Current)

Configured in `netlify.toml`:

```toml
[build]
  command = "./build.sh"
  publish = "site"
```

**Deploy:**
1. Push to GitHub
2. Netlify auto-deploys from main branch

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
| `site/css/main.css` | Main site styling |
| `site/css/blog.css` | Blog card styling |
| `site/js/world-map.js` | Location map (Boston/Oslo markers) |
| `site/notebooks/_quarto.yml` | LaTeX config, MathJax macros, navbar |
| `site/notebooks/custom.scss` | Notebook typography, colors, layout |
| `notebooks/tikz.clj` | TikZ rendering, add libraries |
| `deps.edn` | Clojure dependencies |
| `generate-blog-index.js` | Blog index generation, excluded files |
| `build.sh` | Build process, server options |
