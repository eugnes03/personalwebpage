const fs = require('fs');
const path = require('path');

// Configuration
const NOTEBOOKS_DIR = 'site/notebooks';
const OUTPUT_FILE = 'site/js/blog-posts.json';

const PORTFOLIO_DIR = 'site/assets/pdfs/portfolio';
const PORTFOLIO_META_FILE = 'site/assets/pdfs/portfolio/portfolio-meta.json';
const PORTFOLIO_OUTPUT_FILE = 'site/js/portfolio-projects.json';

// Files to exclude from blog index (utility modules, not posts)
const EXCLUDED_FILES = ['tikz.html'];

function extractMetadata(htmlContent, filename) {
    // Try <h1 class="title"> first (clean post title, no site name).
    // Fall back to <title> tag with site-name stripping for both Quarto formats:
    //   Quarto 1.4: "Site Name - Post Title"  (prefix, regular hyphen)
    //   Quarto 1.8: "Post Title – Site Name"  (suffix, em-dash)
    const titleMatch = htmlContent.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/h1>/) ||
                       htmlContent.match(/<title>(.*?)<\/title>/);
    const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : filename.replace('.html', '');
    const title = rawTitle
        .replace(/^Eugen Nesbakken\s*[-–—]\s*/, '')
        .replace(/\s*[-–—]\s*Eugen Nesbakken\s*$/, '')
        .trim();
    
    // Extract date from Quarto meta or filename
    const metaDateMatch = htmlContent.match(/<meta name="dcterms\.date" content="(.*?)"/) ||
                         htmlContent.match(/<meta name="date" content="(.*?)"/);
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    const date = metaDateMatch ? metaDateMatch[1] : 
                 dateMatch ? dateMatch[1] : 
                 new Date().toISOString().split('T')[0];
    
    // Extract description from Quarto meta or first paragraph
    const descMatch = htmlContent.match(/<meta name="description" content="(.*?)"/) ||
                     htmlContent.match(/<meta property="og:description" content="(.*?)"/);
    const paraMatch = htmlContent.match(/<p[^>]*>(.*?)<\/p>/);
    const excerpt = descMatch ? descMatch[1] :
                    paraMatch ? paraMatch[1].replace(/<[^>]*>/g, '').substring(0, 200).trim() + '...' :
                    'A notebook exploring interesting topics.';
    
    // Extract author
    const authorMatch = htmlContent.match(/<meta name="author" content="(.*?)"/) ||
                       htmlContent.match(/<meta name="dcterms\.creator" content="(.*?)"/);
    const author = authorMatch ? authorMatch[1] : 'Eugen Nesbakken';
    
    // Extract category — try Clay's YAML code block first, then the HTML
    // comment injected by scripts/convert-tex.js for TeX-sourced posts.
    const categoryMatch =
      htmlContent.match(/<span class="an">category:<\/span><span class="co"> ([^<]+)<\/span>/) ||
      htmlContent.match(/<!-- tex-post-meta:.*?category="([^"]*)".*?-->/);
    const category = categoryMatch ? categoryMatch[1].trim() : 'general';

    // Extract tags — same two-source fallback as category.
    const tagsMatch =
      htmlContent.match(/<span class="an">tags:<\/span><span class="co"> \[([^\]]+)\]<\/span>/);
    const texTagsMatch =
      !tagsMatch && htmlContent.match(/<!-- tex-post-meta:.*?tags="([^"]*)".*?-->/);
    const tags = tagsMatch
      ? tagsMatch[1].split(',').map(t => t.trim())
      : texTagsMatch && texTagsMatch[1]
        ? texTagsMatch[1].split(',').map(t => t.trim()).filter(Boolean)
        : [];
    
    return { title, date, excerpt, author, category, tags };
}

function generateBlogIndex() {
    console.log('Scanning notebooks directory:', NOTEBOOKS_DIR);
    
    if (!fs.existsSync(NOTEBOOKS_DIR)) {
        console.warn('⚠ Notebooks directory does not exist:', NOTEBOOKS_DIR);
        console.log('Creating empty blog index...');
        
        // Ensure output directory exists
        const outputDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
        return;
    }
    
    const files = fs.readdirSync(NOTEBOOKS_DIR)
        .filter(f => f.endsWith('.html'))
        .filter(f => !f.startsWith('_')) // Ignore Quarto internal files
        .filter(f => !EXCLUDED_FILES.includes(f)); // Ignore utility modules
    
    console.log(`Found ${files.length} HTML file(s)`);
    
    const posts = files.map(filename => {
        const filepath = path.join(NOTEBOOKS_DIR, filename);
        const content = fs.readFileSync(filepath, 'utf-8');
        const metadata = extractMetadata(content, filename);
        
        return {
            title: metadata.title,
            date: metadata.date,
            url: `notebooks/${filename}`,
            excerpt: metadata.excerpt,
            author: metadata.author,
            category: metadata.category,
            tags: metadata.tags,
            filename: filename
        };
    });
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
    
    console.log(`\n✓ Generated blog index with ${posts.length} post(s):`);
    posts.forEach(post => {
        console.log(`  • ${post.title} (${post.date}) - ${post.category}`);
    });
    console.log(`\nIndex saved to: ${OUTPUT_FILE}\n`);
}

function prettifyFilename(filename) {
    return filename
        .replace(/\.pdf$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function generatePortfolioIndex() {
    console.log('Scanning portfolio PDFs directory:', PORTFOLIO_DIR);

    if (!fs.existsSync(PORTFOLIO_DIR)) {
        console.warn('⚠ Portfolio directory does not exist:', PORTFOLIO_DIR);
        fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });
        fs.writeFileSync(PORTFOLIO_OUTPUT_FILE, JSON.stringify([], null, 2));
        return;
    }

    // Load optional metadata
    let meta = {};
    if (fs.existsSync(PORTFOLIO_META_FILE)) {
        try {
            const raw = JSON.parse(fs.readFileSync(PORTFOLIO_META_FILE, 'utf-8'));
            // Drop the _comment key if present
            Object.keys(raw).forEach(k => { if (!k.startsWith('_')) meta[k] = raw[k]; });
        } catch (e) {
            console.warn('⚠ Could not parse portfolio-meta.json:', e.message);
        }
    }

    const files = fs.readdirSync(PORTFOLIO_DIR)
        .filter(f => f.toLowerCase().endsWith('.pdf'));

    console.log(`Found ${files.length} PDF(s)`);

    const projects = files.map(filename => {
        const m = meta[filename] || {};
        return {
            title:       m.title       || prettifyFilename(filename),
            description: m.description || '',
            category:    m.category    || 'Writing',
            date:        m.date        || '',
            filename,
            url: `assets/pdfs/portfolio/${filename}`
        };
    });

    // Sort: dated entries newest-first, then undated alphabetically
    projects.sort((a, b) => {
        if (a.date && b.date) return b.date.localeCompare(a.date);
        if (a.date) return -1;
        if (b.date) return 1;
        return a.title.localeCompare(b.title);
    });

    const outputDir = path.dirname(PORTFOLIO_OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(PORTFOLIO_OUTPUT_FILE, JSON.stringify(projects, null, 2));

    console.log(`\n✓ Generated portfolio index with ${projects.length} project(s):`);
    projects.forEach(p => console.log(`  • ${p.title} (${p.category})`));
    console.log(`\nIndex saved to: ${PORTFOLIO_OUTPUT_FILE}\n`);
}

try {
    generateBlogIndex();
    generatePortfolioIndex();
} catch (error) {
    console.error('❌ Error generating indexes:', error);
    process.exit(1);
}