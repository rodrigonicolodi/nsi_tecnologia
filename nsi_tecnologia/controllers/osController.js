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

      // Validações básicas
      if (!solicitante_id || !responsavel_id || !tipo_servico) {
        const [pessoas] = await db.query('SELECT id, nome FROM pessoas ORDER BY nome');
        return res.status(400).render('os/nova', {
          titulo: 'Nova Ordem de Serviço',
          erro: 'Campos obrigatórios não preenchidos: Solicitante, Responsável e Tipo de Serviço são obrigatórios.',
          pessoas
        });
      }

      // Tratar valores vazios para campos decimais - mais flexível
      const valor_servico_clean = valor_servico && valor_servico.toString().trim() !== '' && !isNaN(parseFloat(valor_servico)) ? parseFloat(valor_servico) : 0;
      const desconto_clean = desconto && desconto.toString().trim() !== '' && !isNaN(parseFloat(desconto)) ? parseFloat(desconto) : 0;
      const acrescimos_clean = acrescimos && acrescimos.toString().trim() !== '' && !isNaN(parseFloat(acrescimos)) ? parseFloat(acrescimos) : 0;
      
      const valor_total = valor_servico_clean - desconto_clean + acrescimos_clean;

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
        valor_servico_clean,
        desconto_clean,
        acrescimos_clean,
        valor_total
      ]);

      res.redirect('/os/listar?sucesso=Ordem de serviço criada com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar OS:', err);
      
      // Buscar pessoas novamente para o formulário
      let pessoas = [];
      try {
        const [pessoasResult] = await db.query('SELECT id, nome FROM pessoas ORDER BY nome');
        pessoas = pessoasResult;
      } catch (pessoasErr) {
        console.error('Erro ao carregar pessoas para erro:', pessoasErr);
      }
      
      // Determinar mensagem de erro específica
      let mensagemErro = 'Erro ao salvar OS. Verifique os dados e tente novamente.';
      
      if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        mensagemErro = 'Erro: Solicitante ou responsável selecionado não existe.';
      } else if (err.code === 'ER_DUP_ENTRY') {
        mensagemErro = 'Erro: Número da OS já existe. Tente novamente.';
      } else if (err.code === 'ER_BAD_NULL_ERROR') {
        mensagemErro = 'Erro: Campos obrigatórios não preenchidos.';
      } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        mensagemErro = 'Erro de conexão com o banco de dados.';
      } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
        mensagemErro = 'Erro: Valores inválidos nos campos numéricos. Verifique se os valores estão corretos.';
      }
      
      res.status(500).render('os/nova', {
        titulo: 'Nova Ordem de Serviço',
        erro: mensagemErro,
        pessoas
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

    // Tratar valores vazios para campos decimais - mais flexível
    const valor_servico_clean = valor_servico && valor_servico.toString().trim() !== '' && !isNaN(parseFloat(valor_servico)) ? parseFloat(valor_servico) : 0;
    const desconto_clean = desconto && desconto.toString().trim() !== '' && !isNaN(parseFloat(desconto)) ? parseFloat(desconto) : 0;
    const acrescimos_clean = acrescimos && acrescimos.toString().trim() !== '' && !isNaN(parseFloat(acrescimos)) ? parseFloat(acrescimos) : 0;
    
    const valor_total = valor_servico_clean - desconto_clean + acrescimos_clean;

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
        valor_servico_clean,
        desconto_clean,
        acrescimos_clean,
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

  // Mostra formulário de finalização com opções de parcelamento
  finalizarOS: async (req, res) => {
    const id = req.params.id;

    try {
      // Busca dados da OS
      const [[os]] = await db.query(`
        SELECT o.id, o.numero_os, o.tipo_servico, o.valor_total, o.problema_informado,
               p.nome AS solicitante_nome
        FROM ordens_servico o
        LEFT JOIN pessoas p ON o.solicitante_id = p.id
        WHERE o.id = ? AND o.status = 'aberta'
      `, [id]);

      if (!os) {
        return res.redirect('/os/listar?erro=Ordem de serviço não encontrada ou já finalizada.');
      }

      // Validação dos dados
      if (!os.valor_total || os.valor_total <= 0) {
        return res.redirect('/os/listar?erro=Valor inválido para gerar lançamento financeiro.');
      }

      // Busca caixas disponíveis
      const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

      res.render('os/finalizar', {
        titulo: 'Finalizar Ordem de Serviço',
        os,
        caixas,
        erro: null
      });
    } catch (err) {
      console.error('Erro ao carregar finalização de OS:', err);
      res.redirect('/os/listar?erro=Erro ao carregar dados da OS.');
    }
  },

  // Processa a finalização da OS com parcelamento
  processarFinalizacao: async (req, res) => {
    const id = req.params.id;
    const {
      parcelamento,
      total_parcelas,
      intervalo_dias,
      vencimento,
      caixa_id,
      observacoes
    } = req.body;

    try {
      // Busca dados da OS
      const [[os]] = await db.query(`
        SELECT solicitante_id, valor_total, tipo_servico, numero_os
        FROM ordens_servico
        WHERE id = ? AND status = 'aberta'
      `, [id]);

      if (!os) {
        return res.redirect('/os/listar?erro=Ordem de serviço não encontrada ou já finalizada.');
      }

      // Atualiza status da OS
      await db.query(`
        UPDATE ordens_servico SET
          status = 'concluida',
          data_fechamento = NOW()
        WHERE id = ?
      `, [id]);

      // Configurações de parcelamento
      const numParcelas = parcelamento === 'parcelado' ? parseInt(total_parcelas) || 2 : 1;
      const intervalo = parseInt(intervalo_dias) || 30;
      const valorParcela = os.valor_total / numParcelas;
      const caixaId = parseInt(caixa_id) || 1;

      // Criar lançamentos (parcelas)
      let parcelaPaiId = null;

      for (let i = 1; i <= numParcelas; i++) {
        // Calcular data de vencimento da parcela
        const dataVencimento = new Date(vencimento);
        dataVencimento.setDate(dataVencimento.getDate() + ((i - 1) * intervalo));

        const lancamento = {
          tipo: 'receber',
          pessoa_id: os.solicitante_id,
          caixa_id: caixaId,
          valor: valorParcela,
          vencimento: dataVencimento.toISOString().split('T')[0],
          status: 'pendente',
          descricao: `${os.tipo_servico} - ${os.numero_os}${numParcelas > 1 ? ` - Parcela ${i}/${numParcelas}` : ''}${observacoes ? ` - ${observacoes}` : ''}`,
          parcela_atual: i,
          total_parcelas: numParcelas,
          parcela_pai_id: parcelaPaiId,
          ordem_servico_id: id
        };

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
      }

      const mensagem = numParcelas > 1 
        ? `OS finalizada e lançamento parcelado criado! ${numParcelas} parcelas geradas.`
        : 'OS finalizada e lançamento financeiro gerado!';

      res.redirect(`/os/listar?sucesso=${encodeURIComponent(mensagem)}`);
    } catch (err) {
      console.error('Erro ao finalizar OS:', err);
      res.redirect('/os/listar?erro=Erro ao finalizar OS.');
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