import {getDb} from '@/db';
import {questionOverrides} from '@/db/schema';
import defaults from '@/lib/questions.json';
export async function GET(){
 try{
  const rows=await getDb().select().from(questionOverrides);
  const data:Record<string,unknown>={...defaults};const revisions:Record<string,string>={teacher:'original',parent:'original',student:'original',staff:'original'};
  for(const row of rows){if(row.role in defaults){data[row.role]=JSON.parse(row.questions).map((question:{section:string})=>({...question,section:question.section==='특성화고 교육'?'기타(학교유형, 특성에 따른 세부영역)':question.section}));revisions[row.role]=row.revision}}
  return Response.json({data,revisions},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'설문 문항을 불러오지 못했습니다. 다시 시도해 주세요.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
