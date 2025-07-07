import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import type { AppState, ReportConfig, TestResult } from '../types';

const PAGE_FORMAT = 'a4';
const PAGE_ORIENTATION = 'p';
const PAGE_UNITS = 'mm';

const MARGINS = { top: 25, bottom: 20, left: 20, right: 20 };
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;
const FONT = 'times';
const LINE_HEIGHT_RATIO = 1.5;

type TocEntry = { title: string, page: number, level: number };

class PdfContext {
    doc: jsPDF;
    y: number;
    pageNumber: number;
    tocEntries: TocEntry[];

    constructor() {
        this.doc = new jsPDF(PAGE_ORIENTATION, PAGE_UNITS, PAGE_FORMAT);
        this.doc.setFont(FONT, 'normal');
        this.y = MARGINS.top;
        this.pageNumber = 1;
        this.tocEntries = [];
    }

    checkPageBreak(heightNeeded = 10) {
        if (this.y + heightNeeded > PAGE_HEIGHT - MARGINS.bottom) {
            this.doc.addPage();
            this.pageNumber++;
            this.y = MARGINS.top;
            return true;
        }
        return false;
    }

    addTocEntry(title: string, level: number) {
        this.tocEntries.push({ title, page: this.pageNumber, level });
    }
}

const addHeaderFooter = (doc: jsPDF, config: ReportConfig) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setFont(FONT, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100);
        
        const headerText = 'Relatório de Qualificação Térmica';
        doc.text(headerText, MARGINS.left, MARGINS.top / 2);
        
        const pageNumText = `${i}`;
        doc.text(pageNumText, PAGE_WIDTH - MARGINS.right, MARGINS.top / 2, { align: 'right' });

        doc.setDrawColor(150);
        doc.line(MARGINS.left, MARGINS.top / 2 + 2, PAGE_WIDTH - MARGINS.right, MARGINS.top / 2 + 2);
    }
};

const addCoverPage = (ctx: PdfContext, state: AppState) => {
    const { doc } = ctx;
    if (state.companyLogo) {
        try {
            const imgProps = doc.getImageProperties(state.companyLogo);
            const logoWidth = 50;
            const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
            doc.addImage(state.companyLogo, 'PNG', (PAGE_WIDTH - logoWidth) / 2, 40, logoWidth, logoHeight);
        } catch (e) { console.error("Could not add company logo", e); }
    }

    doc.setFont(FONT, 'bold');
    doc.setFontSize(20);
    doc.text('RELATÓRIO DE QUALIFICAÇÃO DE', PAGE_WIDTH / 2, 140, { align: 'center' });
    doc.text('DESEMPENHO', PAGE_WIDTH / 2, 150, { align: 'center' });
    
    doc.setFont(FONT, 'normal');
    doc.setFontSize(12);
    doc.text(state.config.city, PAGE_WIDTH / 2, PAGE_HEIGHT - 45, { align: 'center' });
    doc.text(state.config.reportDate, PAGE_WIDTH / 2, PAGE_HEIGHT - 38, { align: 'center' });
    ctx.doc.addPage();
    ctx.pageNumber++;
};

const addTableOfContents = (doc: jsPDF, tocPage: number, entries: TocEntry[]) => {
    doc.setPage(tocPage);
    let y = MARGINS.top;
    
    doc.setFont(FONT, 'bold');
    doc.setFontSize(16);
    doc.text('SUMÁRIO', MARGINS.left, y);
    y += 15;

    doc.setFont(FONT, 'normal');
    doc.setFontSize(12);
    const lineHeight = 8;
    
    entries.forEach(entry => {
        if (y + lineHeight > PAGE_HEIGHT - MARGINS.bottom) {
            doc.addPage();
            y = MARGINS.top;
        }
        const indent = (entry.level - 1) * 7;
        const title = entry.title;
        const pageStr = entry.page.toString();
        
        const titleX = MARGINS.left + indent;
        const pageNumX = PAGE_WIDTH - MARGINS.right;
        
        const maxWidthForTitle = CONTENT_WIDTH - indent - 20;
        doc.text(title, titleX, y, { maxWidth: maxWidthForTitle });
        doc.text(pageStr, pageNumX, y, { align: 'right' });
        
        const titleLines = doc.splitTextToSize(title, maxWidthForTitle);
        y += lineHeight * titleLines.length;
    });
};

