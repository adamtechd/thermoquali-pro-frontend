
import { ReportData, QualificationType, Test } from '../types';

// The 'docx' library is loaded via a script tag in index.html and attached to the window object.
// We access it through window.docx.

export const generateDocx = async (reportData: ReportData) => {
  const docx = (window as any).docx;
  if (!docx) {
    console.error("docx library not found on window object. Make sure it's loaded correctly in index.html.");
    alert("Erro ao gerar documento Word: a biblioteca DOCX não foi carregada.");
    return;
  }

  const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableCell, TableRow, WidthType, ImageRun } = docx;

  const sections: any[] = [];
  
  // Title
  sections.push(new Paragraph({
      text: "Relatório de Qualificação Térmica",
      heading: HeadingLevel.TITLE,
      alignment: 'center'
  }));
  
  const addTextSection = (title: string, content: string | undefined, level: any) => {
    if(!content) return;
    sections.push(new Paragraph({ text: title, heading: level }));
    content.split('\n').forEach(line => {
        sections.push(new Paragraph(line));
    });
    sections.push(new Paragraph("")); // spacing
  };

  addTextSection("1. Introdução", reportData.sections.introduction, HeadingLevel.HEADING_1);
  addTextSection("2. Objetivos", reportData.sections.objectives, HeadingLevel.HEADING_1);
  addTextSection("3. Responsabilidades", reportData.sections.responsibilities, HeadingLevel.HEADING_1);
  addTextSection("4. Definições", reportData.sections.definitions, HeadingLevel.HEADING_1);
  addTextSection("5. Instrumentação", reportData.sections.instrumentation, HeadingLevel.HEADING_1);
  addTextSection("6. Metodologia", reportData.sections.methodology, HeadingLevel.HEADING_1);
  
  // Helper to convert image for docx
  const fetchImage = async (src: string) => {
      const response = await fetch(src);
      return response.arrayBuffer();
  }

  // Tests
  sections.push(new Paragraph({ text: "7. Resultados dos Ensaios", heading: HeadingLevel.HEADING_1 }));
  for (const test of reportData.tests) {
    sections.push(new Paragraph({ text: test.name, heading: HeadingLevel.HEADING_2 }));
    
    // Add Chart Image
    const chartElement = document.getElementById(test.chartId);
    if(chartElement) {
        // Using html2canvas which is loaded in index.html
        const canvas = await (window as any).html2canvas(chartElement);
        const dataUrl = canvas.toDataURL();
        const imageBuffer = await fetchImage(dataUrl);
        sections.push(new Paragraph({
            children: [
                new ImageRun({
                    data: imageBuffer,
                    transformation: {
                        width: 500,
                        height: 250,
                    },
                }),
            ],
        }));
    }

    // Add Stats Table
    const sensorIds = test.data.length > 0 && test.data[0].temperatures ? Object.keys(test.data[0].temperatures) : [];
    const tableRows = [
        new TableRow({
            children: [new TableCell({ children: [new Paragraph({ text: "Parâmetro", style: "strong" })] }), new TableCell({ children: [new Paragraph({ text: "Valor", style: "strong" })] })]
        }),
        new TableRow({
            children: [new TableCell({ children: [new Paragraph("Status Geral")] }), new TableCell({ children: [new Paragraph(test.status)] })]
        }),
        new TableRow({
            children: [new TableCell({ children: [new Paragraph("Temperatura Média")] }), new TableCell({ children: [new Paragraph(`${test.stats.avgTemp?.toFixed(2) ?? 'N/A'} °C`)] })]
        }),
        new TableRow({
            children: [new TableCell({ children: [new Paragraph("Uniformidade Máx.")] }), new TableCell({ children: [new Paragraph(`${test.stats.uniformity?.toFixed(2) ?? 'N/A'} °C`)] })]
        })
    ];

    if(reportData.qualificationType === QualificationType.AUTOCLAVE) {
        tableRows.push(
            new TableRow({
                children: [new TableCell({ children: [new Paragraph("F₀ Mínimo")] }), new TableCell({ children: [new Paragraph(`${test.stats.minF0?.toFixed(2) ?? 'N/A'} min`)] })]
            })
        );
    }

    const table = new Table({
        rows: tableRows,
        width: {
            size: 9000,
            type: WidthType.DXA,
        },
    });
    sections.push(table);
    sections.push(new Paragraph("")); // Spacing
  }

  addTextSection("8. Conclusão", reportData.sections.conclusion, HeadingLevel.HEADING_1);
  
  // Create document
  const doc = new Document({
    sections: [{ children: sections }],
    styles: {
        paragraphStyles: [
            {
                id: "strong",
                name: "Strong",
                basedOn: "Normal",
                next: "Normal",
                run: {
                    bold: true,
                },
            },
        ],
    },
  });

  Packer.toBlob(doc).then(blob => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_ThermoCert_${reportData.client.name.replace(/\s/g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};
