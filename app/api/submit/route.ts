import {env} from 'cloudflare:workers';
import {getDb} from '@/db';
import {questionOverrides} from '@/db/schema';
import {eq} from 'drizzle-orm';
import defaults from '@/lib/questions.json';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'허용되지 않은 요청입니다.'},{status:403});
 try{
  if(Number(req.headers.get('content-length'))>15000)return new Response(null,{status:413});
  const b:any=await req.json();const original=Object.hasOwn(defaults,b.role)?defaults[b.role as keyof typeof defaults]:null;
  if(!original||! /^[0-9a-f-]{36}$/.test(b.id)||typeof b.comment!=='string'||b.comment.length>2000||!b.answers||Object.keys(b.answers).length!==original.length||original.some(q=>![1,2,3,4,5].includes(b.answers[q.id])))return Response.json({error:'모든 문항에 응답해 주세요.'},{status:400});
  const [override]=await getDb().select({revision:questionOverrides.revision}).from(questionOverrides).where(eq(questionOverrides.role,b.role));
  const revision=typeof b.revision==='string'?b.revision:'original';
  if((override?.revision||'original')!==revision)return Response.json({error:'작성 중 설문 문항이 변경되었습니다. 화면을 새로고침하고 변경된 문항을 확인한 후 다시 응답해 주세요.',code:'survey_changed'},{status:409});
  const db=(env as unknown as {DB:D1Database}).DB;
  const r=await db.prepare(`INSERT INTO responses (id,role,answers,comment,created_at) SELECT ?,?,?,?,? WHERE COALESCE((SELECT revision FROM question_overrides WHERE role=?),'original')=? ON CONFLICT(id) DO NOTHING`).bind(b.id,b.role,JSON.stringify(b.answers),'',new Date().toISOString(),b.role,revision).run();
  if(!r.meta.changes){const existing=await db.prepare('SELECT id FROM responses WHERE id = ? AND role = ?').bind(b.id,b.role).first();if(!existing)return Response.json({error:'설문 문항이 변경되었습니다. 화면을 새로고침해 주세요.',code:'survey_changed'},{status:409})}
  return Response.json({ok:true});
 }catch{return Response.json({error:'저장하지 못했습니다. 응답은 유지되니 다시 시도해 주세요.'},{status:500});}
}
