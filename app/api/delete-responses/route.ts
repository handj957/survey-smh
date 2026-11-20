import {env} from 'cloudflare:workers';
import {and, eq, inArray} from 'drizzle-orm';
import {getDb} from '@/db';
import {responses} from '@/db/schema';

export async function POST(req: Request) {
  const key = (env as unknown as Record<string, string>).ADMIN_KEY;
  if (!key || req.headers.get('authorization') !== `Bearer ${key}`) {
    return Response.json({error:'관리자 암호를 확인해 주세요.'}, {status:401, headers:{'Cache-Control':'no-store'}});
  }
  if (req.headers.get('origin') !== new URL(req.url).origin) {
    return Response.json({error:'허용되지 않은 요청입니다.'}, {status:403});
  }
  try {
    const b: unknown = await req.json();
    if (!b || typeof b !== 'object') return Response.json({error:'요청이 올바르지 않습니다.'},{status:400});
    const {role, ids} = b as {role?:unknown;ids?:unknown};
    if (!['teacher','parent','student','staff'].includes(role as string) || !Array.isArray(ids) || ids.length < 1 || ids.length > 10000 || ids.some(id => typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
      return Response.json({error:'삭제 대상이 올바르지 않습니다.'},{status:400});
    }
    // Delete only the selected, already displayed records. Newly submitted records are preserved.
    const db=getDb();
    let deleted=0;
    for (let offset=0;offset<ids.length;offset+=50) {
      const removed=await db.delete(responses).where(and(eq(responses.role,role as string),inArray(responses.id,ids.slice(offset,offset+50)))).returning({id:responses.id});
      deleted+=removed.length;
    }
    return Response.json({ok:true,deleted},{headers:{'Cache-Control':'no-store'}});
  } catch {
    return Response.json({error:'삭제를 완료하지 못했습니다. 새로고침으로 결과를 확인해 주세요.'},{status:500});
  }
}