const addSectionTitle = (ctx: PdfContext, title: string, level = 1) => {
    ctx.checkPageBreak(15);
    ctx.addTocEntry(title, level);
    ctx.doc.setFont(FONT, 'bold');
    ctx.doc.setFontSize(level === 1 ? 14 : 12);
    ctx.doc.text(title.toUpperCase(), MARGINS.left, ctx.y);
    ctx.y += 10;
};

const addText = (ctx: PdfContext, text: string, indent = 0) => {
    ctx.doc.setFont(FONT, 'normal');
    ctx.doc.setFontSize(12);
    const lineHeight = 12 * 0.35 * LINE_HEIGHT_RATIO;
    const splitText = ctx.doc.splitTextToSize(text, CONTENT_WIDTH - indent);
    
    splitText.forEach((line: string) => {
        ctx.checkPageBreak(lineHeight);
        ctx.doc.text(line, MARGINS.left + indent, ctx.y);
        ctx.y += lineHeight;
    });
    ctx.y += 5;
};

const addSideBySideImages = async (ctx: PdfContext, imageData1: string | null, imageData2: string | null) => {
    if (!imageData1 && !imageData2) return;
    const { doc } = ctx;
    
    let maxHeight = 0;
    const imgWidth = (CONTENT_WIDTH / 2) - 2;
    const x1 = MARGINS.left;
    const x2 = x1 + imgWidth + 4;

    const getImageDim = (data: string | null): { h: number, w: number } => {
        if (!data?.startsWith('data:image')) return {h: 0, w: 0};
        try {
            const props = doc.getImageProperties(data);
            const h = (props.height * imgWidth) / props.width;
            return { h, w: imgWidth };
        } catch { return {h: 0, w: 0}; }
    };

    const dim1 = getImageDim(imageData1);
    const dim2 = getImageDim(imageData2);
    maxHeight = Math.max(dim1.h, dim2.h);
    
    ctx.checkPageBreak(maxHeight + 10);
    
    if(imageData1) doc.addImage(imageData1, 'PNG', x1, ctx.y, dim1.w, dim1.h);
    if(imageData2) doc.addImage(imageData2, 'PNG', x2, ctx.y, dim2.w, dim2.h);
    
    ctx.y += maxHeight + 10;
};

const addChart = async (ctx: PdfContext, chartId: string) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;

    const canvas = await html2canvas(chartElement, { scale: 3, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgProps = ctx.doc.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * CONTENT_WIDTH) / imgProps.width;
    
    ctx.checkPageBreak(pdfHeight);
    ctx.doc.addImage(imgData, 'PNG', MARGINS.left, ctx.y, CONTENT_WIDTH, pdfHeight);
    ctx.y += pdfHeight + 10;
};

const addTable = (ctx: PdfContext, head: string[][], body: (string|number)[][]) => {
    const tableStartY = ctx.y;
    autoTable(ctx.doc, {
        startY: tableStartY,
        head: head,
        body: body,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1, font: FONT },
        headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
        didDrawPage: (data: any) => {
             ctx.y = MARGINS.top; // Y position is reset on new page
        }
    });
    ctx.y = (ctx.doc as any).lastAutoTable.finalY + 10;
};


