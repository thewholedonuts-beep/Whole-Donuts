// Branch nav highlighting and footer link
const branchLinks=[...document.querySelectorAll('[data-branch]')];
const footerStore=document.querySelector('#branch-store');
const branchLabels={awd:'Explore Whole Donuts',tnc:'Explore The Nurtured Chef'};

function syncBranch(){
  const id=location.hash.slice(1);
  branchLinks.forEach(a=>a.classList.toggle('active',a.dataset.branch===id));
  if(branchLabels[id]){footerStore.textContent=branchLabels[id]+' ↗';footerStore.href='#'+id}
  else{footerStore.textContent='Open the menu';footerStore.href='#home'}
}
addEventListener('hashchange',syncBranch);
syncBranch();

// Date label
const dateLabel=document.querySelector('#daily-date');
if(dateLabel)dateLabel.textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());

// localStorage helpers
const mem=new Map();
function safeGet(k){try{return localStorage.getItem(k)}catch(e){return mem.get(k)??null}}
function safeSet(k,v){try{localStorage.setItem(k,v)}catch(e){mem.set(k,String(v))}}
function safeRemove(k){try{localStorage.removeItem(k)}catch(e){mem.delete(k)}}

// 3-question welcome gate
const gate=document.querySelector('#welcome-gate');
const steps=[...document.querySelectorAll('[data-question]')];
const welcomeResult=document.querySelector('#welcome-result');
const welcomeResultTitle=document.querySelector('#welcome-result-title');
const welcomeResultCopy=document.querySelector('#welcome-result-copy');
const welcomeGo=document.querySelector('#welcome-go');
const answers={};

function showQuestion(n){
  steps.forEach(s=>s.hidden=Number(s.dataset.question)!==n);
  const prog=document.querySelector('#welcome-progress');
  if(prog)prog.textContent=n<=3?'Question '+n+' of 3':'Your seat is ready';
}

function finishWelcome({scroll=true}={}){
  const dest=answers.age==='kid'?'#tnc':'#awd';
  const destLabel=answers.age==='kid'?'The Nurtured Chef — the Table':'Whole Donuts — the Counter';
  steps.forEach(s=>s.hidden=true);
  if(welcomeResultTitle)welcomeResultTitle.textContent='Your seat is ready at '+destLabel+'.';
  if(welcomeResultCopy)welcomeResultCopy.textContent='Head through when you\'re ready.';
  if(welcomeGo){welcomeGo.href=dest;welcomeGo.textContent='Go to '+destLabel+' ↓'}
  welcomeResult.hidden=false;
  gate.classList.add('complete');
  showQuestion(4);
  safeSet('plusu-age',answers.age||'adult');
  if(scroll)welcomeResult.scrollIntoView({behavior:'smooth',block:'nearest'});
}

document.querySelectorAll('[data-answer]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const step=btn.closest('[data-question]');
    answers[step.dataset.key]=btn.dataset.answer;
    const next=Number(step.dataset.question)+1;
    if(next>3)finishWelcome();else showQuestion(next);
  });
});

// Restore saved age choice so repeat visitors skip straight to the result
const savedAge=safeGet('plusu-age');
if(savedAge==='kid'||savedAge==='adult'){
  answers.age=savedAge;
  finishWelcome({scroll:false});
}else{
  showQuestion(1);
}

// Restart button
const restart=document.querySelector('#restart-welcome');
if(restart)restart.addEventListener('click',()=>{
  safeRemove('plusu-age');
  Object.keys(answers).forEach(k=>delete answers[k]);
  welcomeResult.hidden=true;
  gate.classList.remove('complete');
  showQuestion(1);
  gate.scrollIntoView({behavior:'smooth'});
});