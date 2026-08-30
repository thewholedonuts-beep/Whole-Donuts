const links=[...document.querySelectorAll('[data-branch]')];
const store=document.querySelector('#branch-store');
const stores={
  awd:['Explore Whole Donuts','#awd'],
  tnc:['Explore The Nurtured Chef','#tnc']
};
const memoryStore=new Map();
const journeyOfferTitle=document.querySelector('#journey-offers-title');
const journeyOfferCopy=document.querySelector('#journey-offers-copy');
const virtualStoreTitle=document.querySelector('#virtual-store-title');
const virtualStoreCopy=document.querySelector('#virtual-store-copy');
const featuredProductTitle=document.querySelector('#featured-product-title');
const featuredProductCopy=document.querySelector('#featured-product-copy');
const templateLibraryCopy=document.querySelector('#template-library-copy');
const storefrontStatus=document.querySelector('#storefront-status');
const storefrontActions=document.querySelector('#storefront-actions');
const storefrontConfig=window.WHNUTZ_STOREFRONT_CONFIG||{};

function validStorefrontUrl(value){
  if(typeof value!=='string'||!value.trim())return null;
  try{
    const url=new URL(value.trim());
    return url.protocol==='https:'&&url.hostname&&!url.username&&!url.password?url.href:null;
  }catch(e){return null}
}

function renderStorefrontHandoff(){
  if(!storefrontStatus||!storefrontActions)return;
  const storefrontUrl=validStorefrontUrl(storefrontConfig.storefrontUrl);
  if(!storefrontUrl)return;
  storefrontStatus.textContent='The Made by +U, 4 ALL shop is open in our separate storefront. Products, shipping, taxes, refunds, and checkout are handled there. Voluntary Cash App support remains separate and does not purchase merchandise.';
  const storefrontCta=document.createElement('a');
  storefrontCta.className='button primary';
  storefrontCta.href=storefrontUrl;
  storefrontCta.target='_blank';
  storefrontCta.rel='noopener noreferrer';
  storefrontCta.textContent='Shop Made by +U, 4 ALL ↗';
  storefrontActions.append(storefrontCta);
}
renderStorefrontHandoff();

function safeGet(key){
  try{return localStorage.getItem(key)}catch(e){return memoryStore.has(key)?memoryStore.get(key):null}
}
function safeSet(key,value){
  try{localStorage.setItem(key,value)}catch(e){memoryStore.set(key,String(value))}
}
function safeRemove(key){
  try{localStorage.removeItem(key)}catch(e){memoryStore.delete(key)}
}

function syncBranch(){
  const id=location.hash.slice(1);
  links.forEach(a=>a.classList.toggle('active',a.dataset.branch===id));
  if(stores[id]){store.textContent=stores[id][0]+' ↗';store.href=stores[id][1]}
  else{store.textContent='Open the menu';store.href='#home'}
}

const menuButtons=[...document.querySelectorAll('[data-menu]')];
const menuPanels=[...document.querySelectorAll('[data-course]')];
function openCourse(id,{focus=false}={}){
  menuButtons.forEach(button=>{
    const active=button.dataset.menu===id;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
    button.tabIndex=active?0:-1;
    if(active&&focus)button.focus();
  });
  menuPanels.forEach(panel=>panel.hidden=panel.dataset.course!==id);
}
menuButtons.forEach(button=>button.addEventListener('click',()=>openCourse(button.dataset.menu)));
menuButtons.forEach((button,index)=>button.addEventListener('keydown',event=>{
  const {key}=event;
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(key))return;
  event.preventDefault();
  let nextIndex=index;
  if(key==='Home')nextIndex=0;
  else if(key==='End')nextIndex=menuButtons.length-1;
  else if(key==='ArrowLeft')nextIndex=(index-1+menuButtons.length)%menuButtons.length;
  else nextIndex=(index+1)%menuButtons.length;
  openCourse(menuButtons[nextIndex].dataset.menu,{focus:true});
}));

const dateLabel=document.querySelector('#daily-date');
if(dateLabel)dateLabel.textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());

const gate=document.querySelector('#welcome-gate');
const counter=document.querySelector('#community-counter');
const steps=[...document.querySelectorAll('[data-question]')];
const welcomeResult=document.querySelector('#welcome-result');
const welcomeAnswers={};

