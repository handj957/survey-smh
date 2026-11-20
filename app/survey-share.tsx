'use client';
import {useState} from 'react';
type Props={role:'teacher'|'parent'|'student'|'staff';name:string;count:number;index:number;onStart?:()=>void;showAddress?:boolean};
export default function SurveyShare({role,name,count,index,onStart,showAddress=true}:Props){
 const [message,setMessage]=useState('');
 const url='https://smh-school-survey-2026.aade2623-bb09-4d30-8e76-82e541e6fe64.chatgpt.site/?target='+role;
 async function copy(){try{await navigator.clipboard.writeText(url);setMessage('주소가 복사되었습니다.')}catch{setMessage('주소를 선택해 복사해 주세요.')}}
 return <article className="audience-card"><div className="audience-top"><span className="audience-number">0{index+1}</span><span className="audience-count">{count}개 문항</span></div><div className="audience-heading"><div><h2>{name}용 설문</h2><p>{name} 대상 학교평가 설문입니다.</p>{onStart?<button type="button" className="audience-start" onClick={onStart} aria-label={name+'용 설문 참여하기'}>설문 참여하기 <span aria-hidden="true">↗</span></button>:<a className="audience-start" href={'/?target='+role} aria-label={name+'용 설문 참여하기'}>설문 참여하기 <span aria-hidden="true">↗</span></a>}</div><div className="audience-qr"><img src={'/qr-'+role+'.png'} width="190" height="190" alt={name+' 설문 접속 QR 코드'}/><a href={'/qr-'+role+'.png'} download={'2026학교평가_QR_'+name+'.png'}>QR 저장 ↓</a></div></div>{showAddress&&<div className="audience-link"><label htmlFor={'survey-url-'+role}>접속 주소</label><input id={'survey-url-'+role} readOnly value={url} onFocus={e=>e.currentTarget.select()}/><button type="button" className="secondary" onClick={copy} aria-label={name+' 설문 주소 복사'}>주소 복사</button><small role="status">{message}</small></div>}</article>;
}
