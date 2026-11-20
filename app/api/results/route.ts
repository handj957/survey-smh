import {env} from 'cloudflare:workers';
import {getDb} from '@/db';
import {responses} from '@/db/schema';
export async function POST(req:Request){
 const key=(env as unknown as Record<string,string>).ADMIN_KEY;
 if(!key||req.headers.get('authorization')!==`Bearer ${key}`)return Response.json({error:'관리자 암호를 확인해 주세요.'},{status:401});
 const rows=await getDb().select().from(responses);return Response.json(rows,{headers:{'Cache-Control':'no-store'}});
}
