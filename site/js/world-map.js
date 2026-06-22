/**
 * Dot-grid world map using Natural Earth 110m land data (world-atlas TopoJSON).
 * Uses topojson-client for correct decoding, then rasterises land polygons to
 * an offscreen canvas and samples that mask to build the dot grid.
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

  // ── Cropped equirectangular projection (lat −58 → 82) ──────────────────────
  const LAT_MAX = 82, LAT_MIN = -58, LAT_SPAN = LAT_MAX - LAT_MIN;
  function proj(lon, lat, w, h) {
    return [(lon + 180) / 360 * w, (LAT_MAX - lat) / LAT_SPAN * h];
  }

  // ── GeoJSON ring extractor ──────────────────────────────────────────────────
  function extractRings(geojson) {
    const rings = [];
    for (const feature of geojson.features) {
      const { type, coordinates } = feature.geometry;
      if (type === 'Polygon') {
        rings.push(coordinates[0]);
      } else if (type === 'MultiPolygon') {
        for (const poly of coordinates) {
          rings.push(poly[0]);
        }
      }
    }
    return rings;
  }

  // ── Rasterise rings → offscreen pixel mask ──────────────────────────────────
  // Full standard equirectangular: simple 1:1 degree→pixel mapping.
  const MASK_W = 1440, MASK_H = 720;

  function maskXY(lon, lat) {
    return [
      (lon + 180) / 360 * MASK_W,
      (90  - lat) / 180 * MASK_H,
    ];
  }

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
        const [x, y] = maskXY(lon, lat);
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
    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += STEP) {
      for (let lon = -180; lon < 180; lon += STEP) {
        const [fx, fy] = maskXY(lon, lat);
        const mx = Math.min(MASK_W - 1, Math.max(0, Math.round(fx)));
        const my = Math.min(MASK_H - 1, Math.max(0, Math.round(fy)));
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
    H = Math.round(W * (LAT_SPAN / 360) * 0.95);
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

      ctx.save();
      ctx.globalAlpha = (1 - eased) * 0.55;
      ctx.beginPath();
      ctx.arc(city.x, city.y, 4 + eased * 16, 0, Math.PI * 2);
      ctx.fillStyle = c.accent;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(city.x, city.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = c.accent;
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(city.x, city.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = c.accent;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(city.x, city.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      ctx.font      = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = c.label;
      const tw = ctx.measureText(city.label).width;
      const lx = city.side > 0 ? city.x + 8 : city.x - 8 - tw;
      ctx.fillText(city.label, lx, city.y + 4);
    });

    requestAnimationFrame(draw);
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  // Load topojson-client, then fetch map data.
  const topoScript = document.createElement('script');
  topoScript.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
  topoScript.onload = () => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(topo => {
        const land  = topojson.feature(topo, topo.objects.land);
        const rings  = extractRings(land);
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
  };
  topoScript.onerror = () => console.warn('[world-map] failed to load topojson-client');
  document.head.appendChild(topoScript);
})();
