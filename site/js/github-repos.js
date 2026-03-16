(() => {
    const grid = document.getElementById('gh-grid');

    const LANG_COLORS = {
        'Clojure': '#db5855',
        'OCaml':   '#ef7a08',
        'C':       '#555555',
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
        const desc = r.description ? `<p class="gh-card-desc">${escHtml(r.description)}</p>` : '';
        const color = r.language ? (LANG_COLORS[r.language] ?? '#8b949e') : null;
        const langBadge = r.language
            ? `<span class="gh-lang"><span class="gh-lang-dot" style="background:${color}"></span>${escHtml(r.language)}</span>`
            : '';

        return `
        <a class="gh-card" href="${r.url}" target="_blank" rel="noopener noreferrer">
            <div class="gh-card-body">
                <h3 class="gh-card-name">${escHtml(r.name)}</h3>
                ${desc}
            </div>
            <div class="gh-card-footer">
                ${langBadge}
            </div>
        </a>`;
    }

    function escHtml(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
})();
