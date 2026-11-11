import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const DATABASE_URL = "SUA_URL_DO_NEON_AQUI";
const JWT_SECRET = "sua_chave_secreta_super_segura_123";

export default async (req) => {
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

  const sql = neon(DATABASE_URL);

  try {
    const dias = await sql`SELECT dia, lido FROM progresso_dias WHERE usuario_id = ${userId}`;
    const meses = await sql`SELECT mes, verificado FROM progresso_meses WHERE usuario_id = ${userId}`;

    return new Response(JSON.stringify({ dias, meses }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};