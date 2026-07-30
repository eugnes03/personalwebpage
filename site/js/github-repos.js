(() => {
    const grid = document.getElementById('gh-grid');

    const LANG_COLORS = {
        'Clojure': '#db5855',
        'OCaml':   '#ef7a08',
        'C':       '#555555',
        'C++':     '#f34b7d',
        'Python':  '#3572A5',
    };

    fetch('js/pinned-repos.json')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(repos => {
            grid.innerHTML = repos.map(repoCard).join('');
        })
        .catch(() => {
            grid.innerHTML = '<p class="portfolio-empty">Could not load repositories.</p>';
        });

    function repoCard(r) {
        const desc = r.description ? `<span class="gh-row-desc">${escHtml(r.description)}</span>` : '';
        const color = r.language ? (LANG_COLORS[r.language] ?? '#8b7c68') : null;
        const langBadge = r.language
            ? `<span class="gh-row-lang"><span class="gh-lang-dot" style="background:${color}"></span>${escHtml(r.language)}</span>`
            : '';

        return `
        <a class="gh-row" href="${r.url}" target="_blank" rel="noopener noreferrer">
            <span class="gh-row-name">${escHtml(r.name)}</span>
            ${desc}
            ${langBadge}
        </a>`;
    }

    function escHtml(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
})();
