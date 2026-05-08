/**
 * GET /api/admin/qr-pdf
 *
 * Generates an A4 PDF with a 3×5 grid of QR codes — one per DB table.
 * Each QR encodes http://SHOP_IP:SHOP_PORT/order?table=N.
 * Source of truth: Table model from DB (not TABLE_COUNT env var).
 */

import { NextRequest } from "next/server"
import path from "path"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"

// Force Node.js runtime — pdfkit uses Buffer/fs internally
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  // ── Env var validation ─────────────────────────────────────
  const shopIp = process.env.SHOP_IP
  if (!shopIp) {
    return Response.json(
      { error: "SHOP_IP chưa được cấu hình" },
      { status: 400 },
    )
  }
  const shopPort = process.env.SHOP_PORT || "3000"

  // ── Load tables from DB ─────────────────────────────────────
  let tables: { id: number; number: number; name: string }[]
  try {
    tables = await prisma.table.findMany({
      orderBy: { number: "asc" },
      select: { id: true, number: true, name: true },
    })
  } catch (err) {
    console.error("[qr-pdf] DB query failed:", err)
    return Response.json(
      { error: "Không thể truy vấn danh sách bàn" },
      { status: 500 },
    )
  }

  if (tables.length === 0) {
    return Response.json(
      { error: "Chưa có bàn nào. Hãy thêm bàn trong trang quản lý." },
      { status: 400 },
    )
  }

  console.log(`[qr-pdf] Generating PDF for ${tables.length} tables`)

  // ── Font validation ────────────────────────────────────────
  const fontPath = path.join(process.cwd(), "public", "fonts", "Inter.ttf")
  try {
    const fs = await import("fs")
    if (!fs.existsSync(fontPath)) {
      return Response.json({ error: "Font file not found" }, { status: 500 })
    }
  } catch {
    return Response.json({ error: "Font file not found" }, { status: 500 })
  }

  try {
    // ── Generate QR buffers ────────────────────────────────────
    const qrBuffers: Buffer[] = []
    for (const table of tables) {
      const url = `http://${shopIp}:${shopPort}/order?table=${table.number}`
      const buf = await QRCode.toBuffer(url, {
        width: 300,
        errorCorrectionLevel: "M",
      })
      qrBuffers.push(buf)
    }

    // ── Build PDF ──────────────────────────────────────────────
    const doc = new PDFDocument({ size: "A4", margin: 40 })
    doc.registerFont("Vietnamese", fontPath)

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    const pdfReady = new Promise<void>((resolve, reject) => {
      doc.on("end", resolve)
      doc.on("error", reject)
    })

    // ── Layout constants ─────────────────────────────────────
    const pageWidth = 595.28
    const margin = 40
    const cols = 3
    const rows = 5
    const perPage = cols * rows
    const availableWidth = pageWidth - margin * 2
    const colWidth = availableWidth / cols
    const qrSize = 120
    const rowHeight = 150
    const titleHeight = 50

    // ── Render pages ─────────────────────────────────────────
    const tableCount = tables.length
    const totalPages = Math.ceil(tableCount / perPage)

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage()

      // Page title (only first page)
      if (page === 0) {
        doc
          .font("Vietnamese")
          .fontSize(20)
          .fillColor("#000000")
          .text("QR Code - TraSua", margin, margin, {
            align: "center",
            width: availableWidth,
          })
      }

      const startY = page === 0 ? margin + titleHeight : margin
      const startIdx = page * perPage
      const endIdx = Math.min(startIdx + perPage, tableCount)

      for (let i = startIdx; i < endIdx; i++) {
        const localIdx = i - startIdx
        const col = localIdx % cols
        const row = Math.floor(localIdx / cols)

        const cellX = margin + col * colWidth
        const cellY = startY + row * rowHeight
        const qrX = cellX + (colWidth - qrSize) / 2

        // Embed QR image
        doc.image(qrBuffers[i], qrX, cellY, {
          width: qrSize,
          height: qrSize,
        })

        // "Bàn N" label — 14pt, centered below QR
        doc
          .font("Vietnamese")
          .fontSize(14)
          .fillColor("#1a1a1a")
          .text(`Bàn ${tables[i].number}`, cellX, cellY + qrSize + 4, {
            width: colWidth,
            align: "center",
          })

        // "Quét để đặt món" subtitle — 10pt, lighter
        doc
          .font("Vietnamese")
          .fontSize(10)
          .fillColor("#666666")
          .text("Quét để đặt món", cellX, cellY + qrSize + 20, {
            width: colWidth,
            align: "center",
          })
      }
    }

    doc.end()
    await pdfReady

    const pdfBuffer = Buffer.concat(chunks)

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="trasua-qr-codes.pdf"',
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[qr-pdf] PDF generation failed:", err)
    return Response.json({ error: "PDF generation failed" }, { status: 500 })
  }
}
