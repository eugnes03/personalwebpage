// Site additions: Live Mathematics + Right Now (home), Activity heatmap + Chess Rating (about)
// Plain JS, no dependencies. Safe to include on every page — each block checks for its elements.

function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* ---------- Live Mathematics (home) ---------- */
(function () {
    const canvas = document.getElementById('viz-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let seed = 1;

    window.regenerateViz = function () {
        seed += 1;
        draw();
    };

    function draw() {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#efe8d8';
        ctx.fillRect(0, 0, w, h);
        drawWalk(w, h);
    }

    function drawWalk(w, h) {
        const rand = mulberry32(seed * 1000 + 7);
        let x = w / 2, y = h / 2;
        ctx.strokeStyle = '#7a2e22';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i < 600; i++) {
            const angle = rand() * Math.PI * 2;
            const len = 3 + rand() * 3;
            x = Math.max(10, Math.min(w - 10, x + Math.cos(angle) * len));
            y = Math.max(10, Math.min(h - 10, y + Math.sin(angle) * len));
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#8a7c68';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a2e22';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    draw();
})();

/* ---------- Right Now (home) ---------- */
(function () {
    const updatedEl = document.getElementById('now-updated');
    if (!updatedEl) return;

    function relativeDate(dateStr) {
        const days = Math.round((Date.now() - new Date(dateStr + 'T00:00:00')) / 86400000);
        if (days <= 0) return 'Updated today';
        if (days === 1) return 'Updated 1 day ago';
        return `Updated ${days} days ago`;
    }

    fetch('js/now.json')
        .then((res) => res.json())
        .then((data) => {
            updatedEl.textContent = relativeDate(data.updated);

            const readingList = Array.isArray(data.reading) ? data.reading : [data.reading];
            document.getElementById('now-reading-rows').innerHTML = readingList
                .map(
                    (book) => `
                    <div class="now-row">
                        <p class="now-row-label">Reading</p>
                        <p class="now-row-title">${book.title}</p>
                        ${book.meta ? `<p class="now-row-meta">${book.meta}</p>` : ''}
                    </div>`
                )
                .join('');

            document.getElementById('now-proving-title').textContent = data.proving.title;
            document.getElementById('now-proving-progress').style.width = `${data.proving.progress}%`;
            document.getElementById('now-building-title').innerHTML = data.building.title;
            document.getElementById('now-building-meta').textContent = data.building.meta;
        })
        .catch(() => {
            updatedEl.textContent = '';
        });
})();

/* ---------- Activity heatmap (about) ---------- */
(function () {
    const grid = document.getElementById('heatmap-grid');
    if (!grid) return;
    const LEVEL_COLORS = ['#efe8d8', '#e3c9bf', '#c08876', '#a3543f', '#7a2e22'];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Replace this seeded mock generator with real data whenever you have it
    // (e.g. GitHub commit counts per day, or a log you keep yourself).
    function buildHeatmap() {
        const rand = mulberry32(42);
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 51 * 7 - today.getDay());
        let total = 0;
        const weeks = [];
        for (let w = 0; w < 52; w++) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(start);
                date.setDate(start.getDate() + w * 7 + d);
                const r = rand();
                let level = 0;
                if (r > 0.85) level = 4;
                else if (r > 0.68) level = 3;
                else if (r > 0.5) level = 2;
                else if (r > 0.32) level = 1;
                const count = level === 0 ? 0 : Math.round(level * 2 + rand() * 3);
                total += count;
                week.push({ level, count, date });
            }
            weeks.push(week);
        }
        return { weeks, total };
    }

    const { weeks, total } = buildHeatmap();
    document.getElementById('heatmap-total').textContent = `${total} contributions in the last year`;
    grid.innerHTML = weeks
        .map(
            (week) =>
                `<div class="heatmap-week">${week
                    .map(
                        (day) =>
                            `<div class="heatmap-cell" style="background:${LEVEL_COLORS[day.level]}" title="${day.count} contributions on ${MONTHS[day.date.getMonth()]} ${day.date.getDate()}"></div>`
                    )
                    .join('')}</div>`
        )
        .join('');
})();

/* ---------- Chess rating (about) ---------- */
(function () {
    const canvas = document.getElementById('elo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Replace this seeded mock history with your real rating history
    // (chess.com/Lichess API export, or a log you keep yourself).
    function buildEloHistory() {
        const rand = mulberry32(7);
        let rating = 1440;
        const history = [rating];
        for (let i = 0; i < 103; i++) {
            rating += (rand() - 0.42) * 18;
            rating = Math.max(1300, rating);
            history.push(Math.round(rating));
        }
        return history;
    }

    const eloHistory = buildEloHistory();
    let timeframe = '1Y';

    window.setEloTimeframe = function (tf) {
        timeframe = tf;
        ['3m', '1y', 'all'].forEach((id) => document.getElementById(`elo-tf-${id}`).classList.remove('active'));
        document.getElementById(`elo-tf-${tf.toLowerCase()}`).classList.add('active');
        draw();
    };

    function slice() {
        const n = timeframe === '3M' ? 13 : timeframe === '1Y' ? 52 : eloHistory.length;
        return eloHistory.slice(-n);
    }

    function draw() {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#efe8d8';
        ctx.fillRect(0, 0, w, h);
        const data = slice();
        const min = Math.min(...data) - 20;
        const max = Math.max(...data) + 20;
        const pad = 16;

        ctx.strokeStyle = '#ddd3bf';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const y = pad + ((h - pad * 2) * i) / 4;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        ctx.strokeStyle = '#7a2e22';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        data.forEach((v, i) => {
            const x = pad + ((w - pad * 2) * i) / (data.length - 1);
            const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        const lastX = pad + (w - pad * 2);
        const lastY = h - pad - ((data[data.length - 1] - min) / (max - min)) * (h - pad * 2);
        ctx.fillStyle = '#7a2e22';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fill();

        const change = data[data.length - 1] - data[0];
        document.getElementById('elo-current').textContent = eloHistory[eloHistory.length - 1];
        document.getElementById('elo-peak').textContent = Math.max(...eloHistory);
        document.getElementById('elo-change').textContent = `${change >= 0 ? '+' : ''}${change} over period`;
    }

    draw();
})();
