import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { error as apiError, handleError } from '@/lib/api-response';

// ============================================
// TYPES
// ============================================

interface CardData {
  code: string | null;   // raw code — only when provided from fresh generation
  codeLast4: string;
  value: number;
  currency: string;
  batchName: string | null;
}

type Template = 'dark' | 'light' | 'antifraud';
type Layout = 1 | 2 | 4 | 8;

const querySchema = z.object({
  template: z.enum(['dark', 'light', 'antifraud']).default('dark'),
  layout: z.enum(['1', '2', '4', '8']).default('4'),
  take: z.coerce.number().int().min(1).max(500).default(50),
  status: z.string().default('ACTIVE'),
  includeQr: z.enum(['0', '1']).default('1'),
  language: z.enum(['en', 'ar', 'both']).default('both'),
});

const bodySchema = z.object({
  codes: z.array(z.object({
    code: z.string().min(1),
    value: z.number().positive(),
    currency: z.string().min(1).max(10),
  })).min(1).max(500),
  batchName: z.string().max(200).nullable().optional(),
  voucherIds: z.array(z.string().cuid()).max(500).optional(),
}).optional();

// ============================================
// COLOR PALETTES
// ============================================

function getColors(template: Template) {
  switch (template) {
    case 'dark':
      return {
        bg: rgb(0.12, 0.12, 0.14),
        accent: rgb(0.85, 0.68, 0.2),      // gold
        text: rgb(1, 1, 1),
        subtext: rgb(0.7, 0.7, 0.7),
        scratchBg: rgb(0.3, 0.3, 0.3),
        scratchText: rgb(0.85, 0.68, 0.2),
        border: rgb(0.85, 0.68, 0.2),
      };
    case 'light':
      return {
        bg: rgb(1, 1, 1),
        accent: rgb(0.15, 0.4, 0.85),      // blue
        text: rgb(0.1, 0.1, 0.1),
        subtext: rgb(0.4, 0.4, 0.4),
        scratchBg: rgb(0.85, 0.85, 0.85),
        scratchText: rgb(0.15, 0.4, 0.85),
        border: rgb(0.15, 0.4, 0.85),
      };
    case 'antifraud':
      return {
        bg: rgb(0.96, 0.96, 0.94),
        accent: rgb(0.6, 0.1, 0.1),        // deep red
        text: rgb(0.1, 0.1, 0.1),
        subtext: rgb(0.35, 0.35, 0.35),
        scratchBg: rgb(0.75, 0.75, 0.72),
        scratchText: rgb(0.6, 0.1, 0.1),
        border: rgb(0.6, 0.1, 0.1),
      };
  }
}

// ============================================
// GRID POSITIONS
// ============================================

// A4 in points: 595.28 x 841.89
const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 28; // safe margin in points

function getGrid(layout: Layout): { cols: number; rows: number; cardW: number; cardH: number } {
  // CR80 aspect ratio: 85.60 x 53.98 mm → ratio ~1.586
  // We fit cards in a grid within the safe area
  const safeW = A4_W - MARGIN * 2;
  const safeH = A4_H - MARGIN * 2;
  const gap = 10;

  switch (layout) {
    case 1: {
      const cardW = safeW;
      const cardH = cardW / 1.586;
      return { cols: 1, rows: 1, cardW, cardH };
    }
    case 2: {
      const cardW = safeW;
      const cardH = (safeH - gap) / 2;
      return { cols: 1, rows: 2, cardW, cardH };
    }
    case 4: {
      const cardW = (safeW - gap) / 2;
      const cardH = (safeH - gap) / 2;
      return { cols: 2, rows: 2, cardW, cardH };
    }
    case 8: {
      const cardW = (safeW - gap) / 2;
      const cardH = (safeH - gap * 3) / 4;
      return { cols: 2, rows: 4, cardW, cardH };
    }
  }
}

// ============================================
// DRAW SINGLE CARD
// ============================================

