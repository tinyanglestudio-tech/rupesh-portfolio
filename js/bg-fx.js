/* ════════════════════════════════════════════════════════════════
   bg-fx.js — animated WebGL background layer for the portfolio.
   Sits in a fixed <canvas id="bgfx"> at z-index:-1, behind ALL content.
   Does NOT touch any existing markup, fonts, colours or layout.

   Four selectable themes (selector rendered into the site footer; default
   Particle Drift). Choice persists in localStorage. Theme + palette adapt to
   the site's light/dark mode. Selecting "Off" restores the cinematic images.
   ════════════════════════════════════════════════════════════════ */
import * as THREE from './three.module.js'

// Build the picker UI immediately so it is always visible, even if WebGL
// initialisation later fails. `pendingPick` queues the user's choice until
// the renderer is ready.
const THEMES = ['neural', 'aurora', 'drift', 'grid']
const THEME_LABELS = {
  neural: 'Neural Network',
  aurora: 'Aurora Flow',
  drift: 'Particle Drift',
  grid: 'Data Grid',
}

// This site's "background" is per-section: full-bleed cinematic images
// (.pf-bg, z-index:-2) over an opaque base, with a translucent legibility tint
// (.pf-bg-tint) on top. All of that hides a z-index:-1 canvas. So, only while a
// WebGL theme is active (html.bgfx-on): move the base colour to <html>, make
// <body> + the section bases transparent, and hide the section images — but
// KEEP the .pf-bg-tint scrim so text stays readable over the animation.
// Selecting "Off" removes the class and restores the original look exactly.
const baseFix = document.createElement('style')
baseFix.id = 'bgfx-base'
baseFix.textContent = `
  html.bgfx-on { background: var(--bg); }
  html.bgfx-on body { background: transparent !important; }
  html.bgfx-on .pf-hero,
  html.bgfx-on .pf-close,
  html.bgfx-on .pf-chapter--novartis,
  html.bgfx-on .pf-chapter--cognizant,
  html.bgfx-on .pf-chapter--tinyangle { background: transparent !important; }
  html.bgfx-on .pf-bg { opacity: 0 !important; }

  /* Reading cards are translucent (some as low as 2% opacity), so the moving
     background shows through and distracts. While a theme is on, make the card
     surfaces near-opaque + blurred so text stays comfortable to read. */
  html.bgfx-on .pf-card,
  html.bgfx-on .pf-pillar,
  html.bgfx-on .pf-credbox,
  html.bgfx-on .pf-certgroup,
  html.bgfx-on .pf-certcard,
  html.bgfx-on .pf-proj {
    background-color: rgba(8,13,26,.94) !important;
    -webkit-backdrop-filter: blur(14px) !important;
    backdrop-filter: blur(14px) !important;
  }
  html.bgfx-on[data-theme="light"] .pf-card,
  html.bgfx-on[data-theme="light"] .pf-pillar,
  html.bgfx-on[data-theme="light"] .pf-credbox,
  html.bgfx-on[data-theme="light"] .pf-certgroup,
  html.bgfx-on[data-theme="light"] .pf-certcard,
  html.bgfx-on[data-theme="light"] .pf-proj {
    background-color: rgba(255,255,255,.95) !important;
  }
`
document.head.appendChild(baseFix)

let applyTheme = null
let pendingPick = null
buildPicker(
  (name) => (applyTheme ? applyTheme(name) : (pendingPick = name)),
  () => localStorage.getItem('bgfx-theme') || 'drift',
)

const canvas = document.getElementById('bgfx')
if (canvas) {
  try {
    boot(canvas)
  } catch (err) {
    console.error('[bg-fx] WebGL init failed:', err)
  }
}

