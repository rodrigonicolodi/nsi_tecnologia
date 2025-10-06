const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota principal: Gerenciar Caixas (listar.ejs)
router.get('/', async (req, res) => {
  try {
    const [caixas] = await db.query('SELECT * FROM caixas ORDER BY nome');
    res.render('caixas/listar', {
      caixas,
      erro: null,
      usuario: req.session.usuario || {} // ✅ garante que usuario exista
    });
  } catch (erro) {
    console.error('Erro ao carregar caixas:', erro);
    res.render('caixas/listar', {
      caixas: [],
      erro: 'Erro ao carregar os caixas.',
      usuario: req.session.usuario || {}
    });
  }
});

// Rota de consulta de saldos e movimentações (consulta.ejs)
router.get('/consulta', async (req, res) => {
  try {
    // Buscar dados do financeiro
    const [financeiroData] = await db.query(`
      SELECT 
        caixa_quitacao_id,
        SUM(CASE WHEN tipo = 'receber' THEN valor ELSE 0 END) AS recebido,
        SUM(CASE WHEN tipo = 'pagar' THEN valor ELSE 0 END) AS pago
      FROM financeiro 
      WHERE status = 'pago'
      GROUP BY caixa_quitacao_id
    `);

    // Buscar dados das transferências
    const [transferenciasData] = await db.query(`
      SELECT 
        caixa_origem_id,
        caixa_destino_id,
        SUM(valor) AS valor
      FROM transferencias_caixas
      GROUP BY caixa_origem_id, caixa_destino_id
    `);

    // Buscar caixas
    const [caixasRaw] = await db.query('SELECT id, nome, ativo, valor_inicial FROM caixas ORDER BY nome');
    
    // Processar dados
    const caixas = caixasRaw.map(caixa => {
      const fin = financeiroData.find(f => f.caixa_quitacao_id === caixa.id) || { recebido: 0, pago: 0 };
      
      const transferenciasRecebidas = transferenciasData
        .filter(t => t.caixa_destino_id === caixa.id)
        .reduce((sum, t) => sum + parseFloat(t.valor), 0);
      
      const transferenciasEnviadas = transferenciasData
        .filter(t => t.caixa_origem_id === caixa.id)
        .reduce((sum, t) => sum + parseFloat(t.valor), 0);

      const saldoAtual = parseFloat(caixa.valor_inicial) + 
                        parseFloat(fin.recebido) - 
                        parseFloat(fin.pago) + 
                        transferenciasRecebidas - 
                        transferenciasEnviadas;

      return {
        id: caixa.id,
        nome: caixa.nome,
        ativo: caixa.ativo,
        valor_inicial: caixa.valor_inicial,
        recebido: fin.recebido,
        pago: fin.pago,
        transferencias_recebidas: transferenciasRecebidas,
        transferencias_enviadas: transferenciasEnviadas,
        saldo_atual: saldoAtual
      };
    });

    res.render('caixas/consulta', {
      caixas,
      erro: null,
      sucesso: req.query.sucesso || null,
      usuario: req.session.usuario || {}
    });
  } catch (erro) {
    console.error('Erro ao consultar caixas:', erro);
    res.render('caixas/consulta', {
      caixas: [],
      erro: 'Erro ao carregar os dados dos caixas.',
      sucesso: null,
      usuario: req.session.usuario || {}
    });
  }
});

// Rota para criar novo caixa (nova.ejs)
router.get('/novo', (req, res) => {
  res.render('caixas/nova', {
    erro: null,
    usuario: req.session.usuario || {}
  });
});

router.post('/novo', async (req, res) => {
  const { nome, valor_inicial, ativo } = req.body;

  try {
    await db.query(
      'INSERT INTO caixas (nome, valor_inicial, ativo) VALUES (?, ?, ?)',
      [nome, valor_inicial, ativo === 'true']
    );
    res.redirect('/caixas');
  } catch (erro) {
    console.error('Erro ao criar novo caixa:', erro);
    res.render('caixas/nova', {
      erro: 'Erro ao salvar novo caixa.',
      usuario: req.session.usuario || {}
    });
  }
});

// Rota para editar caixa (editar.ejs)
router.get('/editar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await db.query('SELECT * FROM caixas WHERE id = ?', [id]);
    if (resultado.length === 0) {
      return res.redirect('/caixas');
    }
    res.render('caixas/editar', {
      caixa: resultado[0],
      erro: null,
      usuario: req.session.usuario || {}
    });
  } catch (erro) {
    console.error('Erro ao carregar caixa para edição:', erro);
    res.redirect('/caixas');
  }
});

router.post('/editar/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, valor_inicial, ativo } = req.body;

  try {
    await db.query(
      'UPDATE caixas SET nome = ?, valor_inicial = ?, ativo = ? WHERE id = ?',
      [nome, valor_inicial, ativo === 'true', id]
    );
    res.redirect('/caixas');
  } catch (erro) {
    console.error('Erro ao salvar edição do caixa:', erro);
    res.render('caixas/editar', {
      caixa: { id, nome, valor_inicial, ativo },
      erro: 'Erro ao salvar alterações.',
      usuario: req.session.usuario || {}
    });
  }
});

