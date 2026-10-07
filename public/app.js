'use strict';
const statusBox = document.querySelector('#status');
const status = message => { statusBox.textContent = message; };
const client = window.supabase?.createClient('https://cagntnhysbiqlmjnkjqg.supabase.co','sb_publishable_4XljxqME4e3zoTjZBT3_NQ_87Q1O7qt');
let editingId = null;
let viewGeneration = 0;
const list = document.querySelector('#notes');
function resetEditor(){editingId=null;document.querySelector('#note-form').reset();document.querySelector('#form-heading').textContent='메모 추가';document.querySelector('#cancel').hidden=true;}
async function api(path='',options={}){
 const {data:{session}}=await client.auth.getSession();
 if(!session)throw new Error('로그인이 필요합니다.');
 const response=await fetch('/api/notes'+path,{...options,cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token}});
 const result=await response.json();
 if(!response.ok){const messages={login_required:'로그인이 필요합니다.',invalid_login:'로그인 인증이 만료되었거나 올바르지 않습니다.',invalid_note:'제목과 내용을 확인해주세요.',note_not_found:'메모를 찾을 수 없습니다.',auth_unavailable:'인증 서버 설정을 확인할 수 없습니다.',notes_unavailable:'자료를 불러올 수 없습니다.',note_exists:'같은 ID의 메모가 있습니다.',owner_change_forbidden:'메모 소유자를 변경할 수 없습니다.'};throw new Error(messages[result.error]||'요청을 처리하지 못했습니다.');}
 return result;
}
async function loadNotes(){
 const generation=viewGeneration;
 const notes=await api();
 if(generation!==viewGeneration)return;
 list.replaceChildren();
 if(!notes.length){const p=document.createElement('p');p.textContent='아직 내 메모가 없습니다. 가상 메모를 추가해보세요.';list.append(p);}
 for(const note of notes){const card=document.createElement('article');const title=document.createElement('h3');title.textContent=note.title;const body=document.createElement('p');body.textContent=note.body;const edit=document.createElement('button');edit.textContent='수정';edit.className='secondary';edit.onclick=()=>{editingId=note.id;document.querySelector('#title').value=note.title;document.querySelector('#body').value=note.body;document.querySelector('#form-heading').textContent='메모 수정';document.querySelector('#cancel').hidden=false;document.querySelector('#title').focus();};const remove=document.createElement('button');remove.textContent='삭제';remove.className='secondary';remove.onclick=async()=>{try{await api('/'+note.id,{method:'DELETE'});resetEditor();await loadNotes();status('메모를 삭제했습니다.');}catch(error){status(error.message);}};card.append(title,body,edit,remove);list.append(card);}
}
async function updateView(){viewGeneration++;list.replaceChildren();resetEditor();const {data:{session}}=await client.auth.getSession();document.querySelector('#login-form').hidden=!!session;document.querySelector('#vault').hidden=!session;if(session){document.querySelector('#account').textContent='로그인됨';try{await loadNotes();status('내 메모 목록을 불러왔습니다.');}catch(error){status(error.message);}}else status('로그인하면 내 메모를 볼 수 있습니다.');}
if(!client){status('로그인 도구를 불러오지 못했습니다. 새로고침해주세요.');}
else{
 document.querySelector('#login-form').onsubmit=async event=>{event.preventDefault();const {error}=await client.auth.signInWithPassword({email:document.querySelector('#email').value,password:document.querySelector('#password').value});document.querySelector('#password').value='';if(error)status('로그인 실패: '+error.message);else await updateView();};
 document.querySelector('#signup').onclick=async()=>{const email=document.querySelector('#email').value;const password=document.querySelector('#password').value;if(!document.querySelector('#login-form').reportValidity())return;const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin}});document.querySelector('#password').value='';if(error)status('계정 생성 실패: '+error.message);else status('가입 요청이 접수됐습니다. 이메일 인증 후 로그인하세요.');};
 document.querySelector('#logout').onclick=async()=>{const {error}=await client.auth.signOut();if(error){status('로그아웃 실패: '+error.message);return;}await updateView();};
 document.querySelector('#refresh').onclick=async()=>{try{await loadNotes();}catch(error){status(error.message);}};
 document.querySelector('#cancel').onclick=resetEditor;
 document.querySelector('#note-form').onsubmit=async event=>{event.preventDefault();const submit=event.submitter;submit.disabled=true;try{await api(editingId?'/'+editingId:'',{method:editingId?'PUT':'POST',body:JSON.stringify({title:document.querySelector('#title').value,body:document.querySelector('#body').value})});resetEditor();await loadNotes();status('메모를 저장했습니다.');}catch(error){status(error.message);}finally{submit.disabled=false;}};
 client.auth.onAuthStateChange(()=>{setTimeout(()=>{updateView();},0);});
 updateView();
}