function readPalette() {
  const cs = getComputedStyle(document.documentElement)
  const grab = (v, fb) => (cs.getPropertyValue(v).trim() || fb)
  const light = document.documentElement.getAttribute('data-theme') === 'light'
  return {
    light,
    blue: grab('--blue', '#6366f1'),
    blt: grab('--blt', '#818cf8'),
    green: grab('--green', '#22d3a5'),
    purple: grab('--purple', '#c084fc'),
    bg: grab('--bg', light ? '#f7f8fc' : '#05080f'),
  }
}

function boot(canvas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100)
  camera.position.z = 14

  let palette = readPalette()
  let current = null
  let activeName = localStorage.getItem('bgfx-theme') || 'drift'
  const pointer = { x: 0, y: 0 }

  function size() {
    renderer.setSize(innerWidth, innerHeight, false)
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    if (current?.resize) current.resize(innerWidth, innerHeight)
  }

  function setTheme(name) {
    if (!THEMES.includes(name)) name = 'neural'
    activeName = name
    localStorage.setItem('bgfx-theme', name)
    document.documentElement.classList.add('bgfx-on') // reveal canvas, hide section images
    canvas.style.display = ''
    if (current?.dispose) current.dispose()
    while (scene.children.length) scene.remove(scene.children[0])
    palette = readPalette()
    current = BUILDERS[name](scene, palette, renderer)
    size()
    markActive()
  }

  // react to the site's own light/dark toggle (it flips data-theme on <html>)
  new MutationObserver(() => {
    const p = readPalette()
    if (p.light !== palette.light) setTheme(activeName)
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  addEventListener('resize', size)
  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1
    pointer.y = (e.clientY / innerHeight) * 2 - 1
  })

  const clock = new THREE.Clock()
  let paused = false
  document.addEventListener('visibilitychange', () => (paused = document.hidden))

  function loop() {
    requestAnimationFrame(loop)
    if (paused) return
    const t = reduce ? 0 : clock.getElapsedTime()
    // gentle parallax of the whole scene toward the pointer
    camera.position.x += (pointer.x * 1.2 - camera.position.x) * 0.03
    camera.position.y += (-pointer.y * 0.8 - camera.position.y) * 0.03
    camera.lookAt(0, 0, 0)
    current?.update(t, pointer)
    renderer.render(scene, camera)
  }

  // Expose to the already-built picker, honouring any queued click.
  applyTheme = setTheme
  const startName = pendingPick || activeName
  pendingPick = null
  loop()
  if (startName === 'off') {
    canvas.style.display = 'none' // respect a previously chosen "Off"
  } else {
    setTheme(startName)
  }

  function markActive() {
    document.querySelectorAll('#bgfxFooter button').forEach((b) =>
      b.classList.toggle('on', b.dataset.t === activeName),
    )
  }
}

