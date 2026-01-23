const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '../server/data/bookmarks.json')
const outFile = path.join(__dirname, '../server/data/bookmarks.translated.json')

const data = JSON.parse(fs.readFileSync(file, 'utf8'))

const replacements = [
  [/\s*&\s*/g, ' y '],
  [/Productivity/gi, 'Productividad'],
  [/Tools\b/gi, 'Herramientas'],
  [/Org\b/gi, 'Organización'],
  [/Organization/gi, 'Organización'],
  [/General Dev/gi, 'Desarrollo general'],
  [/Communication/gi, 'Comunicación'],
  [/Playground/gi, 'Área de pruebas'],
  [/Languages/gi, 'Lenguajes'],
  [/Frameworks/gi, 'Frameworks'],
  [/Carousels/gi, 'Carruseles'],
  [/Frontend/gi, 'Front-end'],
  [/UI Libs/gi, 'Librerías UI'],
  [/Dashboard/gi, 'Panel'],
  [/gestion de proyectos/gi, 'gestión de proyectos'],
  [/JS\b/gi, 'JS'],
  [/\bTools\b/gi, 'Herramientas']
]

let changed = 0

function translateName(name) {
  let out = name
  replacements.forEach(([re, rep]) => {
    out = out.replace(re, rep)
  })
  // cleanup multiple spaces
  out = out.replace(/\s+/g, ' ').trim()
  if (out !== name) return out
  return name
}

function walk(node) {
  if (Array.isArray(node)) {
    node.forEach(walk)
    return
  }
  if (node && typeof node === 'object') {
    if (node.children && Array.isArray(node.children)) {
      const old = node.name
      const tr = translateName(String(old))
      if (tr !== old) {
        node.name = tr
        changed++
      }
      // recurse into children
      node.children.forEach(walk)
    }
  }
}

walk(data)

fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf8')
console.log('Wrote', outFile, 'changed:', changed)