// Rota para ajustar saldo (ajustar.ejs)
router.get('/ajustar/:id', (req, res) => {
  const { id } = req.params;
  res.render('caixas/ajustar', {
    caixa_id: id,
    usuario: req.session.usuario || {}
  });
});

// Rota para excluir caixa
router.post('/excluir/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM caixas WHERE id = ?', [id]);
    res.redirect('/caixas');
  } catch (erro) {
    console.error('Erro ao excluir caixa:', erro);
    res.redirect('/caixas');
  }
});

// Rota para exibir o resumo dos caixas cadastrados
router.get('/resumo', async (req, res) => {
  try {
    const [caixas] = await db.query('SELECT nome, valor_inicial, ativo FROM caixas ORDER BY nome');

    res.render('caixas/resumo', {
      caixas,
      usuario: req.session.usuario || {},
      erro: null
    });
  } catch (erro) {
    console.error('Erro ao carregar resumo de caixas:', erro);
    res.render('caixas/resumo', {
      caixas: [],
      usuario: req.session.usuario || {},
      erro: 'Erro ao carregar dados.'
    });
  }
});

// Rota para transferência entre caixas
router.get('/transferir', async (req, res) => {
  try {
    const [caixas] = await db.query('SELECT id, nome, ativo FROM caixas WHERE ativo = true ORDER BY nome');
    res.render('caixas/transferir', {
      caixas,
      erro: null,
      usuario: req.session.usuario || {}
    });
  } catch (erro) {
    console.error('Erro ao carregar caixas para transferência:', erro);
    res.render('caixas/transferir', {
      caixas: [],
      erro: 'Erro ao carregar caixas.',
      usuario: req.session.usuario || {}
    });
  }
});

router.post('/transferir', async (req, res) => {
  const { caixa_origem_id, caixa_destino_id, valor, descricao } = req.body;
  const usuario_id = req.session.usuario?.id;

  try {
    // Validações
    if (!usuario_id) {
      const [caixas] = await db.query('SELECT id, nome, ativo FROM caixas WHERE ativo = true ORDER BY nome');
      return res.render('caixas/transferir', {
        caixas,
        erro: 'Usuário não autenticado.',
        usuario: req.session.usuario || {}
      });
    }

    if (!caixa_origem_id || !caixa_destino_id || !valor) {
      const [caixas] = await db.query('SELECT id, nome, ativo FROM caixas WHERE ativo = true ORDER BY nome');
      return res.render('caixas/transferir', {
        caixas,
        erro: 'Todos os campos são obrigatórios.',
        usuario: req.session.usuario || {}
      });
    }

    if (caixa_origem_id === caixa_destino_id) {
      const [caixas] = await db.query('SELECT id, nome, ativo FROM caixas WHERE ativo = true ORDER BY nome');
      return res.render('caixas/transferir', {
        caixas,
        erro: 'Caixa de origem e destino devem ser diferentes.',
        usuario: req.session.usuario || {}
      });
    }

    const valorNumerico = parseFloat(valor);
    if (valorNumerico <= 0) {
      const [caixas] = await db.query('SELECT id, nome, ativo FROM caixas WHERE ativo = true ORDER BY nome');
      return res.render('caixas/transferir', {
        caixas,
        erro: 'Valor deve ser maior que zero.',
        usuario: req.session.usuario || {}
      });
    }

    // Verificar se os caixas existem e estão ativos
    const [caixasOrigem] = await db.query('SELECT id, nome FROM caixas WHERE id = ? AND ativo = true', [caixa_origem_id]);
    const [caixasDestino] = await db.query('SELECT id, nome FROM caixas WHERE id = ? AND ativo = true', [caixa_destino_id]);

    if (caixasOrigem.length === 0 || caixasDestino.length === 0) {
      const [caixas] = await db.query('SELECT id, nome, ativo FROM caixas WHERE ativo = true ORDER BY nome');
      return res.render('caixas/transferir', {
        caixas,
        erro: 'Caixa de origem ou destino não encontrado ou inativo.',
        usuario: req.session.usuario || {}
      });
    }

    // Verificar saldo do caixa de origem - Queries separadas para evitar duplicação
    const [caixaInfo] = await db.query('SELECT valor_inicial FROM caixas WHERE id = ?', [caixa_origem_id]);
    
    const [financeiroData] = await db.query(`
      SELECT 
        SUM(CASE WHEN tipo = 'receber' THEN valor ELSE 0 END) AS recebido,
        SUM(CASE WHEN tipo = 'pagar' THEN valor ELSE 0 END) AS pago
      FROM financeiro 
      WHERE caixa_quitacao_id = ? AND status = 'pago'
    `, [caixa_origem_id]);
    
    const [transferenciasRecebidas] = await db.query(`
      SELECT COALESCE(SUM(valor), 0) AS total 
      FROM transferencias_caixas 
      WHERE caixa_destino_id = ?
    `, [caixa_origem_id]);
    
    const [transferenciasEnviadas] = await db.query(`
      SELECT COALESCE(SUM(valor), 0) AS total 
      FROM transferencias_caixas 
      WHERE caixa_origem_id = ?
    `, [caixa_origem_id]);

    // Calcular saldo atual
    const valorInicial = parseFloat(caixaInfo[0].valor_inicial);
    const recebido = parseFloat(financeiroData[0].recebido) || 0;
    const pago = parseFloat(financeiroData[0].pago) || 0;
    const transferenciasRecebidasTotal = parseFloat(transferenciasRecebidas[0].total) || 0;
    const transferenciasEnviadasTotal = parseFloat(transferenciasEnviadas[0].total) || 0;
    
    const saldoAtual = valorInicial + recebido - pago + transferenciasRecebidasTotal - transferenciasEnviadasTotal;
    
    // Debug: Log dos valores calculados
    console.log('🔍 DEBUG Transferência:');
    console.log('Caixa Origem ID:', caixa_origem_id);
    console.log('Valor Inicial:', valorInicial);
    console.log('Recebido:', recebido);
    console.log('Pago:', pago);
    console.log('Transferências Recebidas:', transferenciasRecebidasTotal);
    console.log('Transferências Enviadas:', transferenciasEnviadasTotal);
    console.log('Saldo Calculado:', saldoAtual);
    console.log('Valor Transferência:', valorNumerico);
    
    if (saldoAtual < valorNumerico) {
      const [caixas] = await db.query('SELECT id, nome, ativo FROM caixas WHERE ativo = true ORDER BY nome');
      return res.render('caixas/transferir', {
        caixas,
        erro: `Saldo insuficiente. Saldo atual: R$ ${saldoAtual.toFixed(2)}`,
        usuario: req.session.usuario || {}
      });
    }

    // Iniciar transação
    await db.query('START TRANSACTION');

    try {
      // Criar registro de transferência
      const transferencia = {
        caixa_origem_id: caixa_origem_id,
        caixa_destino_id: caixa_destino_id,
        valor: valorNumerico,
        descricao: descricao || null,
        usuario_id: usuario_id
      };

      await db.query('INSERT INTO transferencias_caixas SET ?', [transferencia]);

      // Confirmar transação
      await db.query('COMMIT');

      res.redirect('/caixas/consulta?sucesso=Transferência realizada com sucesso!');
    } catch (erroTransacao) {
      // Reverter transação em caso de erro
      await db.query('ROLLBACK');
      throw erroTransacao;
    }

  } catch (erro) {
    console.error('Erro ao realizar transferência:', erro);
    const [caixas] = await db.query('SELECT id, nome, ativo FROM caixas WHERE ativo = true ORDER BY nome');
    res.render('caixas/transferir', {
      caixas,
      erro: 'Erro ao realizar transferência. Tente novamente.',
      usuario: req.session.usuario || {}
    });
  }
});

