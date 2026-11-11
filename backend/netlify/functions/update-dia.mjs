import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const DATABASE_URL = "SUA_URL_DO_NEON_AQUI";
const JWT_SECRET = "sua_chave_secreta_super_segura_123";

export default async (req) => {
  if (req.method !== 'POST') return new Response("Method not allowed", { status: 405 });
  
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response("Token não fornecido", { status: 401 });

  const token = authHeader.split(' ')[1];
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return new Response("Token inválido", { status: 401 });
  }

  const { dia, lido } = await req.json();
  const sql = neon(DATABASE_URL);

  try {
    if (lido) {
      await sql`
        INSERT INTO progresso_dias (usuario_id, dia, lido, concluido_em) 
        VALUES (${userId}, ${dia}, true, NOW()) 
        ON CONFLICT (usuario_id, dia) DO UPDATE SET lido = true, concluido_em = NOW()
      `;
    } else {
      await sql`DELETE FROM progresso_dias WHERE usuario_id = ${userId} AND dia = ${dia}`;
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};