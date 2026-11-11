import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const DATABASE_URL = "SUA_URL_DO_NEON_AQUI";
const JWT_SECRET = "sua_chave_secreta_super_segura_123";

export default async (req) => {
  if (req.method !== 'POST') return new Response("Method not allowed", { status: 405 });
  const { email, senha } = await req.json();

  const sql = neon(DATABASE_URL);

  try {
    const users = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
    if (users.length === 0) {
      return new Response(JSON.stringify({ error: "E-mail ou senha incorretos" }), { status: 401 });
    }

    const user = users[0];
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return new Response(JSON.stringify({ error: "E-mail ou senha incorretos" }), { status: 401 });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    return new Response(JSON.stringify({ token, user: { id: user.id, nome: user.nome, email: user.email } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};