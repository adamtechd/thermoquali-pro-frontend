
import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, PageBreak, VerticalAlign,BorderStyle, TabStopType, TabStopPosition, LeaderType } from 'docx';
import html2canvas from 'html2canvas';
import type { AppState } from '../types';

const A4_WIDTH_TWIPS = 11906;
const A4_HEIGHT_TWIPS = 16838;
const MARGIN_TWIPS = 1440; // 1 inch
const CONTENT_WIDTH_TWIPS = A4_WIDTH_TWIPS - MARGIN_TWIPS * 2;

const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const getImageBuffer = async (imageDataUrl: string | null): Promise<ArrayBuffer | null> => {
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) return null;
    const res = await fetch(imageDataUrl);
    return res.arrayBuffer();
};

const getChartImageBuffer = async (chartId: string): Promise<ArrayBuffer | null> => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return null;
    const canvas = await html2canvas(chartElement, { scale: 3, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png', 1.0);
    return getImageBuffer(imgData);
};

export const generateWord = async (state: AppState): Promise<void> => {
    const children: (Paragraph | Table)[] = [];

    // --- Cover Page ---
    if (state.companyLogo) {
        const logoBuffer = await getImageBuffer(state.companyLogo);
        if (logoBuffer) {
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 200, height: 100 }
                })]
            }));
        }
    }
    children.push(new Paragraph({ text: "", spacing: { before: 3000 } }));
    children.push(new Paragraph({
        text: "RELATÓRIO DE QUALIFICAÇÃO DE DESEMPENHO",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
    }));
    children.push(new Paragraph({ text: "", spacing: { before: 6000 } }));
    children.push(new Paragraph({ text: state.config.city, alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ text: state.config.reportDate, alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
    
    // --- Table of Contents ---
    children.push(new Paragraph({ text: "SUMÁRIO", heading: HeadingLevel.HEADING_1 }));
    
    const tocEntries = [
      { text: "1. IDENTIFICAÇÃO DO EQUIPAMENTO", level: 1 },
      { text: "2. INTRODUÇÃO", level: 1 },
      { text: "3. OBJETIVOS", level: 1 },
      { text: "4. RESPONSABILIDADES", level: 1 },
      { text: "5. DEFINIÇÃO DOS TERMOS", level: 1 },
      { text: "6. CONFIGURAÇÃO DOS CICLOS", level: 1 },
      { text: "7. INSTRUMENTAÇÃO", level: 1 },
      { text: "8. RELAÇÃO DOS ENSAIOS REALIZADOS", level: 1 },
      { text: "9. ENSAIOS", level: 1 },
      ...state.tests.map((test, i) => ({ text: `9.${i + 1} ${test.name}`, level: 2 })),
      { text: "10. CONCLUSÃO", level: 1 },
      { text: "11. RESPONSÁVEIS TÉCNICOS", level: 1 },
    ];

    tocEntries.forEach(entry => {
        children.push(new Paragraph({
            children: [new TextRun(entry.text)],
            indent: { left: (entry.level - 1) * 400 },
            style: "Normal",
            tabStops: [
                {
                    type: TabStopType.RIGHT,
                    position: TabStopPosition.MAX,
                    leader: LeaderType.DOT,
                },
            ],
        }));
    });

    children.push(new Paragraph({ text: "\n(O sumário acima é uma representação estática. Para gerar um sumário automático com números de página, utilize a função 'Referências > Sumário' do Microsoft Word, que usará os títulos do documento.)", style: "Normal", run: { italics: true, size: 18 } }));
    children.push(new Paragraph({ children: [new PageBreak()] }));


    // --- Sections ---
    const addSectionTitle = (text: string) => children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
    const addSubSectionTitle = (text: string) => children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }));
    const addBodyText = (text: string) => {
        text.split('\n').forEach(line => children.push(new Paragraph({ text: line, style: "Normal", spacing: { after: 120 } })));
    };
    
    addSectionTitle('1. IDENTIFICAÇÃO DO EQUIPAMENTO');
    const idTableRows = Object.entries({
        'Cliente': state.config.clientName, 'Endereço': state.config.address, 'CNPJ': state.config.cnpj,
        'Descrição': state.config.equipmentDescription, 'Fabricante': state.config.manufacturer,
        'Modelo': state.config.model, 'N° de Série': state.config.serialNumber, 'Patrimônio': state.config.assetNumber,
    }).map(([label, value]) => new TableRow({
        children: [
            new TableCell({ children: [new Paragraph({ text: label, style: "Normal" })], width: { size: 20, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: value, style: "Normal" })], width: { size: 80, type: WidthType.PERCENTAGE } })
        ]
    }));
    children.push(new Table({ rows: idTableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

    addSectionTitle('2. INTRODUÇÃO');
    addBodyText(state.textBlocks.introduction);

    addSectionTitle('3. OBJETIVOS');
    addBodyText(state.textBlocks.objectives);

    addSectionTitle('4. RESPONSABILIDADES');
    addBodyText(state.textBlocks.responsibilities);

    addSectionTitle('5. DEFINIÇÃO DOS TERMOS');
    addBodyText(state.textBlocks.termDefinitions);

    addSectionTitle('6. CONFIGURAÇÃO DOS CICLOS');
    addBodyText(state.textBlocks.cycleConfig);

    addSectionTitle('7. INSTRUMENTAÇÃO');
    addBodyText(state.textBlocks.instrumentation);

    addSectionTitle('8. RELAÇÃO DOS ENSAIOS REALIZADOS');
    addBodyText(state.tests.map(t => `• ${t.name}`).join('\n'));
    
    addSectionTitle('9. ENSAIOS');
    for (let i = 0; i < state.tests.length; i++) {
        const test = state.tests[i];
        
        addSubSectionTitle(`9.${i + 1} ${test.name}`);
        addBodyText(`9.${i+1}.1 Descrição do ensaio\n${test.description}`);
        addBodyText(`9.${i+1}.2 Ciclos ensaiados\n${test.cycleInfo}`);

        if (i === 0) {
            addBodyText('Posicionamento dos sensores\nA distribuição das cargas e dos sensores no equipamento está explicitada nos esquemáticos e fotos abaixo.');
            const techDrawingBuffer = await getImageBuffer(state.technicalDrawingImage);
            const equipmentImgBuffer = await getImageBuffer(state.equipmentImage);
            if (techDrawingBuffer || equipmentImgBuffer) {
                 const imageCells = [];
                 if (techDrawingBuffer) imageCells.push(new TableCell({ children: [new Paragraph({ children: [new ImageRun({ data: techDrawingBuffer, transformation: { width: 250, height: 180 } })] })]}));
                 if (equipmentImgBuffer) imageCells.push(new TableCell({ children: [new Paragraph({ children: [new ImageRun({ data: equipmentImgBuffer, transformation: { width: 250, height: 180 } })] })]}));
                 
                 children.push(new Table({
                     rows: [new TableRow({ children: imageCells })],
                     width: { size: 100, type: WidthType.PERCENTAGE },
                     borders: { inside: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, outside: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }}
                 }));
            }
        }

        addBodyText(`Critério de aceitação\n${test.acceptanceCriteria}`);
        addBodyText(`9.${i+1}.3 Resultados\n${test.results}`);
        
        if (state.qualificationType === 'autoclave' && test.summary.f0 !== undefined && test.f0Results && test.f0Results.length > 0) {
            addBodyText(`Resultados de Letalidade (F0)`);
            addBodyText(`F0 Mínimo Atingido: ${test.summary.f0.toFixed(2)} min. | Status: ${test.summary.status}`);
            
            const f0Header = new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: 'Sensor', style: "Normal" })], verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ text: 'Valor F0 (min)', style: "Normal" })], verticalAlign: VerticalAlign.CENTER })
                ],
                tableHeader: true,
            });
            const f0DataRows = test.f0Results.map(res => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(`Sensor ${res.sensor.substring(1)}`)] }),
                    new TableCell({ children: [new Paragraph(res.f0.toFixed(2))] })
                ]
            }));
            children.push(new Table({ rows: [f0Header, ...f0DataRows], width: { size: 100, type: WidthType.PERCENTAGE } }));
        }

        const chartBuffer = await getChartImageBuffer(`chart-test-${i}`);
        if(chartBuffer) {
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new ImageRun({ data: chartBuffer, transformation: { width: 500, height: 250 } })]
            }));
        }

        addBodyText(`9.${i+1}.4 Anexos`);
        if (test.rawData.length > 0) {
            const columns = Object.keys(test.rawData[0]).filter(key => key !== 'timestamp');
            const header = new TableRow({
                children: columns.map(key => new TableCell({ children: [new Paragraph({ text: key, style: "Normal" })], verticalAlign: VerticalAlign.CENTER })),
                tableHeader: true,
            });
            const dataRows = test.rawData.map(row => new TableRow({
                children: columns.map(col => new TableCell({ children: [new Paragraph(String(row[col]))] }))
            }));
            children.push(new Table({ rows: [header, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }));
        }
    }
    
    addSectionTitle('10. CONCLUSÃO');
    addBodyText(state.textBlocks.conclusion);

    addSectionTitle('11. RESPONSÁVEIS TÉCNICOS');
    children.push(new Paragraph({ text: "", spacing: { before: 800 } }));
    const addSignatureLine = (name: string, role: string) => {
        children.push(new Paragraph({ text: "________________________________________", alignment: AlignmentType.CENTER }));
        children.push(new Paragraph({ text: name, alignment: AlignmentType.CENTER }));
        children.push(new Paragraph({ text: role, alignment: AlignmentType.CENTER, spacing: { after: 400 } }));
    };
    addSignatureLine(state.config.technicalManager, 'Responsável técnico');
    addSignatureLine(state.config.executingTechnician, 'Técnico executor');
    addSignatureLine(state.config.reportReviewer, 'Revisão relatório');


    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: "Normal", name: "Normal", run: { font: "Times New Roman", size: 24 } }, // 12pt
                { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { bold: true, size: 28 }, paragraph: { spacing: { before: 240, after: 120 } } },
                { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { bold: true, size: 24 }, paragraph: { spacing: { before: 200, after: 100 } } },
                { id: "Title", name: "Title", basedOn: "Normal", run: { bold: true, size: 40 }, paragraph: { alignment: AlignmentType.CENTER } },
            ]
        },
        sections: [{
            properties: {
                page: {
                    margin: { top: MARGIN_TWIPS, right: MARGIN_TWIPS, bottom: MARGIN_TWIPS, left: MARGIN_TWIPS },
                    size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
                },
            },
            children: children,
        }]
    });

    const blob = await Packer.toBlob(doc);
    downloadFile(blob, 'Relatorio_Qualificacao_Termica.docx');
};
