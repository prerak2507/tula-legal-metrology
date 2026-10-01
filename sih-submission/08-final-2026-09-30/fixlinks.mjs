// Replaces the link annotations PowerPoint wrote into the PDF with one correct annotation per hyperlink,
// at the positions PowerPoint reports for each linked run or picture (v8_links.txt).
import { readFileSync, writeFileSync } from 'node:fs';
import { PDFDocument, PDFName, PDFString, PDFArray } from 'pdf-lib';

const [, , inPdf, linksFile, outPdf] = process.argv;
const lines = readFileSync(linksFile, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
const [, SW, SH] = lines[0].split('|').map(Number);
const links = lines.slice(1).map(l => { const [, slide, x, y, w, h, ...u] = l.split('|'); return { slide: +slide, x: +x, y: +y, w: +w, h: +h, url: u.join('|') }; });

const pdf = await PDFDocument.load(readFileSync(inPdf));
const pages = pdf.getPages();
let removed = 0, added = 0;
pages.forEach((page, i) => {
  const { width, height } = page.getSize();
  const kx = width / SW, ky = height / SH;
  const annots = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  const keep = [];
  if (annots) for (let j = 0; j < annots.size(); j++) {
    const a = annots.lookup(j);
    if (a?.get?.(PDFName.of('Subtype'))?.toString() === '/Link') { removed++; continue; }
    keep.push(annots.get(j));
  }
  const arr = pdf.context.obj(keep);
  for (const l of links.filter(l => l.slide === i + 1)) {
    const pad = 1.5;
    const rect = [(l.x - pad) * kx, height - (l.y + l.h + pad) * ky, (l.x + l.w + pad) * kx, height - (l.y - pad) * ky];
    const annot = pdf.context.obj({
      Type: 'Annot', Subtype: 'Link', Rect: rect, Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(l.url) },
    });
    arr.push(pdf.context.register(annot));
    added++;
  }
  page.node.set(PDFName.of('Annots'), arr);
});
writeFileSync(outPdf, await pdf.save());
console.log({ pages: pages.length, removed, added });
