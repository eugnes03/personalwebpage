(() => {
    // ── State ──────────────────────────────────────────────────────────────────
    let allProjects = [];
    let activeCategory = 'all';

    // ── DOM refs ───────────────────────────────────────────────────────────────
    const grid       = document.getElementById('portfolio-grid');
    const filterBar  = document.getElementById('portfolio-filters');
    const modal      = document.getElementById('pdf-modal');
    const modalFrame = document.getElementById('pdf-modal-frame');
    const modalTitle = document.getElementById('pdf-modal-title');
    const btnClose   = document.getElementById('pdf-modal-close');
    const btnNewTab  = document.getElementById('pdf-modal-newtab');
    const btnDl      = document.getElementById('pdf-modal-download');

    // ── Fetch index ────────────────────────────────────────────────────────────
    fetch('js/portfolio-projects.json')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
            allProjects = data;
            buildFilters();
            renderCards('all');
        })
        .catch(() => {
            grid.innerHTML = '<p class="portfolio-empty">No projects found yet. Drop PDFs into <code>site/assets/pdfs/portfolio/</code> and rebuild.</p>';
        });

    // ── Filters ────────────────────────────────────────────────────────────────
    function buildFilters() {
        const cats = ['all', ...new Set(allProjects.map(p => p.category).filter(Boolean))];
        filterBar.innerHTML = cats.map(c =>
            `<button class="pf-filter-btn${c === 'all' ? ' active' : ''}" data-cat="${c}">
                ${c === 'all' ? 'All' : c}
            </button>`
        ).join('');
        filterBar.addEventListener('click', e => {
            const btn = e.target.closest('.pf-filter-btn');
            if (!btn) return;
            activeCategory = btn.dataset.cat;
            filterBar.querySelectorAll('.pf-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
            renderCards(activeCategory);
        });
    }

    // ── Cards ──────────────────────────────────────────────────────────────────
    function renderCards(cat) {
        const filtered = cat === 'all' ? allProjects : allProjects.filter(p => p.category === cat);
        if (filtered.length === 0) {
            grid.innerHTML = '<p class="portfolio-empty">No projects in this category yet.</p>';
            return;
        }
        grid.innerHTML = filtered.map((p, i) => cardHTML(p, i)).join('');
        grid.querySelectorAll('.pf-card').forEach(card => {
            card.addEventListener('click', () => openModal(card.dataset.index));
        });
    }

    function cardHTML(p, i) {
        const dateStr = p.date ? `<span class="pf-card-date">${formatDate(p.date)}</span>` : '';
        const desc    = p.description ? `<p class="pf-card-desc">${p.description}</p>` : '';
        return `
        <article class="pf-card" data-index="${i}" tabindex="0" role="button" aria-label="Open ${p.title}">
            <div class="pf-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="9" y1="13" x2="15" y2="13"></line>
                    <line x1="9" y1="17" x2="13" y2="17"></line>
                </svg>
            </div>
            <div class="pf-card-body">
                <div class="pf-card-meta">
                    <span class="pf-card-cat">${p.category}</span>
                    ${dateStr}
                </div>
                <h3 class="pf-card-title">${p.title}</h3>
                ${desc}
            </div>
            <div class="pf-card-footer">
                <span class="pf-card-cta">
                    Read
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </span>
            </div>
        </article>`;
    }

    function formatDate(d) {
        if (!d) return '';
        // Handles "YYYY-MM", "YYYY-MM-DD", "YYYY"
        const parts = d.split('-');
        if (parts.length >= 2) {
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const m = parseInt(parts[1], 10) - 1;
            return `${months[m]} ${parts[0]}`;
        }
        return parts[0];
    }

    // ── Modal ──────────────────────────────────────────────────────────────────
    function openModal(index) {
        const p = allProjects[index];
        modalTitle.textContent = p.title;
        modalFrame.src = p.url;
        btnNewTab.onclick  = () => window.open(p.url, '_blank', 'noopener');
        btnDl.href = p.url;
        btnDl.download = p.filename;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        btnClose.focus();
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        // Clear src so the PDF is unloaded and won't keep running
        setTimeout(() => { modalFrame.src = ''; }, 300);
    }

    btnClose.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // Keyboard-activate cards
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && document.activeElement.classList.contains('pf-card')) {
            openModal(document.activeElement.dataset.index);
        }
    });
})();
