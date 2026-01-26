const fs = require('fs');
const path = require('path');

// Configuration
const NOTEBOOKS_DIR = 'site/notebooks';
const OUTPUT_FILE = 'site/js/blog-posts.json';

function extractMetadata(htmlContent, filename) {
    // Extract title from Quarto YAML or <title> tag or <h1>
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/) || 
                      htmlContent.match(/<h1[^>]*class="title"[^>]*>(.*?)<\/h1>/) ||
                      htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : filename.replace('.html', '');
    
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
    
    // Extract category
    const categoryMatch = htmlContent.match(/<meta name="category" content="(.*?)"/) ||
                         htmlContent.match(/<meta property="article:section" content="(.*?)"/);
    const category = categoryMatch ? categoryMatch[1] : 'general';
    
    // Extract tags
    const tagsMatch = htmlContent.match(/<meta name="keywords" content="(.*?)"/) ||
                     htmlContent.match(/<meta property="article:tag" content="(.*?)"/);
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [];
    
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
        .filter(f => !f.startsWith('_')); // Ignore Quarto internal files
    
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

try {
    generateBlogIndex();
} catch (error) {
    console.error('❌ Error generating blog index:', error);
    process.exit(1);
}