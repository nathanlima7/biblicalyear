import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_super_segura_123";

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

  try {
    const { mes } = await req.json();
    const sql = neon(process.env.DATABASE_URL);

    await sql`
      INSERT INTO progresso_meses (usuario_id, mes, verificado) 
      VALUES (${userId}, ${mes}, true) 
      ON CONFLICT (usuario_id, mes) DO UPDATE SET verificado = true
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Erro ao verificar mês:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};