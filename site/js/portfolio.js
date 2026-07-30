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

    // ── Rows ───────────────────────────────────────────────────────────────────
    function renderCards(cat) {
        const filtered = cat === 'all' ? allProjects : allProjects.filter(p => p.category === cat);
        if (filtered.length === 0) {
            grid.innerHTML = '<p class="portfolio-empty">No projects in this category yet.</p>';
            return;
        }
        grid.innerHTML = filtered.map((p, i) => rowHTML(p, i)).join('');
        grid.querySelectorAll('.pf-row').forEach(row => {
            row.addEventListener('click', () => openModal(row.dataset.index));
        });
    }

    function rowHTML(p, i) {
        const dateStr = p.date ? `<span class="pf-row-date">${formatDate(p.date)}</span>` : '';
        return `
        <button class="pf-row" data-index="${i}" aria-label="Open ${p.title}">
            <span class="pf-row-cat">${p.category}</span>
            <span class="pf-row-title">${p.title}</span>
            ${dateStr}
        </button>`;
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
})();
