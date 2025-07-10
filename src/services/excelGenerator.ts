import type { AppState, TestResult } from '../types';

declare const XLSX: any;

export const generateExcel = async (state: AppState) => {
  const wb = XLSX.utils.book_new();
  const { config, tests } = state;
  
  // 1. Create Summary Sheet
  const summaryData = [
    { Categoria: 'Informações do Cliente', Detalhe: ''},
    { Categoria: 'Nome', Detalhe: config.clientName },
    { Categoria: 'CNPJ', Detalhe: config.cnpj },
    { Categoria: 'Endereço', Detalhe: config.address },
    { Categoria: '', Detalhe: ''}, // Spacer
    { Categoria: 'Informações do Equipamento', Detalhe: ''},
    { Categoria: 'Tipo', Detalhe: config.equipmentType },
    { Categoria: 'Descrição', Detalhe: config.equipmentDescription },
    { Categoria: 'Fabricante', Detalhe: config.manufacturer },
    { Categoria: 'Modelo', Detalhe: config.model },
    { Categoria: 'Nº de Série', Detalhe: config.serialNumber },
    { Categoria: 'Identificação/Patrimônio', Detalhe: config.assetNumber },
    { Categoria: 'Temp. Alvo', Detalhe: config.targetTemperature },
    { Categoria: '', Detalhe: ''}, // Spacer
    { Categoria: 'Detalhes do Relatório', Detalhe: ''},
    { Categoria: 'Tipo de Qualificação', Detalhe: config.qualificationPhase },
    { Categoria: 'Tipo de Cadeia', Detalhe: config.chainType },
    { Categoria: 'Responsável Técnico', Detalhe: config.technicalManager },
    { Categoria: 'Executor do Ensaio', Detalhe: config.executingTechnician },
    { Categoria: 'Revisor', Detalhe: config.reportReviewer },
    { Categoria: 'Data do Relatório', Detalhe: config.reportDate },
  ];

  const summaryWs = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });
  summaryWs['!cols'] = [{ wch: 30 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo do Relatório');

  // 2. Create a sheet for each test
  tests.forEach(test => {
    if (test.rawData.length === 0 || test.rawData[0].Data === 'dd/mm/aaaa') return;

    const ws = XLSX.utils.json_to_sheet(test.rawData, {});

    // Add summary stats to the same sheet
    const statsHeader = [['Resumo do Ensaio', '']];
    const statsBody = [
        ['Status Geral', test.summary.status],
        ['Temperatura Mínima Geral (°C)', test.summary.min.toFixed(2)],
        ['Temperatura Máxima Geral (°C)', test.summary.max.toFixed(2)],
        ['Temperatura Média da Câmara (°C)', test.summary.chamber.toFixed(2)],
        // Add uniformity and stability if they exist
    ];
    
    if(state.qualificationType === 'autoclave' && test.summary.f0 !== undefined) {
        statsBody.push(['Letalidade F0 Mínima (min)', test.summary.f0.toFixed(2)]);
        if(test.f0Results) {
            statsBody.push(['', '']); // spacer
            statsBody.push(['F0 por Sensor', 'Valor (min)']);
            test.f0Results.forEach(res => {
                statsBody.push([`Sensor ${res.sensor.substring(1)}`, res.f0.toFixed(2)]);
            });
        }
    }

    XLSX.utils.sheet_add_aoa(ws, [[' ']], {origin: -1}); // Add a blank row for spacing
    XLSX.utils.sheet_add_aoa(ws, statsHeader, {origin: -1});
    XLSX.utils.sheet_add_aoa(ws, statsBody, {origin: -1});
    
    // Auto-fit columns
    const cols = Object.keys(test.rawData[0] || {}).map(key => ({wch: Math.max(15, key.length + 2)}));
    ws['!cols'] = cols;
    
    const sheetName = test.name.replace(/[\/\\?*\[\]]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  
  // 3. Save the workbook
  const fileName = `Dados_ThermoCert_${config.clientName.replace(/\s/g, '_') || 'Relatorio'}.xlsx`;
  XLSX.writeFile(wb, fileName);
};