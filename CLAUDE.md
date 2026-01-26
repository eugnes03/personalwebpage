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

### Key Paths

- `notebooks/` - Source Clojure notebook files
- `site/` - Static website (publish directory)
- `site/notebooks/_site/notebook/` - Rendered notebook HTML output
- `site/js/blog-posts.json` - Auto-generated blog post index

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

### Configuration Files

- `clay.edn` - Clay notebook rendering config (output paths, Quarto theme)
- `deps.edn` - Clojure dependencies and aliases
- `netlify.toml` - Netlify build config (Java 17, Node 18)

## Dependencies

Requires: Clojure CLI, Quarto, Node.js

Key Clojure libraries: Clay v2, Tablecloth, Kindly, scicloj/noj (data science stack)
