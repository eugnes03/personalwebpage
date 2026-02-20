/**
 * Dot-grid world map
 * Highlights Oslo (hometown) and Boston (university) with a pulsing beacon
 * and connects them with a dashed arc.
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

  // ── Simplified land polygons [lon, lat] (equirectangular) ──────────────────
  const POLYS = [
    // North America
    [[-168,72],[-140,72],[-120,60],[-100,50],[-83,46],[-82,45],[-76,44],
     [-70,47],[-67,45],[-52,47],[-55,50],[-67,45],[-80,32],[-81,25],
     [-83,10],[-77,8],[-84,10],[-90,16],[-97,20],[-104,20],[-110,23],
     [-117,32],[-124,37],[-124,49],[-130,55],[-140,60],[-155,60],[-168,60]],
    // South America
    [[-78,8],[-70,12],[-62,11],[-50,0],[-35,-5],[-35,-10],
     [-39,-17],[-40,-23],[-48,-28],[-58,-35],[-65,-38],[-67,-55],
     [-75,-55],[-80,-40],[-76,-14]],
    // Europe (mainland)
    [[-10,36],[0,36],[5,44],[10,44],[15,38],[18,40],[22,38],[28,38],
     [32,42],[36,42],[30,60],[28,65],[25,65],[20,70],[15,70],[10,63],
     [5,58],[0,50],[-2,50],[-5,48],[-10,44]],
    // Scandinavia peninsula
    [[5,58],[10,58],[15,57],[18,57],[20,58],[24,60],[28,65],
     [25,70],[20,70],[15,70],[10,63]],
    // Finland
    [[28,65],[30,68],[28,72],[25,72],[22,70],[20,70],[24,60]],
    // British Isles
    [[-6,50],[2,51],[2,52],[-3,58],[-6,57]],
    // Africa
    [[-18,15],[-5,10],[3,5],[9,4],[15,0],[35,-5],[40,10],[43,12],
     [50,11],[51,28],[37,28],[32,32],[32,36],[26,38],[10,38],[0,32],
     [-8,28],[-18,20]],
    // Russia + Siberia
    [[26,50],[30,55],[40,55],[60,55],[80,60],[90,58],[100,55],[110,53],
     [120,55],[130,55],[140,55],[145,50],[150,55],[160,60],[168,65],
     [168,72],[140,75],[100,78],[72,74],[68,65],[72,68],[80,60],
     [60,60],[40,60],[30,60],[26,60]],
    // Asia main (Middle East → E Asia, south of Russia)
    [[26,38],[32,36],[32,32],[37,28],[44,12],[51,28],[55,24],[60,22],
     [75,8],[80,12],[80,30],[70,37],[80,42],[90,44],[100,50],[110,53],
     [120,48],[130,43],[140,38],[140,20],[120,12],[105,10],[100,2],
     [105,-8],[115,-8],[130,-10],[130,-3],[140,0],[145,5],
     [145,43],[140,48],[130,43],[120,48],[110,53],[100,50],
     [90,44],[80,42],[70,37],[60,44],[50,38],[44,42],[40,44],[30,50]],
    // Arabian Peninsula
    [[36,28],[37,24],[44,12],[51,22],[56,24],[58,15],[45,12],[40,12],[36,18]],
    // India
    [[60,22],[75,8],[80,8],[80,12],[78,20],[72,22],[66,22]],
    // Indochina / SE Asia
    [[100,2],[105,-1],[110,-8],[115,-8],[120,-5],[110,-5],[105,10],[100,5]],
    // Australia
    [[115,-34],[117,-35],[130,-35],[137,-35],[140,-37],[148,-38],
     [152,-29],[153,-24],[149,-20],[142,-10],[136,-12],
     [128,-15],[122,-18],[114,-22],[114,-28]],
    // Greenland
    [[-44,60],[-25,62],[-18,70],[-18,78],[-35,84],
     [-58,82],[-68,76],[-68,70],[-55,65]],
    // Iceland
    [[-24,63],[-14,63],[-13,65],[-20,66]],
    // Japan (Honshu)
    [[130,31],[132,33],[135,35],[138,38],[141,40],[141,41],
     [139,43],[141,40],[138,38],[131,33]],
    // Madagascar
    [[44,-12],[50,-14],[50,-24],[44,-25]],
    // New Zealand North Island
    [[172,-37],[174,-37],[178,-39],[177,-41],[174,-41]],
    // New Zealand South Island
    [[168,-46],[174,-43],[172,-44],[171,-45],[169,-46]],
  ];

  // ── Point-in-polygon (ray casting) ─────────────────────────────────────────
  function pip(lon, lat, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      if ((yi > lat) !== (yj > lat) &&
          lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  function isLand(lon, lat) {
    return POLYS.some(p => pip(lon, lat, p));
  }

  // ── Pre-compute land dot positions (lon/lat) ────────────────────────────────
  const STEP = 2;
  const LAND_LL = [];
  for (let lat = -84; lat <= 84; lat += STEP) {
    for (let lon = -180; lon < 180; lon += STEP) {
      if (isLand(lon, lat)) LAND_LL.push([lon, lat]);
    }
  }

  // ── Equirectangular projection ──────────────────────────────────────────────
  function proj(lon, lat, w, h) {
    return [(lon + 180) / 360 * w, (90 - lat) / 180 * h];
  }

  // ── Sizing ──────────────────────────────────────────────────────────────────
  let W, H, landPx, cityPx;

  function resize() {
    const container = canvas.parentElement;
    W = Math.min(container ? container.clientWidth : 900, 1000);
    H = Math.round(W * 0.46);
    canvas.width  = W;
    canvas.height = H;
    landPx  = LAND_LL.map(([lo, la]) => proj(lo, la, W, H));
    cityPx  = CITIES.map(c => {
      const [x, y] = proj(c.lon, c.lat, W, H);
      return { ...c, x, y };
    });
  }

  resize();
  let _rt;
  window.addEventListener('resize', () => { clearTimeout(_rt); _rt = setTimeout(resize, 80); });

  // ── Colors ──────────────────────────────────────────────────────────────────
  function palette() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      land:   dark ? 'rgba(156,163,175,0.40)' : 'rgba(107,114,128,0.30)',
      accent: dark ? '#3b82f6' : '#007bff',
      label:  dark ? 'rgba(156,163,175,0.95)' : 'rgba(75,85,99,0.95)',
      arc:    dark ? 'rgba(59,130,246,0.28)'  : 'rgba(0,123,255,0.22)',
    };
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    const c = palette();
    const r = Math.max(1.2, W / 650);   // dot radius, scales with canvas

    // Land dots
    ctx.fillStyle = c.land;
    for (const [x, y] of landPx) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dashed arc
    const ox = cityPx[0].x, oy = cityPx[0].y;
    const bx = cityPx[1].x, by = cityPx[1].y;
    const cpx = (ox + bx) / 2;
    const cpy = Math.min(oy, by) - H * 0.22;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo(cpx, cpy, bx, by);
    ctx.strokeStyle = c.arc;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 7]);
    ctx.stroke();
    ctx.setLineDash([]);

    // City beacons
    cityPx.forEach((city, i) => {
      const phase  = ((ts / 2400) + i * 0.5) % 1;
      const eased  = 1 - (1 - phase) * (1 - phase);

      // Expanding pulse ring
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

      // Dot
      ctx.beginPath();
      ctx.arc(city.x, city.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = c.accent;
      ctx.fill();

      // White centre
      ctx.beginPath();
      ctx.arc(city.x, city.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Label
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = c.label;
      const tw = ctx.measureText(city.label).width;
      const lx = city.side > 0 ? city.x + 8 : city.x - 8 - tw;
      ctx.fillText(city.label, lx, city.y + 4);
    });

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
