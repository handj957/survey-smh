import {env} from 'cloudflare:workers';
import defaults from '@/lib/questions.json';
type Role=keyof typeof defaults;
export async function POST(req:Request){
 const e=env as unknown as {ADMIN_KEY?:string; DB:D1Database};
 if(!e.ADMIN_KEY||req.headers.get('authorization')!==`Bearer ${e.ADMIN_KEY}`)return Response.json({error:'관리자 암호를 확인해 주세요.'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'허용되지 않은 요청입니다.'},{status:403});
 try{
  const b:any=await req.json();const role=b.role as Role;const base=Object.hasOwn(defaults,role)?defaults[role]:null;
  if(!base||!Array.isArray(b.questions)||b.questions.length!==base.length||typeof b.revision!=='string')return Response.json({error:'문항 형식이 올바르지 않습니다.'},{status:400});
  const clean=[];
  for(let i=0;i<base.length;i++){const q=b.questions[i];if(!q||q.id!==base[i].id||typeof q.title!=='string'||typeof q.text!=='string'||!q.title.trim()||!q.text.trim()||q.title.length>160||q.text.length>1500)return Response.json({error:`${i+1}번 문항의 제목과 내용을 확인해 주세요.`},{status:400});clean.push({...base[i],title:q.title.trim(),text:q.text.trim()});}
  const rev=crypto.randomUUID();
  // One atomic statement checks for existing responses and concurrent edits.
  const result=await e.DB.prepare(`INSERT INTO question_overrides (role,revision,questions,updated_at)
    SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM responses WHERE role = ?) AND COALESCE((SELECT revision FROM question_overrides WHERE role = ?),'original') = ?
    ON CONFLICT(role) DO UPDATE SET revision=excluded.revision, questions=excluded.questions, updated_at=excluded.updated_at`).bind(role,rev,JSON.stringify(clean),new Date().toISOString(),role,role,b.revision).run();
  if(result.meta.changes!==1)return Response.json({error:'이미 응답이 접수되었거나 다른 곳에서 수정되었습니다. 새로고침 후 확인해 주세요.'},{status:409});
  return Response.json({ok:true,revision:rev,questions:clean},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'문항을 저장하지 못했습니다. 다시 시도해 주세요.'},{status:500})}
}