/* ───────────────────────── THEME BUILDERS ───────────────────────── */
const BUILDERS = {
  /* A — Neural Network: drifting nodes connected by proximity lines.
     Evokes AI / neural systems. */
  neural(scene, pal) {
    const N = 90
    const R = 16
    const col = new THREE.Color(pal.blue)
    const nodes = []
    const pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * R,
        (Math.random() - 0.5) * R * 0.62,
        (Math.random() - 0.5) * R * 0.6,
      )
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.12,
        (Math.random() - 0.5) * 0.12,
        (Math.random() - 0.5) * 0.12,
      )
      nodes.push({ v, vel })
      pos.set([v.x, v.y, v.z], i * 3)
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const points = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: col, size: pal.light ? 0.13 : 0.16, transparent: true, opacity: pal.light ? 0.5 : 0.9, sizeAttenuation: true, depthWrite: false }),
    )
    scene.add(points)

    const linePos = new Float32Array(N * N * 3)
    const lGeo = new THREE.BufferGeometry()
    lGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
    const lines = new THREE.LineSegments(
      lGeo,
      new THREE.LineBasicMaterial({ color: new THREE.Color(pal.blt), transparent: true, opacity: pal.light ? 0.14 : 0.22, depthWrite: false }),
    )
    scene.add(lines)

    const LINK = 3.6
    return {
      update(t) {
        let k = 0
        for (let i = 0; i < N; i++) {
          const a = nodes[i]
          a.v.addScaledVector(a.vel, 1)
          ;['x', 'y', 'z'].forEach((ax, j) => {
            const lim = j === 0 ? R / 2 : j === 1 ? (R * 0.62) / 2 : (R * 0.6) / 2
            if (a.v[ax] > lim || a.v[ax] < -lim) a.vel[ax] *= -1
          })
          pos.set([a.v.x, a.v.y, a.v.z], i * 3)
        }
        for (let i = 0; i < N; i++) {
          for (let j = i + 1; j < N; j++) {
            if (nodes[i].v.distanceTo(nodes[j].v) < LINK) {
              linePos.set([nodes[i].v.x, nodes[i].v.y, nodes[i].v.z], k); k += 3
              linePos.set([nodes[j].v.x, nodes[j].v.y, nodes[j].v.z], k); k += 3
            }
          }
        }
        lGeo.setDrawRange(0, k / 3)
        lGeo.attributes.position.needsUpdate = true
        pGeo.attributes.position.needsUpdate = true
        points.rotation.y = t * 0.02
        lines.rotation.y = t * 0.02
      },
      dispose() { pGeo.dispose(); lGeo.dispose() },
    }
  },

  /* B — Aurora Flow: soft flowing gradient (fbm noise) full-screen plane. */
  aurora(scene, pal) {
    const uni = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(innerWidth, innerHeight) },
      uA: { value: new THREE.Color(pal.blue) },
      uB: { value: new THREE.Color(pal.green) },
      uC: { value: new THREE.Color(pal.purple) },
      uLight: { value: pal.light ? 1 : 0 },
    }
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv; uniform float uTime, uLight; uniform vec2 uRes;
        uniform vec3 uA,uB,uC;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
          float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
          return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
        float fbm(vec2 p){ float v=0.0,amp=0.5; for(int i=0;i<5;i++){ v+=amp*noise(p); p*=2.02; amp*=0.5;} return v; }
        void main(){
          vec2 uv=vUv; uv.x*=uRes.x/uRes.y;
          float t=uTime*0.06;
          float n=fbm(uv*1.6+vec2(t, t*0.7));
          float m=fbm(uv*2.4-vec2(t*0.5, t));
          vec3 col=mix(uA,uC,smoothstep(0.1,0.85,n));
          col=mix(col,uB,smoothstep(0.35,0.95,m)*0.7);
          // brighten the ribbons so the aurora actually reads
          float glow=pow(n*m,0.8);
          float intensity = uLight>0.5 ? 0.42 : 0.95;
          float base = uLight>0.5 ? 0.04 : 0.12;
          float alpha = clamp(base + glow*intensity, 0.0, uLight>0.5 ? 0.5 : 0.92);
          gl_FragColor=vec4(col*(0.6+glow), alpha);
        }`,
      blending: pal.light ? THREE.NormalBlending : THREE.AdditiveBlending,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)
    quad.frustumCulled = false
    scene.add(quad)
    return {
      update(t) { uni.uTime.value = t },
      resize(w, h) { uni.uRes.value.set(w, h) },
      dispose() { mat.dispose() },
    }
  },

  /* C — Particle Drift: layered depth field gently moving past the camera. */
  drift(scene, pal) {
    const N = 1600
    const pos = new Float32Array(N * 3)
    const spd = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40
      pos[i * 3 + 2] = -Math.random() * 60
      spd[i] = 0.4 + Math.random() * 1.2
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(pal.blt), size: pal.light ? 0.07 : 0.1,
      transparent: true, opacity: pal.light ? 0.45 : 0.8, sizeAttenuation: true, depthWrite: false,
    })
    const pts = new THREE.Points(geo, mat)
    scene.add(pts)
    let last = 0
    return {
      update(t) {
        const dt = Math.min(0.05, t - last); last = t
        for (let i = 0; i < N; i++) {
          pos[i * 3 + 2] += spd[i] * dt * 6
          if (pos[i * 3 + 2] > 14) { pos[i * 3 + 2] = -60; pos[i * 3] = (Math.random() - 0.5) * 60; pos[i * 3 + 1] = (Math.random() - 0.5) * 40 }
        }
        geo.attributes.position.needsUpdate = true
        pts.rotation.z = t * 0.01
      },
      dispose() { geo.dispose(); mat.dispose() },
    }
  },

  /* D — Data Grid: perspective wireframe plane with a slow travelling wave. */
  grid(scene, pal) {
    const SEG = 60
    const geo = new THREE.PlaneGeometry(50, 50, SEG, SEG)
    geo.rotateX(-Math.PI / 2.1)
    const base = geo.attributes.position.array.slice()
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(pal.blue), wireframe: true,
      transparent: true, opacity: pal.light ? 0.12 : 0.22,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.y = -6
    mesh.position.z = -6
    scene.add(mesh)
    const arr = geo.attributes.position.array
    return {
      update(t) {
        for (let i = 0; i < arr.length; i += 3) {
          const x = base[i], z = base[i + 2]
          arr[i + 1] = base[i + 1] + Math.sin(x * 0.3 + t * 1.2) * 0.7 + Math.cos(z * 0.35 + t) * 0.7
        }
        geo.attributes.position.needsUpdate = true
        mesh.rotation.z = Math.sin(t * 0.05) * 0.05
      },
      dispose() { geo.dispose(); mat.dispose() },
    }
  },
}

/* ───────────────────────── PICKER UI (in footer) ───────────────────────── */
function buildPicker(onPick, getActive) {
  const mount = document.getElementById('bgfxFooter')
  if (!mount || mount.dataset.built) return
  mount.dataset.built = '1'
  mount.classList.add('footer-col') // inherit the site's footer column styling

  mount.innerHTML =
    `<h4>Background</h4><ul class="bgfx-list">` +
    THEMES.map((t) => `<li><button type="button" data-t="${t}">${THEME_LABELS[t]}</button></li>`).join('') +
    `<li><button type="button" data-t="off">Off · Cinematic</button></li>` +
    `</ul>`

  const style = document.createElement('style')
  style.textContent = `
    .bgfx-list{list-style:none;margin:0;padding:0}
    .bgfx-list li{margin:0}
    .bgfx-list button{cursor:pointer;background:none;border:none;padding:6px 0;font:inherit;
      color:var(--muted,#6272a0);transition:color .2s;display:inline-flex;align-items:center;gap:8px;text-align:left}
    .bgfx-list button::before{content:"";width:6px;height:6px;border-radius:50%;background:transparent;
      border:1px solid currentColor;opacity:.5;transition:all .2s;flex:0 0 auto}
    .bgfx-list button:hover{color:var(--blt,#818cf8)}
    .bgfx-list button.on{color:var(--blt,#818cf8)}
    .bgfx-list button.on::before{background:var(--blt,#818cf8);border-color:var(--blt,#818cf8);opacity:1;
      box-shadow:0 0 8px var(--blt,#818cf8)}`
  document.head.appendChild(style)

  const canvas = document.getElementById('bgfx')
  const mark = (name) =>
    mount.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.t === name))

  mount.addEventListener('click', (e) => {
    const b = e.target.closest('button')
    if (!b) return
    if (b.dataset.t === 'off') {
      document.documentElement.classList.remove('bgfx-on') // restore original cinematic look
      if (canvas) canvas.style.display = 'none'
      localStorage.setItem('bgfx-theme', 'off')
      mark('off')
      return
    }
    if (canvas) canvas.style.display = ''
    onPick(b.dataset.t)
    mark(b.dataset.t)
  })

  if (getActive) mark(getActive())
}
