const express = require('express');
const router = express.Router();
const db = require('../db');

// 📄 Listagem com filtros e paginação
router.get('/', async (req, res) => {
  const { busca = '', tipo = '', status = 'pendente', pagina = 1, data_inicio = '', data_fim = '', caixa_quitacao_id = '' } = req.query;
  // Verificar se caixa_id foi passado explicitamente na query
  const caixa_id = req.query.caixa_id !== undefined ? req.query.caixa_id : undefined;
  const limite = 10;
  const offset = (pagina - 1) * limite;

  try {
    // Buscar caixas disponíveis
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true ORDER BY nome');
    
    // Se caixa_id não foi fornecido na query (primeira carga), buscar o ID do "Sicredi PJ" como padrão
    // Se foi passado como string vazia (usuário selecionou "Todos"), não filtrar
    let caixaIdFiltro = caixa_id;
    if (caixa_id === undefined) {
      // Primeira carga: aplicar padrão "Sicredi PJ"
      const [caixaPadrao] = await db.query("SELECT id FROM caixas WHERE nome = 'Sicredi PJ' AND ativo = true LIMIT 1");
      if (caixaPadrao.length > 0) {
        caixaIdFiltro = caixaPadrao[0].id.toString();
      } else {
        caixaIdFiltro = '';
      }
    } else if (caixa_id === '') {
      // Usuário selecionou "Todos os caixas": não filtrar
      caixaIdFiltro = '';
    }

  let sql = `
    SELECT f.id, f.tipo, f.valor, f.vencimento, f.status, f.descricao,
           f.parcela_atual, f.total_parcelas, f.parcela_pai_id, f.data_quitacao,
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

  if (caixaIdFiltro) {
    sql += ' AND f.caixa_id = ?';
    params.push(caixaIdFiltro);
  }

  if (data_inicio) {
    sql += ' AND DATE(f.vencimento) >= ?';
    params.push(data_inicio);
  }
  if (data_fim) {
    sql += ' AND DATE(f.vencimento) <= ?';
    params.push(data_fim);
  }

  if (caixa_quitacao_id) {
    sql += ' AND f.caixa_quitacao_id = ?';
    params.push(caixa_quitacao_id);
  }

  sql += ' ORDER BY f.vencimento DESC LIMIT ? OFFSET ?';
  params.push(limite, offset);

    const [lancamentos] = await db.query(sql, params);

    const countParams = [];
    let countSql = `
      SELECT COUNT(*) AS total
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      WHERE 1 = 1
    `;

    if (busca) {
      countSql += ' AND (f.descricao LIKE ? OR p.nome LIKE ?)';
      countParams.push(`%${busca}%`, `%${busca}%`);
    }

    if (tipo) {
      countSql += ' AND f.tipo = ?';
      countParams.push(tipo);
    }

    if (status) {
      countSql += ' AND f.status = ?';
      countParams.push(status);
    }

    if (caixaIdFiltro) {
      countSql += ' AND f.caixa_id = ?';
      countParams.push(caixaIdFiltro);
    }
    if (data_inicio) {
      countSql += ' AND DATE(f.vencimento) >= ?';
      countParams.push(data_inicio);
    }
    if (data_fim) {
      countSql += ' AND DATE(f.vencimento) <= ?';
      countParams.push(data_fim);
    }
    if (caixa_quitacao_id) {
      countSql += ' AND f.caixa_quitacao_id = ?';
      countParams.push(caixa_quitacao_id);
    }

    const [totalResult] = await db.query(countSql, countParams);
    const totalPaginas = Math.ceil(totalResult[0].total / limite);

    res.render('financeiro/listar', {
      titulo: 'Lançamentos Financeiros',
      lancamentos,
      caixas,
      busca,
      tipo,
      status,
      caixa_id: caixa_id || '',
      caixa_quitacao_id: caixa_quitacao_id || '',
      data_inicio: data_inicio || '',
      data_fim: data_fim || '',
      pagina: Number(pagina),
      totalPaginas,
      erro: req.query.erro || null,
      sucesso: req.query.sucesso || null
    });
  } catch (erro) {
    console.error('Erro ao buscar lançamentos:', erro);
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true ORDER BY nome');
    res.render('financeiro/listar', {
      titulo: 'Lançamentos Financeiros',
      lancamentos: [],
      caixas: caixas || [],
      busca,
      tipo,
      status,
      caixa_id: '',
      caixa_quitacao_id: '',
      data_inicio: data_inicio || '',
      data_fim: data_fim || '',
      pagina: 1,
      totalPaginas: 0,
      erro: 'Erro ao carregar lançamentos.',
      sucesso: null
    });
  }
});

// 🆕 Formulário de novo lançamento
router.get('/novo', async (req, res) => {
  try {
    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

    res.render('financeiro/nova', {
      titulo: 'Novo Lançamento Financeiro',
      pessoas,
      caixas,
      erro: null,
      sucesso: null
    });
  } catch (erro) {
    console.error('Erro ao carregar dados:', erro);
    res.render('financeiro/nova', {
      titulo: 'Novo Lançamento Financeiro',
      pessoas: [],
      caixas: [],
      erro: 'Erro ao carregar dados.',
      sucesso: null
    });
  }
});

// 💾 Salvar novo lançamento
router.post('/novo', async (req, res) => {
  const {
    tipo,
    pessoa_id,
    caixa_id,
    valor,
    vencimento,
    status,
    descricao,
    parcelamento,
    total_parcelas,
    intervalo_dias
  } = req.body;

  try {
    const valorFinal = parseFloat(valor);
    const numParcelas = parcelamento === 'parcelado' ? parseInt(total_parcelas) || 2 : 1;
    const intervalo = parseInt(intervalo_dias) || 30;

    if (!tipo || !pessoa_id || !caixa_id || !valorFinal || valorFinal <= 0 || !vencimento) {
      const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
      const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

      return res.render('financeiro/nova', {
        titulo: 'Novo Lançamento Financeiro',
        erro: 'Todos os campos obrigatórios devem ser preenchidos.',
        sucesso: null,
        pessoas,
        caixas
      });
    }

    // Calcular valor por parcela
    const valorParcela = valorFinal / numParcelas;

    // Criar lançamentos (parcelas)
    const lancamentos = [];
    let parcelaPaiId = null;

    for (let i = 1; i <= numParcelas; i++) {
      // Calcular data de vencimento da parcela
      const dataVencimento = new Date(vencimento);
      dataVencimento.setDate(dataVencimento.getDate() + ((i - 1) * intervalo));

      const lancamento = {
        tipo,
        pessoa_id,
        caixa_id: parseInt(caixa_id),
        valor: valorParcela,
        vencimento: dataVencimento.toISOString().split('T')[0],
        status,
        descricao: numParcelas > 1 ? `${descricao} - Parcela ${i}/${numParcelas}` : descricao,
        parcela_atual: i,
        total_parcelas: numParcelas,
        parcela_pai_id: parcelaPaiId
      };

      // Se status = pago, já quitar: dar baixa no caixa (caixa_quitacao_id + data_quitacao)
      if (status === 'pago') {
        lancamento.caixa_quitacao_id = parseInt(caixa_id);
        lancamento.data_quitacao = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }

      // Se for a primeira parcela, salvar e obter o ID para usar como parcela_pai_id
      if (i === 1) {
        const [result] = await db.query('INSERT INTO financeiro SET ?', lancamento);
        parcelaPaiId = result.insertId;
        lancamento.parcela_pai_id = parcelaPaiId;
        await db.query('UPDATE financeiro SET parcela_pai_id = ? WHERE id = ?', [parcelaPaiId, parcelaPaiId]);
      } else {
        lancamento.parcela_pai_id = parcelaPaiId;
        await db.query('INSERT INTO financeiro SET ?', lancamento);
      }

      lancamentos.push(lancamento);
    }

    const mensagem = numParcelas > 1 
      ? `Lançamento parcelado salvo com sucesso! ${numParcelas} parcelas criadas.`
      : 'Lançamento salvo com sucesso!';

    res.redirect(`/financeiro?sucesso=${encodeURIComponent(mensagem)}`);
  } catch (erro) {
    console.error('Erro ao salvar lançamento:', erro);
    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

    res.render('financeiro/nova', {
      titulo: 'Novo Lançamento Financeiro',
      erro: 'Erro ao salvar lançamento.',
      sucesso: null,
      pessoas,
      caixas
    });
  }
});

// ✏️ Formulário de edição
router.get('/editar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [[lancamento]] = await db.query('SELECT * FROM financeiro WHERE id = ?', [id]);
    if (!lancamento) {
      return res.redirect('/financeiro?erro=Lançamento não encontrado');
    }

    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

    // Se o lançamento veio de uma OS, buscar dados da OS (incluindo problema_informado)
    let os = null;
    if (lancamento.ordem_servico_id) {
      const [[osRow]] = await db.query(
        'SELECT id, numero_os, tipo_servico, problema_informado FROM ordens_servico WHERE id = ?',
        [lancamento.ordem_servico_id]
      );
      os = osRow;
    }

    res.render('financeiro/editar', {
      titulo: 'Editar Lançamento Financeiro',
      lancamento,
      os,
      pessoas,
      caixas,
      erro: null,
      sucesso: null
    });
  } catch (erro) {
    console.error('Erro ao carregar edição:', erro.message, erro.stack);
    res.redirect('/financeiro?erro=Erro ao carregar edição');
  }
});


router.post('/editar/:id', async (req, res) => {
  const { id } = req.params;
  const {
    tipo,
    pessoa_id,
    caixa_id,
    caixa_quitacao_id,
    valor,
    vencimento,
    status,
    descricao
  } = req.body;

  try {
    if (!tipo || !pessoa_id || !caixa_id || !valor || !vencimento) {
      const [[lancamento]] = await db.query('SELECT * FROM financeiro WHERE id = ?', [id]);
      const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
      const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');
      let os = null;
      if (lancamento.ordem_servico_id) {
        const [[osRow]] = await db.query(
          'SELECT id, numero_os, tipo_servico, problema_informado FROM ordens_servico WHERE id = ?',
          [lancamento.ordem_servico_id]
        );
        os = osRow;
      }
      return res.render('financeiro/editar', {
        titulo: 'Editar Lançamento Financeiro',
        erro: 'Todos os campos obrigatórios devem ser preenchidos.',
        sucesso: null,
        lancamento,
        os,
        pessoas,
        caixas
      });
    }

    const valorFinal = parseFloat(valor) || 0;

    await db.query('UPDATE financeiro SET ? WHERE id = ?', [{
      tipo,
      pessoa_id,
      caixa_id: parseInt(caixa_id),
      caixa_quitacao_id: parseInt(caixa_quitacao_id),
      valor: valorFinal,
      vencimento,
      status,
      descricao
    }, id]);

    res.redirect('/financeiro?sucesso=Lançamento atualizado com sucesso!');
  } catch (erro) {
    console.error('Erro ao atualizar lançamento:', erro);
    const [[lancamento]] = await db.query('SELECT * FROM financeiro WHERE id = ?', [id]);
    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');
    let os = null;
    if (lancamento.ordem_servico_id) {
      const [[osRow]] = await db.query(
        'SELECT id, numero_os, tipo_servico, problema_informado FROM ordens_servico WHERE id = ?',
        [lancamento.ordem_servico_id]
      );
      os = osRow;
    }
    res.render('financeiro/editar', {
      titulo: 'Editar Lançamento Financeiro',
      erro: 'Erro ao atualizar lançamento.',
      sucesso: null,
      lancamento,
      os,
      pessoas,
      caixas
    });
  }
});

// 👁️ Exibir detalhes do lançamento
router.get('/exibir/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [[lancamento]] = await db.query(`
      SELECT f.*, p.nome AS pessoa_nome,
             c1.nome AS caixa_origem_nome,
             c2.nome AS caixa_quitacao_nome
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c1 ON f.caixa_id = c1.id
      LEFT JOIN caixas c2 ON f.caixa_quitacao_id = c2.id
      WHERE f.id = ?
    `, [id]);

    if (!lancamento) {
      return res.redirect('/financeiro?erro=Lançamento não encontrado');
    }

    // Se o lançamento veio de uma OS, buscar dados da OS (incluindo problema_informado)
    let os = null;
    if (lancamento.ordem_servico_id) {
      const [[osRow]] = await db.query(
        'SELECT id, numero_os, tipo_servico, problema_informado FROM ordens_servico WHERE id = ?',
        [lancamento.ordem_servico_id]
      );
      os = osRow;
    }

    res.render('financeiro/exibir', {
      titulo: 'Detalhes do Lançamento',
      lancamento,
      os
    });
  } catch (erro) {
    console.error('Erro ao exibir lançamento:', erro);
    res.redirect('/financeiro?erro=Erro ao exibir lançamento.');
  }
});

// 🗑️ Excluir lançamento
router.post('/excluir/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM financeiro WHERE id = ?', [id]);
    res.redirect('/financeiro?sucesso=Lançamento excluído com sucesso!');
  } catch (erro) {
    console.error('Erro ao excluir lançamento:', erro);
    res.redirect('/financeiro?erro=Erro ao excluir lançamento.');
  }
});

// 💳 Quitar lançamento financeiro
router.post('/quitar/:id', async (req, res) => {
  const { id } = req.params;
  const { caixa_quitacao_id } = req.body;

  try {
    await db.query(`
      UPDATE financeiro
      SET status = 'pago',
          caixa_quitacao_id = ?,
          data_quitacao = NOW()
      WHERE id = ?
    `, [parseInt(caixa_quitacao_id), id]);

    res.redirect('/financeiro?sucesso=Lançamento quitado com sucesso!');
  } catch (erro) {
    console.error('Erro ao quitar lançamento:', erro);
    res.redirect('/financeiro?erro=Erro ao quitar lançamento.');
  }
});

// 🧾 Imprimir recibo de pagamento
router.get('/recibo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [lancamentos] = await db.query(`
      SELECT f.id, f.valor, f.descricao, f.status, f.parcela_atual, f.total_parcelas,
             f.ordem_servico_id, f.data_quitacao,
             p.nome AS pessoa_nome,
             c.nome AS caixa_quitacao_nome
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c ON f.caixa_quitacao_id = c.id
      WHERE f.id = ? AND f.status = 'pago'
    `, [id]);

    if (lancamentos.length === 0) {
      return res.status(404).render('erro', {
        titulo: 'Recibo não encontrado',
        mensagem: 'Lançamento não encontrado ou não foi quitado.',
        layout: false
      });
    }

    res.render('financeiro/recibo', {
      titulo: 'Recibo de Pagamento',
      lancamento: lancamentos[0],
      layout: false
    });
  } catch (erro) {
    console.error('Erro ao gerar recibo:', erro);
    res.status(500).render('erro', {
      titulo: 'Erro ao gerar recibo',
      mensagem: 'Erro interno do servidor.',
      layout: false
    });
  }
});

// 🔄 Converter lançamento único em parcelado
router.get('/parcelar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar o lançamento atual
    const [[lancamento]] = await db.query(`
      SELECT f.*, p.nome AS pessoa_nome,
             c1.nome AS caixa_origem_nome
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c1 ON f.caixa_id = c1.id
      WHERE f.id = ? AND f.total_parcelas = 1
    `, [id]);

    if (!lancamento) {
      return res.redirect('/financeiro?erro=Lançamento não encontrado ou já é parcelado.');
    }

    // Buscar caixas disponíveis
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

    res.render('financeiro/parcelar', {
      titulo: 'Parcelar Lançamento',
      lancamento,
      caixas,
      erro: null
    });
  } catch (erro) {
    console.error('Erro ao carregar parcelamento:', erro);
    res.redirect('/financeiro?erro=Erro ao carregar dados para parcelamento.');
  }
});

// 💾 Processar parcelamento de lançamento existente
router.post('/parcelar/:id', async (req, res) => {
  const { id } = req.params;
  const {
    total_parcelas,
    intervalo_dias,
    vencimento,
    caixa_id,
    observacoes
  } = req.body;

  try {
    // Buscar o lançamento atual
    const [[lancamentoAtual]] = await db.query(`
      SELECT * FROM financeiro 
      WHERE id = ? AND total_parcelas = 1
    `, [id]);

    if (!lancamentoAtual) {
      return res.redirect('/financeiro?erro=Lançamento não encontrado ou já é parcelado.');
    }

    const numParcelas = parseInt(total_parcelas) || 2;
    const intervalo = parseInt(intervalo_dias) || 30;
    const valorParcela = parseFloat(lancamentoAtual.valor) / numParcelas;
    const caixaId = parseInt(caixa_id) || lancamentoAtual.caixa_id;

    // Iniciar transação
    await db.query('START TRANSACTION');

    try {
      // Atualizar o lançamento atual para ser a primeira parcela
      await db.query(`
        UPDATE financeiro SET
          valor = ?,
          vencimento = ?,
          caixa_id = ?,
          parcela_atual = 1,
          total_parcelas = ?,
          parcela_pai_id = ?,
          descricao = ?
        WHERE id = ?
      `, [
        valorParcela,
        vencimento,
        caixaId,
        numParcelas,
        id, // Será a parcela pai
        `${lancamentoAtual.descricao} - Parcela 1/${numParcelas}${observacoes ? ` - ${observacoes}` : ''}`,
        id
      ]);

      // Criar as parcelas restantes
      for (let i = 2; i <= numParcelas; i++) {
        const dataVencimento = new Date(vencimento);
        dataVencimento.setDate(dataVencimento.getDate() + ((i - 1) * intervalo));

        await db.query(`
          INSERT INTO financeiro (
            tipo, pessoa_id, caixa_id, valor, vencimento, status, descricao,
            parcela_atual, total_parcelas, parcela_pai_id, ordem_servico_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          lancamentoAtual.tipo,
          lancamentoAtual.pessoa_id,
          caixaId,
          valorParcela,
          dataVencimento.toISOString().split('T')[0],
          lancamentoAtual.status,
          `${lancamentoAtual.descricao} - Parcela ${i}/${numParcelas}${observacoes ? ` - ${observacoes}` : ''}`,
          i,
          numParcelas,
          id,
          lancamentoAtual.ordem_servico_id
        ]);
      }

      // Confirmar transação
      await db.query('COMMIT');

      res.redirect(`/financeiro?sucesso=Lançamento parcelado com sucesso! ${numParcelas} parcelas criadas.`);
    } catch (erro) {
      // Reverter transação em caso de erro
      await db.query('ROLLBACK');
      throw erro;
    }
  } catch (erro) {
    console.error('Erro ao parcelar lançamento:', erro);
    res.redirect('/financeiro?erro=Erro ao parcelar lançamento.');
  }
});

