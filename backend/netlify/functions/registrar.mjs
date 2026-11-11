import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_super_segura_123";

export default async (req) => {
  if (req.method !== 'POST') return new Response("Method not allowed", { status: 405 });
  
  try {
    const { nome, email, senha } = await req.json();
    const sql = neon(process.env.DATABASE_URL);

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

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    return new Response(JSON.stringify({ token, user }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};