'use client';
import {useEffect,useRef,useState} from 'react';
type Question={id:string;section:string;title:string;text:string;sourcePage:number};
type Props={role:string;name:string;questions:Question[];revision:string;count:number;adminKey:string;onSaved:(q:Question[],revision:string)=>void};
export default function QuestionEditor({role,name,questions,revision,count,adminKey,onSaved}:Props){
 const [open,setOpen]=useState(false),[draft,setDraft]=useState<Question[]>(()=>questions.map(q=>({...q}))),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[isError,setIsError]=useState(false);
 const statusRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(message)statusRef.current?.scrollIntoView({block:'nearest',behavior:'smooth'})},[message]);
 const changed=draft.some((q,i)=>q.title!==questions[i]?.title||q.text!==questions[i]?.text);
 const changedCount=draft.filter((q,i)=>q.title!==questions[i]?.title||q.text!==questions[i]?.text).length;
 function promptSave(){
  setMessage('');setIsError(false);
  if(count>0){setIsError(true);setMessage(`현재 ${name} 응답 ${count}건이 있어 저장할 수 없습니다. 응답을 보관해야 한다면 CSV로 먼저 저장해 주세요.`);return}
  if(!changed){setIsError(true);setMessage('변경된 문항이 없습니다. 제목이나 설문 내용을 수정한 뒤 눌러 주세요.');return}
  const invalid=draft.findIndex(q=>!q.title.trim()||!q.text.trim());
  if(invalid>=0){setIsError(true);setMessage(`${invalid+1}번 문항의 제목과 내용을 모두 입력해 주세요.`);return}
  void save();
 }
 async function save(){
  if(busy||!changed||count>0)return;
  setBusy(true);setMessage('');setIsError(false);
  try{
   const r=await fetch('/api/admin/questions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+adminKey},body:JSON.stringify({role,revision,questions:draft})});
   let b:any;try{b=await r.json()}catch{throw new Error('서버 응답을 확인하지 못했습니다. 수정 내용은 화면에 남아 있습니다. 잠시 후 다시 시도해 주세요.')}
   if(!r.ok)throw Error(b.error||'저장하지 못했습니다.');
   if(!b.ok||!Array.isArray(b.questions)||typeof b.revision!=='string')throw new Error('저장 결과가 올바르지 않습니다. 새로고침하여 반영 여부를 확인해 주세요.');
   const check=await fetch('/api/questions',{cache:'no-store'});
   if(!check.ok)throw new Error('서버에 저장 요청은 완료됐지만 설문 반영 여부를 확인하지 못했습니다. 새로고침 후 확인해 주세요.');
   const latest:any=await check.json();
   if(latest.revisions?.[role]!==b.revision||!Array.isArray(latest.data?.[role]))throw new Error('저장 후 설문 반영 여부가 일치하지 않습니다. 새로고침 후 확인해 주세요.');
   const published=latest.data[role] as Question[];
   if(published.length!==b.questions.length||published.some((q,i)=>q.id!==b.questions[i].id||q.title!==b.questions[i].title||q.text!==b.questions[i].text))throw new Error('저장한 문항과 설문 문항이 일치하지 않습니다. 새로고침 후 확인해 주세요.');
   setDraft(published.map(q=>({...q})));onSaved(published,b.revision);setMessage(`${name} 설문 문항 ${changedCount}개가 저장되었고 해당 설문지에 반영된 것을 확인했습니다.`);
  }catch(e){setIsError(true);setMessage((e as Error).message||'저장하지 못했습니다.')}finally{setBusy(false)}
 }
 return <section className="panel question-editor"><div className="toolbar"><div><h2>{name} 설문 문항 수정</h2><p>문항 제목과 내용을 수정한 뒤 저장·반영할 수 있습니다.</p></div><button type="button" className="secondary" onClick={()=>{setOpen(!open)}}>{open?'접기':'문항 수정하기'}</button></div>{open&&<><p>기존 응답과 다른 문항이 섞이지 않도록 해당 대상의 응답이 없을 때만 저장할 수 있습니다. 문항 수와 응답 선택지는 유지됩니다.</p>{count>0&&<p className="edit-warning" role="alert">현재 {name} 응답 {count}건이 있어 저장할 수 없습니다. 필요한 경우 먼저 CSV로 백업한 뒤 응답 관리에서 정리해 주세요.</p>}{draft.map((q,i)=><div className="edit-question" key={q.id}><div className="edit-number">{i+1}번 · {q.section}</div><label>문항 제목<input maxLength={160} value={q.title} onChange={e=>{setDraft(draft.map((x,n)=>n===i?{...x,title:e.target.value}:x));setMessage('')}}/></label><label>설문 내용<textarea rows={3} maxLength={1500} value={q.text} onChange={e=>{setDraft(draft.map((x,n)=>n===i?{...x,text:e.target.value}:x));setMessage('')}}/></label></div>)}<div className="editor-save-area"><p>변경된 문항: <b>{changedCount}개</b></p>{message&&<div ref={statusRef} role={isError?'alert':'status'} className={isError?'edit-warning':'edit-success'}>{message}</div>}<div className="toolbar"><button type="button" disabled={busy} onClick={promptSave}>수정 내용 저장·반영</button><button type="button" className="secondary" disabled={busy||!changed} onClick={()=>{setDraft(questions.map(q=>({...q})));setIsError(false);setMessage('수정 중이던 내용을 취소했습니다.')}}>수정 취소</button></div></div></>}</section>
}
