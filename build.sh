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
    wget -q https://github.com/quarto-dev/quarto-cli/releases/download/v1.4.549/quarto-1.4.549-linux-amd64.deb
    sudo dpkg -i quarto-1.4.549-linux-amd64.deb
    rm quarto-1.4.549-linux-amd64.deb
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

# Render Quarto to HTML
echo ""
echo "→ Running Quarto render (site -> HTML)..."
quarto render site/notebooks
echo "✓ Quarto render complete"

# Move rendered notebooks to clean URL location
echo ""
echo "→ Moving notebooks to clean URL location..."
if [ -d "site/notebooks/_site/notebook" ]; then
    cp site/notebooks/_site/notebook/*.html site/notebooks/ 2>/dev/null || true
    echo "✓ Notebooks moved to site/notebooks/"
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