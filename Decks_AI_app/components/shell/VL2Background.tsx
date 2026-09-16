'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/controls/ThemeProvider'

/**
 * Procedural pixel-art meadow background for VL2.
 * Draws a spectrogram-style pixelated nature scene — dark forest left,
 * bright sky upper-right, yellow-green meadow lower half — matching the
 * reference image, without requiring any image file.
 */
export function VL2Background() {
  const { vl } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (vl !== '2') {
      // Clear canvas when switching back to VL1
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // ── Step 1: draw the base scene on an offscreen canvas ──────────────
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const o = off.getContext('2d')!

    // Deep dark base
    o.fillStyle = '#0a120a'
    o.fillRect(0, 0, W, H)

    // Sky (upper right) — bright white-blue glow
    const sky = o.createRadialGradient(W * 0.72, H * 0.12, 0, W * 0.62, H * 0.22, W * 0.65)
    sky.addColorStop(0, 'rgba(240,248,255,1)')     // bright white centre
    sky.addColorStop(0.12, 'rgba(200,232,252,0.95)')
    sky.addColorStop(0.3, 'rgba(100,180,232,0.85)')
    sky.addColorStop(0.55, 'rgba(60,130,190,0.55)')
    sky.addColorStop(1, 'rgba(0,40,80,0)')
    o.fillStyle = sky
    o.fillRect(0, 0, W, H)

    // Dark forest / trees (left third)
    const trees = o.createRadialGradient(W * 0.08, H * 0.25, 0, W * 0.15, H * 0.35, W * 0.38)
    trees.addColorStop(0, 'rgba(8,24,8,0.96)')
    trees.addColorStop(0.2, 'rgba(14,40,14,0.88)')
    trees.addColorStop(0.5, 'rgba(20,55,15,0.65)')
    trees.addColorStop(1, 'rgba(20,55,15,0)')
    o.fillStyle = trees
    o.fillRect(0, 0, W, H)

    // Second tree cluster (left-center overlap)
    const trees2 = o.createRadialGradient(W * 0.04, H * 0.55, 0, W * 0.18, H * 0.55, W * 0.28)
    trees2.addColorStop(0, 'rgba(8,22,8,0.9)')
    trees2.addColorStop(0.4, 'rgba(16,45,12,0.6)')
    trees2.addColorStop(1, 'rgba(16,45,12,0)')
    o.fillStyle = trees2
    o.fillRect(0, 0, W, H)

    // Meadow ground (lower 55%) — yellow-green grass
    const meadow = o.createLinearGradient(0, H * 0.38, 0, H)
    meadow.addColorStop(0, 'rgba(50,100,20,0.0)')
    meadow.addColorStop(0.12, 'rgba(80,140,30,0.75)')
    meadow.addColorStop(0.3, 'rgba(140,200,50,0.92)')
    meadow.addColorStop(0.55, 'rgba(190,220,60,0.96)')
    meadow.addColorStop(0.75, 'rgba(160,200,48,0.92)')
    meadow.addColorStop(1, 'rgba(60,100,20,0.88)')
    o.fillStyle = meadow
    o.fillRect(0, 0, W, H)

    // Dark tree-shadow line at the horizon (where forest meets meadow)
    const horizon = o.createLinearGradient(0, H * 0.40, 0, H * 0.58)
    horizon.addColorStop(0, 'rgba(8,20,8,0.0)')
    horizon.addColorStop(0.4, 'rgba(8,24,8,0.55)')
    horizon.addColorStop(1, 'rgba(8,20,8,0.0)')
    o.fillStyle = horizon
    o.fillRect(0, H * 0.35, W * 0.45, H * 0.28)  // only on left/tree side

    // ── Step 2: read pixels and redraw as vertical pixel-bar mosaic ──────
    const BLOCK = 4   // pixel block size (px)
    const pixels = o.getImageData(0, 0, W, H)
    const d = pixels.data

    ctx.clearRect(0, 0, W, H)

    for (let x = 0; x < W; x += BLOCK) {
      for (let y = 0; y < H; y += BLOCK) {
        // Sample the centre of this block
        const sx = Math.min(x + 1, W - 1)
        const sy = Math.min(y + 1, H - 1)
        const idx = (sy * W + sx) * 4
        const r = d[idx]
        const g = d[idx + 1]
        const b = d[idx + 2]

        // Slight vertical height variation for the spectrogram feel
        // Uses sin so it's deterministic (no Math.random)
        const stretch = 1 + Math.sin(x * 0.07 + y * 0.03) * 0.22
        const bw = BLOCK - 1
        const bh = Math.round(BLOCK * stretch)
        const dy = y - (bh - BLOCK) / 2

        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, dy, bw, bh)
      }
    }
  }, [vl])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -2,
        opacity: 0.42,
        pointerEvents: 'none',
      }}
    />
  )
}
