import { readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const inputPath = process.argv[2]
const outputPath = resolve(process.cwd(), 'public/specialties.mxl')

if (!inputPath) {
  throw new Error('Usage: node scripts/import-specialties.mjs <path-to-specialties.json>')
}

const source = JSON.parse(readFileSync(resolve(inputPath), 'utf8'))

if (!Array.isArray(source.allSpecialty)) {
  throw new Error('Expected an allSpecialty array in the source file')
}

const directions = source.allSpecialty.map((item, index) => {
  const specialty = String(item?.specialty ?? '')
  const match = specialty.match(/^\s*(\d{2}\.\d{2}\.\d{2})\.?\s+(.+?)\s*$/)

  if (!match) {
    throw new Error(`Unable to read direction #${index + 1}: ${specialty}`)
  }

  return { code: match[1], name: match[2] }
})

const quote = (value) => `"${value.replaceAll('"', '""')}"`
const content = [
  `# Generated from ${basename(inputPath)}. Do not edit manually.`,
  ...directions.map(({ code, name }) => `${quote(code)}\t${quote(name)}`),
  '',
].join('\n')

writeFileSync(outputPath, content, 'utf8')
console.log(`Wrote ${directions.length} directions to ${outputPath}`)