function showQuestion(number){
  steps.forEach(step=>step.hidden=Number(step.dataset.question)!==number);
  const progress=document.querySelector('#welcome-progress');
  if(progress)progress.textContent=number<=3?'Question '+number+' of 3':'Welcome to your table';
}
function finishWelcome({scroll=true}={}){
  const branch=welcomeAnswers.branch;
  const course=welcomeAnswers.course||'bits';
  openCourse(course);
  saveJourney();
  gate.classList.add('complete');
  steps.forEach(step=>step.hidden=true);
  welcomeResult.hidden=false;
  counter.hidden=false;
  const branchWords=branch==='awd'?'Whole Donuts':branch==='tnc'?'The Nurtured Chef':'the whole +U table';
  welcomeResult.querySelector('strong').textContent='Your seat is ready at '+branchWords+'.';
  welcomeResult.querySelector('span').textContent='We opened '+course.toUpperCase()+' first. Change courses anytime.';
  showQuestion(4);
  if(scroll)counter.scrollIntoView({behavior:'smooth',block:'start'});
}
function saveJourney(){
  const journey={
    branch:welcomeAnswers.branch||'both',
    course:welcomeAnswers.course||'bits',
    intent:welcomeAnswers.intent||'wander'
  };
  safeSet('plusu-welcome',JSON.stringify(journey));
  renderJourneyOffers(journey);
  dispatchEvent(new CustomEvent('plusu:journey',{detail:journey}));
}
function renderJourneyOffers(journey){
  if(!journeyOfferTitle||!journeyOfferCopy)return;
  const branch=journey.branch==='awd'?'Whole Donuts':journey.branch==='tnc'?'The Nurtured Chef':'+U';
  const intent={
    learn:'a practical resource to explore',
    make:'a small project to make real',
    help:'a way to support the community',
    wander:'room to look around at your own pace'
  }[journey.intent]||'a next step that fits today';
  journeyOfferTitle.textContent=branch+' picks, made for your '+journey.course+' appetite.';
  journeyOfferCopy.textContent='Start with '+intent+'. Your free next-step template is ready whenever you are.';
  renderVirtualStore(journey,branch,intent);
}
function renderVirtualStore(journey,branch,intent){
  if(!virtualStoreTitle||!virtualStoreCopy||!featuredProductTitle||!featuredProductCopy)return;
  const featured={
    learn:['Open Water Poster','A calm wall piece for keeping a good question close.'],
    make:['Table Tote','For tools, notes, and the work you are ready to make real.'],
    help:['4 ALL Everyday Tee','A soft, simple way to show that there is room at the table.'],
    wander:['Counter Mug','For slow starts, fresh air, and finding your next step at your own pace.']
  }[journey.intent]||['Everyday Tee','Soft, simple, and ready for the long way home.'];
  virtualStoreTitle.textContent='Made by +U, 4 ALL - a little '+branch+' for your '+journey.course+' appetite.';
  virtualStoreCopy.textContent='Since you came here for '+intent+', we pulled a few gentle ideas toward that direction. Browse at your own pace; this is a future Shopify + Printful collection, with no merchandise order or payment collected here.';
  featuredProductTitle.textContent=featured[0];
  featuredProductCopy.textContent=featured[1];
  if(templateLibraryCopy){
    templateLibraryCopy.textContent='You said you came for '+intent+'. Start with a guide, make it your own, and keep only what helps. The library grows as the community leaves useful crumbs.';
  }
}
document.querySelectorAll('[data-answer]').forEach(button=>{
  button.addEventListener('click',()=>{
    const step=button.closest('[data-question]');
    welcomeAnswers[step.dataset.key]=button.dataset.answer;
    const next=Number(step.dataset.question)+1;
    if(next>3)finishWelcome();else showQuestion(next);
  });
});

const savedWelcome=safeGet('plusu-welcome');
if(savedWelcome){
  try{Object.assign(welcomeAnswers,JSON.parse(savedWelcome));finishWelcome({scroll:false})}
  catch(e){
    if(menuButtons.length)openCourse('bits');
    showQuestion(1);
  }
}else{
  if(menuButtons.length)openCourse('bits');
  if(gate)showQuestion(1);
}

const restart=document.querySelector('#restart-welcome');
if(restart)restart.addEventListener('click',()=>{
  safeRemove('plusu-welcome');
  Object.keys(welcomeAnswers).forEach(key=>delete welcomeAnswers[key]);
  welcomeResult.hidden=true;
  counter.hidden=true;
  gate.classList.remove('complete');
  showQuestion(1);
  gate.scrollIntoView({behavior:'smooth'});
});

