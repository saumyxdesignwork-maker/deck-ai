import type { AspectRatio } from './fixtures'

/** A safe-ish filename stem from the deck title — strips characters that
 * break on Windows/macOS filesystems, collapses whitespace, and falls back
 * to a generic name if the title turns out to be empty after cleanup. */
function fileStem(title: string): string {
  const cleaned = title.trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim()
  return cleaned || 'deck'
}

function aspectSize(aspectRatio: AspectRatio | undefined): { w: number; h: number } {
  // Base width chosen for crisp PDF/PPTX output without producing files that
  // are needlessly huge — pixelRatio on the capture step adds the rest of
  // the sharpness.
  return aspectRatio === '4:3' ? { w: 1200, h: 900 } : { w: 1280, h: 720 }
}

/**
 * Rasterizes each given slide element to a PNG data URL. `crossOrigin` on
 * generated-image `<img>` tags (see ImageBlock in ContentSection.tsx) plus
 * matching CORS headers from the backend's /assets route (see
 * Decks_AI_Service/src/app.ts) are what keep this from throwing on a tainted
 * canvas — every slide photo is same-app-origin by the time it reaches the
 * browser, just served from a different host, so it needs real CORS, not
 * just `crossOrigin` alone.
 */
export async function captureSlides(nodes: HTMLElement[], pixelRatio = 2): Promise<string[]> {
  const { toPng } = await import('html-to-image')
  const images: string[] = []
  for (const node of nodes) {
    // Sequential, not Promise.all — html-to-image serializes the DOM into an
    // SVG <foreignObject> internally; doing every slide at once against the
    // same document has caused occasional cross-slide font/layout bleed in
    // testing, and a deck is small enough that sequential capture is still fast.
    images.push(await toPng(node, {
      pixelRatio,
      cacheBust: true,
      // The browser has already painted every font correctly by the time we
      // capture — html-to-image's font-embedding step is only for portable
      // standalone SVGs, and just throws noisy (harmless) console errors
      // trying to read `cssRules` off cross-origin stylesheets (Typekit,
      // Google Fonts) that don't allow it.
      skipFonts: true,
    }))
  }
  return images
}

export async function exportToPdf(images: string[], title: string, aspectRatio: AspectRatio | undefined) {
  const { jsPDF } = await import('jspdf')
  const { w, h } = aspectSize(aspectRatio)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [w, h] })
  images.forEach((img, i) => {
    if (i > 0) doc.addPage([w, h], 'landscape')
    doc.addImage(img, 'PNG', 0, 0, w, h)
  })
  doc.save(`${fileStem(title)}.pdf`)
}

export async function exportToPptx(images: string[], title: string, aspectRatio: AspectRatio | undefined) {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pres = new PptxGenJS()
  pres.defineLayout({ name: 'DECKAI', width: aspectRatio === '4:3' ? 10 : 10, height: aspectRatio === '4:3' ? 7.5 : 5.63 })
  pres.layout = 'DECKAI'
  images.forEach(img => {
    const slide = pres.addSlide()
    slide.addImage({ data: img, x: 0, y: 0, w: '100%', h: '100%' })
  })
  await pres.writeFile({ fileName: `${fileStem(title)}.pptx` })
}

/** A self-contained HTML file (images inlined as base64, no external
 * requests) with a minimal click/arrow-key slideshow — "standalone" means
 * it still works if emailed or opened offline years later, not just today
 * while the deck's images are still hosted. */
export function exportToHtml(images: string[], title: string) {
  const escapedTitle = title.replace(/</g, '&lt;')
  const slidesHtml = images
    .map((src, i) => `<img class="slide" src="${src}" alt="Slide ${i + 1}" style="display:${i === 0 ? 'block' : 'none'}">`)
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapedTitle}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #0A0A0B; }
  body { display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif; }
  .stage { position: relative; width: 100%; max-width: 1280px; aspect-ratio: 16 / 9; }
  .slide { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
  .nav { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 14px; color: #fff; font-size: 14px; background: rgba(255,255,255,0.08); padding: 8px 16px; border-radius: 999px; backdrop-filter: blur(10px); }
  .nav button { background: transparent; border: none; color: #fff; cursor: pointer; font-size: 16px; padding: 4px 8px; }
  .nav button:disabled { opacity: 0.3; cursor: default; }
</style>
</head>
<body>
  <div class="stage">${slidesHtml}</div>
  <div class="nav">
    <button id="prev" aria-label="Previous slide">←</button>
    <span id="count"></span>
    <button id="next" aria-label="Next slide">→</button>
  </div>
  <script>
    const slides = Array.from(document.querySelectorAll('.slide'));
    let i = 0;
    const countEl = document.getElementById('count');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    function render() {
      slides.forEach((s, idx) => s.style.display = idx === i ? 'block' : 'none');
      countEl.textContent = (i + 1) + ' / ' + slides.length;
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === slides.length - 1;
    }
    function go(delta) { i = Math.min(slides.length - 1, Math.max(0, i + delta)); render(); }
    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === ' ') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    });
    render();
  </script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileStem(title)}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
