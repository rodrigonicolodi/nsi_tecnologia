const db = require('../db');

module.exports = {
  // Renderiza o formulário de nova OS com dados de pessoas
  novaOS: async (req, res) => {
    try {
      const [pessoas] = await db.query('SELECT id, nome FROM pessoas ORDER BY nome');
      res.render('os/nova', {
        titulo: 'Nova Ordem de Serviço',
        pessoas,
        erro: null
      });
    } catch (err) {
      console.error('Erro ao carregar pessoas:', err);
      res.status(500).render('os/nova', {
        titulo: 'Nova Ordem de Serviço',
        erro: 'Erro ao carregar dados de pessoas.',
        pessoas: []
      });
    }
  },

  // Salva os dados da OS no banco com número automático
  salvarOS: async (req, res) => {
    try {
      const {
        solicitante_id,
        responsavel_id,
        tipo_servico,
        prioridade,
        problema_informado,
        valor_servico,
        desconto,
        acrescimos
      } = req.body;

      const valor_total = parseFloat(valor_servico || 0) - parseFloat(desconto || 0) + parseFloat(acrescimos || 0);

      const [[{ ultimo }]] = await db.query(`
        SELECT MAX(CAST(SUBSTRING(numero_os, 4) AS UNSIGNED)) AS ultimo
        FROM ordens_servico
        WHERE numero_os LIKE 'OS-%'
      `);
      const proximoNumero = (parseInt(ultimo) || 0) + 1;
      const numero_os = `OS-${String(proximoNumero).padStart(5, '0')}`;

      await db.query(`
        INSERT INTO ordens_servico (
          numero_os,
          solicitante_id,
          responsavel_id,
          tipo_servico,
          prioridade,
          problema_informado,
          valor_servico,
          desconto,
          acrescimos,
          valor_total,
          status,
          data_abertura
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aberta', NOW())
      `, [
        numero_os,
        solicitante_id,
        responsavel_id,
        tipo_servico,
        prioridade,
        problema_informado,
        valor_servico,
        desconto,
        acrescimos,
        valor_total
      ]);

      res.redirect('/os/listar?sucesso=Ordem de serviço criada com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar OS:', err);
      res.status(500).render('os/nova', {
        titulo: 'Nova Ordem de Serviço',
        erro: 'Erro ao salvar OS. Verifique os dados e tente novamente.',
        pessoas: []
      });
    }
  },

  // Lista todas as OS com filtros e JOIN
  listarOS: async (req, res) => {
    const { busca = '', status = '', prioridade = '', pagina = 1 } = req.query;
    const limite = 20;
    const offset = (pagina - 1) * limite;

    try {
      let sql = `
        SELECT os.*, s.nome AS solicitante, r.nome AS responsavel
        FROM ordens_servico os
        JOIN pessoas s ON os.solicitante_id = s.id
        JOIN pessoas r ON os.responsavel_id = r.id
        WHERE 1 = 1
      `;
      const params = [];

      if (busca) {
        sql += ` AND (os.tipo_servico LIKE ? OR s.nome LIKE ?)`;
        params.push(`%${busca}%`, `%${busca}%`);
      }

      if (status) {
        sql += ` AND os.status = ?`;
        params.push(status);
      }

      if (prioridade) {
        sql += ` AND os.prioridade = ?`;
        params.push(prioridade);
      }

      sql += ` ORDER BY os.data_abertura DESC LIMIT ? OFFSET ?`;
      params.push(limite, offset);

      const [ordens] = await db.query(sql, params);

      const [totalRegistros] = await db.query(`
        SELECT COUNT(*) AS total
        FROM ordens_servico os
        JOIN pessoas s ON os.solicitante_id = s.id
        WHERE 1 = 1
        ${busca ? `AND (os.tipo_servico LIKE '%${busca}%' OR s.nome LIKE '%${busca}%')` : ''}
        ${status ? `AND os.status = '${status}'` : ''}
        ${prioridade ? `AND os.prioridade = '${prioridade}'` : ''}
      `);

      const totalPaginas = Math.ceil(totalRegistros[0].total / limite);

      res.render('os/listar', {
        titulo: 'Lista de Ordens de Serviço',
        ordens,
        busca,
        status,
        prioridade,
        pagina: parseInt(pagina),
        totalPaginas,
        erro: null,
        sucesso: req.query.sucesso || null
      });
    } catch (err) {
      console.error('Erro ao listar OS:', err);
      res.status(500).render('os/listar', {
        titulo: 'Lista de Ordens de Serviço',
        ordens: [],
        busca,
        status,
        prioridade,
        pagina: 1,
        totalPaginas: 1,
        erro: 'Erro ao carregar lista de OS.',
        sucesso: null
      });
    }
  },

  // Renderiza formulário de edição
  editarOS: async (req, res) => {
    const id = req.params.id;
    try {
      const [os] = await db.query('SELECT * FROM ordens_servico WHERE id = ?', [id]);
      const [pessoas] = await db.query('SELECT id, nome FROM pessoas ORDER BY nome');

      res.render('os/editar', {
        titulo: 'Editar Ordem de Serviço',
        os: os[0] || {},
        pessoas,
        erro: null
      });
    } catch (err) {
      console.error('Erro ao carregar OS para edição:', err);
      res.status(500).render('os/editar', {
        titulo: 'Editar Ordem de Serviço',
        os: {},
        pessoas: [],
        erro: 'Erro ao carregar dados da OS.'
      });
    }
  },

  // Atualiza OS no banco
  atualizarOS: async (req, res) => {
    const id = req.params.id;
    const {
      tipo_servico,
      prioridade,
      problema_informado,
      valor_servico,
      desconto,
      acrescimos
    } = req.body;

    const valor_total = parseFloat(valor_servico || 0) - parseFloat(desconto || 0) + parseFloat(acrescimos || 0);

    try {
      await db.query(`
        UPDATE ordens_servico SET
          tipo_servico = ?,
          prioridade = ?,
          problema_informado = ?,
          valor_servico = ?,
          desconto = ?,
          acrescimos = ?,
          valor_total = ?
        WHERE id = ?
      `, [
        tipo_servico,
        prioridade,
        problema_informado,
        valor_servico,
        desconto,
        acrescimos,
        valor_total,
        id
      ]);

      res.redirect('/os/listar?sucesso=Ordem de serviço atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar OS:', err);
      res.status(500).render('os/editar', {
        titulo: 'Editar Ordem de Serviço',
        os: {},
        erro: 'Erro ao atualizar OS.',
        pessoas: []
      });
    }
  },

  // Finaliza OS e gera lançamento financeiro
finalizarOS: async (req, res) => {
  const id = req.params.id;

  try {
    // Atualiza status da OS
    await db.query(`
      UPDATE ordens_servico SET
        status = 'concluida',
        data_fechamento = NOW()
      WHERE id = ?
    `, [id]);

    // Busca dados da OS
    const [[os]] = await db.query(`
      SELECT solicitante_id, valor_total, tipo_servico
      FROM ordens_servico
      WHERE id = ?
    `, [id]);

    // Validação dos dados antes de gerar lançamento
    if (!os.solicitante_id || !os.valor_total || os.valor_total <= 0) {
      return res.redirect('/os/listar?erro=Dados insuficientes para gerar lançamento financeiro.');
    }
    
        // Caixa padrão
    const caixaPadrao = 1;

    // Gera lançamento financeiro
    await db.query(`
      INSERT INTO financeiro (
        tipo,
        pessoa_id,
        caixa_id,
        valor,
        vencimento,
        status,
        descricao,
        ordem_servico_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'receber',
      os.solicitante_id,
      caixaPadrao, // ✅ agora está usando o valor 1 corretamente
      os.valor_total,
      new Date(),
      'pendente',
      `Serviço concluído: ${os.tipo_servico}`,
      id
    ]);

    // Redireciona com sucesso
    res.redirect('/os/listar?sucesso=OS finalizada e lançamento financeiro gerado!');
  } catch (err) {
    console.error('Erro ao finalizar OS e gerar financeiro:', err);
    res.status(500).send('Erro ao finalizar OS');
  }
},

   // 👁️ Exibir OS
  exibirOS: async (req, res) => {
    const { id } = req.params;
    try {
      const [[os]] = await db.query(`
        SELECT os.*, s.nome AS solicitante_nome, r.nome AS responsavel_nome
        FROM ordens_servico os
        JOIN pessoas s ON os.solicitante_id = s.id
        JOIN pessoas r ON os.responsavel_id = r.id
        WHERE os.id = ?
      `, [id]);

      if (!os) return res.redirect('/os/listar?erro=OS não encontrada');

      res.render('os/exibir', {
        titulo: 'Detalhes da Ordem de Serviço',
        os
      });
    } catch (err) {
      console.error('Erro ao exibir OS:', err);
      res.redirect('/os/listar?erro=Erro ao exibir OS');
    }
  },

  // 🖨️ Imprimir OS
  imprimirOS: async (req, res) => {
    const { id } = req.params;
    try {
      const [[os]] = await db.query(`
        SELECT os.*, s.nome AS cliente_nome
        FROM ordens_servico os
        JOIN pessoas s ON os.solicitante_id = s.id
        WHERE os.id = ?
      `, [id]);

      if (!os) return res.redirect('/os/listar?erro=OS não encontrada');

      res.render('os/imprimir', {
      layout: false, // 👈 ESSENCIAL para remover o layout padrão
      titulo: 'Impressão de OS',
      os
      });
    } catch (err) {
      console.error('Erro ao preparar impressão da OS:', err);
      res.redirect('/os/listar?erro=Erro ao preparar impressão');
    }
  }
};