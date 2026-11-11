import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const DATABASE_URL = "SUA_URL_DO_NEON_AQUI";
const JWT_SECRET = "sua_chave_secreta_super_segura_123"; // Em produção, use variável de ambiente

export default async (req) => {
  if (req.method !== 'POST') return new Response("Method not allowed", { status: 405 });
  const { nome, email, senha } = await req.json();

  const sql = neon(DATABASE_URL);

  try {
    // Verifica se o email já existe
    const existing = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: "E-mail já cadastrado" }), { status: 400 });
    }

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Insere o usuário
    const result = await sql`
      INSERT INTO usuarios (nome, email, senha_hash) 
      VALUES (${nome}, ${email}, ${senhaHash}) 
      RETURNING id, nome, email
    `;
    const user = result[0];

    // Gera o token JWT válido por 30 dias
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    return new Response(JSON.stringify({ token, user }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};