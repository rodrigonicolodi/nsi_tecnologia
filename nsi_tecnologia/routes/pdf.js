// Rotas para exportação de PDF
const express = require('express');
const puppeteer = require('puppeteer');
const db = require('../db');
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
            <p>Contato: (54) 98128-3447 | nsi@nsitecnologia.com.br</p>
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
            <p>Contato: (54) 98128-3447 | nsi@nsitecnologia.com.br</p>
        </div>
    </div>
</body>
</html>`;
}

// Função para gerar HTML do relatório de OS com dados reais
function gerarHTMLOSComDados(inicio, fim, status, busca, prioridade, ordens, totais) {
  // Calcular totais gerais
  const totalGeral = ordens.length;
  const valorTotalGeral = ordens.reduce((sum, os) => sum + parseFloat(os.valor_total || 0), 0);
  const ticketMedioGeral = totalGeral > 0 ? valorTotalGeral / totalGeral : 0;
  
  // Calcular percentual por status
  const totaisComPercentual = totais.map(item => ({
    ...item,
    percentual: valorTotalGeral > 0 ? (parseFloat(item.valor_total || 0) / valorTotalGeral * 100) : 0
  }));
  
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
        .cards-resumo {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .card-header {
            font-weight: 600;
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        .card-value {
            font-size: 1.4em;
            font-weight: bold;
            color: #333;
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
            padding: 10px 12px; 
            text-align: left; 
        }
        .data-table th { 
            background-color: #007bff; 
            color: #fff; 
            font-weight: 600; 
            text-transform: uppercase; 
            font-size: 0.85em; 
        }
        .data-table tr:nth-child(even) { 
            background-color: #f8f8f8; 
        }
        .data-table tr:hover { 
            background-color: #f1f1f1; 
        }
        .valor { 
            font-weight: bold; 
            color: #28a745; 
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 500;
            text-transform: uppercase;
        }
        .status-concluida {
            background-color: #d4edda;
            color: #155724;
        }
        .status-aberta {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-cancelada {
            background-color: #f8d7da;
            color: #721c24;
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
            <h1>📋 Relatório de OS por Status e Período</h1>
            <h2>NSI Tecnologia</h2>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="info">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Período:</strong> ${inicio || 'Não informado'} até ${fim || 'Não informado'}</p>
            <p><strong>Status:</strong> ${status || 'Todos os status'}</p>
            <p><strong>Busca:</strong> ${busca || 'Nenhuma'}</p>
            <p><strong>Prioridade:</strong> ${prioridade || 'Todas'}</p>
        </div>

        <div class="cards-resumo">
            <div class="card">
                <div class="card-header">Total de OS</div>
                <div class="card-value">${totalGeral}</div>
            </div>
            <div class="card">
                <div class="card-header">Valor Total</div>
                <div class="card-value">R$ ${valorTotalGeral.toFixed(2)}</div>
            </div>
            <div class="card">
                <div class="card-header">Ticket Médio</div>
                <div class="card-value">R$ ${ticketMedioGeral.toFixed(2)}</div>
            </div>
        </div>
        
        ${totais.length > 0 ? `
        <div class="table-wrapper">
            <h3>Resumo por Status</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Quantidade</th>
                        <th>Valor Total</th>
                        <th>Ticket Médio</th>
                        <th>% do Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${totaisComPercentual.map(item => `
                    <tr>
                        <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
                        <td>${item.quantidade}</td>
                        <td class="valor">R$ ${parseFloat(item.valor_total || 0).toFixed(2)}</td>
                        <td>R$ ${parseFloat(item.ticket_medio || 0).toFixed(2)}</td>
                        <td>${parseFloat(item.percentual).toFixed(1)}%</td>
                    </tr>
                    `).join('')}
                    <tr style="font-weight: bold; background-color: #e9ecef;">
                        <td>TOTAL</td>
                        <td>${totalGeral}</td>
                        <td class="valor">R$ ${valorTotalGeral.toFixed(2)}</td>
                        <td>R$ ${ticketMedioGeral.toFixed(2)}</td>
                        <td>100%</td>
                    </tr>
                </tbody>
            </table>
        </div>
        ` : ''}
        
        ${ordens.length > 0 ? `
        <div class="table-wrapper">
            <h3>Detalhes das Ordens de Serviço (${ordens.length} encontradas)</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Número OS</th>
                        <th>Cliente</th>
                        <th>Tipo de Serviço</th>
                        <th>Prioridade</th>
                        <th>Status</th>
                        <th>Valor Total</th>
                        <th>Data Abertura</th>
                        <th>Data Fechamento</th>
                    </tr>
                </thead>
                <tbody>
                    ${ordens.map(os => `
                    <tr>
                        <td>${os.id}</td>
                        <td>${os.numero_os}</td>
                        <td>${os.cliente_nome || '-'}</td>
                        <td>${os.tipo_servico || '-'}</td>
                        <td>${os.prioridade || '-'}</td>
                        <td><span class="status-badge status-${os.status?.toLowerCase() || 'aberta'}">${os.status || 'ABERTA'}</span></td>
                        <td class="valor">R$ ${parseFloat(os.valor_total || 0).toFixed(2)}</td>
                        <td>${os.data_abertura ? new Date(os.data_abertura).toLocaleDateString('pt-BR') : '-'}</td>
                        <td>${os.data_fechamento ? new Date(os.data_fechamento).toLocaleDateString('pt-BR') : '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : '<div class="info"><h3>Nenhuma OS encontrada</h3><p>Não foram encontradas ordens de serviço com os filtros aplicados.</p></div>'}
        
        <div class="footer">
            <p>NSI Tecnologia - Todos os direitos reservados.</p>
            <p>Contato: (54) 98128-3447 | nsi@nsitecnologia.com.br</p>
        </div>
    </div>
</body>
</html>`;
}

// Função para gerar HTML do relatório de OS (versão antiga - mantida para compatibilidade)
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
            <p>Contato: (54) 98128-3447 | nsi@nsitecnologia.com.br</p>
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
    
    // Buscar dados financeiros
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (inicio) {
      whereClause += ' AND DATE(f.vencimento) >= ?';
      params.push(inicio);
    }
    
    if (fim) {
      whereClause += ' AND DATE(f.vencimento) <= ?';
      params.push(fim);
    }
    
    if (status) {
      whereClause += ' AND f.status = ?';
      params.push(status);
    }
    
    const [lancamentos] = await db.query(`
      SELECT f.*, p.nome as pessoa_nome
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      ${whereClause}
      ORDER BY f.vencimento DESC
    `, params);
    
    // Calcular totais
    const totalReceber = lancamentos
      .filter(l => l.tipo === 'receber')
      .reduce((sum, l) => sum + parseFloat(l.valor || 0), 0);
    
    const totalPagar = lancamentos
      .filter(l => l.tipo === 'pagar')
      .reduce((sum, l) => sum + parseFloat(l.valor || 0), 0);
    
    // Gerar HTML
    const html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Relatório Financeiro</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .tipo-receber { color: green; font-weight: bold; }
            .tipo-pagar { color: red; font-weight: bold; }
            .status-pago { color: green; }
            .status-pendente { color: orange; }
            .status-vencido { color: red; }
            .totais { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>💰 Relatório Financeiro</h1>
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div class="content">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Período:</strong> ${inicio || 'Data inicial'} até ${fim || 'Data final'}</p>
            <p><strong>Status:</strong> ${status || 'Todos os status'}</p>

            <h3>Lançamentos (${lancamentos.length} encontrados):</h3>
            ${lancamentos.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Data Vencimento</th>
                        <th>Cliente/Fornecedor</th>
                        <th>Descrição</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${lancamentos.map(lanc => `
                    <tr>
                        <td>${new Date(lanc.vencimento).toLocaleDateString('pt-BR')}</td>
                        <td>${lanc.pessoa_nome || 'N/A'}</td>
                        <td>${lanc.descricao || 'N/A'}</td>
                        <td class="tipo-${lanc.tipo || 'pagar'}">${lanc.tipo === 'receber' ? 'A Receber' : 'A Pagar'}</td>
                        <td>R$ ${parseFloat(lanc.valor || 0).toFixed(2)}</td>
                        <td class="status-${lanc.status || 'pendente'}">${lanc.status || 'Pendente'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="totais">
                <h3>Resumo Financeiro:</h3>
                <p><strong>Total a Receber:</strong> R$ ${totalReceber.toFixed(2)}</p>
                <p><strong>Total a Pagar:</strong> R$ ${totalPagar.toFixed(2)}</p>
                <p><strong>Saldo:</strong> R$ ${(totalReceber - totalPagar).toFixed(2)}</p>
            </div>
            ` : '<p>Nenhum lançamento encontrado com os filtros aplicados.</p>'}
        </div>
    </body>
    </html>`;
    
    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Gerar PDF
    console.log('🔄 Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true, // Modo paisagem para melhor visualização das colunas
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
    res.status(500).json({
      error: 'Erro interno do servidor ao gerar PDF',
      details: error.message
    });
  }
});

// Rota para PDF de lançamentos (filtros da listagem)
router.get('/lancamentos', async (req, res) => {
  try {
    console.log('📄 Exportando PDF de lançamentos...');
    console.log('Parâmetros:', req.query);
    
    const { busca = '', tipo = '', status = '', caixa_id = '', data_inicio = '', data_fim = '' } = req.query;
    
    let sql = `
      SELECT f.id, f.tipo, f.valor, f.vencimento, f.status, f.descricao,
             f.parcela_atual, f.total_parcelas, f.parcela_pai_id,
             p.nome AS pessoa_nome,
             c1.nome AS caixa_origem_nome,
             c2.nome AS caixa_quitacao_nome
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c1 ON f.caixa_id = c1.id
      LEFT JOIN caixas c2 ON f.caixa_quitacao_id = c2.id
      WHERE 1 = 1
    `;
    const params = [];

    if (busca) {
      sql += ' AND (f.descricao LIKE ? OR p.nome LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`);
    }

    if (tipo) {
      sql += ' AND f.tipo = ?';
      params.push(tipo);
    }

    if (status) {
      sql += ' AND f.status = ?';
      params.push(status);
    }

    if (caixa_id) {
      sql += ' AND f.caixa_id = ?';
      params.push(caixa_id);
    }
    if (data_inicio) {
      sql += ' AND DATE(f.vencimento) >= ?';
      params.push(data_inicio);
    }
    if (data_fim) {
      sql += ' AND DATE(f.vencimento) <= ?';
      params.push(data_fim);
    }

    sql += ' ORDER BY f.vencimento DESC';

    const [lancamentos] = await db.query(sql, params);

    // Buscar nome do caixa selecionado se houver
    let caixaNome = 'Todos os caixas';
    if (caixa_id) {
      const [caixas] = await db.query('SELECT nome FROM caixas WHERE id = ?', [caixa_id]);
      if (caixas.length > 0) {
        caixaNome = caixas[0].nome;
      }
    }

    // Calcular totais
    const totalReceber = lancamentos
      .filter(l => l.tipo === 'receber')
      .reduce((sum, l) => sum + parseFloat(l.valor || 0), 0);
    
    const totalPagar = lancamentos
      .filter(l => l.tipo === 'pagar')
      .reduce((sum, l) => sum + parseFloat(l.valor || 0), 0);

    // Gerar HTML
    const html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Relatório de Lançamentos Financeiros</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { padding: 20px; }
            .filtros { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .filtros p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.9em; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #007bff; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            .tipo-receber { color: green; font-weight: bold; }
            .tipo-pagar { color: red; font-weight: bold; }
            .status-pago { color: green; font-weight: bold; }
            .status-pendente { color: orange; font-weight: bold; }
            .status-cancelado { color: red; font-weight: bold; }
            .totais { margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 5px; }
            .totais h3 { margin-top: 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>💰 Relatório de Lançamentos Financeiros</h1>
            <p>NSI Tecnologia</p>
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        <div class="content">
            <div class="filtros">
                <h3>Filtros Aplicados:</h3>
                <p><strong>Busca:</strong> ${busca || 'Todos'}</p>
                <p><strong>Tipo:</strong> ${tipo === 'receber' ? 'A Receber' : tipo === 'pagar' ? 'A Pagar' : 'Todos os tipos'}</p>
                <p><strong>Status:</strong> ${status === 'pendente' ? 'Pendente' : status === 'pago' ? 'Pago' : status === 'cancelado' ? 'Cancelado' : 'Todos os status'}</p>
                <p><strong>Caixa:</strong> ${caixaNome}</p>
                <p><strong>Período:</strong> ${data_inicio || '-'} até ${data_fim || '-'}</p>
            </div>

            <h3>Lançamentos (${lancamentos.length} encontrados):</h3>
            ${lancamentos.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Pessoa</th>
                        <th>Caixa</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Parcelas</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${lancamentos.map(lanc => `
                    <tr>
                        <td class="tipo-${lanc.tipo || 'pagar'}">${lanc.tipo === 'receber' ? 'A Receber' : 'A Pagar'}</td>
                        <td>${lanc.pessoa_nome || '-'}</td>
                        <td>${lanc.caixa_origem_nome || '-'}</td>
                        <td>${lanc.descricao || '-'}</td>
                        <td>R$ ${parseFloat(lanc.valor || 0).toFixed(2)}</td>
                        <td>${lanc.total_parcelas > 1 ? `${lanc.parcela_atual}/${lanc.total_parcelas}` : 'À Vista'}</td>
                        <td>${lanc.vencimento ? new Date(lanc.vencimento).toLocaleDateString('pt-BR') : '-'}</td>
                        <td class="status-${lanc.status || 'pendente'}">${lanc.status === 'pago' ? 'Pago' : lanc.status === 'pendente' ? 'Pendente' : lanc.status === 'cancelado' ? 'Cancelado' : '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="totais">
                <h3>Resumo Financeiro:</h3>
                <p><strong>Total a Receber:</strong> R$ ${totalReceber.toFixed(2)}</p>
                <p><strong>Total a Pagar:</strong> R$ ${totalPagar.toFixed(2)}</p>
                <p><strong>Saldo:</strong> R$ ${(totalReceber - totalPagar).toFixed(2)}</p>
            </div>
            ` : '<p>Nenhum lançamento encontrado com os filtros aplicados.</p>'}
        </div>
    </body>
    </html>`;
    
    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Gerar PDF
    console.log('🔄 Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
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
    res.setHeader('Content-Disposition', 'attachment; filename="lancamentos_financeiros.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(pdf);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF de lançamentos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao gerar PDF',
      details: error.message
    });
  }
});

// Função auxiliar para gerar PDF de contas (receber ou pagar)
async function gerarPDFContas(tipo, req, res) {
  const { busca = '', status_vencimento = '', data_inicio = '', data_fim = '' } = req.query;

  let sql = `
    SELECT f.id, f.tipo, f.valor, f.vencimento, f.status, f.descricao,
           f.parcela_atual, f.total_parcelas, p.nome AS pessoa_nome,
           c1.nome AS caixa_origem_nome, c2.nome AS caixa_quitacao_nome
    FROM financeiro f
    LEFT JOIN pessoas p ON f.pessoa_id = p.id
    LEFT JOIN caixas c1 ON f.caixa_id = c1.id
    LEFT JOIN caixas c2 ON f.caixa_quitacao_id = c2.id
    WHERE f.tipo = ?
  `;
  const params = [tipo];

  if (busca) {
    sql += ' AND (f.descricao LIKE ? OR p.nome LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }
  if (status_vencimento && status_vencimento !== 'todas') {
    if (status_vencimento === 'vencidas') sql += ' AND f.vencimento < CURDATE() AND f.status = "pendente"';
    else if (status_vencimento === 'vencendo_hoje') sql += ' AND f.vencimento = CURDATE() AND f.status = "pendente"';
    else if (status_vencimento === 'vencendo_7_dias') sql += ' AND f.vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND f.status = "pendente"';
    else if (status_vencimento === 'pendentes') sql += ' AND f.status = "pendente"';
    else if (status_vencimento === 'quitadas') sql += ' AND f.status = "pago"';
  }
  if (data_inicio) { sql += ' AND DATE(f.vencimento) >= ?'; params.push(data_inicio); }
  if (data_fim) { sql += ' AND DATE(f.vencimento) <= ?'; params.push(data_fim); }
  sql += ' ORDER BY f.vencimento ASC';

  const [lancamentos] = await db.query(sql, params);
  const titulo = tipo === 'receber' ? 'Contas a Receber' : 'Contas a Pagar';
  const colunaPessoa = tipo === 'receber' ? 'Cliente' : 'Fornecedor';

  const totalPendente = lancamentos.filter(l => l.status === 'pendente').reduce((s, l) => s + parseFloat(l.valor || 0), 0);
  const totalQuitado = lancamentos.filter(l => l.status === 'pago').reduce((s, l) => s + parseFloat(l.valor || 0), 0);

  const html = `<!DOCTYPE html>
  <html lang="pt-BR">
  <head><meta charset="UTF-8"><title>${titulo}</title>
  <style>body{font-family:Arial,sans-serif;margin:20px;}.header{text-align:center;margin-bottom:30px;}
  table{width:100%;border-collapse:collapse;margin-top:20px;font-size:0.9em;}
  th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#007bff;color:white;}
  tr:nth-child(even){background-color:#f8f9fa;}.valor-pagar{color:#dc3545;}.valor-receber{color:#28a745;}
  .totais{margin-top:20px;padding:15px;background:#e9ecef;border-radius:5px;}</style></head>
  <body>
  <div class="header"><h1>💸 ${titulo}</h1><p>NSI Tecnologia - ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p></div>
  <div class="filtros"><p><strong>Busca:</strong> ${busca || 'Todos'}</p><p><strong>Status:</strong> ${status_vencimento || 'Todos'}</p><p><strong>Período:</strong> ${data_inicio || '-'} até ${data_fim || '-'}</p></div>
  <table><thead><tr><th>${colunaPessoa}</th><th>Descrição</th><th>Valor</th><th>Parcelas</th><th>Vencimento</th><th>Status</th></tr></thead>
  <tbody>${lancamentos.map(l => `
  <tr><td>${l.pessoa_nome || '-'}</td><td>${l.descricao || '-'}</td>
  <td class="valor-${tipo}">R$ ${parseFloat(l.valor || 0).toFixed(2)}</td>
  <td>${l.total_parcelas > 1 ? `${l.parcela_atual}/${l.total_parcelas}` : 'À Vista'}</td>
  <td>${l.vencimento ? new Date(l.vencimento).toLocaleDateString('pt-BR') : '-'}</td>
  <td>${l.status || '-'}</td></tr>`).join('')}</tbody></table>
  <div class="totais"><p><strong>Total Pendente:</strong> R$ ${totalPendente.toFixed(2)}</p><p><strong>Total Quitado:</strong> R$ ${totalQuitado.toFixed(2)}</p></div>
  </body></html>`;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', landscape: true, printBackground: true, margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' } });
  await browser.close();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio_${tipo === 'receber' ? 'contas_receber' : 'contas_pagar'}.pdf"`);
  res.setHeader('Content-Length', pdf.length);
  res.setHeader('Cache-Control', 'no-cache');
  res.end(pdf);
}

router.get('/contas-receber', (req, res, next) => gerarPDFContas('receber', req, res).catch(next));
router.get('/contas-pagar', (req, res, next) => gerarPDFContas('pagar', req, res).catch(next));

// Rota para PDF de estoque
router.get('/estoque', async (req, res) => {
  try {
    console.log('📄 Exportando relatório de estoque...');
    console.log('Parâmetros:', req.query);
    
    const { busca, categoria, status } = req.query;

    // Buscar dados do estoque
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (busca) {
      whereClause += ' AND (nome LIKE ? OR descricao LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`);
    }

    if (categoria) {
      whereClause += ' AND categoria = ?';
      params.push(categoria);
    }

    if (status) {
      whereClause += ' AND f.status = ?';
      params.push(status);
    }

    const [produtos] = await db.query(`
      SELECT * FROM produtos
      ${whereClause}
      ORDER BY nome
    `, params);

    // Gerar HTML
    const html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Relatório de Estoque</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .status-ativo { color: green; font-weight: bold; }
            .status-inativo { color: red; font-weight: bold; }
            .status-baixo { color: orange; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📦 Relatório de Estoque</h1>
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div class="content">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Busca:</strong> ${busca || 'Todos os produtos'}</p>
            <p><strong>Categoria:</strong> ${categoria || 'Todas as categorias'}</p>
            <p><strong>Status:</strong> ${status || 'Todos os status'}</p>

            <h3>Produtos (${produtos.length} encontrados):</h3>
            ${produtos.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Estoque Atual</th>
                        <th>Estoque Mínimo</th>
                        <th>Preço</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${produtos.map(produto => `
                    <tr>
                        <td>${produto.codigo || 'N/A'}</td>
                        <td>${produto.nome || 'N/A'}</td>
                        <td>${produto.categoria || 'N/A'}</td>
                        <td>${produto.estoque_atual || 0}</td>
                        <td>${produto.estoque_minimo || 0}</td>
                        <td>R$ ${produto.preco_venda ? parseFloat(produto.preco_venda).toFixed(2) : '0,00'}</td>
                        <td class="status-${produto.status || 'inativo'}">${produto.status || 'Inativo'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<p>Nenhum produto encontrado com os filtros aplicados.</p>'}
        </div>
    </body>
    </html>`;

    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Gerar PDF
    console.log('🔄 Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true, // Modo paisagem para melhor visualização das colunas
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
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_estoque.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(pdf);

  } catch (error) {
    console.error('❌ Erro ao gerar PDF de estoque:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao gerar PDF',
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
    
    // Buscar dados reais do banco
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (inicio) {
      whereClause += ' AND DATE(o.data_abertura) >= ?';
      params.push(inicio);
    }
    
    if (fim) {
      whereClause += ' AND DATE(o.data_abertura) <= ?';
      params.push(fim);
    }
    
    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }
    
    if (busca) {
      whereClause += ' AND (o.numero_os LIKE ? OR p.nome LIKE ? OR o.tipo_servico LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }
    
    if (prioridade) {
      whereClause += ' AND o.prioridade = ?';
      params.push(prioridade);
    }
    
    // Buscar OS
    const [ordens] = await db.query(`
      SELECT o.*, p.nome as cliente_nome
      FROM ordens_servico o
      LEFT JOIN pessoas p ON o.solicitante_id = p.id
      ${whereClause}
      ORDER BY o.data_abertura DESC
    `, params);
    
    // Calcular totais por status
    const [totais] = await db.query(`
      SELECT 
        o.status,
        COUNT(*) as quantidade,
        SUM(o.valor_total) as valor_total,
        AVG(o.valor_total) as ticket_medio
      FROM ordens_servico o
      LEFT JOIN pessoas p ON o.solicitante_id = p.id
      ${whereClause}
      GROUP BY o.status
    `, params);
    
    // Gerar HTML com dados reais
    const html = gerarHTMLOSComDados(inicio, fim, status, busca, prioridade, ordens, totais);
    
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
      landscape: true, // Modo paisagem para melhor visualização das colunas
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
      landscape: true, // Modo paisagem para melhor visualização das colunas
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

// Exportar relatório de performance de técnicos para PDF
router.get('/performance-tecnicos', async (req, res) => {
  const { inicio, fim } = req.query;
  
  try {
    console.log('🔄 Iniciando geração de PDF - Performance Técnicos');
    console.log('📅 Período:', inicio, 'até', fim);
    
    // Buscar dados reais dos técnicos
    let sql = `
      SELECT 
        r.id as tecnico_id,
        r.nome as tecnico_nome,
        COUNT(os.id) as os_concluidas,
        AVG(TIMESTAMPDIFF(HOUR, os.data_abertura, os.data_fechamento)) as tempo_medio_horas,
        AVG(CASE WHEN os.status = 'concluida' THEN 4.5 ELSE 3.0 END) as satisfacao_media,
        ROUND((COUNT(CASE WHEN os.status = 'concluida' THEN 1 END) * 100.0 / COUNT(os.id)), 1) as produtividade_percent
      FROM pessoas r
      LEFT JOIN ordens_servico os ON r.id = os.responsavel_id
      WHERE r.tipo = 'tecnico'
    `;
    
    const params = [];
    
    // Aplicar filtro de período se fornecido
    if (inicio && fim) {
      sql += ` AND os.data_abertura BETWEEN ? AND ?`;
      params.push(inicio, fim);
    }
    
    sql += `
      GROUP BY r.id, r.nome
      HAVING os_concluidas > 0
      ORDER BY produtividade_percent DESC, os_concluidas DESC
    `;
    
    const [tecnicos] = await db.query(sql, params);
    
    console.log('📊 Técnicos encontrados:', tecnicos.length);
    
    // Gerar HTML do relatório com dados reais
    const html = gerarHTMLPerformanceTecnicosComDados(inicio, fim, tecnicos);
    
    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Gerar PDF
    console.log('🔄 Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true, // Modo paisagem para melhor visualização das colunas
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    console.log('✅ PDF gerado, tamanho:', pdf.length, 'bytes');
    
    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_performance_tecnicos.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(pdf);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF de performance técnicos:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao gerar PDF', 
      details: error.message 
    });
  }
});

// Exportar relatório de faturamento por cliente para PDF
router.get('/faturamento-cliente', async (req, res) => {
  const { inicio, fim } = req.query;
  
  try {
    console.log('🔄 Iniciando geração de PDF - Faturamento por Cliente');
    console.log('📅 Período:', inicio, 'até', fim);
    
    // Buscar dados reais do banco
    let whereClause = 'WHERE o.status = "concluida"';
    const params = [];
    
    if (inicio) {
      whereClause += ' AND DATE(o.data_fechamento) >= ?';
      params.push(inicio);
    }
    
    if (fim) {
      whereClause += ' AND DATE(o.data_fechamento) <= ?';
      params.push(fim);
    }
    
    // Buscar faturamento por cliente
    const [clientes] = await db.query(`
      SELECT 
        p.id as cliente_id,
        p.nome as cliente_nome,
        COUNT(o.id) as total_os,
        SUM(o.valor_total) as faturamento_total,
        AVG(o.valor_total) as ticket_medio,
        MAX(o.data_fechamento) as ultima_os
      FROM ordens_servico o
      LEFT JOIN pessoas p ON o.solicitante_id = p.id
      ${whereClause}
      GROUP BY p.id, p.nome
      ORDER BY faturamento_total DESC
    `, params);
    
    // Calcular totais gerais
    const totalOS = clientes.reduce((sum, cliente) => sum + parseInt(cliente.total_os), 0);
    const faturamentoGeral = clientes.reduce((sum, cliente) => sum + parseFloat(cliente.faturamento_total || 0), 0);
    const ticketMedioGeral = totalOS > 0 ? faturamentoGeral / totalOS : 0;
    
    // Gerar HTML com dados reais
    const html = gerarHTMLFaturamentoClienteComDados(inicio, fim, clientes, { totalOS, faturamentoGeral, ticketMedioGeral });
    
    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Gerar PDF
    console.log('🔄 Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    console.log('✅ PDF gerado, tamanho:', pdf.length, 'bytes');
    
    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_faturamento_cliente.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(pdf);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF de faturamento por cliente:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao gerar PDF', 
      details: error.message 
    });
  }
});

// Função para gerar HTML do relatório de performance de técnicos com dados reais
function gerarHTMLPerformanceTecnicosComDados(inicio, fim, tecnicos) {
  // Calcular totais gerais
  const totalOS = tecnicos.reduce((sum, t) => sum + (parseInt(t.os_concluidas) || 0), 0);
  const tempoMedioGeral = tecnicos.length > 0 ? 
    (tecnicos.reduce((sum, t) => sum + (parseFloat(t.tempo_medio_horas) || 0), 0) / tecnicos.length).toFixed(1) : 0;
  const satisfacaoGeral = tecnicos.length > 0 ? 
    (tecnicos.reduce((sum, t) => sum + (parseFloat(t.satisfacao_media) || 0), 0) / tecnicos.length).toFixed(1) : 0;
  const produtividadeGeral = tecnicos.length > 0 ? 
    (tecnicos.reduce((sum, t) => sum + (parseFloat(t.produtividade_percent) || 0), 0) / tecnicos.length).toFixed(1) : 0;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Performance de Técnicos</title>
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
        .cards-resumo {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        .card-header {
            font-weight: 600;
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        .card-value {
            font-size: 1.4em;
            font-weight: bold;
            color: #333;
        }
        .card-azul { border-left: 4px solid #007bff; }
        .card-verde { border-left: 4px solid #28a745; }
        .card-laranja { border-left: 4px solid #fd7e14; }
        .card-roxo { border-left: 4px solid #6f42c1; }
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
        .badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 500;
            text-transform: uppercase;
        }
        .badge-success {
            background-color: #d4edda;
            color: #155724;
        }
        .badge-warning {
            background-color: #fff3cd;
            color: #856404;
        }
        .badge-danger {
            background-color: #f8d7da;
            color: #721c24;
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            color: #777; 
            font-size: 0.9em; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👨‍💻 Relatório de Performance de Técnicos</h1>
            <h2>NSI Tecnologia</h2>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="info">
            <h3>📊 Resumo Geral</h3>
            <p><strong>Período:</strong> ${inicio && fim ? `${inicio} até ${fim}` : 'Todos os períodos'}</p>
            <p><strong>Técnicos Analisados:</strong> ${tecnicos.length}</p>
            <p><strong>Total de OS:</strong> ${totalOS}</p>
        </div>

        <div class="cards-resumo">
            <div class="card card-azul">
                <div class="card-header">Total de OS</div>
                <div class="card-value">${totalOS}</div>
            </div>
            <div class="card card-verde">
                <div class="card-header">Tempo Médio Geral</div>
                <div class="card-value">${tempoMedioGeral}h</div>
            </div>
            <div class="card card-laranja">
                <div class="card-header">Satisfação Geral</div>
                <div class="card-value">${satisfacaoGeral}/5</div>
            </div>
            <div class="card card-roxo">
                <div class="card-header">Produtividade Geral</div>
                <div class="card-value">${produtividadeGeral}%</div>
            </div>
        </div>

        <div class="info">
            <h3>📈 Performance Individual dos Técnicos</h3>
            ${tecnicos.length > 0 ? `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Técnico</th>
                        <th>OS Concluídas</th>
                        <th>Tempo Médio</th>
                        <th>Satisfação</th>
                        <th>Produtividade</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tecnicos.map(tecnico => `
                    <tr>
                        <td><strong>${tecnico.tecnico_nome}</strong></td>
                        <td>${tecnico.os_concluidas}</td>
                        <td>${tecnico.tempo_medio_horas ? parseFloat(tecnico.tempo_medio_horas).toFixed(1) + 'h' : 'N/A'}</td>
                        <td>${tecnico.satisfacao_media ? parseFloat(tecnico.satisfacao_media).toFixed(1) + '/5' : 'N/A'}</td>
                        <td>${tecnico.produtividade_percent || 0}%</td>
                        <td>
                            ${parseFloat(tecnico.produtividade_percent || 0) >= 90 ? 
                                '<span class="badge badge-success">Excelente</span>' :
                                parseFloat(tecnico.produtividade_percent || 0) >= 70 ?
                                '<span class="badge badge-warning">Bom</span>' :
                                '<span class="badge badge-danger">Regular</span>'
                            }
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<p>Nenhum técnico encontrado com OS no período especificado.</p>'}
        </div>
        
        <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema NSI Tecnologia</p>
            <p>Contato: (54) 98128-3447 | nsi@nsitecnologia.com.br</p>
        </div>
    </div>
</body>
</html>`;
}

// Função para gerar HTML do relatório de performance de técnicos (versão antiga com dados fictícios)
function gerarHTMLPerformanceTecnicos(inicio, fim) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Performance de Técnicos</title>
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
            color: #666; 
            margin: 10px 0 0 0; 
            font-size: 1.1em; 
            font-weight: normal; 
        }
        .info { 
            background-color: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px; 
            border-left: 4px solid #007bff; 
        }
        .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
            background-color: #fff; 
        }
        .table th, .table td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
        }
        .table th { 
            background-color: #007bff; 
            color: white; 
            font-weight: bold; 
        }
        .table tr:nth-child(even) { 
            background-color: #f8f9fa; 
        }
        .table tr:hover { 
            background-color: #e3f2fd; 
        }
        .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            text-align: center; 
            color: #666; 
            font-size: 0.9em; 
        }
        .badge { 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 0.8em; 
            font-weight: bold; 
        }
        .badge-success { 
            background-color: #28a745; 
            color: white; 
        }
        .badge-warning { 
            background-color: #ffc107; 
            color: #212529; 
        }
        .badge-danger { 
            background-color: #dc3545; 
            color: white; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Performance de Técnicos</h1>
            <h2>NSI Tecnologia</h2>
        </div>
        
        <div class="info">
            <strong>📅 Período:</strong> ${inicio || 'N/A'} até ${fim || 'N/A'}<br>
            <strong>📄 Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}
        </div>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Técnico</th>
                    <th>OS Concluídas</th>
                    <th>Tempo Médio</th>
                    <th>Satisfação</th>
                    <th>Produtividade</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>João Silva</td>
                    <td>25</td>
                    <td>2.5h</td>
                    <td>4.8/5</td>
                    <td>95%</td>
                    <td><span class="badge badge-success">Excelente</span></td>
                </tr>
                <tr>
                    <td>Maria Santos</td>
                    <td>18</td>
                    <td>3.2h</td>
                    <td>4.5/5</td>
                    <td>88%</td>
                    <td><span class="badge badge-success">Bom</span></td>
                </tr>
                <tr>
                    <td>Pedro Costa</td>
                    <td>12</td>
                    <td>4.1h</td>
                    <td>3.8/5</td>
                    <td>72%</td>
                    <td><span class="badge badge-warning">Regular</span></td>
                </tr>
            </tbody>
        </table>
        
        <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema NSI Tecnologia</p>
            <p>Para mais informações, acesse o sistema administrativo</p>
        </div>
    </div>
</body>
</html>`;
}

// Função para gerar HTML do relatório de faturamento por cliente com dados reais
function gerarHTMLFaturamentoClienteComDados(inicio, fim, clientes, totais) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Faturamento por Cliente</title>
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
        .cards-resumo {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .card-header {
            font-weight: 600;
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        .card-value {
            font-size: 1.4em;
            font-weight: bold;
            color: #333;
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
            padding: 10px 12px; 
            text-align: left; 
        }
        .data-table th { 
            background-color: #007bff; 
            color: #fff; 
            font-weight: 600; 
            text-transform: uppercase; 
            font-size: 0.85em; 
        }
        .data-table tr:nth-child(even) { 
            background-color: #f8f8f8; 
        }
        .data-table tr:hover { 
            background-color: #f1f1f1; 
        }
        .valor { 
            font-weight: bold; 
            color: #28a745; 
        }
        .posicao {
            font-weight: bold;
            color: #007bff;
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
            <h1>💰 Relatório de Faturamento por Cliente</h1>
            <h2>NSI Tecnologia</h2>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="info">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Período:</strong> ${inicio || 'Todos os períodos'} até ${fim || 'Data atual'}</p>
        </div>

        <div class="cards-resumo">
            <div class="card">
                <div class="card-header">Total de Clientes</div>
                <div class="card-value">${clientes.length}</div>
            </div>
            <div class="card">
                <div class="card-header">Total de OS</div>
                <div class="card-value">${totais.totalOS}</div>
            </div>
            <div class="card">
                <div class="card-header">Faturamento Total</div>
                <div class="card-value">R$ ${totais.faturamentoGeral.toFixed(2)}</div>
            </div>
            <div class="card">
                <div class="card-header">Ticket Médio Geral</div>
                <div class="card-value">R$ ${totais.ticketMedioGeral.toFixed(2)}</div>
            </div>
        </div>
        
        ${clientes.length > 0 ? `
        <div class="table-wrapper">
            <h3>Ranking de Faturamento por Cliente</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Cliente</th>
                        <th>Total de OS</th>
                        <th>Faturamento</th>
                        <th>Ticket Médio</th>
                        <th>Última OS</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientes.map((cliente, index) => `
                    <tr>
                        <td class="posicao">${index + 1}º</td>
                        <td><strong>${cliente.cliente_nome || 'Cliente sem nome'}</strong></td>
                        <td>${cliente.total_os}</td>
                        <td class="valor">R$ ${parseFloat(cliente.faturamento_total || 0).toFixed(2)}</td>
                        <td>R$ ${parseFloat(cliente.ticket_medio || 0).toFixed(2)}</td>
                        <td>${cliente.ultima_os ? new Date(cliente.ultima_os).toLocaleDateString('pt-BR') : '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : '<div class="info"><h3>Nenhum cliente encontrado</h3><p>Não foram encontrados clientes com faturamento no período selecionado.</p></div>'}
        
        <div class="footer">
            <p>NSI Tecnologia - Todos os direitos reservados.</p>
            <p>Contato: (54) 98128-3447 | nsi@nsitecnologia.com.br</p>
        </div>
    </div>
</body>
</html>`;
}

// Função para gerar HTML do relatório de faturamento por cliente (versão antiga - mantida para compatibilidade)
function gerarHTMLFaturamentoCliente(inicio, fim) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Faturamento por Cliente</title>
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
            color: #666; 
            margin: 10px 0 0 0; 
            font-size: 1.1em; 
            font-weight: normal; 
        }
        .info { 
            background-color: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px; 
            border-left: 4px solid #007bff; 
        }
        .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
            background-color: #fff; 
        }
        .table th, .table td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
        }
        .table th { 
            background-color: #007bff; 
            color: white; 
            font-weight: bold; 
        }
        .table tr:nth-child(even) { 
            background-color: #f8f9fa; 
        }
        .table tr:hover { 
            background-color: #e3f2fd; 
        }
        .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            text-align: center; 
            color: #666; 
            font-size: 0.9em; 
        }
        .currency { 
            text-align: right; 
            font-weight: bold; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Relatório de Faturamento por Cliente</h1>
            <h2>NSI Tecnologia</h2>
        </div>
        
        <div class="info">
            <strong>📅 Período:</strong> ${inicio || 'N/A'} até ${fim || 'N/A'}<br>
            <strong>📄 Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}
        </div>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Total de OS</th>
                    <th>Faturamento</th>
                    <th>Ticket Médio</th>
                    <th>Última OS</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Empresa ABC Ltda</td>
                    <td>15</td>
                    <td class="currency">R$ 45.000,00</td>
                    <td class="currency">R$ 3.000,00</td>
                    <td>15/09/2024</td>
                </tr>
                <tr>
                    <td>Comércio XYZ</td>
                    <td>8</td>
                    <td class="currency">R$ 12.500,00</td>
                    <td class="currency">R$ 1.562,50</td>
                    <td>10/09/2024</td>
                </tr>
                <tr>
                    <td>Indústria 123</td>
                    <td>22</td>
                    <td class="currency">R$ 67.800,00</td>
                    <td class="currency">R$ 3.081,82</td>
                    <td>20/09/2024</td>
                </tr>
            </tbody>
        </table>
        
        <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema NSI Tecnologia</p>
            <p>Para mais informações, acesse o sistema administrativo</p>
        </div>
    </div>
</body>
</html>`;
}

// Rota para PDF de movimentações
router.get('/movimentacoes', async (req, res) => {
  try {
    console.log('📄 Exportando relatório de movimentações...');
    console.log('Parâmetros:', req.query);

    const { inicio, fim, tipo } = req.query;

    // Buscar dados das movimentações
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (inicio) {
      whereClause += ' AND DATE(m.data) >= ?';
      params.push(inicio);
    }

    if (fim) {
      whereClause += ' AND DATE(m.data) <= ?';
      params.push(fim);
    }

    if (tipo) {
      whereClause += ' AND m.tipo = ?';
      params.push(tipo);
    }

    const [movimentacoes] = await db.query(`
      SELECT m.*, p.nome as produto_nome, p.codigo as produto_codigo
      FROM movimentacoes m
      LEFT JOIN produtos p ON m.produto_id = p.id
      ${whereClause}
      ORDER BY m.data DESC
    `, params);

    // Gerar HTML
    const html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Relatório de Movimentações</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .tipo-entrada { color: green; font-weight: bold; }
            .tipo-saida { color: red; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📦 Relatório de Movimentações</h1>
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div class="content">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Período:</strong> ${inicio || 'Data inicial'} até ${fim || 'Data final'}</p>
            <p><strong>Tipo:</strong> ${tipo || 'Todos os tipos'}</p>

            <h3>Movimentações (${movimentacoes.length} encontradas):</h3>
            ${movimentacoes.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Produto</th>
                        <th>Tipo</th>
                        <th>Quantidade</th>
                        <th>Observações</th>
                    </tr>
                </thead>
                <tbody>
                    ${movimentacoes.map(mov => `
                    <tr>
                        <td>${new Date(mov.data).toLocaleDateString('pt-BR')}</td>
                        <td>${mov.produto_codigo || 'N/A'} - ${mov.produto_nome || 'N/A'}</td>
                        <td class="tipo-${mov.tipo || 'saida'}">${mov.tipo || 'Saída'}</td>
                        <td>${mov.quantidade || 0}</td>
                        <td>${mov.observacoes || 'N/A'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<p>Nenhuma movimentação encontrada com os filtros aplicados.</p>'}
        </div>
    </body>
    </html>`;

    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

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
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_movimentacoes.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(pdf);

  } catch (error) {
    console.error('❌ Erro ao gerar PDF de movimentações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao gerar PDF',
      details: error.message
    });
  }
});

// Rota para PDF de contas a receber
router.get('/contas-receber', async (req, res) => {
  try {
    console.log('📄 Exportando relatório de contas a receber...');
    console.log('Parâmetros:', req.query);
    
    const { busca = '', status_vencimento = 'todas' } = req.query;

    // Buscar dados das contas a receber
    let sql = `
      SELECT f.id, f.tipo, f.valor, f.vencimento, f.status, f.descricao,
             f.parcela_atual, f.total_parcelas, f.parcela_pai_id,
             p.nome AS pessoa_nome, p.telefone, p.email,
             c1.nome AS caixa_origem_nome,
             c2.nome AS caixa_quitacao_nome,
             CASE 
               WHEN f.vencimento < CURDATE() AND f.status = 'pendente' THEN 'vencida'
               WHEN f.vencimento = CURDATE() AND f.status = 'pendente' THEN 'vencendo_hoje'
               WHEN f.vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND f.status = 'pendente' THEN 'vencendo_7_dias'
               WHEN f.status = 'pendente' THEN 'pendente'
               ELSE 'quitada'
             END AS status_vencimento_real
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c1 ON f.caixa_id = c1.id
      LEFT JOIN caixas c2 ON f.caixa_quitacao_id = c2.id
      WHERE f.tipo = 'receber'
    `;
    const params = [];

    if (busca) {
      sql += ' AND (f.descricao LIKE ? OR p.nome LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`);
    }

    if (status_vencimento && status_vencimento !== 'todas') {
      if (status_vencimento === 'vencidas') {
        sql += ' AND f.vencimento < CURDATE() AND f.status = "pendente"';
      } else if (status_vencimento === 'vencendo_hoje') {
        sql += ' AND f.vencimento = CURDATE() AND f.status = "pendente"';
      } else if (status_vencimento === 'vencendo_7_dias') {
        sql += ' AND f.vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND f.status = "pendente"';
      } else if (status_vencimento === 'pendentes') {
        sql += ' AND f.status = "pendente"';
      } else if (status_vencimento === 'quitadas') {
        sql += ' AND f.status = "pago"';
      }
    }

    sql += ' ORDER BY f.vencimento ASC';

    const [lancamentos] = await db.query(sql, params);

    // Calcular totais
    const [totais] = await db.query(`
      SELECT 
        COUNT(*) as total_lancamentos,
        SUM(CASE WHEN f.vencimento < CURDATE() AND f.status = 'pendente' THEN f.valor ELSE 0 END) as total_vencidas,
        SUM(CASE WHEN f.vencimento = CURDATE() AND f.status = 'pendente' THEN f.valor ELSE 0 END) as total_vencendo_hoje,
        SUM(CASE WHEN f.vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND f.status = 'pendente' THEN f.valor ELSE 0 END) as total_vencendo_7_dias,
        SUM(CASE WHEN f.status = 'pendente' THEN f.valor ELSE 0 END) as total_pendentes,
        SUM(CASE WHEN f.status = 'pago' THEN f.valor ELSE 0 END) as total_quitadas
      FROM financeiro f
      WHERE f.tipo = 'receber'
    `);

    // Gerar HTML
    const html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Relatório de Contas a Receber</title>
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
            .cards-resumo {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            .card {
                background: white;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                text-align: center;
            }
            .card-header {
                font-weight: 600;
                color: #666;
                font-size: 0.9em;
                margin-bottom: 10px;
            }
            .card-value {
                font-size: 1.4em;
                font-weight: bold;
                color: #333;
            }
            .card-vermelho { border-left: 4px solid #dc3545; }
            .card-laranja { border-left: 4px solid #fd7e14; }
            .card-amarelo { border-left: 4px solid #ffc107; }
            .card-azul { border-left: 4px solid #007bff; }
            .card-verde { border-left: 4px solid #28a745; }
            .table-wrapper { 
                overflow-x: auto; 
                margin-bottom: 30px; 
            }
            .data-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 15px; 
                table-layout: fixed; /* Força larguras fixas das colunas */
            }
            .data-table th, .data-table td { 
                border: 1px solid #ddd; 
                padding: 10px 12px; 
                text-align: left; 
                word-wrap: break-word; /* Quebra palavras longas */
                overflow-wrap: break-word; /* Suporte adicional para quebra */
            }
            /* Larguras específicas para cada coluna */
            .data-table th:nth-child(1), .data-table td:nth-child(1) { width: 15%; } /* Cliente */
            .data-table th:nth-child(2), .data-table td:nth-child(2) { width: 20%; } /* Descrição */
            .data-table th:nth-child(3), .data-table td:nth-child(3) { width: 10%; } /* Valor */
            .data-table th:nth-child(4), .data-table td:nth-child(4) { width: 10%; } /* Parcelas */
            .data-table th:nth-child(5), .data-table td:nth-child(5) { width: 10%; } /* Vencimento */
            .data-table th:nth-child(6), .data-table td:nth-child(6) { width: 10%; } /* Status */
            .data-table th:nth-child(7), .data-table td:nth-child(7) { width: 25%; } /* Contato - mais espaço */
            .data-table th { 
                background-color: #007bff; 
                color: #fff; 
                font-weight: 600; 
                text-transform: uppercase; 
                font-size: 0.85em; 
            }
            .data-table tr:nth-child(even) { 
                background-color: #f8f8f8; 
            }
            .data-table tr:hover { 
                background-color: #f1f1f1; 
            }
            .valor { 
                font-weight: bold; 
                color: #28a745; 
            }
            .data-vencimento.vencida { 
                color: #dc3545; 
                font-weight: bold; 
            }
            .data-vencimento.vencendo-hoje { 
                color: #fd7e14; 
                font-weight: bold; 
            }
            .status-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8em;
                font-weight: 500;
                text-transform: uppercase;
            }
            .status-pendente {
                background-color: #fff3cd;
                color: #856404;
            }
            .status-pago {
                background-color: #d4edda;
                color: #155724;
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
                <h1>💰 Relatório de Contas a Receber</h1>
                <h2>NSI Tecnologia</h2>
                <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
            
            <div class="info">
                <h3>Filtros Aplicados:</h3>
                <p><strong>Busca:</strong> ${busca || 'Todos os clientes'}</p>
                <p><strong>Status de Vencimento:</strong> ${status_vencimento === 'todas' ? 'Todos' : status_vencimento}</p>
            </div>

            <div class="cards-resumo">
                <div class="card card-vermelho">
                    <div class="card-header">Vencidas</div>
                    <div class="card-value">R$ ${parseFloat(totais[0]?.total_vencidas || 0).toFixed(2)}</div>
                </div>
                <div class="card card-laranja">
                    <div class="card-header">Vence Hoje</div>
                    <div class="card-value">R$ ${parseFloat(totais[0]?.total_vencendo_hoje || 0).toFixed(2)}</div>
                </div>
                <div class="card card-amarelo">
                    <div class="card-header">Vence em 7 dias</div>
                    <div class="card-value">R$ ${parseFloat(totais[0]?.total_vencendo_7_dias || 0).toFixed(2)}</div>
                </div>
                <div class="card card-azul">
                    <div class="card-header">Total Pendente</div>
                    <div class="card-value">R$ ${parseFloat(totais[0]?.total_pendentes || 0).toFixed(2)}</div>
                </div>
                <div class="card card-verde">
                    <div class="card-header">Total Quitado</div>
                    <div class="card-value">R$ ${parseFloat(totais[0]?.total_quitadas || 0).toFixed(2)}</div>
                </div>
            </div>
            
            <div class="table-wrapper">
                <h3>Detalhes das Contas a Receber (${lancamentos.length} encontradas)</h3>
                ${lancamentos.length > 0 ? `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Parcelas</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Contato</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lancamentos.map(l => `
                        <tr>
                            <td><strong>${l.pessoa_nome || '-'}</strong></td>
                            <td>${l.descricao || '-'}</td>
                            <td class="valor">R$ ${parseFloat(l.valor).toFixed(2)}</td>
                            <td>
                                ${l.total_parcelas > 1 ? 
                                    `${l.parcela_atual || 1}/${l.total_parcelas || 1}${l.parcela_pai_id === l.id ? ' (Principal)' : ''}` : 
                                    'À Vista'
                                }
                            </td>
                            <td>
                                <span class="data-vencimento ${l.status_vencimento_real === 'vencida' ? 'vencida' : ''} ${l.status_vencimento_real === 'vencendo_hoje' ? 'vencendo-hoje' : ''}">
                                    ${l.vencimento ? new Date(l.vencimento).toLocaleDateString('pt-BR') : '-'}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge status-${l.status}">${l.status || '-'}</span>
                            </td>
                            <td>
                                ${l.telefone ? `Tel: ${l.telefone}` : ''}
                                ${l.email ? `<br>Email: ${l.email}` : ''}
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : '<p>Nenhuma conta a receber encontrada com os filtros aplicados.</p>'}
            </div>
            
            <div class="footer">
                <p>NSI Tecnologia - Todos os direitos reservados.</p>
                <p>Contato: (54) 98128-3447 | nsi@nsitecnologia.com.br</p>
            </div>
        </div>
    </body>
    </html>`;

    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Gerar PDF
    console.log('🔄 Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true, // Modo paisagem para melhor visualização das colunas
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
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_contas_receber.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(pdf);

  } catch (error) {
    console.error('❌ Erro ao gerar PDF de contas a receber:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao gerar PDF',
      details: error.message
    });
  }
});

// Rota para PDF de pessoas
router.get('/pessoas', async (req, res) => {
  try {
    console.log('📄 Exportando relatório de pessoas...');
    console.log('Parâmetros:', req.query);
    
    const { busca, tipo } = req.query;

    // Buscar dados das pessoas
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (busca) {
      whereClause += ' AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    if (tipo) {
      whereClause += ' AND tipo = ?';
      params.push(tipo);
    }

    const [pessoas] = await db.query(`
      SELECT * FROM pessoas
      ${whereClause}
      ORDER BY nome
    `, params);

    // Gerar HTML
    const html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Relatório de Pessoas</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .tipo-cliente { color: blue; font-weight: bold; }
            .tipo-fornecedor { color: green; font-weight: bold; }
            .tipo-tecnico { color: orange; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>👥 Relatório de Pessoas</h1>
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div class="content">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Busca:</strong> ${busca || 'Todas as pessoas'}</p>
            <p><strong>Tipo:</strong> ${tipo || 'Todos os tipos'}</p>

            <h3>Pessoas (${pessoas.length} encontradas):</h3>
            ${pessoas.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Tipo</th>
                        <th>Endereço</th>
                        <th>Data Cadastro</th>
                    </tr>
                </thead>
                <tbody>
                    ${pessoas.map(pessoa => `
                    <tr>
                        <td>${pessoa.nome || 'N/A'}</td>
                        <td>${pessoa.email || 'N/A'}</td>
                        <td>${pessoa.telefone || 'N/A'}</td>
                        <td class="tipo-${pessoa.tipo || 'cliente'}">${pessoa.tipo || 'Cliente'}</td>
                        <td>${pessoa.endereco || 'N/A'}</td>
                        <td>${pessoa.data_cadastro ? new Date(pessoa.data_cadastro).toLocaleDateString('pt-BR') : (pessoa.created_at ? new Date(pessoa.created_at).toLocaleDateString('pt-BR') : 'N/A')}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<p>Nenhuma pessoa encontrada com os filtros aplicados.</p>'}
        </div>
    </body>
    </html>`;

    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

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
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_pessoas.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(pdf);

  } catch (error) {
    console.error('❌ Erro ao gerar PDF de pessoas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao gerar PDF',
      details: error.message
    });
  }
});

module.exports = router;