// Rota para histórico de transferências
router.get('/historico', async (req, res) => {
  try {
    const { pagina = 1, busca = '' } = req.query;
    const limite = 10;
    const offset = (pagina - 1) * limite;

    let sql = `
      SELECT 
        t.id,
        t.valor,
        t.descricao,
        t.data_transferencia,
        co.nome AS caixa_origem_nome,
        cd.nome AS caixa_destino_nome,
        u.nome AS usuario_nome
      FROM transferencias_caixas t
      JOIN caixas co ON t.caixa_origem_id = co.id
      JOIN caixas cd ON t.caixa_destino_id = cd.id
      JOIN usuarios u ON t.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (busca) {
      sql += ' AND (co.nome LIKE ? OR cd.nome LIKE ? OR t.descricao LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    sql += ' ORDER BY t.data_transferencia DESC LIMIT ? OFFSET ?';
    params.push(limite, offset);

    const [transferencias] = await db.query(sql, params);

    // Contar total
    let countSql = `
      SELECT COUNT(*) as total
      FROM transferencias_caixas t
      JOIN caixas co ON t.caixa_origem_id = co.id
      JOIN caixas cd ON t.caixa_destino_id = cd.id
      WHERE 1=1
    `;
    const countParams = [];

    if (busca) {
      countSql += ' AND (co.nome LIKE ? OR cd.nome LIKE ? OR t.descricao LIKE ?)';
      countParams.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    const [total] = await db.query(countSql, countParams);
    const totalPaginas = Math.ceil(total[0].total / limite);

    res.render('caixas/historico', {
      transferencias,
      pagina: parseInt(pagina),
      totalPaginas,
      busca,
      erro: null,
      usuario: req.session.usuario || {}
    });
  } catch (erro) {
    console.error('Erro ao carregar histórico de transferências:', erro);
    res.render('caixas/historico', {
      transferencias: [],
      pagina: 1,
      totalPaginas: 1,
      busca: '',
      erro: 'Erro ao carregar histórico.',
      usuario: req.session.usuario || {}
    });
  }
});

module.exports = router;