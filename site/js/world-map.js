/**
 * Dot-grid world map using Natural Earth 110m land data (world-atlas TopoJSON).
 * Fetches once from jsDelivr CDN, rasterises land polygons to an offscreen
 * canvas, then samples that mask to build the dot grid.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('world-map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── Cities ─────────────────────────────────────────────────────────────────
  const CITIES = [
    { lon: 10.75,  lat: 59.9,  label: 'Oslo',   side:  1 },
    { lon: -71.06, lat: 42.36, label: 'Boston',  side: -1 },
  ];

  // ── Equirectangular projection ──────────────────────────────────────────────
  function proj(lon, lat, w, h) {
    return [(lon + 180) / 360 * w, (90 - lat) / 180 * h];
  }

  // ── Minimal TopoJSON → rings decoder ───────────────────────────────────────
  function decodeRings(topo) {
    const { scale, translate } = topo.transform;
    const rawArcs = topo.arcs;

    function decodeArc(idx) {
      const src = rawArcs[idx < 0 ? ~idx : idx];
      let x = 0, y = 0;
      const pts = src.map(([dx, dy]) => {
        x += dx; y += dy;
        return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
      });
      return idx < 0 ? pts.slice().reverse() : pts;
    }

    const rings = [];
    for (const geom of topo.objects.land.geometries) {
      const polys = geom.type === 'Polygon' ? [geom.arcs] : geom.arcs;
      for (const poly of polys) {
        // Only outer ring (index 0); holes not needed for dot-visibility
        let ring = [];
        for (const arcIdx of poly[0]) {
          const pts = decodeArc(arcIdx);
          if (ring.length) pts.shift();   // drop duplicate junction point
          ring = ring.concat(pts);
        }
        rings.push(ring);
      }
    }
    return rings;
  }

  // ── Rasterise rings → offscreen pixel mask ──────────────────────────────────
  const MASK_W = 720, MASK_H = 360;

  function buildMask(rings) {
    const off = document.createElement('canvas');
    off.width  = MASK_W;
    off.height = MASK_H;
    const oc = off.getContext('2d');
    oc.fillStyle = '#000';
    oc.fillRect(0, 0, MASK_W, MASK_H);
    oc.fillStyle = '#fff';
    for (const ring of rings) {
      oc.beginPath();
      ring.forEach(([lon, lat], i) => {
        const [x, y] = proj(lon, lat, MASK_W, MASK_H);
        i === 0 ? oc.moveTo(x, y) : oc.lineTo(x, y);
      });
      oc.closePath();
      oc.fill('evenodd');
    }
    return oc.getImageData(0, 0, MASK_W, MASK_H).data;
  }

  // ── Sample land dots from mask ──────────────────────────────────────────────
  const STEP = 2; // degrees between dots

  function sampleDots(pixels) {
    const dots = [];
    for (let lat = -84; lat <= 84; lat += STEP) {
      for (let lon = -180; lon < 180; lon += STEP) {
        const mx = Math.min(MASK_W  - 1, Math.round((lon + 180) / 360 * MASK_W));
        const my = Math.min(MASK_H - 1, Math.round((90 - lat)  / 180 * MASK_H));
        if (pixels[(my * MASK_W + mx) * 4] > 128) {
          dots.push([lon, lat]);
        }
      }
    }
    return dots;
  }

  // ── State ───────────────────────────────────────────────────────────────────
  let W, H, landPx, cityPx, landLL = [];

  function sizeCanvas() {
    const container = canvas.parentElement;
    W = Math.min(container ? container.clientWidth : 900, 1000);
    H = Math.round(W * 0.46);
    canvas.width  = W;
    canvas.height = H;
    landPx = landLL.map(([lo, la]) => proj(lo, la, W, H));
    cityPx = CITIES.map(c => {
      const [x, y] = proj(c.lon, c.lat, W, H);
      return { ...c, x, y };
    });
  }

  // ── Theme-aware colours ─────────────────────────────────────────────────────
  function palette() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      land:   dark ? 'rgba(156,163,175,0.40)' : 'rgba(107,114,128,0.30)',
      accent: dark ? '#3b82f6'                 : '#007bff',
      label:  dark ? 'rgba(156,163,175,0.95)' : 'rgba(75,85,99,0.95)',
      arc:    dark ? 'rgba(59,130,246,0.28)'   : 'rgba(0,123,255,0.22)',
    };
  }

  // ── Draw loop ───────────────────────────────────────────────────────────────
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    const c = palette();
    const r = Math.max(1.2, W / 650);

    // Land dots
    ctx.fillStyle = c.land;
    for (const [x, y] of landPx) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dashed arc connecting cities
    const ox = cityPx[0].x, oy = cityPx[0].y;
    const bx = cityPx[1].x, by = cityPx[1].y;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo((ox + bx) / 2, Math.min(oy, by) - H * 0.22, bx, by);
    ctx.strokeStyle = c.arc;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 7]);
    ctx.stroke();
    ctx.setLineDash([]);

    // City beacons
    cityPx.forEach((city, i) => {
      const phase = ((ts / 2400) + i * 0.5) % 1;
      const eased = 1 - (1 - phase) * (1 - phase);

      // Expanding pulse
      ctx.save();
      ctx.globalAlpha = (1 - eased) * 0.55;
      ctx.beginPath();
      ctx.arc(city.x, city.y, 4 + eased * 16, 0, Math.PI * 2);
      ctx.fillStyle = c.accent;
      ctx.fill();
      ctx.restore();

      // Soft halo
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(city.x, city.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = c.accent;
      ctx.fill();
      ctx.restore();

      // Dot + white centre
      ctx.beginPath();
      ctx.arc(city.x, city.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = c.accent;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(city.x, city.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Label
      ctx.font      = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = c.label;
      const tw = ctx.measureText(city.label).width;
      const lx = city.side > 0 ? city.x + 8 : city.x - 8 - tw;
      ctx.fillText(city.label, lx, city.y + 4);
    });

    requestAnimationFrame(draw);
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(topo => {
      const rings  = decodeRings(topo);
      const pixels = buildMask(rings);
      landLL = sampleDots(pixels);
      sizeCanvas();

      let rt;
      window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(sizeCanvas, 80);
      });

      requestAnimationFrame(draw);
    })
    .catch(err => console.warn('[world-map] failed to load map data:', err));
})();
