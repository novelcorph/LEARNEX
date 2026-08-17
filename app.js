const $=s=>document.querySelector(s);
const messages=$("#messages"),input=$("#input"),welcome=$("#welcome"),splash=$("#splash"),historyEl=$("#history");
let chatHistory=JSON.parse(localStorage.getItem("learnex_history")||"[]");

function save(){localStorage.setItem("learnex_history",JSON.stringify(chatHistory.slice(-20)));renderHistory()}
function renderHistory(){historyEl.innerHTML="";chatHistory.filter(x=>x.role==="user").slice(-8).reverse().forEach(x=>{const b=document.createElement("button");b.textContent=x.text;b.onclick=()=>{input.value=x.text;closeSide();input.focus()};historyEl.appendChild(b)})}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function renderMarkdown(raw){
  let s=String(raw||"").replace(/\r/g,"");
  const blocks=[];
  s=s.replace(/\$\$([\s\S]*?)\$\$/g,(_,m)=>`@@MB${blocks.push(m)-1}@@`);
  s=s.replace(/\\\[([\s\S]*?)\\\]/g,(_,m)=>`@@MB${blocks.push(m)-1}@@`);
  s=s.replace(/\\\(([\s\S]*?)\\\)/g,(_,m)=>`@@MI${blocks.push(m)-1}@@`);
  s=s.replace(/\$([^$\n]+)\$/g,(_,m)=>`@@MI${blocks.push(m)-1}@@`);
  s=esc(s);
  s=s.replace(/```([\s\S]*?)```/g,(_,m)=>`<pre><code>${m.trim()}</code></pre>`);
  s=s.replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/^# (.*)$/gm,"<h1>$1</h1>");
  s=s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/__(.+?)__/g,"<strong>$1</strong>");
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/^[-*] (.*)$/gm,"<li>$1</li>").replace(/(<li>.*<\/li>)/gs,"<ul>$1</ul>");
  s=s.replace(/\n{2,}/g,"</p><p>").replace(/\n/g,"<br>");
  s="<p>"+s+"</p>";
  s=s.replace(/<p>(<h[1-3]>)/g,"$1").replace(/(<\/h[1-3]>)<\/p>/g,"$1");
  s=s.replace(/<p>(<pre>)/g,"$1").replace(/(<\/pre>)<\/p>/g,"$1");
  s=s.replace(/@@MB(\d+)@@/g,(_,i)=>`<div class="math-block" data-math="${i}"></div>`);
  s=s.replace(/@@MI(\d+)@@/g,(_,i)=>`<span class="math-inline" data-math="${i}"></span>`);
  return {html:s,math:blocks};
}
function typeset(el,math){
  el.querySelectorAll("[data-math]").forEach(node=>{
    const i=Number(node.dataset.math);
    if(window.katex) try{katex.render(math[i],node,{displayMode:node.classList.contains("math-block"),throwOnError:false})}catch{}
  });
}
function addMessage(role,text){
  const row=document.createElement("div");row.className="message "+role;
  if(role==="user"){row.innerHTML=`<div class="bubble">${esc(text).replace(/\n/g,"<br>")}</div>`}
  else{const r=renderMarkdown(text);row.innerHTML=`<img class="avatar" src="/learnex-logo.png" alt=""><div><div class="ai-label">LEARNEX AI ✦</div><div class="bubble">${r.html}</div></div>`;setTimeout(()=>typeset(row,r.math),0)}
  messages.appendChild(row);row.scrollIntoView({behavior:"smooth",block:"end"});return row;
}
function addTyping(){const row=document.createElement("div");row.className="message ai";row.id="typing";row.innerHTML='<img class="avatar" src="/learnex-logo.png"><div><div class="ai-label">LEARNEX AI ✦</div><div class="typing"><i></i><i></i><i></i></div></div>';messages.appendChild(row);row.scrollIntoView({behavior:"smooth",block:"end"});return row}
async function send(text){
  text=String(text||"").trim();if(!text)return;
  welcome.style.display="none";input.value="";input.style.height="auto";
  addMessage("user",text);
  chatHistory.push({role:"user",text});save();
  const typing=addTyping();
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,history:chatHistory.slice(-12)})});
    const data=await r.json();typing.remove();
    if(!r.ok)throw new Error(data.error||"Request failed");
    addMessage("ai",data.reply);
    chatHistory.push({role:"model",text:data.reply});save();
  }catch(e){typing.remove();addMessage("ai","Sorry — "+e.message)}
}
$("#composer").addEventListener("submit",e=>{e.preventDefault();send(input.value)});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input.value)}});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,120)+"px"});
document.querySelectorAll("[data-prompt]").forEach(b=>b.onclick=()=>send(b.dataset.prompt));
$("#clearBtn").onclick=()=>{messages.innerHTML="";welcome.style.display="block";chatHistory=[];save()};
$("#attachBtn").onclick=()=>input.focus();
$("#menuBtn").onclick=()=>{$("#sidebar").classList.add("open");$("#overlay").classList.add("show")};
$("#closeSide").onclick=closeSide;$("#overlay").onclick=closeSide;
$("#newChat").onclick=()=>{messages.innerHTML="";welcome.style.display="block";closeSide()};
function closeSide(){$("#sidebar").classList.remove("open");$("#overlay").classList.remove("show")}
$("#skipSplash").onclick=()=>splash.classList.add("hide");
window.addEventListener("load",()=>{renderHistory();setTimeout(()=>splash.classList.add("hide"),2200)});
$("#voiceBtn").onclick=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){input.focus();return}const r=new SR();r.lang=/[\u0980-\u09FF]/.test(input.value)?"bn-IN":"en-IN";r.onresult=e=>{input.value=e.results[0][0].transcript;input.dispatchEvent(new Event("input"))};r.start()};