// 💰 Relatório de Contas a Receber
router.get('/contas-receber', async (req, res) => {
  const { busca = '', status_vencimento = 'pendentes', pagina = 1, data_inicio = '', data_fim = '' } = req.query;
    const limite = 10;
  const offset = (pagina - 1) * limite;

  let sql = `
    SELECT f.id, f.tipo, f.valor, f.vencimento, f.status, f.descricao,
           f.parcela_atual, f.total_parcelas, f.parcela_pai_id,
           p.nome AS pessoa_nome, p.telefone, p.email, p.codigo_pais,
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

  if (data_inicio) {
    sql += ' AND DATE(f.vencimento) >= ?';
    params.push(data_inicio);
  }
  if (data_fim) {
    sql += ' AND DATE(f.vencimento) <= ?';
    params.push(data_fim);
  }

  sql += ' ORDER BY f.vencimento ASC LIMIT ? OFFSET ?';
  params.push(limite, offset);

  try {
    const [lancamentos] = await db.query(sql, params);

    // Calcular totais (com mesmos filtros)
    let totaisSql = `
      SELECT 
        COUNT(*) as total_lancamentos,
        SUM(CASE WHEN f.vencimento < CURDATE() AND f.status = 'pendente' THEN f.valor ELSE 0 END) as total_vencidas,
        SUM(CASE WHEN f.vencimento = CURDATE() AND f.status = 'pendente' THEN f.valor ELSE 0 END) as total_vencendo_hoje,
        SUM(CASE WHEN f.vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND f.status = 'pendente' THEN f.valor ELSE 0 END) as total_vencendo_7_dias,
        SUM(CASE WHEN f.status = 'pendente' THEN f.valor ELSE 0 END) as total_pendentes,
        SUM(CASE WHEN f.status = 'pago' THEN f.valor ELSE 0 END) as total_quitadas
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      WHERE f.tipo = 'receber'
    `;
    const totaisParams = [];
    if (busca) { totaisSql += ' AND (f.descricao LIKE ? OR p.nome LIKE ?)'; totaisParams.push(`%${busca}%`, `%${busca}%`); }
    if (status_vencimento && status_vencimento !== 'todas') {
      if (status_vencimento === 'vencidas') totaisSql += ' AND f.vencimento < CURDATE() AND f.status = "pendente"';
      else if (status_vencimento === 'vencendo_hoje') totaisSql += ' AND f.vencimento = CURDATE() AND f.status = "pendente"';
      else if (status_vencimento === 'vencendo_7_dias') totaisSql += ' AND f.vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND f.status = "pendente"';
      else if (status_vencimento === 'pendentes') totaisSql += ' AND f.status = "pendente"';
      else if (status_vencimento === 'quitadas') totaisSql += ' AND f.status = "pago"';
    }
    if (data_inicio) { totaisSql += ' AND DATE(f.vencimento) >= ?'; totaisParams.push(data_inicio); }
    if (data_fim) { totaisSql += ' AND DATE(f.vencimento) <= ?'; totaisParams.push(data_fim); }
    const [totais] = await db.query(totaisSql, totaisParams);

    // Contar total de páginas
    let countSql = `
      SELECT COUNT(*) as total
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      WHERE f.tipo = 'receber'
    `;
    const countParams = [];

    if (busca) {
      countSql += ' AND (f.descricao LIKE ? OR p.nome LIKE ?)';
      countParams.push(`%${busca}%`, `%${busca}%`);
    }

    if (status_vencimento && status_vencimento !== 'todas') {
      if (status_vencimento === 'vencidas') {
        countSql += ' AND f.vencimento < CURDATE() AND f.status = "pendente"';
      } else if (status_vencimento === 'vencendo_hoje') {
        countSql += ' AND f.vencimento = CURDATE() AND f.status = "pendente"';
      } else if (status_vencimento === 'vencendo_7_dias') {
        countSql += ' AND f.vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND f.status = "pendente"';
      } else if (status_vencimento === 'pendentes') {
        countSql += ' AND f.status = "pendente"';
      } else if (status_vencimento === 'quitadas') {
        countSql += ' AND f.status = "pago"';
      }
    }
    if (data_inicio) { countSql += ' AND DATE(f.vencimento) >= ?'; countParams.push(data_inicio); }
    if (data_fim) { countSql += ' AND DATE(f.vencimento) <= ?'; countParams.push(data_fim); }

    const [countResult] = await db.query(countSql, countParams);
    const totalPaginas = Math.ceil(countResult[0].total / limite);

    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

    res.render('financeiro/contas-receber', {
      titulo: 'Relatório - Contas a Receber',
      lancamentos,
      totais: totais[0],
      caixas,
      busca,
      status_vencimento,
      data_inicio: data_inicio || '',
      data_fim: data_fim || '',
      pagina: parseInt(pagina),
      totalPaginas,
      erro: req.query.erro,
      sucesso: req.query.sucesso
    });
  } catch (error) {
    console.error('Erro ao carregar contas a receber:', error);
    res.render('financeiro/contas-receber', {
      titulo: 'Relatório - Contas a Receber',
      lancamentos: [],
      totais: {},
      caixas: [],
      busca: '',
      status_vencimento: 'todas',
      data_inicio: '',
      data_fim: '',
      pagina: 1,
      totalPaginas: 0,
      erro: 'Erro ao carregar dados.',
      sucesso: null
    });
  }
});

// 💸 Relatório de Contas a Pagar (mesmo padrão de Contas a Receber)
router.get('/contas-pagar', async (req, res) => {
  const { busca = '', status_vencimento = 'pendentes', pagina = 1, data_inicio = '', data_fim = '' } = req.query;
  const limite = 10;
  const offset = (pagina - 1) * limite;

  let sql = `
    SELECT f.id, f.tipo, f.valor, f.vencimento, f.status, f.descricao,
           f.parcela_atual, f.total_parcelas, f.parcela_pai_id,
           p.nome AS pessoa_nome, p.telefone, p.email, p.codigo_pais,
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
    WHERE f.tipo = 'pagar'
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

  if (data_inicio) {
    sql += ' AND DATE(f.vencimento) >= ?';
    params.push(data_inicio);
  }
  if (data_fim) {
    sql += ' AND DATE(f.vencimento) <= ?';
    params.push(data_fim);
  }

  sql += ' ORDER BY f.vencimento ASC LIMIT ? OFFSET ?';
  params.push(limite, offset);

  try {
    const [lancamentos] = await db.query(sql, params);

    let totaisSqlPagar = `
      SELECT 
        COUNT(*) as total_lancamentos,
        SUM(CASE WHEN f.vencimento < CURDATE() AND f.status = 'pendente' THEN f.valor ELSE 0 END) as total_vencidas,
        SUM(CASE WHEN f.vencimento = CURDATE() AND f.status = 'pendente' THEN f.valor ELSE 0 END) as total_vencendo_hoje,
        SUM(CASE WHEN f.vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND f.status = 'pendente' THEN f.valor ELSE 0 END) as total_vencendo_7_dias,
        SUM(CASE WHEN f.status = 'pendente' THEN f.valor ELSE 0 END) as total_pendentes,
        SUM(CASE WHEN f.status = 'pago' THEN f.valor ELSE 0 END) as total_quitadas
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      WHERE f.tipo = 'pagar'
    `;
    const totaisParamsPagar = [];
    if (busca) { totaisSqlPagar += ' AND (f.descricao LIKE ? OR p.nome LIKE ?)'; totaisParamsPagar.push(`%${busca}%`, `%${busca}%`); }
    if (status_vencimento && status_vencimento !== 'todas') {
      if (status_vencimento === 'vencidas') totaisSqlPagar += ' AND f.vencimento < CURDATE() AND f.status = "pendente"';
      else if (status_vencimento === 'vencendo_hoje') totaisSqlPagar += ' AND f.vencimento = CURDATE() AND f.status = "pendente"';
      else if (status_vencimento === 'vencendo_7_dias') totaisSqlPagar += ' AND f.vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND f.status = "pendente"';
      else if (status_vencimento === 'pendentes') totaisSqlPagar += ' AND f.status = "pendente"';
      else if (status_vencimento === 'quitadas') totaisSqlPagar += ' AND f.status = "pago"';
    }
    if (data_inicio) { totaisSqlPagar += ' AND DATE(f.vencimento) >= ?'; totaisParamsPagar.push(data_inicio); }
    if (data_fim) { totaisSqlPagar += ' AND DATE(f.vencimento) <= ?'; totaisParamsPagar.push(data_fim); }
    const [totais] = await db.query(totaisSqlPagar, totaisParamsPagar);

    let countSql = `
      SELECT COUNT(*) as total
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      WHERE f.tipo = 'pagar'
    `;
    const countParams = [];

    if (busca) {
      countSql += ' AND (f.descricao LIKE ? OR p.nome LIKE ?)';
      countParams.push(`%${busca}%`, `%${busca}%`);
    }

    if (status_vencimento && status_vencimento !== 'todas') {
      if (status_vencimento === 'vencidas') {
        countSql += ' AND f.vencimento < CURDATE() AND f.status = "pendente"';
      } else if (status_vencimento === 'vencendo_hoje') {
        countSql += ' AND f.vencimento = CURDATE() AND f.status = "pendente"';
      } else if (status_vencimento === 'vencendo_7_dias') {
        countSql += ' AND f.vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND f.status = "pendente"';
      } else if (status_vencimento === 'pendentes') {
        countSql += ' AND f.status = "pendente"';
      } else if (status_vencimento === 'quitadas') {
        countSql += ' AND f.status = "pago"';
      }
    }
    if (data_inicio) { countSql += ' AND DATE(f.vencimento) >= ?'; countParams.push(data_inicio); }
    if (data_fim) { countSql += ' AND DATE(f.vencimento) <= ?'; countParams.push(data_fim); }

    const [countResult] = await db.query(countSql, countParams);
    const totalPaginas = Math.ceil(countResult[0].total / limite);

    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

    res.render('financeiro/contas-pagar', {
      titulo: 'Relatório - Contas a Pagar',
      lancamentos,
      totais: totais[0],
      caixas,
      busca,
      status_vencimento,
      data_inicio: data_inicio || '',
      data_fim: data_fim || '',
      pagina: parseInt(pagina),
      totalPaginas,
      erro: req.query.erro,
      sucesso: req.query.sucesso
    });
  } catch (error) {
    console.error('Erro ao carregar contas a pagar:', error);
    res.render('financeiro/contas-pagar', {
      titulo: 'Relatório - Contas a Pagar',
      lancamentos: [],
      totais: {},
      caixas: [],
      busca: '',
      status_vencimento: 'todas',
      data_inicio: '',
      data_fim: '',
      pagina: 1,
      totalPaginas: 0,
      erro: 'Erro ao carregar dados.',
      sucesso: null
    });
  }
});

