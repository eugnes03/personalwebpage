#!/bin/bash
# TikZ to PNG renderer
# Usage: ./render-tikz.sh input.tikz output.png [dpi]
#
# Requires: pdflatex, ImageMagick (convert) or pdftoppm

set -e

INPUT="$1"
OUTPUT="$2"
DPI="${3:-300}"

if [ -z "$INPUT" ] || [ -z "$OUTPUT" ]; then
    echo "Usage: $0 input.tikz output.png [dpi]"
    echo "  input.tikz - File containing TikZ code (just the tikzpicture, no document wrapper)"
    echo "  output.png - Output PNG file path"
    echo "  dpi        - Resolution (default: 300)"
    exit 1
fi

# Create temp directory
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Read TikZ code
TIKZ_CODE=$(cat "$INPUT")

# Create LaTeX document
cat > "$TMPDIR/tikz.tex" << 'HEADER'
\documentclass[tikz,border=10pt]{standalone}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{tikz}
\usetikzlibrary{arrows.meta,positioning,calc,shapes,backgrounds,decorations.pathmorphing,decorations.markings,patterns,matrix,fit,chains}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\begin{document}
HEADER

echo "$TIKZ_CODE" >> "$TMPDIR/tikz.tex"

cat >> "$TMPDIR/tikz.tex" << 'FOOTER'
\end{document}
FOOTER

# Compile LaTeX to PDF
cd "$TMPDIR"
pdflatex -interaction=nonstopmode tikz.tex > /dev/null 2>&1

if [ ! -f "tikz.pdf" ]; then
    echo "Error: LaTeX compilation failed"
    cat tikz.log
    exit 1
fi

# Convert PDF to PNG
# Try ImageMagick first, fall back to pdftoppm
if command -v convert &> /dev/null; then
    convert -density "$DPI" tikz.pdf -quality 100 "$OLDPWD/$OUTPUT"
elif command -v pdftoppm &> /dev/null; then
    pdftoppm -png -r "$DPI" tikz.pdf > "$OLDPWD/$OUTPUT"
else
    echo "Error: Neither ImageMagick (convert) nor pdftoppm found"
    exit 1
fi

echo "Created: $OUTPUT"
