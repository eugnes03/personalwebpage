// Load blog posts from generated JSON index

const BLOG_POSTS_PATH = 'js/blog-posts.json';

let allPosts = [];
let activeCategory = '';
let activeYear = '';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function formatDateLabel(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!m || !d) {
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return `${MONTHS[m - 1]} ${d}, ${y}`;
}

async function loadAllPosts() {
    const container = document.getElementById('blog-posts');
    if (!container) return;

    try {
        const response = await fetch(BLOG_POSTS_PATH);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const posts = await response.json();
        allPosts = posts;

        renderFeaturedPost(posts);
        renderCategoryFilters(posts);
        renderYearFilters(posts);
        renderFilteredPosts();

        console.log(`Loaded ${posts.length} blog posts`);
    } catch (error) {
        console.error('Error loading blog posts:', error);
        container.innerHTML = `
            <div class="error">
                <p>Unable to load blog posts.</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                    Make sure <code>js/blog-posts.json</code> exists and is accessible.
                </p>
            </div>
        `;
    }
}

function renderFeaturedPost(posts) {
    const container = document.getElementById('featured-post');
    if (!container) return;

    const featured = posts.find(p => p.slug === 'visualizing-random-walks') || posts[0];
    if (!featured) return;

    container.innerHTML = `
        <a href="${featured.url}" class="featured-post">
            <p class="section-label">Featured</p>
            <div class="featured-grid">
                <div>
                    <div class="featured-meta">
                        <span class="cat">${featured.category}</span>
                        <time>${formatDateLabel(featured.date)}</time>
                    </div>
                    <h2 class="featured-title">${featured.title}</h2>
                    <p class="featured-excerpt">${featured.excerpt}</p>
                    <span class="featured-cta">Read the full entry &rarr;</span>
                </div>
            </div>
        </a>
    `;
}

function renderCategoryFilters(posts) {
    const container = document.getElementById('category-filters');
    if (!container) return;

    const categories = [...new Set(posts.map(post => post.category).filter(Boolean))];

    let html = `<button class="filter-btn active" data-category="">All</button>`;
    categories.forEach(category => {
        const count = posts.filter(p => p.category === category).length;
        html += `<button class="filter-btn" data-category="${category}">${category} (${count})</button>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategory = btn.dataset.category || '';
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
            renderFilteredPosts();
        });
    });
}

function renderYearFilters(posts) {
    const container = document.getElementById('year-filters');
    if (!container) return;

    const years = [...new Set(posts.map(post => post.date.slice(0, 4)))].sort().reverse();

    let html = `<button class="filter-btn active" data-year="">All</button>`;
    years.forEach(year => {
        const count = posts.filter(p => p.date.slice(0, 4) === year).length;
        html += `<button class="filter-btn" data-year="${year}">${year} (${count})</button>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeYear = btn.dataset.year || '';
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
            renderFilteredPosts();
        });
    });
}

function renderFilteredPosts() {
    const filtered = allPosts
        .filter(p => !activeCategory || p.category === activeCategory)
        .filter(p => !activeYear || p.date.slice(0, 4) === activeYear);

    renderPosts(filtered);
}

function renderPosts(posts) {
    const container = document.getElementById('blog-posts');
    if (!container) return;

    if (posts.length === 0) {
        container.innerHTML = '<p class="no-posts">No posts match this filter.</p>';
        return;
    }

    container.innerHTML = posts.map(createPostRow).join('');
}

function createPostRow(post) {
    const tagsHtml = post.tags && post.tags.length > 0
        ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
        : '';

    return `
        <article class="post-row">
            <div class="post-body">
                <div class="post-meta-row">
                    <span class="cat">${post.category}</span>
                    <time>${formatDateLabel(post.date)}</time>
                </div>
                <h3 class="post-title"><a href="${post.url}">${post.title}</a></h3>
                <p class="post-excerpt">${post.excerpt}</p>
                ${tagsHtml}
            </div>
        </article>
    `;
}

async function loadRecentPosts(limit = 3) {
    const container = document.getElementById('recent-posts-container');
    if (!container) return;

    try {
        const response = await fetch(BLOG_POSTS_PATH);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const posts = await response.json();
        const recentPosts = posts.slice(0, limit);

        if (recentPosts.length === 0) {
            container.innerHTML = '<p class="no-posts">No blog posts yet.</p>';
            return;
        }

        container.innerHTML = recentPosts.map(createEntryRow).join('');
        console.log(`Loaded ${recentPosts.length} recent posts`);
    } catch (error) {
        console.error('Error loading recent posts:', error);
        container.innerHTML = '<p class="no-posts">Posts coming soon!</p>';
    }
}

function createEntryRow(post) {
    return `
        <div class="entry-row">
            <div class="entry-meta">
                <span class="cat">${post.category}</span>
                <span>${formatDateLabel(post.date)}</span>
            </div>
            <p class="entry-title"><a href="${post.url}">${post.title}</a></p>
            <p class="entry-excerpt">${post.excerpt}</p>
        </div>
    `;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadAllPosts, loadRecentPosts };
}
