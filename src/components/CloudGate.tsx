import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cloud, emailFor, type Profile } from '@/lib/cloud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
const C = createContext<Profile | null>(null);
export const useProfile = () => useContext(C);
export function CloudGate({children}: {children:ReactNode}) {
 const [profile,setProfile]=useState<Profile|null>(null), [loading,setLoading]=useState(true), [error,setError]=useState('');
 const [id,setId]=useState(''), [password,setPassword]=useState(''), [first,setFirst]=useState(''), [last,setLast]=useState('');
 useEffect(()=>{if(!cloud){setLoading(false);return;} let alive=true; const refresh=async()=>{const {data:{session}}=await cloud!.auth.getSession(); if(!alive)return; if(!session){setProfile(null);setLoading(false);return;} const {data,error}=await cloud!.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle(); if(!alive)return; setProfile(data?.active?data as Profile:null); if(error||!data?.active)setError('Conta sem autorização ou indisponível.');setLoading(false);}; void refresh(); const {data:{subscription}}=cloud.auth.onAuthStateChange(()=>{setTimeout(()=>void refresh(),0)}); const timer=setInterval(()=>void refresh(),15000); return()=>{alive=false;subscription.unsubscribe();clearInterval(timer);};},[]);
 if(!cloud)return <div className="mx-auto max-w-lg p-8"><h1 className="text-xl font-bold">Craft Food — configuração necessária</h1><p>Configure o Supabase conforme CONFIGURACAO.md antes de publicar.</p></div>;
 if(loading)return <p className="p-8">Carregando sessão…</p>;
 if(profile)return <C.Provider value={profile}>{children}</C.Provider>;
 return <main className="mx-auto max-w-md p-8"><h1 className="mb-4 text-2xl font-bold">Craft Food · Acesso restrito</h1><form className="surface-card space-y-3 p-5" onSubmit={async e=>{e.preventDefault();setError('');setLoading(true);try{const {data,error}=await cloud!.auth.signInWithPassword({email:emailFor(id),password});if(error)throw error;const r=await cloud!.from('profiles').select('*').eq('user_id',data.user.id).single();if(r.error||!r.data?.active||r.data.first_name.trim().toLowerCase()!==first.trim().toLowerCase()||r.data.last_name.trim().toLowerCase()!==last.trim().toLowerCase()){await cloud!.auth.signOut();setProfile(null);throw new Error('Nome, sobrenome ou autorização não correspondem ao cadastro.');}setProfile(r.data as Profile);}catch(e){setError(e instanceof Error?e.message:'Falha no acesso.');}finally{setLoading(false);setPassword('');}}}>
 <label>Nome<Input required value={first} onChange={e=>setFirst(e.target.value)}/></label><label>Sobrenome<Input required value={last} onChange={e=>setLast(e.target.value)}/></label><label>ID do personagem<Input required pattern="[0-9]+" value={id} onChange={e=>setId(e.target.value)}/></label><label>Senha<Input required type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><Button className="w-full" type="submit">Entrar</Button>{error&&<p role="alert">{error}</p>}</form></main>;
}
