const $ = (s) => document.querySelector(s);
const messagesEl = $('#messages');
const input = $('#input');
const welcome = $('#welcome');
const typing = $('#typing');
const sidePanel = $('#sidePanel');
const backdrop = $('#backdrop');
let history = [];

function escapeHtml(text){return text.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function addMessage(role,text){
  const row=document.createElement('div'); row.className=`msg ${role}`;
  if(role==='assistant'){
    row.innerHTML=`<img class="avatar" src="logo.svg" alt="LEARNEX AI"><div><div class="msg-label">LEARNEX AI ✦</div><div class="bubble">${escapeHtml(text)}</div></div>`;
  }else row.innerHTML=`<div class="bubble">${escapeHtml(text)}</div>`;
  messagesEl.appendChild(row); row.scrollIntoView({behavior:'smooth',block:'end'});
}
function resizeInput(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,130)+'px'}
function setPanel(open){sidePanel.classList.toggle('open',open);backdrop.classList.toggle('show',open);sidePanel.setAttribute('aria-hidden',String(!open))}
function clearChat(){history=[];messagesEl.innerHTML='';welcome.hidden=false;input.focus()}
function showTyping(v){typing.hidden=!v}
async function sendMessage(text=input.value.trim()){
  if(!text)return;
  input.value='';resizeInput();welcome.hidden=true;addMessage('user',text);showTyping(true);
  try{
    const previous=history.slice(-12);
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:previous})});
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||'Request failed');
    history.push({role:'user',text},{role:'assistant',text:data.text});
    addMessage('assistant',data.text);
  }catch(err){
    addMessage('assistant',`Sorry, something went wrong. ${err.message}`);
  }finally{showTyping(false)}
}

$('#composer').addEventListener('submit',e=>{e.preventDefault();sendMessage()});
input.addEventListener('input',resizeInput);
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}});
$('#menuBtn').addEventListener('click',()=>setPanel(true));$('#closeMenu').addEventListener('click',()=>setPanel(false));backdrop.addEventListener('click',()=>setPanel(false));$('#clearBtn').addEventListener('click',clearChat);
$('#attachBtn').addEventListener('click',()=>setPanel(true));
document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.prompt;resizeInput();input.focus()}));
document.querySelectorAll('.side-item').forEach(b=>b.addEventListener('click',()=>{
  const action=b.dataset.action;setPanel(false);
  if(action==='new'){clearChat();return}
  if(action==='math'){input.value='Help me solve this math problem step by step: ';resizeInput();input.focus();return}
  if(action==='study'){input.value='Help me study this topic with a simple explanation, examples, and a short quiz: ';resizeInput();input.focus();return}
  if(action==='about'){alert('LEARNEX AI is an educational assistant focused on Mathematics, Science, Chemistry, Geography and History.');}
}));

let recognition=null;
if('SpeechRecognition' in window || 'webkitSpeechRecognition' in window){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; recognition=new SR();recognition.continuous=false;recognition.interimResults=true;recognition.lang='en-US';
  recognition.onresult=e=>{input.value=Array.from(e.results).map(r=>r[0].transcript).join('');resizeInput()};
  recognition.onend=()=>$('#voiceBtn').classList.remove('active');
  recognition.onerror=()=>$('#voiceBtn').classList.remove('active');
  $('#voiceBtn').addEventListener('click',()=>{if($('#voiceBtn').classList.contains('active'))recognition.stop();else{recognition.lang='en-US';recognition.start();$('#voiceBtn').classList.add('active')}});
}else $('#voiceBtn').addEventListener('click',()=>alert('Voice input is not supported by this browser.'));

window.addEventListener('load',()=>setTimeout(()=>$('#splash').classList.add('hide'),1100));