// 📋 Visualizar todas as parcelas de um lançamento
router.get('/parcelas/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar a parcela principal
    const [[lancamentoPrincipal]] = await db.query(`
      SELECT f.*, p.nome AS pessoa_nome,
             c1.nome AS caixa_origem_nome,
             c2.nome AS caixa_quitacao_nome
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c1 ON f.caixa_id = c1.id
      LEFT JOIN caixas c2 ON f.caixa_quitacao_id = c2.id
      WHERE f.id = ?
    `, [id]);

    if (!lancamentoPrincipal) {
      return res.redirect('/financeiro?erro=Lançamento não encontrado');
    }

    // Buscar todas as parcelas do grupo
    const parcelaPaiId = lancamentoPrincipal.parcela_pai_id || id;
    const [parcelas] = await db.query(`
      SELECT f.*, p.nome AS pessoa_nome,
             c1.nome AS caixa_origem_nome,
             c2.nome AS caixa_quitacao_nome
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c1 ON f.caixa_id = c1.id
      LEFT JOIN caixas c2 ON f.caixa_quitacao_id = c2.id
      WHERE f.parcela_pai_id = ? OR f.id = ?
      ORDER BY f.parcela_atual ASC
    `, [parcelaPaiId, parcelaPaiId]);

    // Calcular totais
    const totalValor = parcelas.reduce((sum, p) => sum + parseFloat(p.valor), 0);
    const parcelasPagas = parcelas.filter(p => p.status === 'pago').length;
    const parcelasPendentes = parcelas.filter(p => p.status === 'pendente').length;

    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true ORDER BY nome');

    res.render('financeiro/parcelas', {
      titulo: 'Parcelas do Lançamento',
      lancamentoPrincipal,
      parcelas,
      caixas,
      totalValor,
      parcelasPagas,
      parcelasPendentes,
      totalParcelas: parcelas.length
    });
  } catch (erro) {
    console.error('Erro ao buscar parcelas:', erro);
    res.redirect('/financeiro?erro=Erro ao carregar parcelas.');
  }
});

