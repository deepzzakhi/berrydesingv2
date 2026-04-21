import ExcelJS from 'exceljs'
import type { Producto } from '@/types/producto'
import { TIPO_LABELS, ESTADO_LABELS } from '@/types/producto'
import { formatDate } from '@/lib/utils'

const BERRY_PURPLE = 'FF851919'
const WHITE = 'FFFFFFFF'
const GRAY_LIGHT = 'FFF3F4F6'

const ESTADO_FILL: Record<string, string> = {
  stock: 'FFD1FAE5',
  reservado: 'FFFEF3C7',
  cobrado: 'FFF3F4F6',
}

const ESTADO_FONT_COLOR: Record<string, string> = {
  stock: 'FF166534',
  reservado: 'FF92400E',
  cobrado: 'FF374151',
}

export async function exportarProductosExcel(productos: Producto[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Berry Stock'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Inventario Berry', {
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
    },
  })

  // ── Title row ────────────────────────────────────────────────────────────────
  sheet.mergeCells('A1:H1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'Inventario Berry Design'
  titleCell.font = { bold: true, size: 16, color: { argb: BERRY_PURPLE } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 36

  // ── Subtitle / date ───────────────────────────────────────────────────────────
  sheet.mergeCells('A2:H2')
  const dateCell = sheet.getCell('A2')
  dateCell.value = `Exportado el ${formatDate(new Date().toISOString())}`
  dateCell.font = { size: 10, color: { argb: 'FF6B7280' } }
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(2).height = 20

  // ── Header row ────────────────────────────────────────────────────────────────
  const headers = [
    'Código Tela',
    'Tipo',
    'Medida',
    'Cantidad',
    'Estado',
    'Catálogo',
    'Observaciones',
    'Última actualización',
  ]

  const headerRow = sheet.getRow(4)
  headerRow.height = 28

  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = header
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BERRY_PURPLE },
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: WHITE } },
    }
  })

  // ── Column widths ─────────────────────────────────────────────────────────────
  sheet.getColumn(1).width = 18
  sheet.getColumn(2).width = 22
  sheet.getColumn(3).width = 16
  sheet.getColumn(4).width = 12
  sheet.getColumn(5).width = 16
  sheet.getColumn(6).width = 18
  sheet.getColumn(7).width = 30
  sheet.getColumn(8).width = 26

  // ── Data rows ─────────────────────────────────────────────────────────────────
  productos.forEach((producto, rowIdx) => {
    const row = sheet.getRow(5 + rowIdx)
    row.height = 24

    const isEven = rowIdx % 2 === 0
    const bgColor = isEven ? WHITE : GRAY_LIGHT

    const values = [
      producto.tela?.codigo ?? '-',
      TIPO_LABELS[producto.tipo] ?? producto.tipo,
      producto.medida ?? '-',
      producto.cantidad,
      ESTADO_LABELS[producto.estado] ?? producto.estado,
      producto.tela?.catalogo?.nombre ?? '-',
      producto.tela?.observaciones ?? '-',
      formatDate(producto.updated_at),
    ]

    values.forEach((value, colIdx) => {
      const cell = row.getCell(colIdx + 1)
      cell.value = value

      const defaultFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor },
      }

      // Estado column gets special color
      if (colIdx === 4) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: ESTADO_FILL[producto.estado] ?? bgColor },
        }
        cell.font = {
          bold: true,
          color: { argb: ESTADO_FONT_COLOR[producto.estado] ?? 'FF000000' },
        }
      } else {
        cell.fill = defaultFill
        cell.font = { size: 10 }
      }

      cell.alignment = {
        horizontal: colIdx === 3 ? 'center' : 'left',
        vertical: 'middle',
      }

      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
      }
    })
  })

  // ── Summary sheet ─────────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Resumen')

  const totalStock = productos.filter((p) => p.estado === 'stock').length
  const totalReservado = productos.filter((p) => p.estado === 'reservado').length
  const totalVendido = productos.filter((p) => p.estado === 'cobrado').length

  const summaryData = [
    ['Resumen del Inventario', ''],
    ['', ''],
    ['Métrica', 'Valor'],
    ['Total de productos', productos.length],
    ['En stock', totalStock],
    ['Reservados', totalReservado],
    ['Vendidos', totalVendido],
  ]

  summaryData.forEach((rowData, rowIdx) => {
    const row = summarySheet.getRow(rowIdx + 1)
    rowData.forEach((value, colIdx) => {
      row.getCell(colIdx + 1).value = value
    })

    if (rowIdx === 0) {
      const titleC = row.getCell(1)
      titleC.font = { bold: true, size: 14, color: { argb: BERRY_PURPLE } }
    }

    if (rowIdx === 2) {
      const h1 = row.getCell(1)
      const h2 = row.getCell(2)
      h1.font = { bold: true, color: { argb: WHITE } }
      h2.font = { bold: true, color: { argb: WHITE } }
      const headerFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: BERRY_PURPLE },
      }
      h1.fill = headerFill
      h2.fill = headerFill
    }
  })

  summarySheet.getColumn(1).width = 25
  summarySheet.getColumn(2).width = 15

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
