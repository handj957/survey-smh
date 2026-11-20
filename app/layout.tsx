import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'2026 학교평가 | 서울의료보건고등학교',description:'교원·학부모·학생이 함께 만드는 더 나은 학교'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
