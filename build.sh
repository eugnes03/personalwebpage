#!/bin/bash
set -e

# Parse arguments
SERVE=false
SERVE_ONLY=false
PORT=8000

for arg in "$@"; do
    case $arg in
        --serve|-s)
            SERVE=true
            ;;
        --serve-only)
            SERVE_ONLY=true
            ;;
        --port=*)
            PORT="${arg#*=}"
            ;;
    esac
done

# Function to start local server
start_server() {
    echo ""
    echo "======================================"
    echo "Starting local server on http://localhost:$PORT"
    echo "======================================"
    cd site && python3 -m http.server $PORT
}

# If --serve-only, skip build and just serve
if [ "$SERVE_ONLY" = true ]; then
    start_server
    exit 0
fi

echo "======================================"
echo "Personal Website Build Script"
echo "======================================"

# Install Clojure CLI
echo ""
echo "→ Installing Clojure CLI..."
if ! command -v clojure &> /dev/null; then
    curl -O https://download.clojure.org/install/linux-install-1.11.1.1435.sh
    chmod +x linux-install-1.11.1.1435.sh
    sudo ./linux-install-1.11.1.1435.sh
    rm linux-install-1.11.1.1435.sh
    echo "✓ Clojure installed"
else
    echo "✓ Clojure already installed"
fi

# Install Quarto
echo ""
echo "→ Installing Quarto..."
if ! command -v quarto &> /dev/null; then
    wget -q https://github.com/quarto-dev/quarto-cli/releases/download/v1.8.25/quarto-1.8.25-linux-amd64.deb
    sudo dpkg -i quarto-1.8.25-linux-amd64.deb
    rm quarto-1.8.25-linux-amd64.deb
    echo "✓ Quarto installed"
else
    echo "✓ Quarto already installed"
fi

# Verify installations
echo ""
echo "→ Verifying installations..."
echo "Clojure version:"
clojure --version
echo "Quarto version:"
quarto --version

# Download Clojure dependencies
echo ""
echo "→ Downloading Clojure dependencies..."
clojure -P -M:render/notebooks
echo "✓ Dependencies downloaded"

# Render Clay notebooks to Quarto markdown
echo ""
echo "→ Rendering Clay notebooks to Quarto markdown..."
clojure -M:render/notebooks -A:markdown
echo "✓ Clay notebooks rendered"

# Convert TeX posts to QMD (runs before Quarto so they are included in the render)
echo ""
echo "→ Converting TeX posts to QMD..."
if ls tex-posts/*.tex 1>/dev/null 2>&1; then
    node scripts/convert-tex.js
    echo "✓ TeX posts converted"
else
    echo "✓ No TeX posts found, skipping"
fi

# Render Quarto to HTML
echo ""
echo "→ Running Quarto render (site -> HTML)..."
quarto render site/notebooks
echo "✓ Quarto render complete"

# Copy full Quarto output to serve location
echo ""
echo "→ Setting up notebook output..."
if [ -d "site/notebooks/_site" ]; then
    # Copy site_libs to site/ (HTML uses ../site_libs/ relative path)
    cp -r site/notebooks/_site/site_libs site/ 2>/dev/null || true
    # Copy notebook HTML files to site/notebooks/
    cp site/notebooks/_site/notebook/*.html site/notebooks/ 2>/dev/null || true
    # No utility files to remove (all helpers live in src/)
    echo "✓ Notebooks ready at site/notebooks/"
else
    echo "⚠ Warning: No rendered notebooks found"
fi

# Generate blog index from rendered HTML files
echo ""
echo "→ Generating blog index..."
if [ -f "generate-blog-index.js" ]; then
    node generate-blog-index.js
    echo "✓ Blog index generated"
else
    echo "⚠ Warning: generate-blog-index.js not found, skipping index generation"
fi

echo ""
echo "======================================"
echo "✓ Build complete!"
echo "======================================"
echo "Site is ready in: site/"
echo ""

# Start server if --serve flag was passed
if [ "$SERVE" = true ]; then
    start_server
fi