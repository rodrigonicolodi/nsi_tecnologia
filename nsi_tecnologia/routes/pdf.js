// Rotas para exportação de PDF
const express = require('express');
const puppeteer = require('puppeteer');
const router = express.Router();

// Middleware de verificação de login
function verificarLogin(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.redirect('/login');
}

// Aplicar middleware de autenticação a todas as rotas
router.use(verificarLogin);

// Função para gerar HTML do relatório financeiro
function gerarHTMLFinanceiro(inicio, fim, status) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório Financeiro</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f4f7f6; 
            color: #333; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background-color: #fff; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #007bff; 
            padding-bottom: 20px; 
        }
        .header h1 { 
            color: #007bff; 
            margin: 0; 
            font-size: 2.2em; 
        }
        .header h2 { 
            color: #555; 
            margin: 5px 0 15px; 
            font-size: 1.6em; 
        }
        .header p { 
            color: #777; 
            font-size: 0.9em; 
        }
        .info { 
            background: #e9f5ff; 
            border-left: 5px solid #007bff; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 5px; 
        }
        .info h3 { 
            color: #007bff; 
            margin-top: 0; 
            font-size: 1.4em; 
        }
        .info p { 
            margin: 8px 0; 
            line-height: 1.5; 
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            color: #888; 
            font-size: 0.8em; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NSI Tecnologia</h1>
            <h2>Relatório Financeiro</h2>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="info">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Período:</strong> ${inicio || 'Não informado'} até ${fim || 'Não informado'}</p>
            <p><strong>Status:</strong> ${status || 'Todos'}</p>
        </div>
        
        <div class="info">
            <h3>Resumo Financeiro:</h3>
            <p><strong>Total a Receber:</strong> R$ 0,00</p>
            <p><strong>Total a Pagar:</strong> R$ 0,00</p>
            <p><strong>Total Pago:</strong> R$ 0,00</p>
            <p><strong>Total Pendente:</strong> R$ 0,00</p>
        </div>
        
        <div class="footer">
            <p>NSI Tecnologia - Todos os direitos reservados.</p>
            <p>Contato: (XX) XXXX-XXXX | email@nsitecnologia.com.br</p>
        </div>
    </div>
</body>
</html>`;
}

// Função para gerar HTML do relatório de serviços e produtos
function gerarHTMLServicosProdutos(mes, ano, resultados, detalhes) {
  const nomeMes = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ][mes] || 'Mês';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Serviços e Produtos</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f4f7f6; 
            color: #333; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background-color: #fff; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #007bff; 
            padding-bottom: 20px; 
        }
        .header h1 { 
            color: #007bff; 
            margin: 0; 
            font-size: 2.2em; 
        }
        .header h2 { 
            color: #555; 
            margin: 5px 0 15px; 
            font-size: 1.6em; 
        }
        .header p { 
            color: #777; 
            font-size: 0.9em; 
        }
        .info { 
            background: #e9f5ff; 
            border-left: 5px solid #007bff; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 5px; 
        }
        .info h3 { 
            color: #007bff; 
            margin-top: 0; 
            font-size: 1.4em; 
        }
        .info p { 
            margin: 8px 0; 
            line-height: 1.5; 
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .info-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .info-item label {
            font-weight: 600;
            color: #666;
            font-size: 0.9em;
        }
        .info-item span {
            font-size: 1.1em;
        }
        .valor-destaque {
            font-weight: bold;
            color: #0077cc;
            font-size: 1.2em !important;
        }
        .valor-verde {
            font-weight: bold;
            color: #28a745;
        }
        .valor-azul {
            font-weight: bold;
            color: #0077cc;
        }
        .valor-vermelho {
            font-weight: bold;
            color: #dc3545;
        }
        .valor-principal {
            font-weight: bold;
            color: #2e7d32;
            font-size: 1.2em !important;
        }
        .table-wrapper { 
            overflow-x: auto; 
            margin-bottom: 30px; 
        }
        .data-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
        }
        .data-table th, .data-table td { 
            border: 1px solid #ddd; 
            padding: 12px 15px; 
            text-align: left; 
        }
        .data-table th { 
            background-color: #007bff; 
            color: #fff; 
            font-weight: 600; 
            text-transform: uppercase; 
            font-size: 0.9em; 
        }
        .data-table tr:nth-child(even) { 
            background-color: #f8f8f8; 
        }
        .data-table tr:hover { 
            background-color: #f1f1f1; 
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            color: #888; 
            font-size: 0.8em; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NSI Tecnologia</h1>
            <h2>Relatório de Serviços e Produtos por Mês</h2>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="info">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Mês:</strong> ${nomeMes}</p>
            <p><strong>Ano:</strong> ${ano}</p>
        </div>
        
        ${resultados && Object.keys(resultados).length > 0 ? `
        <div class="info">
            <h3>Resumo do Mês</h3>
            <div class="info-grid">
                <div class="info-item">
                    <label>Total de OS:</label>
                    <span class="valor-destaque">${resultados.total_os || 0}</span>
                </div>
                <div class="info-item">
                    <label>Total Serviços:</label>
                    <span class="valor-verde">R$ ${parseFloat(resultados.total_servicos || 0).toFixed(2)}</span>
                </div>
                <div class="info-item">
                    <label>Total Produtos:</label>
                    <span class="valor-azul">R$ ${parseFloat(resultados.total_produtos || 0).toFixed(2)}</span>
                </div>
                <div class="info-item">
                    <label>Total Descontos:</label>
                    <span class="valor-vermelho">R$ ${parseFloat(resultados.total_descontos || 0).toFixed(2)}</span>
                </div>
                <div class="info-item">
                    <label>Total Geral:</label>
                    <span class="valor-principal">R$ ${parseFloat(resultados.total_geral || 0).toFixed(2)}</span>
                </div>
                <div class="info-item">
                    <label>Ticket Médio:</label>
                    <span class="valor-destaque">R$ ${parseFloat(resultados.ticket_medio || 0).toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        ${detalhes && detalhes.length > 0 ? `
        <div class="table-wrapper">
            <h3>Detalhes por Ordem de Serviço</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>OS</th>
                        <th>Cliente</th>
                        <th>Tipo de Serviço</th>
                        <th>Valor Serviço</th>
                        <th>Valor Produtos</th>
                        <th>Desconto</th>
                        <th>Total</th>
                        <th>Data Fechamento</th>
                    </tr>
                </thead>
                <tbody>
                    ${detalhes.map(os => `
                        <tr>
                            <td>${os.numero_os}</td>
                            <td>${os.cliente_nome}</td>
                            <td>${os.tipo_servico}</td>
                            <td class="valor-verde">R$ ${parseFloat(os.valor_servico).toFixed(2)}</td>
                            <td class="valor-azul">R$ ${parseFloat(os.valor_produtos).toFixed(2)}</td>
                            <td class="valor-vermelho">R$ ${parseFloat(os.desconto).toFixed(2)}</td>
                            <td class="valor-principal">R$ ${parseFloat(os.valor_total).toFixed(2)}</td>
                            <td>${new Date(os.data_fechamento).toLocaleDateString('pt-BR')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
        ` : `
        <div class="info">
            <h3>Nenhum dado encontrado</h3>
            <p>Não foram encontrados dados para o período selecionado.</p>
        </div>
        `}
        
        <div class="footer">
            <p>NSI Tecnologia - Todos os direitos reservados.</p>
            <p>Contato: (XX) XXXX-XXXX | email@nsitecnologia.com.br</p>
        </div>
    </div>
</body>
</html>`;
}

// Função para gerar HTML do relatório de OS
function gerarHTMLOS(inicio, fim, status, busca, prioridade) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de OS</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f4f7f6; 
            color: #333; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background-color: #fff; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #007bff; 
            padding-bottom: 20px; 
        }
        .header h1 { 
            color: #007bff; 
            margin: 0; 
            font-size: 2.2em; 
        }
        .header h2 { 
            color: #555; 
            margin: 5px 0 15px; 
            font-size: 1.6em; 
        }
        .header p { 
            color: #777; 
            font-size: 0.9em; 
        }
        .info { 
            background: #e9f5ff; 
            border-left: 5px solid #007bff; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 5px; 
        }
        .info h3 { 
            color: #007bff; 
            margin-top: 0; 
            font-size: 1.4em; 
        }
        .info p { 
            margin: 8px 0; 
            line-height: 1.5; 
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            color: #888; 
            font-size: 0.8em; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NSI Tecnologia</h1>
            <h2>Relatório de Ordens de Serviço</h2>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="info">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Período:</strong> ${inicio || 'Não informado'} até ${fim || 'Não informado'}</p>
            <p><strong>Status:</strong> ${status || 'Todos'}</p>
            <p><strong>Busca:</strong> ${busca || 'Nenhuma'}</p>
            <p><strong>Prioridade:</strong> ${prioridade || 'Todas'}</p>
        </div>
        
        <div class="info">
            <h3>Resumo de OS:</h3>
            <p><strong>Abertas:</strong> 0 OS (R$ 0,00)</p>
            <p><strong>Concluídas:</strong> 0 OS (R$ 0,00)</p>
            <p><strong>Canceladas:</strong> 0 OS (R$ 0,00)</p>
        </div>
        
        <div class="footer">
            <p>NSI Tecnologia - Todos os direitos reservados.</p>
            <p>Contato: (XX) XXXX-XXXX | email@nsitecnologia.com.br</p>
        </div>
    </div>
</body>
</html>`;
}

// Exportar relatório financeiro para PDF
router.get('/financeiro', async (req, res) => {
  try {
    console.log('📄 Exportando relatório financeiro...');
    console.log('Parâmetros:', req.query);
    
    const { inicio, fim, status } = req.query;
    
    // Gerar HTML
    const html = gerarHTMLFinanceiro(inicio, fim, status);
    
    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Gerar PDF
    console.log('🔄 Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    console.log('✅ PDF gerado, tamanho:', pdf.length, 'bytes');
    
    await browser.close();
    
    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_financeiro.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(pdf);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF financeiro:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao gerar PDF', 
      details: error.message 
    });
  }
});

// Exportar relatório de OS para PDF
router.get('/os', async (req, res) => {
  try {
    console.log('📄 Exportando relatório de OS...');
    console.log('Parâmetros:', req.query);
    
    const { inicio, fim, status, busca, prioridade } = req.query;
    
    // Gerar HTML
    const html = gerarHTMLOS(inicio, fim, status, busca, prioridade);
    
    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Gerar PDF
    console.log('🔄 Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    console.log('✅ PDF gerado, tamanho:', pdf.length, 'bytes');
    
    await browser.close();
    
    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_os.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(pdf);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF de OS:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao gerar PDF', 
      details: error.message 
    });
  }
});

// Exportar relatório de serviços e produtos para PDF
router.get('/servicos-produtos', async (req, res) => {
  try {
    console.log('📄 Exportando relatório de serviços e produtos...');
    console.log('Parâmetros:', req.query);
    
    const { mes, ano } = req.query;
    const mesAtual = mes || new Date().getMonth() + 1;
    const anoAtual = ano || new Date().getFullYear();

    // Buscar dados do relatório
    const db = require('../db');
    
    const [resultados] = await db.query(`
        SELECT 
            DATE_FORMAT(data_fechamento, '%Y-%m') as mes_ano,
            COUNT(*) as total_os,
            SUM(valor_servico) as total_servicos,
            SUM(acrescimos) as total_produtos,
            SUM(desconto) as total_descontos,
            SUM(valor_total) as total_geral,
            AVG(valor_total) as ticket_medio
        FROM ordens_servico 
        WHERE status = 'concluida' 
        AND MONTH(data_fechamento) = ? 
        AND YEAR(data_fechamento) = ?
        GROUP BY DATE_FORMAT(data_fechamento, '%Y-%m')
    `, [mesAtual, anoAtual]);

    // Buscar dados detalhados por OS
    const [detalhes] = await db.query(`
        SELECT 
            o.numero_os,
            o.tipo_servico,
            o.valor_servico,
            o.acrescimos as valor_produtos,
            o.desconto,
            o.valor_total,
            o.data_fechamento,
            p.nome as cliente_nome
        FROM ordens_servico o
        LEFT JOIN pessoas p ON o.solicitante_id = p.id
        WHERE o.status = 'concluida' 
        AND MONTH(o.data_fechamento) = ? 
        AND YEAR(o.data_fechamento) = ?
        ORDER BY o.data_fechamento DESC
    `, [mesAtual, anoAtual]);
    
    // Verificar se há dados
    console.log('📊 Resultados encontrados:', resultados.length);
    console.log('📊 Detalhes encontrados:', detalhes.length);
    
    // Gerar HTML
    const html = gerarHTMLServicosProdutos(mesAtual, anoAtual, resultados[0] || {}, detalhes);
    console.log('📄 HTML gerado, tamanho:', html.length, 'caracteres');
    
    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Gerar PDF
    console.log('🔄 Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    console.log('✅ PDF gerado, tamanho:', pdf.length, 'bytes');
    
    await browser.close();
    
    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_servicos_produtos.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(pdf);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF de serviços e produtos:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao gerar PDF', 
      details: error.message 
    });
  }
});

module.exports = router;