// 📊 Relatório financeiro por período
router.get('/relatorio', async (req, res) => {
  const { inicio, fim, status } = req.query;

  if (!inicio || !fim) {
    return res.render('financeiro/relatorio', {
      titulo: 'Relatório Financeiro',
      lancamentos: [],
      totalReceber: 0,
      totalPagar: 0,
      inicio,
      fim,
      status: status || ''
    });
  }

  try {
    let sql = `
      SELECT f.*, p.nome AS pessoa_nome,
             c1.nome AS caixa_origem_nome,
             c2.nome AS caixa_quitacao_nome
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c1 ON f.caixa_id = c1.id
      LEFT JOIN caixas c2 ON f.caixa_quitacao_id = c2.id
      WHERE f.vencimento BETWEEN ? AND ?
    `;
    
    const params = [inicio, fim];
    
    // Aplicar filtro de status se fornecido
    if (status && status.trim() !== '') {
      sql += ' AND f.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY f.vencimento ASC';
    
    const [lancamentos] = await db.query(sql, params);

    let totalReceber = 0;
    let totalPagar = 0;

    lancamentos.forEach(l => {
      if (l.tipo === 'receber') totalReceber += parseFloat(l.valor) || 0;
      if (l.tipo === 'pagar') totalPagar += parseFloat(l.valor) || 0;
    });

    res.render('financeiro/relatorio', {
      titulo: 'Relatório Financeiro',
      lancamentos,
      totalReceber,
      totalPagar,
      inicio,
      fim,
      status: status || '',
      erro: null
    });
  } catch (erro) {
    console.error('Erro ao gerar relatório:', erro);
    res.render('financeiro/relatorio', {
      titulo: 'Relatório Financeiro',
      lancamentos: [],
      totalReceber: 0,
      totalPagar: 0,
      inicio,
      fim,
      status: status || '',
      erro: 'Erro ao gerar relatório.'
    });
  }
});

module.exports = router;