async function drawCard(
  pdfDoc: PDFDocument,
  page: PDFPage,
  card: CardData,
  x: number,
  y: number,
  w: number,
  h: number,
  template: Template,
  includeQr: boolean,
  language: 'en' | 'ar' | 'both',
  helvetica: PDFFont,
  helveticaBold: PDFFont,
) {
  const c = getColors(template);

  // Background
  page.drawRectangle({ x, y, width: w, height: h, color: c.bg });

  // Border
  page.drawRectangle({
    x, y, width: w, height: h,
    borderColor: c.border, borderWidth: 1.5,
  });

  // Antifraud: pattern lines
  if (template === 'antifraud') {
    for (let lx = x + 8; lx < x + w; lx += 12) {
      page.drawLine({
        start: { x: lx, y: y + 2 },
        end: { x: lx, y: y + h - 2 },
        color: rgb(0.88, 0.88, 0.86),
        thickness: 0.3,
      });
    }
    // Micro-text effect: small repeated text along bottom
    const micro = 'SES-SECURE ';
    const microLine = micro.repeat(Math.ceil(w / 40));
    page.drawText(microLine.slice(0, Math.floor(w / 3)), {
      x: x + 4,
      y: y + 4,
      size: 3,
      font: helvetica,
      color: rgb(0.82, 0.82, 0.80),
    });
  }

  const pad = 12;
  const innerX = x + pad;
  const topY = y + h - pad;

  // SES Logo text
  page.drawText('SES', {
    x: innerX,
    y: topY - 14,
    size: 18,
    font: helveticaBold,
    color: c.accent,
  });

  // Value (big)
  const valueStr = `${card.value} ${card.currency}`;
  page.drawText(valueStr, {
    x: innerX,
    y: topY - 40,
    size: Math.min(28, w / (valueStr.length * 0.6)),
    font: helveticaBold,
    color: c.text,
  });

  // Site URL
  page.drawText('ses-marketplace.com', {
    x: innerX,
    y: topY - 56,
    size: 7,
    font: helvetica,
    color: c.subtext,
  });

  // Batch name (small text, top-right area, clamped to avoid SES logo overlap)
  if (card.batchName) {
    const maxBatchW = w - pad * 2 - 50; // 50pt reserved for SES logo
    let batchLabel = card.batchName.slice(0, 30);
    let batchWidth = helvetica.widthOfTextAtSize(batchLabel, 5);
    // Truncate further if it would overlap
    while (batchWidth > maxBatchW && batchLabel.length > 3) {
      batchLabel = batchLabel.slice(0, -1);
      batchWidth = helvetica.widthOfTextAtSize(batchLabel + '…', 5);
    }
    if (batchLabel.length < card.batchName.slice(0, 30).length) {
      batchLabel += '…';
      batchWidth = helvetica.widthOfTextAtSize(batchLabel, 5);
    }
    page.drawText(batchLabel, {
      x: x + w - pad - batchWidth,
      y: topY - 14,
      size: 5,
      font: helvetica,
      color: c.subtext,
    });
  }

  // Language labels
  const labelEn = card.code ? 'GIFT CARD' : 'VOUCHER CARD';
  const labelAr = card.code ? 'بطاقة هدية' : 'بطاقة قسيمة';
  let labelText = labelEn;
  if (language === 'ar') labelText = labelAr;
  else if (language === 'both') labelText = `${labelEn} | ${labelAr}`;
  page.drawText(labelText, {
    x: innerX,
    y: topY - 70,
    size: 7,
    font: helvetica,
    color: c.subtext,
  });

  // ---- Bottom section: code area + QR ----
  const bottomY = y + pad;
  const qrSize = includeQr ? Math.min(60, h * 0.3) : 0;
  const codeAreaX = innerX;
  const codeAreaW = w - pad * 2 - (includeQr ? qrSize + 8 : 0);

  if (card.code) {
    // Show full code for freshly generated cards
    // Scratch overlay rectangle
    const scratchH = 22;
    const scratchY = bottomY + 14;
    page.drawRectangle({
      x: codeAreaX,
      y: scratchY,
      width: codeAreaW,
      height: scratchH,
      color: c.scratchBg,
    });

    const scratchLabel = language === 'ar' ? 'امسح هنا' : language === 'both' ? 'Scratch Here | امسح هنا' : 'Scratch Here';
    page.drawText(scratchLabel, {
      x: codeAreaX + 4,
      y: scratchY + 7,
      size: 7,
      font: helveticaBold,
      color: c.scratchText,
    });

    // Code below scratch area
    // Split code for readability (groups of 4)
    const formatted = card.code.match(/.{1,4}/g)?.join('-') ?? card.code;
    page.drawText(formatted, {
      x: codeAreaX,
      y: bottomY,
      size: Math.min(9, codeAreaW / (formatted.length * 0.45)),
      font: helveticaBold,
      color: c.text,
    });
  } else {
    // No raw code: scratch placeholder + last4
    const scratchH = 28;
    const scratchY = bottomY + 10;
    page.drawRectangle({
      x: codeAreaX,
      y: scratchY,
      width: codeAreaW,
      height: scratchH,
      color: c.scratchBg,
    });

    const scratchLabel = language === 'ar' ? 'امسح لكشف الكود' :
      language === 'both' ? 'SCRATCH TO REVEAL CODE | امسح لكشف الكود' :
        'SCRATCH TO REVEAL CODE';
    page.drawText(scratchLabel, {
      x: codeAreaX + 4,
      y: scratchY + 10,
      size: 7,
      font: helveticaBold,
      color: c.scratchText,
    });

    // Last 4 digits
    page.drawText(`****${card.codeLast4}`, {
      x: codeAreaX,
      y: bottomY,
      size: 8,
      font: helvetica,
      color: c.subtext,
    });
  }

  // QR Code
  if (includeQr) {
    const qrX = x + w - pad - qrSize;
    const qrY = bottomY;
    const qrContent = card.code ?? `https://ses-marketplace.com/wallet/redeem?last4=${card.codeLast4}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(qrContent, {
        width: 200,
        margin: 1,
        color: {
          dark: template === 'dark' ? '#FFFFFF' : '#000000',
          light: '#00000000', // transparent
        },
      });

      // Convert data URL to bytes
      const base64 = qrDataUrl.split(',')[1];
      if (base64) {
        const qrBytes = Buffer.from(base64, 'base64');
        const qrImage = await pdfDoc.embedPng(qrBytes);
        page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
      }
    } catch {
      // QR generation failed — draw placeholder
      page.drawRectangle({
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
        borderColor: c.subtext,
        borderWidth: 0.5,
      });
      page.drawText('QR', {
        x: qrX + qrSize / 2 - 6,
        y: qrY + qrSize / 2 - 4,
        size: 8,
        font: helvetica,
        color: c.subtext,
      });
    }
  }
}

// ============================================
// POST — Print with raw codes (fresh generation)
// ============================================

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams);
    const { template, layout: layoutStr, includeQr: iqStr, language } = querySchema.parse(params);
    const layoutNum = parseInt(layoutStr, 10) as Layout;
    const includeQr = iqStr === '1';

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError('Invalid JSON body', 'VALIDATION_ERROR', 400);
    }

    const parsed = bodySchema.parse(body);
    if (!parsed || !parsed.codes.length) {
      return apiError('No codes provided', 'VALIDATION_ERROR', 400);
    }

    const cards: CardData[] = parsed.codes.map((c) => ({
      code: c.code,
      codeLast4: c.code.slice(-4),
      value: c.value,
      currency: c.currency,
      batchName: parsed.batchName ?? null,
    }));

    // Set printedAt on vouchers if voucherIds provided
    if (parsed.voucherIds?.length) {
      await prisma.voucherCard.updateMany({
        where: { id: { in: parsed.voucherIds } },
        data: { printedAt: new Date() },
      });
    }

    const pdfBytes = await generatePDF(cards, template, layoutNum, includeQr, language);

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ses-vouchers-${template}-${layoutStr}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return handleError(err);
  }
}

// ============================================
// GET — Print active vouchers (no raw codes)
// ============================================

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams);
    const {
      template,
      layout: layoutStr,
      take,
      status,
      includeQr: iqStr,
      language,
    } = querySchema.parse(params);
    const layoutNum = parseInt(layoutStr, 10) as Layout;
    const includeQr = iqStr === '1';

    const vouchers = await prisma.voucherCard.findMany({
      where: { status: status as 'ACTIVE' | 'USED' | 'DISABLED' | 'EXPIRED' },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        codeLast4: true,
        value: true,
        currency: true,
        batch: { select: { name: true } },
      },
    });

    if (vouchers.length === 0) {
      return apiError('No vouchers found', 'NOT_FOUND', 404);
    }

    const cards: CardData[] = vouchers.map((v) => ({
      code: null,
      codeLast4: v.codeLast4,
      value: Number(v.value),
      currency: v.currency,
      batchName: v.batch?.name ?? null,
    }));

    const pdfBytes = await generatePDF(cards, template, layoutNum, includeQr, language);

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ses-vouchers-${template}-${layoutStr}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return handleError(err);
  }
}

// ============================================
// PDF GENERATION
// ============================================

async function generatePDF(
  cards: CardData[],
  template: Template,
  layout: Layout,
  includeQr: boolean,
  language: 'en' | 'ar' | 'both',
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('SES Voucher Cards');
  pdfDoc.setProducer('SES Marketplace');

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const grid = getGrid(layout);
  const cardsPerPage = grid.cols * grid.rows;
  const gap = 10;

  for (let i = 0; i < cards.length; i += cardsPerPage) {
    const page = pdfDoc.addPage([A4_W, A4_H]);
    const pageCards = cards.slice(i, i + cardsPerPage);

    for (let j = 0; j < pageCards.length; j++) {
      const col = j % grid.cols;
      const row = Math.floor(j / grid.cols);

      const x = MARGIN + col * (grid.cardW + gap);
      // Y from top: first row at top of safe area
      const y = A4_H - MARGIN - (row + 1) * grid.cardH - row * gap;

      await drawCard(
        pdfDoc,
        page,
        pageCards[j],
        x, y, grid.cardW, grid.cardH,
        template, includeQr, language,
        helvetica, helveticaBold,
      );
    }
  }

  return pdfDoc.save();
}