const passButton=document.querySelector('#make-pass');
const passCard=document.querySelector('#pass-card');
const passImage=document.querySelector('#pass-qr');
const passName=document.querySelector('#pass-name');
const passLink=document.querySelector('#open-pass-link');
const copyPassLink=document.querySelector('#copy-pass-link');
const passHelp=document.querySelector('#pass-help');
const passFallback=document.querySelector('#pass-fallback');
let displayedPass=null;
// +U passes use the generated format +U-<STAMP>-<4 CHAR SUFFIX>, where STAMP is a timestamp-derived base36 token.
function validPass(value){
  return typeof value==='string'&&/^\+U-[A-Z0-9]{1,32}-[A-Z0-9]{4}$/.test(value);
}
function passUrl(pass){
  return 'https://wenevergonnaclose.com/?u='+encodeURIComponent(pass);
}
function syncPassFromQuery(){
  const params=new URLSearchParams(location.search);
  const incoming=params.get('u');
  if(!incoming)return 'none';
  const pass=incoming.trim();
  if(!validPass(pass))return 'invalid';
  const existing=safeGet('plusu-pass');
  let current=existing;
  if(current&&!validPass(current)){
    safeRemove('plusu-pass');
    current=null;
  }
  if(current&&current!==pass){
    console.info('Ignoring incoming +U pass because this browser already has a different saved pass.');
    return 'kept-existing';
  }
  safeSet('plusu-pass',pass);
  safeSet('plusu-last-visit',new Date().toISOString());
  return 'restored';
}
const passRestoreState=syncPassFromQuery();
function getPass(){
  let pass=safeGet('plusu-pass');
  if(pass&&!validPass(pass)){
    safeRemove('plusu-pass');
    pass=null;
  }
  if(!pass){
    const stamp=Date.now().toString(36).toUpperCase();
    const spice=Math.random().toString(36).slice(2,6).toUpperCase();
    pass='+U-'+stamp+'-'+spice;
    safeSet('plusu-pass',pass);
  }
  return pass;
}
function renderPass(renderQr){
  if(!passCard||!passImage||!passName)return;
  const pass=getPass();
  const url=passUrl(pass);
  displayedPass=pass;
  passName.textContent=pass;
  if(passLink)passLink.href=url;
  passCard.hidden=false;
  if(renderQr){
    passImage.hidden=false;
    passImage.src='https://api.qrserver.com/v1/create-qr-code/?size=720x720&data='+encodeURIComponent(url);
    passImage.alt='Your private +U QR for '+pass;
  }else{
    passImage.hidden=true;
    passImage.removeAttribute('src');
    passImage.alt='Your private +U QR is ready when requested';
  }
  if(passButton)passButton.textContent=renderQr?'Refresh your +U QR':'Show your +U QR';
  if(copyPassLink)copyPassLink.textContent='Copy my private +U link';
  if(passHelp){
    passHelp.textContent=passRestoreState==='restored'
      ?'This browser restored your +U pass from a private link. Request a QR only if you want one on screen.'
      :passRestoreState==='kept-existing'
        ?'This browser kept its existing +U pass. Request a QR only if you want one on screen.'
        :'The QR image is requested from a third-party QR service only after you ask for it.';
  }
  if(passFallback)passFallback.hidden=true;
  safeSet('plusu-last-visit',new Date().toISOString());
  if(passRestoreState==='restored'&&counter&&!counter.hidden){
    passCard.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
}
if(passButton)passButton.addEventListener('click',()=>renderPass(true));
if(validPass(safeGet('plusu-pass')))renderPass(false);
if(passImage&&passFallback){
  passImage.addEventListener('error',()=>{
    if(!passImage.hidden&&passImage.getAttribute('src'))passFallback.hidden=false;
  });
  passImage.addEventListener('load',()=>{passFallback.hidden=true});
}
if(copyPassLink)copyPassLink.addEventListener('click',async()=>{
  if(!displayedPass)renderPass(false);
  if(!displayedPass){
    copyPassLink.textContent='Copy unavailable';
    return;
  }
  const pass=displayedPass;
  const url=passUrl(pass);
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      await navigator.clipboard.writeText(url);
      copyPassLink.textContent='Link copied';
    }else{
      copyPassLink.textContent='Copy unavailable';
    }
  }catch(e){
    copyPassLink.textContent='Copy unavailable';
  }
});

addEventListener('hashchange',syncBranch);
syncBranch();