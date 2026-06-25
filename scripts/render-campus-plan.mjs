import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas'

globalThis.DOMMatrix = DOMMatrix
globalThis.ImageData = ImageData
globalThis.Path2D = Path2D

const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
const sourcePath = new URL('../public/assets/plan_melgu.pdf', import.meta.url)
const outputPath = new URL('../public/assets/plan_melgu.webp', import.meta.url)
const cacheDirectory = new URL('../.cache/', import.meta.url)
const hashPath = new URL('plan_melgu.sha256', cacheDirectory)
const distAssetsDirectory = new URL('../dist/assets/', import.meta.url)
const distPdfPath = new URL('plan_melgu.pdf', distAssetsDirectory)
const distImagePath = new URL('plan_melgu.webp', distAssetsDirectory)
const renderScale = 1.5

async function syncProductionAssets() {
  await mkdir(distAssetsDirectory, { recursive: true })
  await Promise.all([
    copyFile(sourcePath, distPdfPath),
    copyFile(outputPath, distImagePath),
  ])
}

async function hasValidCache(sourceHash) {
  try {
    const [savedHash, outputStats] = await Promise.all([
      readFile(hashPath, 'utf8'),
      stat(outputPath),
    ])
    return savedHash.trim() === sourceHash && outputStats.size > 0
  } catch {
    return false
  }
}

async function hasGeneratedImage() {
  try {
    const outputStats = await stat(outputPath)
    return outputStats.size > 0
  } catch {
    return false
  }
}

async function renderCampusPlan() {
  const source = await readFile(sourcePath)
  const sourceHash = createHash('sha256').update(source).digest('hex')

  if (await hasValidCache(sourceHash)) {
    await syncProductionAssets()
    console.log('Кеш плана актуален — повторная обработка не требуется.')
    return
  }

  if (await hasGeneratedImage()) {
    await mkdir(cacheDirectory, { recursive: true })
    await writeFile(hashPath, sourceHash, 'utf8')
    await syncProductionAssets()
    console.log('План уже собран — используем готовый WebP без рендера PDF.')
    return
  }

  console.log('PDF изменился — обновляем кеш плана…')
  const loadingTask = getDocument({ data: new Uint8Array(source), disableWorker: true })
  const document = await loadingTask.promise
  const page = await document.getPage(1)
  const viewport = page.getViewport({ scale: renderScale })
  const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height))

  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
  }).promise

  const image = await canvas.encode('webp', 90)
  await mkdir(cacheDirectory, { recursive: true })
  await Promise.all([
    writeFile(outputPath, image),
    writeFile(hashPath, sourceHash, 'utf8'),
  ])
  await loadingTask.destroy()
  await syncProductionAssets()

  console.log(`Кеш плана обновлён: ${canvas.width}×${canvas.height}, ${(image.length / 1024 / 1024).toFixed(1)} МБ`)
}

await renderCampusPlan()