export const generatePdf = async (state: AppState): Promise<void> => {
    const ctx = new PdfContext();
    const tocPageNumber = 2;

    addCoverPage(ctx, state); // Finishes on page 2.
    
    ctx.doc.addPage();
    ctx.pageNumber++;
    ctx.y = MARGINS.top;

    const generateAllPages = async () => {
        addSectionTitle(ctx, '1. IDENTIFICAÇÃO DO EQUIPAMENTO');
        addTable(ctx, [], [
            ['Cliente', state.config.clientName], ['Endereço', state.config.address], ['CNPJ', state.config.cnpj],
            ['Descrição', state.config.equipmentDescription], ['Fabricante', state.config.manufacturer],
            ['Modelo', state.config.model], ['N° de Série', state.config.serialNumber], ['Patrimônio', state.config.assetNumber],
            ['Tipo de Qualificação', state.config.qualificationPhase]
        ]);

        addSectionTitle(ctx, '2. INTRODUÇÃO');
        addText(ctx, state.textBlocks.introduction);

        addSectionTitle(ctx, '3. OBJETIVOS');
        addText(ctx, state.textBlocks.objectives);
        
        addSectionTitle(ctx, '4. RESPONSABILIDADES');
        addText(ctx, state.textBlocks.responsibilities);

        addSectionTitle(ctx, '5. DEFINIÇÃO DOS TERMOS');
        addText(ctx, state.textBlocks.termDefinitions);

        addSectionTitle(ctx, '6. CONFIGURAÇÃO DOS CICLOS');
        addText(ctx, state.textBlocks.cycleConfig);
        
        addSectionTitle(ctx, '7. INSTRUMENTAÇÃO');
        addText(ctx, state.textBlocks.instrumentation);
        
        addSectionTitle(ctx, '8. POSICIONAMENTO DOS SENSORES');
        addText(ctx, 'A distribuição das cargas e dos sensores no equipamento está explicitada nos esquemáticos e fotos abaixo.');
        await addSideBySideImages(ctx, state.technicalDrawingImage, state.equipmentImage);
        
        addSectionTitle(ctx, '8. RELAÇÃO DOS ENSAIOS REALIZADOS');
        const testsList = state.tests.map(t => `• ${t.name}`).join('\n');
        addText(ctx, testsList);

        addSectionTitle(ctx, '9. ENSAIOS');
        for (let i = 0; i < state.tests.length; i++) {
            const test = state.tests[i];
            
            ctx.addTocEntry(`9.${i + 1} ${test.name}`, 2);
            ctx.doc.setFontSize(12);
            ctx.doc.setFont(FONT, 'bold');
            ctx.checkPageBreak(10);
            ctx.doc.text(`9.${i + 1} ${test.name}`, MARGINS.left, ctx.y);
            ctx.y += 8;

            ctx.doc.setFontSize(12);
            ctx.doc.text(`9.${i+1}.1 Descrição do ensaio`, MARGINS.left, ctx.y);
            ctx.y += 6;
            addText(ctx, test.description, 5);

            ctx.doc.setFontSize(12);
            ctx.doc.text(`9.${i+1}.2 Ciclos ensaiados`, MARGINS.left, ctx.y);
            ctx.y += 6;
            addText(ctx, test.cycleInfo, 5);

            ctx.doc.setFontSize(12);
            ctx.doc.text('Critério de aceitação', MARGINS.left, ctx.y);
            ctx.y += 6;
            addText(ctx, test.acceptanceCriteria, 5);

            ctx.doc.setFontSize(12);
            ctx.doc.text(`9.${i+1}.3 Resultados`, MARGINS.left, ctx.y);
            ctx.y += 6;
            addText(ctx, test.results, 5);

            if (state.qualificationType === 'autoclave' && test.summary.f0 !== undefined && test.f0Results && test.f0Results.length > 0) {
                ctx.checkPageBreak(15);
                ctx.doc.setFontSize(12);
                ctx.doc.text(`Resultados de Letalidade (F0)`, MARGINS.left, ctx.y);
                ctx.y += 6;
                const f0SummaryText = `F0 Mínimo Atingido: ${test.summary.f0.toFixed(2)} min. | Status: ${test.summary.status}`;
                addText(ctx, f0SummaryText, 5);

                const f0Head = [['Sensor', 'Valor F0 (min)']];
                const f0Body = test.f0Results.map(r => [`Sensor ${r.sensor.substring(1)}`, r.f0.toFixed(2)]);
                addTable(ctx, f0Head, f0Body);
            }

            await addChart(ctx, `chart-test-${i}`);

            ctx.doc.setFontSize(12);
            ctx.doc.text(`9.${i+1}.4 Anexos`, MARGINS.left, ctx.y);
            ctx.y += 6;

            const columns = test.rawData.length > 0 ? Object.keys(test.rawData[0]).filter(key => key !== 'timestamp') : [];
            const head = [columns];
            const body = test.rawData.map(row => columns.map(col => String(row[col])));
            addTable(ctx, head, body);
        }

        addSectionTitle(ctx, '10. CONCLUSÃO');
        addText(ctx, state.textBlocks.conclusion);

        addSectionTitle(ctx, '11. RESPONSÁVEIS TÉCNICOS');
        ctx.y += 20; // Space for signatures
        const signatureY = ctx.y;
        const lineLength = 80;
        const xCenter = PAGE_WIDTH / 2;
        
        ctx.doc.line(xCenter - lineLength/2, signatureY, xCenter + lineLength/2, signatureY);
        ctx.doc.text(state.config.technicalManager, xCenter, signatureY + 5, { align: 'center' });
        ctx.doc.text('Responsável técnico', xCenter, signatureY + 10, { align: 'center' });

        ctx.y = signatureY + 30;
        ctx.doc.line(xCenter - lineLength/2, ctx.y, xCenter + lineLength/2, ctx.y);
        ctx.doc.text(state.config.executingTechnician, xCenter, ctx.y + 5, { align: 'center' });
        ctx.doc.text('Técnico executor', xCenter, ctx.y + 10, { align: 'center' });
        
        ctx.y += 30;
        ctx.doc.line(xCenter - lineLength/2, ctx.y, xCenter + lineLength/2, ctx.y);
        ctx.doc.text(state.config.reportReviewer, xCenter, ctx.y + 5, { align: 'center' });
        ctx.doc.text('Revisão relatório', xCenter, ctx.y + 10, { align: 'center' });
    };

    await generateAllPages();
    addTableOfContents(ctx.doc, tocPageNumber, ctx.tocEntries);
    addHeaderFooter(ctx.doc, state.config);
    
    let finalPdfBytes = await ctx.doc.output('arraybuffer');
    let finalPdfDoc = await PDFDocument.load(finalPdfBytes);

    if (state.watermarkImage) {
        try {
            const watermarkImageBytes = await fetch(state.watermarkImage).then(res => res.arrayBuffer());
            const watermarkImage = await finalPdfDoc.embedPng(watermarkImageBytes);
            const watermarkDims = watermarkImage.scale(0.5);
            for (const page of finalPdfDoc.getPages()) {
                 page.drawImage(watermarkImage, {
                    x: page.getWidth() / 2 - watermarkDims.width / 2,
                    y: page.getHeight() / 2 - watermarkDims.height / 2,
                    width: watermarkDims.width,
                    height: watermarkDims.height,
                    opacity: 0.1,
                });
            }
        } catch(e) { console.error("Could not apply watermark", e); }
    }
    
    if (state.calibrationCertificate) {
        try {
            const anexoCoverPdf = await PDFDocument.create();
            const page = anexoCoverPdf.addPage();
            page.drawText('Anexo A - Certificado de Calibração', { x: 50, y: page.getHeight() / 2, size: 24 });
            
            const certBytes = await state.calibrationCertificate.arrayBuffer();
            const certPdfDoc = await PDFDocument.load(certBytes);

            const mergedPdfDoc = await PDFDocument.create();

            const mainPages = await mergedPdfDoc.copyPages(finalPdfDoc, finalPdfDoc.getPageIndices());
            for (const page of mainPages) { mergedPdfDoc.addPage(page); }

            const [anexoCoverPage] = await mergedPdfDoc.copyPages(anexoCoverPdf, [0]);
            mergedPdfDoc.addPage(anexoCoverPage);
            
            const certPages = await mergedPdfDoc.copyPages(certPdfDoc, certPdfDoc.getPageIndices());
            for (const page of certPages) { mergedPdfDoc.addPage(page); }
            
            finalPdfDoc = mergedPdfDoc;
        } catch (e) {
            console.error("Failed to merge PDF certificate:", e);
            alert("Falha ao anexar o certificado de calibração. O relatório será gerado sem ele.");
        }
    }

    finalPdfBytes = await finalPdfDoc.save();
    downloadPdf(finalPdfBytes as Uint8Array, 'Relatorio_Qualificacao_Termica.pdf');
};


const downloadPdf = (pdfBytes: Uint8Array, filename: string) => {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};