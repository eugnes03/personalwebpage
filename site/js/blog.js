// Load blog posts from generated JSON index

const BLOG_POSTS_PATH = 'js/blog-posts.json';

async function loadAllPosts() {
    const container = document.getElementById('blog-posts');
    if (!container) return;
    
    try {
        const response = await fetch(BLOG_POSTS_PATH);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        
        if (posts.length === 0) {
            container.innerHTML = '<p class="no-posts">No blog posts yet. Check back soon!</p>';
            return;
        }
        
        
        // Clear container
        container.innerHTML = '';
        
        // Render all posts
        posts.forEach(post => {
            const card = createPostCard(post);
            container.appendChild(card);
        });
        
        console.log(`Loaded ${posts.length} blog posts`);
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        console.error('Attempted to fetch from:', BLOG_POSTS_PATH);
        
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

async function loadRecentPosts(limit = 3) {
    const container = document.getElementById('recent-posts-container');
    if (!container) return;
    
    try {
        const response = await fetch(BLOG_POSTS_PATH);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        
        const recentPosts = posts.slice(0, limit);
        
        if (recentPosts.length === 0) {
            container.innerHTML = '<p class="no-posts">No blog posts yet.</p>';
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Render recent posts
        recentPosts.forEach(post => {
            const card = createPostCard(post);
            container.appendChild(card);
        });
        
        console.log(`Loaded ${recentPosts.length} recent posts`);
        
    } catch (error) {
        console.error('Error loading recent posts:', error);
        container.innerHTML = '<p class="no-posts">Posts coming soon!</p>';
    }
}

function createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    
    // Format date
    const date = new Date(post.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create category badge
    const categoryBadge = post.category 
        ? `<span class="category-badge">${post.category}</span>` 
        : '';
    
    // Create tags
    const tagsHtml = post.tags && post.tags.length > 0
        ? `<div class="post-tags">
             ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
           </div>`
        : '';
    
    card.innerHTML = `
        <div class="post-header">
            <h3><a href="${post.url}">${post.title}</a></h3>
            ${categoryBadge}
        </div>
        <p class="post-meta">
            <time datetime="${post.date}">${formattedDate}</time>
            ${post.author ? `<span class="author">by ${post.author}</span>` : ''}
        </p>
        <p class="post-excerpt">${post.excerpt}</p>
        ${tagsHtml}
        <a href="${post.url}" class="read-more">Read more →</a>
    `;
    
    return card;
}

// Filter posts by category or tag (optional feature)
function filterPosts(posts, category = null, tag = null) {
    let filtered = posts;
    
    if (category) {
        filtered = filtered.filter(post => post.category === category);
    }
    
    if (tag) {
        filtered = filtered.filter(post => post.tags && post.tags.includes(tag));
    }
    
    return filtered;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadAllPosts, loadRecentPosts, filterPosts };
}