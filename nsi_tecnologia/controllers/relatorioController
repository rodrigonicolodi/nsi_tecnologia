
const db = require('../db');

exports.listarRelatorios = (req, res) => {
    // A view agora é estática, não precisa de dados injetados
    res.render('relatorios/listar', {
        titulo: 'Índice de Relatórios', 
        erro: null,
        sucesso: null
    });
};

// Relatório de valor de serviços e produtos por mês
exports.servicosProdutosMes = async (req, res) => {
    const { mes, ano } = req.query;
    const mesAtual = mes || new Date().getMonth() + 1;
    const anoAtual = ano || new Date().getFullYear();

    try {
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

        res.render('relatorios/servicos-produtos-mes', {
            titulo: 'Relatório de Serviços e Produtos por Mês',
            resultados: resultados[0] || {},
            detalhes,
            mes: mesAtual,
            ano: anoAtual,
            erro: null
        });
    } catch (erro) {
        console.error('Erro ao gerar relatório:', erro);
        res.render('relatorios/servicos-produtos-mes', {
            titulo: 'Relatório de Serviços e Produtos por Mês',
            resultados: {},
            detalhes: [],
            mes: mesAtual,
            ano: anoAtual,
            erro: 'Erro ao gerar relatório.'
        });
    }
};

// Relatório de OS por status e período
exports.osStatusPeriodo = async (req, res) => {
    const { inicio, fim, status } = req.query;
    
    try {
        let sql = `
            SELECT 
                o.status,
                COUNT(*) as quantidade,
                SUM(o.valor_total) as valor_total,
                AVG(o.valor_total) as ticket_medio
            FROM ordens_servico o
            WHERE 1=1
        `;
        const params = [];

        if (inicio) {
            sql += ' AND DATE(o.data_abertura) >= ?';
            params.push(inicio);
        }
        if (fim) {
            sql += ' AND DATE(o.data_abertura) <= ?';
            params.push(fim);
        }
        if (status) {
            sql += ' AND o.status = ?';
            params.push(status);
        }

        sql += ' GROUP BY o.status ORDER BY quantidade DESC';

        const [resultados] = await db.query(sql, params);

        // Buscar detalhes das OS
        let detalhesSql = `
            SELECT 
                o.id,
                o.numero_os,
                o.tipo_servico,
                o.prioridade,
                o.status,
                o.valor_total,
                o.data_abertura,
                o.data_fechamento,
                p.nome as cliente_nome
            FROM ordens_servico o
            LEFT JOIN pessoas p ON o.solicitante_id = p.id
            WHERE 1=1
        `;
        const detalhesParams = [];

        if (inicio) {
            detalhesSql += ' AND DATE(o.data_abertura) >= ?';
            detalhesParams.push(inicio);
        }
        if (fim) {
            detalhesSql += ' AND DATE(o.data_abertura) <= ?';
            detalhesParams.push(fim);
        }
        if (status) {
            detalhesSql += ' AND o.status = ?';
            detalhesParams.push(status);
        }

        detalhesSql += ' ORDER BY o.data_abertura DESC';

        const [detalhes] = await db.query(detalhesSql, detalhesParams);

        res.render('relatorios/os-status-periodo', {
            titulo: 'Relatório de OS por Status e Período',
            resultados,
            detalhes,
            inicio: inicio || '',
            fim: fim || '',
            status: status || '',
            erro: null
        });
    } catch (erro) {
        console.error('Erro ao gerar relatório:', erro);
        res.render('relatorios/os-status-periodo', {
            titulo: 'Relatório de OS por Status e Período',
            resultados: [],
            detalhes: [],
            inicio: inicio || '',
            fim: fim || '',
            status: status || '',
            erro: 'Erro ao gerar relatório.'
        });
    }
};

// Relatório de faturamento por pessoa/cliente
exports.faturamentoCliente = async (req, res) => {
    const { inicio, fim } = req.query;
    
    try {
        let sql = `
            SELECT 
                p.id,
                p.nome as cliente_nome,
                COUNT(o.id) as total_os,
                SUM(o.valor_servico) as total_servicos,
                SUM(o.acrescimos) as total_produtos,
                SUM(o.desconto) as total_descontos,
                SUM(o.valor_total) as total_faturamento,
                AVG(o.valor_total) as ticket_medio
            FROM pessoas p
            LEFT JOIN ordens_servico o ON p.id = o.solicitante_id AND o.status = 'concluida'
            WHERE 1=1
        `;
        const params = [];

        if (inicio) {
            sql += ' AND DATE(o.data_fechamento) >= ?';
            params.push(inicio);
        }
        if (fim) {
            sql += ' AND DATE(o.data_fechamento) <= ?';
            params.push(fim);
        }

        sql += `
            GROUP BY p.id, p.nome
            HAVING total_os > 0
            ORDER BY total_faturamento DESC
        `;

        const [resultados] = await db.query(sql, params);

        res.render('relatorios/faturamento-cliente', {
            titulo: 'Relatório de Faturamento por Cliente',
            resultados,
            inicio: inicio || '',
            fim: fim || '',
            erro: null
        });
    } catch (erro) {
        console.error('Erro ao gerar relatório:', erro);
        res.render('relatorios/faturamento-cliente', {
            titulo: 'Relatório de Faturamento por Cliente',
            resultados: [],
            inicio: inicio || '',
            fim: fim || '',
            erro: 'Erro ao gerar relatório.'
        });
    }
};

// Relatório de performance de técnicos
exports.performanceTecnicos = async (req, res) => {
    const { inicio, fim } = req.query;
    
    try {
        let sql = `
            SELECT 
                p.id,
                p.nome as tecnico_nome,
                COUNT(o.id) as total_os,
                SUM(CASE WHEN o.status = 'concluida' THEN 1 ELSE 0 END) as os_concluidas,
                SUM(CASE WHEN o.status = 'concluida' THEN o.valor_total ELSE 0 END) as faturamento,
                AVG(CASE WHEN o.status = 'concluida' THEN o.tempo_execucao ELSE NULL END) as tempo_medio_execucao,
                ROUND((SUM(CASE WHEN o.status = 'concluida' THEN 1 ELSE 0 END) / COUNT(o.id)) * 100, 2) as taxa_conclusao
            FROM pessoas p
            LEFT JOIN ordens_servico o ON p.id = o.responsavel_id
            WHERE 1=1
        `;
        const params = [];

        if (inicio) {
            sql += ' AND DATE(o.data_abertura) >= ?';
            params.push(inicio);
        }
        if (fim) {
            sql += ' AND DATE(o.data_abertura) <= ?';
            params.push(fim);
        }

        sql += `
            GROUP BY p.id, p.nome
            HAVING total_os > 0
            ORDER BY faturamento DESC
        `;

        const [resultados] = await db.query(sql, params);

        res.render('relatorios/performance-tecnicos', {
            titulo: 'Relatório de Performance de Técnicos',
            resultados,
            inicio: inicio || '',
            fim: fim || '',
            erro: null
        });
    } catch (erro) {
        console.error('Erro ao gerar relatório:', erro);
        res.render('relatorios/performance-tecnicos', {
            titulo: 'Relatório de Performance de Técnicos',
            resultados: [],
            inicio: inicio || '',
            fim: fim || '',
            erro: 'Erro ao gerar relatório.'
        });
    }
};
