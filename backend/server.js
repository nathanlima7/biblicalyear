const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors()); // Permite que o Netlify acesse este servidor
app.use(express.json());

const DATABASE_URL = process.env.DATABASE_URL || "SUA_URL_DO_NEON_AQUI";
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_super_segura_123";
const sql = neon(DATABASE_URL);

// Middleware para verificar o Token JWT
const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// ROTA: Registrar
app.post('/api/registrar', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const existing = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
    if (existing.length > 0) return res.status(400).json({ error: "E-mail já cadastrado" });

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const result = await sql`
      INSERT INTO usuarios (nome, email, senha_hash) 
      VALUES (${nome}, ${email}, ${senhaHash}) 
      RETURNING id, nome, email
    `;
    const user = result[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: error.message });
  }
});

// ROTA: Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const users = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
    if (users.length === 0) return res.status(401).json({ error: "E-mail ou senha incorretos" });

    const user = users[0];
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) return res.status(401).json({ error: "E-mail ou senha incorretos" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: error.message });
  }
});

// ROTA: Buscar Progresso
app.get('/api/get-progress', autenticar, async (req, res) => {
  try {
    const userId = req.userId;
    const dias = await sql`SELECT dia, lido FROM progresso_dias WHERE usuario_id = ${userId}`;
    const meses = await sql`SELECT mes, verificado FROM progresso_meses WHERE usuario_id = ${userId}`;
    res.json({ dias, meses });
  } catch (error) {
    console.error("Erro ao buscar progresso:", error);
    res.status(500).json({ error: error.message });
  }
});

// ROTA: Atualizar Dia
app.post('/api/update-dia', autenticar, async (req, res) => {
  try {
    const { dia, lido } = req.body;
    const userId = req.userId;

    if (lido) {
      await sql`
        INSERT INTO progresso_dias (usuario_id, dia, lido, concluido_em) 
        VALUES (${userId}, ${dia}, true, NOW()) 
        ON CONFLICT (usuario_id, dia) DO UPDATE SET lido = true, concluido_em = NOW()
      `;
    } else {
      await sql`DELETE FROM progresso_dias WHERE usuario_id = ${userId} AND dia = ${dia}`;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar dia:", error);
    res.status(500).json({ error: error.message });
  }
});

// ROTA: Atualizar Mês
app.post('/api/update-mes', autenticar, async (req, res) => {
  try {
    const { mes } = req.body;
    const userId = req.userId;

    await sql`
      INSERT INTO progresso_meses (usuario_id, mes, verificado) 
      VALUES (${userId}, ${mes}, true) 
      ON CONFLICT (usuario_id, mes) DO UPDATE SET verificado = true
    `;
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao verificar mês:", error);
    res.status(500).json({ error: error.message });
  }
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));