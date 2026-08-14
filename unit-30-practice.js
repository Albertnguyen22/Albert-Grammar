(function(){
'use strict';
const ROOT=typeof window!=='undefined'?window:globalThis;
const STORE_BASE='ag_unit30_practice_v1';
const TOTAL_PER_UNIT=30;
let CURRENT_USER=null;
let DATA={version:1,units:{}};
const CACHE=new Map();
let POOLS=null;

function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function plain(value){return String(value??'').replace(/<br\s*\/?>/gi,' / ').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()}
function norm(value){return plain(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[^a-z0-9' -]+/g,' ').replace(/\s+/g,' ').trim()}
function unique(values){const seen=new Set(),out=[];for(const value of values||[]){const text=plain(value);const key=norm(text);if(text&&key&&!seen.has(key)){seen.add(key);out.push(text)}}return out}
function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=hash(seed)||1;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
function shuffled(values,seed){const out=[...values],r=rng(seed);for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function guides(){try{return ROOT.V12_GUIDES||(typeof V12_GUIDES!=='undefined'?V12_GUIDES:{})}catch(_e){return ROOT.V12_GUIDES||{}}}
function sourceBooks(){try{if(typeof V7_SOURCE_BOOKS!=='undefined')return V7_SOURCE_BOOKS;if(typeof BOOKS!=='undefined')return BOOKS}catch(_e){}return []}
function currentUid(){try{return typeof state!=='undefined'&&state&&state.unit?String(state.unit):''}catch(_e){return ''}}
function userId(){return CURRENT_USER&&CURRENT_USER.id?String(CURRENT_USER.id):'guest'}
function storeKey(){return STORE_BASE+'::'+userId()}
function load(){try{const raw=JSON.parse(localStorage.getItem(storeKey())||'null');DATA=raw&&typeof raw==='object'?raw:{version:1,units:{}}}catch(_e){DATA={version:1,units:{}}}DATA.version=1;DATA.units=DATA.units||{}}
function save(){try{localStorage.setItem(storeKey(),JSON.stringify(DATA))}catch(_e){}}
function unitState(uid){return DATA.units[uid]||(DATA.units[uid]={open:false,answers:{},submitted:false})}
function unitMeta(uid){
 const guide=guides()[uid]||{};let bookId=String(uid).split('-')[0]||'',bookTitle=guide.bookTitle||bookId,unit=guide.unit||'',title=guide.sourceTitle||guide.titleVi||uid,topicTitle='',category='';
 for(const book of sourceBooks()){
  const found=(book.units||[]).find(item=>String(item.uid)===String(uid));
  if(found){bookId=book.id||bookId;bookTitle=book.title||book.short||bookTitle;unit=found.unit||unit;title=found.title||title;topicTitle=found.topicTitle||'';category=found.category||'';break}
 }
 return {uid,bookId,bookTitle,unit,title,topicTitle,category,guideTitle:guide.titleVi||title};
}
function allGuideEntries(){return Object.entries(guides()).map(([uid,guide])=>({uid,guide,meta:unitMeta(uid)}))}
function collectPools(){
 if(POOLS)return POOLS;
 const entries=allGuideEntries();
 POOLS={
  summaries:unique(entries.map(x=>x.guide.summary)),
  useTitles:unique(entries.flatMap(x=>(x.guide.uses||[]).map(y=>y.title))),
  useDescs:unique(entries.flatMap(x=>(x.guide.uses||[]).map(y=>useDescription(y)))),
  ruleTitles:unique(entries.flatMap(x=>(x.guide.rules||[]).map(y=>y.title))),
  formulas:unique(entries.flatMap(x=>(x.guide.rules||[]).map(y=>y.formula))),
  examples:unique(entries.flatMap(x=>collectExamples(x.guide).map(y=>y.en))),
  signals:unique(entries.flatMap(x=>(x.guide.signals||[]).flatMap(y=>y.items||[]))),
  notes:unique(entries.flatMap(x=>x.guide.notes||[])),
  traps:unique(entries.flatMap(x=>x.guide.traps||[])),
  titles:unique(entries.map(x=>x.guide.titleVi||x.meta.title))
 };
 return POOLS;
}
function distractors(pool,correct,seed,count){
 const c=norm(correct),items=unique(pool).filter(x=>norm(x)!==c);
 const near=items.filter(x=>Math.abs(x.length-String(correct).length)<Math.max(26,String(correct).length*.8));
 const base=near.length>=count?near:items;
 return shuffled(base,seed).slice(0,count);
}
function optionSet(correct,pool,seed){
 let opts=unique([correct,...distractors(pool,correct,seed,3)]);
 const fallback=['Không có đáp án nào phù hợp','Chỉ dùng trong văn nói thân mật','Luôn dùng cho mọi chủ ngữ','Không cần xét nghĩa của câu'];
 for(const x of fallback)if(opts.length<4&&norm(x)!==norm(correct)&&!opts.some(y=>norm(y)===norm(x)))opts.push(x);
 opts=shuffled(opts.slice(0,4),seed+'::shuffle');
 return {options:opts,correctIndex:opts.findIndex(x=>norm(x)===norm(correct))};
}
function collectExamples(guide){
 const out=[];
 for(const use of guide.uses||[])for(const pair of use.examples||[])if(pair&&pair[0])out.push({en:plain(pair[0]),vi:plain(pair[1]||''),label:use.title||'Cách dùng',kind:'use'});
 for(const rule of guide.rules||[])for(const pair of rule.examples||[])if(pair&&pair[0])out.push({en:plain(pair[0]),vi:plain(pair[1]||''),label:rule.title||'Cấu trúc',formula:plain(rule.formula||''),kind:'rule'});
 for(const signal of guide.signals||[])if(signal.example)out.push({en:plain(signal.example),vi:'',label:signal.title||'Dấu hiệu nhận biết',kind:'signal'});
 return out;
}
const CLOZE_GROUPS=[
 ['am','is','are','was'],['was','were','is','are'],['do','does','did','has'],['have','has','had','did'],
 ['have been','has been','had been','will have been'],['will have','would have','should have','could have'],
 ['will be','would be','is','are'],['can','could','may','might'],['must','should','ought to','have to'],
 ['will','would','shall','should'],['a','an','the','Ø (không dùng mạo từ)'],['some','any','no','every'],
 ['much','many','few','little'],['a few','few','a little','little'],['for','since','ago','during'],
 ['at','on','in','by'],['to','for','from','of'],['with','without','by','for'],['by','until','during','while'],
 ['who','which','that','whose'],['where','when','why','how'],['if','unless','provided that','when'],
 ['although','though','even though','despite'],['because','because of','although','despite'],
 ['more','most','less','least'],['too','enough','so','such'],
 ['there is','there are','it is','they are'],['used to','be used to','get used to','would'],
 ['am going to','is going to','are going to','will'],['was going to','were going to','would','was about to'],
 ['been','being','be','was'],['up','out','off','on'],['back','away','over','through']
];
function boundary(text,index,length){const before=index>0?text[index-1]:' ',after=index+length<text.length?text[index+length]:' ';return !/[a-z0-9]/i.test(before)&&!/[a-z0-9]/i.test(after)}
function phraseMatch(sentence,phrase){const source=String(sentence),lower=source.toLowerCase(),target=String(phrase).toLowerCase();let at=lower.indexOf(target);while(at>=0){if(boundary(lower,at,target.length))return {start:at,length:target.length,text:source.slice(at,at+target.length)};at=lower.indexOf(target,at+1)}return null}
function baseIng(word){let b=word.slice(0,-3);if(/([bcdfghjklmnpqrstvwxyz])\1$/i.test(b))b=b.slice(0,-1);if(/(?:mak|tak|writ|us|mov|com|giv|hav)$/i.test(b))b+='e';return b}
function verbCloze(sentence){const words=String(sentence).match(/\b[A-Za-z]{5,}(?:ing|ed)\b/g)||[];for(const word of words){if(/ing$/i.test(word)){const base=baseIng(word.toLowerCase());if(base.length<3)continue;return {match:phraseMatch(sentence,word),answer:word,group:unique([word,base,base+'s',base+'ed'])}}if(/ed$/i.test(word)){const base=word.toLowerCase().slice(0,-2);if(base.length<3)continue;return {match:phraseMatch(sentence,word),answer:word,group:unique([word,base,base+'ing',base+'s'])}}}return null}
function clozeGroupAllowed(group,guide,meta){
 const key=group.join('|').toLowerCase(),topic=norm([guide.titleVi,guide.sourceTitle,guide.summary,meta.category,meta.topicTitle].join(' ')),formulas=plain((guide.rules||[]).map(r=>r.formula+' '+r.title).join(' '));
 const has=re=>re.test(topic+' '+norm(formulas));
 if(key.includes('a|an|the'))return has(/article|mao tu|a an|zero article/);
 if(key.includes('some|any|no|every')||key.includes('much|many|few|little')||key.includes('a few|few|a little|little'))return has(/quantifier|so luong|some any|much many|few little|all both|each every/);
 if(key.includes('who|which|that|whose'))return has(/relative|menh de quan he|pronoun/);
 if(key.includes('where|when|why|how'))return has(/question|cau hoi|how long|relative|menh de|where when/);
 if(key.includes('if|unless|provided'))return has(/condition|if clause|wish|unless|menh de/);
 if(key.includes('although|though|even though|despite')||key.includes('because|because of|although|despite'))return has(/clause|conjunction|lien tu|although|despite|because|contrast|reason/);
 if(key.includes('more|most|less|least')||key.includes('too|enough|so|such'))return has(/comparison|comparative|superlative|adjective|adverb|so such|too enough/);
 if(key.includes('there is|there are|it is|they are'))return has(/there is|there are|it 1|it 2|existence/);
 if(key.includes('used to|be used to|get used to'))return has(/used to/);
 if(key.includes('going to'))return has(/going to|future|tuong lai/);
 if(key==='up|out|off|on'||key==='back|away|over|through')return has(/phrasal|cum dong tu|preposition|gioi tu|particle/);
 if(key==='at|on|in|by'||key==='to|for|from|of'||key==='with|without|by|for')return has(/preposition|gioi tu|gerund|infinitive|relative|passive|for since|how long|collocation|fixed phrase/);
 if(key==='for|since|ago|during'||key==='by|until|during|while')return has(/perfect|how long|for since|time|tense|preposition|clause|tuong lai|qua khu|hien tai/);
 return true;
}
function clozeCandidates(example,guide,meta,seed){
 const found=[];
 for(const group of CLOZE_GROUPS){if(!clozeGroupAllowed(group,guide,meta))continue;for(const phrase of [...group].sort((a,b)=>b.length-a.length)){if(phrase.startsWith('Ø'))continue;const match=phraseMatch(example.en,phrase);if(match){found.push({match,answer:match.text,group:group.map(x=>x===phrase?match.text:x)});break}}}
 const seen=new Set();return shuffled(found.filter(x=>{const k=x.match.start+'::'+norm(x.answer);if(seen.has(k))return false;seen.add(k);return x.group.length>=3}),seed);
}
function blankSentence(sentence,match){return String(sentence).slice(0,match.start)+'_____'+String(sentence).slice(match.start+match.length)}
function replaceMatch(sentence,match,replacement){const rep=String(replacement||'');const value=rep.startsWith('Ø')?'':rep;return (String(sentence).slice(0,match.start)+value+String(sentence).slice(match.start+match.length)).replace(/\s+([?.!,;:])/g,'$1').replace(/\s{2,}/g,' ').trim()}
function questionObject(spec,uid,index){return Object.assign({id:uid+'::extra30::'+String(index+1).padStart(2,'0'),index,skill:'grammar'},spec)}
function useDescription(use){const desc=plain(use&&use.desc||'');return desc||('Dùng để diễn đạt hoặc nhận biết: '+plain(use&&use.title||'cách dùng của Unit')+'.')}
function buildQuestions(uid){
 if(CACHE.has(uid))return CACHE.get(uid);
 const guide=guides()[uid];if(!guide)return [];
 const meta=unitMeta(uid),pool=collectPools(),questions=[],keys=new Set();
 function push(spec){
  if(questions.length>=TOTAL_PER_UNIT)return false;
  if(!spec||!spec.correctAnswer)return false;
  const key=norm((spec.prompt||'')+' '+(spec.stem||'')+' '+spec.correctAnswer);
  if(!key||keys.has(key))return false;
  const built=optionSet(spec.correctAnswer,spec.pool||pool.summaries,uid+'::'+questions.length+'::'+(spec.seed||''));
  if(built.correctIndex<0)return false;
  keys.add(key);questions.push(questionObject(Object.assign({},spec,{options:built.options,correctIndex:built.correctIndex,category:meta.topicTitle||guide.titleVi||meta.title,bookTitle:meta.bookTitle,unit:meta.unit,unitTitle:guide.titleVi||meta.title}),uid,questions.length));return true;
 }
 const examples=collectExamples(guide),applicationPairs=[];
 let clozeNo=0;
 for(const example of examples){
  const candidates=clozeCandidates(example,guide,meta,uid+'::'+example.en);
  for(const candidate of candidates){
   if(clozeNo>=8)break;
   push({kind:'cloze',prompt:'Chọn từ hoặc cụm từ đúng để hoàn thành câu.',stem:blankSentence(example.en,candidate.match),support:example.vi?('Nghĩa tiếng Việt: '+example.vi):('Điểm đang luyện: '+example.label),correctAnswer:candidate.answer,pool:candidate.group,explanation:'Câu hoàn chỉnh: '+example.en+(example.vi?' — '+example.vi:'')+'. Câu này minh họa phần “'+example.label+'” trong Unit.',fix:'Đặt “'+candidate.answer+'” vào chỗ trống rồi đọc lại toàn bộ câu.',trap:(guide.traps||[])[clozeNo%(guide.traps||['']).length]||'Đọc cả câu và kiểm tra cấu trúc trước khi chọn.',seed:'cloze-'+clozeNo});
   applicationPairs.push({example,candidate});clozeNo++;
  }
  if(clozeNo>=8)break;
 }
 let sentenceChoiceNo=0;
 for(const pair of applicationPairs){
  if(sentenceChoiceNo>=6||questions.length>=14)break;
  const variants=unique(pair.candidate.group.map(value=>replaceMatch(pair.example.en,pair.candidate.match,value)));
  if(variants.length<3)continue;
  push({kind:'sentence-choice',prompt:'Câu nào đúng theo cấu trúc và nghĩa của Unit?',stem:pair.example.vi?('Nghĩa cần diễn đạt: '+pair.example.vi):('Điểm đang luyện: '+pair.example.label),correctAnswer:pair.example.en,pool:variants,explanation:'Câu đúng: '+pair.example.en+(pair.example.vi?' — '+pair.example.vi:'')+'. Cấu trúc này thuộc phần “'+pair.example.label+'”.',fix:'So sánh trợ động từ, dạng động từ và trật tự từ giữa các lựa chọn.',trap:(guide.traps||[])[sentenceChoiceNo%(guide.traps||['']).length]||'Chọn theo nghĩa và công thức của Unit, không chọn theo cảm giác.',seed:'sentence-choice-'+sentenceChoiceNo});
  sentenceChoiceNo++;
 }
 const uses=guide.uses||[];
 for(let i=0;i<Math.max(6,uses.length*2)&&questions.length<15;i++){
  const use=uses[i%Math.max(1,uses.length)];if(!use)break;
  const mode=i%3,desc=useDescription(use);
  if(mode===0)push({kind:'use',prompt:'Cách dùng nào phù hợp với mô tả sau?',stem:desc,correctAnswer:use.title,pool:pool.useTitles,explanation:'Trong Unit “'+guide.titleVi+'”, mô tả này thuộc cách dùng “'+use.title+'”.',fix:'Ghi nhớ mối liên hệ giữa tên cách dùng và ý nghĩa: '+desc,trap:(guide.traps||[])[0]||'Không chọn chỉ vì thấy một từ khóa.',seed:'use-title-'+i});
  else if(mode===1)push({kind:'use',prompt:'Mô tả nào đúng với cách dùng “'+use.title+'”?',stem:'Chọn lời giải thích sát nhất với lý thuyết của Unit.',correctAnswer:desc,pool:pool.useDescs,explanation:'“'+use.title+'” được giải thích là: '+desc,fix:'Đọc lại phần Khi nào dùng? của Unit.',trap:(guide.traps||[])[0]||'Phải xét nghĩa của cả câu.',seed:'use-desc-'+i});
  else if((use.examples||[]).length){const pair=use.examples[i%(use.examples.length)];push({kind:'use-example',prompt:'Câu nào minh họa đúng cách dùng “'+use.title+'”?',stem:'Chọn ví dụ đúng theo Unit.',correctAnswer:pair[0],pool:pool.examples,explanation:'Ví dụ đúng: '+pair[0]+(pair[1]?' — '+pair[1]:'')+'. Đây là ví dụ cho “'+use.title+'”.',fix:'Đối chiếu nghĩa của câu với tên cách dùng.',trap:(guide.traps||[])[0]||'Không chọn câu chỉ vì có từ quen thuộc.',seed:'use-example-'+i})}
 }
 const rules=guide.rules||[];
 for(let i=0;i<Math.max(8,rules.length*3)&&questions.length<23;i++){
  const rule=rules[i%Math.max(1,rules.length)];if(!rule)break;
  const mode=i%3;
  if(mode===0)push({kind:'structure',prompt:'Cấu trúc nào đúng cho phần “'+rule.title+'”?',stem:'Chọn công thức được trình bày trong Unit.',correctAnswer:rule.formula,pool:pool.formulas,explanation:'Công thức đúng của “'+rule.title+'” là: '+plain(rule.formula)+'. '+plain(rule.explanation||''),fix:'Chép lại công thức theo từng thành phần và đặt một câu mới.',trap:(guide.traps||[])[0]||'Kiểm tra trợ động từ và dạng động từ.',seed:'formula-'+i});
  else if(mode===1)push({kind:'structure',prompt:'Tên phần nào đi với công thức sau?',stem:plain(rule.formula),correctAnswer:rule.title,pool:pool.ruleTitles,explanation:'Công thức này thuộc phần “'+rule.title+'”. '+plain(rule.explanation||''),fix:'Nối tên chức năng với đúng công thức.',trap:(guide.traps||[])[0]||'Không đảo lẫn vị trí chủ ngữ và trợ động từ.',seed:'rule-title-'+i});
  else if((rule.examples||[]).length){const pair=rule.examples[i%(rule.examples.length)];push({kind:'structure-example',prompt:'Ví dụ nào được dùng để minh họa “'+rule.title+'”?',stem:'Chọn câu phù hợp với công thức: '+plain(rule.formula),correctAnswer:pair[0],pool:pool.examples,explanation:'Câu đúng: '+pair[0]+(pair[1]?' — '+pair[1]:'')+'. '+plain(rule.explanation||''),fix:'So sánh từng phần của câu với công thức.',trap:(guide.traps||[])[0]||'Kiểm tra dạng động từ và trật tự từ.',seed:'rule-example-'+i})}
 }
 const signalItems=(guide.signals||[]).flatMap(signal=>(signal.items||[]).map(item=>({item,title:signal.title||'Dấu hiệu nhận biết'})));
 for(let i=0;i<4&&questions.length<27;i++){
  if(signalItems.length){const s=signalItems[i%signalItems.length];push({kind:'signal',prompt:'Từ hoặc cụm nào là dấu hiệu/điểm cần chú ý của Unit này?',stem:'Nhóm: '+s.title,correctAnswer:s.item,pool:pool.signals,explanation:'“'+s.item+'” được liệt kê trong nhóm “'+s.title+'” của Unit.',fix:'Ghi cả cụm và đặt một câu ví dụ.',trap:(guide.traps||[])[0]||'Dấu hiệu chỉ hỗ trợ; nghĩa toàn câu mới quyết định.',seed:'signal-'+i})}
  else if((guide.notes||[]).length){const note=guide.notes[i%guide.notes.length];push({kind:'note',prompt:'Ghi chú nào đúng với Unit này?',stem:'Chọn lưu ý được nêu trong phần lý thuyết.',correctAnswer:note,pool:pool.notes,explanation:'Lưu ý đúng: '+note,fix:'Đọc lại ghi chú và thử giải thích bằng lời của em.',trap:(guide.traps||[])[0]||'Đừng bỏ qua ngoại lệ hoặc lưu ý nhỏ.',seed:'note-'+i})}
  else push({kind:'summary',prompt:'Ý chính nào đúng với Unit “'+guide.titleVi+'”?',stem:'Chọn phần tóm tắt sát nhất.',correctAnswer:guide.summary,pool:pool.summaries,explanation:'Tóm tắt của Unit: '+guide.summary,fix:'Dùng ý chính này để kiểm tra lại các câu vừa làm.',trap:(guide.traps||[])[0]||'Hãy xác định ý nghĩa trước công thức.',seed:'summary-signal-'+i});
 }
 const traps=(guide.traps||[]).length?guide.traps:['Đọc toàn bộ nghĩa của câu trước khi chọn cấu trúc.'];
 for(let i=0;i<4&&questions.length<TOTAL_PER_UNIT;i++){
  const trap=traps[i%traps.length];
  push({kind:'trap',prompt:'Exam Trap nào cần nhớ trong Unit này?',stem:'Chọn cảnh báo đúng để tránh lỗi thường gặp.',correctAnswer:trap,pool:pool.traps,explanation:'Cảnh báo của Unit: '+trap,fix:'Viết một ví dụ đúng và một ví dụ sai để ghi nhớ.',trap,seed:'trap-'+i});
 }
 let fill=0;
 while(questions.length<TOTAL_PER_UNIT&&fill<100){
  const mode=fill%4;
  if(mode===0)push({kind:'summary',prompt:'Câu củng cố '+(fill+1)+': Chọn tóm tắt đúng cho Unit “'+guide.titleVi+'”.',stem:'Bài này tập trung vào nội dung nào?',correctAnswer:guide.summary,pool:pool.summaries,explanation:'Nội dung trọng tâm: '+guide.summary,fix:'Đọc lại tóm tắt rồi tự nêu một ví dụ.',trap:traps[fill%traps.length],seed:'fill-summary-'+fill});
  else if(mode===1&&rules.length){const r=rules[fill%rules.length];push({kind:'structure',prompt:'Câu củng cố '+(fill+1)+': Theo Unit, công thức nào đi với “'+r.title+'”?',stem:'Chọn đúng một công thức.',correctAnswer:r.formula,pool:pool.formulas,explanation:'Đáp án đúng: '+plain(r.formula)+'. '+plain(r.explanation||''),fix:'Đặt các thành phần theo đúng thứ tự trong công thức.',trap:traps[fill%traps.length],seed:'fill-rule-'+fill})}
  else if(mode===2&&uses.length){const u=uses[fill%uses.length],desc=useDescription(u);push({kind:'use',prompt:'Câu củng cố '+(fill+1)+': Theo Unit, “'+u.title+'” được dùng khi nào?',stem:'Chọn mô tả chính xác.',correctAnswer:desc,pool:pool.useDescs,explanation:'Cách dùng đúng: '+desc,fix:'Tạo một tình huống thực tế dùng cấu trúc này.',trap:traps[fill%traps.length],seed:'fill-use-'+fill})}
  else push({kind:'source',prompt:'Câu củng cố '+(fill+1)+': Tên nội dung nào đúng với Unit '+meta.unit+' của '+meta.bookTitle+'?',stem:'Chọn đúng chủ điểm đang học.',correctAnswer:guide.titleVi||meta.title,pool:pool.titles,explanation:'Unit này được giải thích bằng tiếng Việt là “'+(guide.titleVi||meta.title)+'”.',fix:'Liên hệ tên Unit với tóm tắt: '+guide.summary,trap:traps[fill%traps.length],seed:'fill-title-'+fill});
  fill++;
 }
 const out=questions.slice(0,TOTAL_PER_UNIT);CACHE.set(uid,out);return out;
}
function validateAll(){
 const ids=Object.keys(guides()),issues=[];let total=0;
 for(const uid of ids){const qs=buildQuestions(uid);total+=qs.length;if(qs.length!==TOTAL_PER_UNIT)issues.push(uid+': '+qs.length);const idSet=new Set(qs.map(q=>q.id));if(idSet.size!==qs.length)issues.push(uid+': duplicate ids');for(const q of qs){if(q.options.length!==4||q.correctIndex<0||q.correctIndex>3||!q.prompt||!q.stem||!q.explanation||!q.trap)issues.push(uid+': invalid '+q.id)}}
 return {units:ids.length,questionsPerUnit:TOTAL_PER_UNIT,totalQuestions:total,issues};
}
function renderQuestion(q,answer,submitted){
 const isCorrect=Number(answer)===q.correctIndex;let result='';
 if(submitted)result=`<div class="ag30-feedback ${isCorrect?'correct':'wrong'}"><b>${isCorrect?'✓ Chính xác':'✗ Chưa đúng'}</b><p><strong>Đáp án đúng:</strong> ${esc(q.options[q.correctIndex])}</p><p><strong>Giải thích:</strong> ${esc(q.explanation)}</p>${isCorrect?'':`<p><strong>Cách sửa:</strong> ${esc(q.fix||'Đọc lại lý thuyết của Unit và làm lại câu.')}</p>`}<p><strong>Exam Trap:</strong> ${esc(q.trap)}</p></div>`;
 return `<article class="ag30-question ${submitted?(isCorrect?'is-correct':'is-wrong'):''}" data-ag30-question-id="${esc(q.id)}"><div class="ag30-qhead"><span>${q.index+1}</span><div><b>Câu ${q.index+1}</b><small>${esc(q.kind==='cloze'?'Điền cấu trúc vào câu':q.kind==='sentence-choice'?'Chọn câu đúng':q.kind==='structure'||q.kind==='structure-example'?'Cấu trúc và mẫu câu':q.kind==='trap'?'Exam Trap':'Hiểu và vận dụng Unit')}</small></div></div><h4>${esc(q.prompt)}</h4><div class="ag30-stem">${esc(q.stem||'')}</div>${q.support?`<div class="ag30-support">${esc(q.support)}</div>`:''}<div class="ag30-options">${q.options.map((option,i)=>`<label class="ag30-option ${Number(answer)===i?'selected':''} ${submitted&&i===q.correctIndex?'correct-option':''} ${submitted&&Number(answer)===i&&i!==q.correctIndex?'wrong-option':''}"><input type="radio" name="ag30-${esc(q.id)}" value="${i}" data-ag30-answer="${esc(q.id)}" ${Number(answer)===i?'checked':''} ${submitted?'disabled':''}><span>${String.fromCharCode(65+i)}</span><em>${esc(option)}</em></label>`).join('')}</div>${result}</article>`;
}
function score(uid){const qs=buildQuestions(uid),st=unitState(uid);let correct=0;for(const q of qs)if(Number(st.answers[q.id])===q.correctIndex)correct++;return {correct,wrong:qs.length-correct,percent:qs.length?Math.round(correct/qs.length*100):0}}
function allAnswered(uid){const qs=buildQuestions(uid),st=unitState(uid);return qs.length===TOTAL_PER_UNIT&&qs.every(q=>st.answers[q.id]!==undefined&&st.answers[q.id]!==null&&st.answers[q.id]!=='')}
function ensureStyle(){if(typeof document==='undefined'||document.getElementById('ag30-style'))return;const style=document.createElement('style');style.id='ag30-style';style.textContent=`
.ag30-section{margin:22px 0;border:1px solid #cfe1f4;border-radius:26px;background:#fff;overflow:hidden;box-shadow:0 12px 32px rgba(44,101,172,.08)}
.ag30-head{padding:20px;background:linear-gradient(135deg,#edf7ff,#fff7d9);display:flex;justify-content:space-between;align-items:center;gap:16px}.ag30-head h3{font:900 24px Nunito;margin:2px 0 5px}.ag30-head p{margin:0;color:#60758a}.ag30-badge{display:inline-flex;background:#fff;border:1px solid #bcd8f5;color:#1d63d7;border-radius:999px;padding:6px 10px;font-weight:900;font-size:12px}.ag30-start{border:0;border-radius:15px;background:#2f72ff;color:#fff;padding:11px 15px;font-weight:900;white-space:nowrap}
.ag30-body{padding:18px}.ag30-progress-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:16px}.ag30-progress{height:10px;background:#e6eef7;border-radius:999px;overflow:hidden}.ag30-progress i{display:block;height:100%;background:linear-gradient(90deg,#2f72ff,#14a06f);transition:width .2s}.ag30-progress-row b{color:#47657d}
.ag30-score{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}.ag30-score>div{border:1px solid #d5e5f4;border-radius:16px;padding:12px;text-align:center;background:#f8fcff}.ag30-score b{display:block;font:900 27px Nunito;color:#2563eb}.ag30-score span{color:#60758a;font-weight:800;font-size:12px}
.ag30-list{display:grid;gap:15px}.ag30-question{border:1px solid #d7e6f5;border-radius:21px;padding:17px;background:#fff;scroll-margin-top:100px}.ag30-question.is-correct{border-color:#91d8b5;background:#f7fffb}.ag30-question.is-wrong{border-color:#efaaaa;background:#fff9f9}.ag30-qhead{display:flex;gap:11px;align-items:center;padding-bottom:10px;border-bottom:1px solid #e4edf6}.ag30-qhead>span{width:38px;height:38px;border-radius:12px;background:#e9f3ff;color:#2468dc;display:grid;place-items:center;font:900 15px Nunito}.ag30-qhead b{display:block}.ag30-qhead small{display:block;color:#718397;margin-top:2px}.ag30-question h4{font:900 17px Nunito;margin:13px 0 8px}.ag30-stem{font-size:17px;font-weight:750;line-height:1.7;color:#17324d;background:#f7fbff;border-left:4px solid #5b92ef;border-radius:12px;padding:11px 13px}.ag30-support{margin-top:8px;color:#61778e;font-size:13px}
.ag30-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:13px}.ag30-option{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:start;border:1px solid #cfe0f1;border-radius:15px;padding:10px 11px;background:#fff;cursor:pointer}.ag30-option input{position:absolute;opacity:0;pointer-events:none}.ag30-option>span{width:30px;height:30px;border-radius:9px;background:#edf5ff;color:#2b69d4;display:grid;place-items:center;font-weight:900}.ag30-option em{font-style:normal;line-height:1.5;color:#294c68}.ag30-option:hover,.ag30-option.selected{border-color:#4f8fee;background:#edf5ff}.ag30-option.selected>span{background:#2f72ff;color:#fff}.ag30-option.correct-option{border-color:#72c99e;background:#ecfff6}.ag30-option.wrong-option{border-color:#e89696;background:#fff0f0}
.ag30-feedback{margin-top:12px;border-radius:15px;padding:12px 13px;line-height:1.6}.ag30-feedback p{margin:5px 0}.ag30-feedback.correct{background:#eafbf3;border:1px solid #a9e0c6;color:#205f47}.ag30-feedback.wrong{background:#fff0f0;border:1px solid #efb1b1;color:#7d3030}
.ag30-actions{position:sticky;bottom:10px;z-index:5;margin-top:18px;border:1px solid #d5e4f2;border-radius:18px;padding:11px;background:rgba(255,255,255,.96);backdrop-filter:blur(9px);box-shadow:0 14px 30px rgba(44,86,126,.13);display:flex;justify-content:space-between;gap:10px;align-items:center}.ag30-actions>div{display:flex;gap:8px;flex-wrap:wrap}.ag30-btn{border:1px solid #cbddec;background:#fff;color:#315a7d;border-radius:13px;padding:10px 13px;font-weight:900}.ag30-btn.primary{background:#2f72ff;border-color:#2f72ff;color:#fff}.ag30-btn.danger{color:#a12d2d;border-color:#efb7b7;background:#fff7f7}.ag30-btn:disabled{opacity:.45;cursor:not-allowed}.ag30-note{margin:12px 0 0;color:#60758a;font-size:12px;line-height:1.55}.ag30-login-note{margin-top:10px;border:1px solid #f0d49c;background:#fff8e8;color:#78551a;border-radius:13px;padding:9px 11px;font-size:13px;font-weight:800}
@media(max-width:760px){.ag30-head{display:block}.ag30-start{margin-top:12px;width:100%}.ag30-options{grid-template-columns:1fr}.ag30-score{grid-template-columns:1fr}.ag30-actions{position:static;display:block}.ag30-actions>div{display:grid;margin-top:9px}.ag30-btn{width:100%}}
`;document.head.appendChild(style)}
function sectionHtml(uid){
 const guide=guides()[uid];if(!guide)return '';
 const meta=unitMeta(uid),st=unitState(uid),qs=buildQuestions(uid);
 if(!st.open)return `<section class="ag30-section" data-ag30-unit="${esc(uid)}"><div class="ag30-head"><div><span class="ag30-badge">${TOTAL_PER_UNIT} câu mới cho từng Unit</span><h3>Luyện thêm 30 câu theo Unit</h3><p>${esc(meta.bookTitle)} · Unit ${esc(meta.unit)} · ${esc(guide.titleVi||meta.title)}</p></div><button type="button" class="ag30-start" data-ag30-open="1">Bắt đầu 30 câu</button></div></section>`;
 const done=qs.filter(q=>st.answers[q.id]!==undefined&&st.answers[q.id]!==null&&st.answers[q.id]!=='').length,pct=Math.round(done/TOTAL_PER_UNIT*100),result=st.submitted?score(uid):null;
 return `<section class="ag30-section" data-ag30-unit="${esc(uid)}"><div class="ag30-head"><div><span class="ag30-badge">Bộ câu hỏi do app biên soạn theo đúng lý thuyết Unit</span><h3>Luyện thêm 30 câu</h3><p>${esc(meta.bookTitle)} · Unit ${esc(meta.unit)} · ${esc(guide.titleVi||meta.title)}</p></div><button type="button" class="ag30-start" data-ag30-collapse="1">Thu gọn</button></div><div class="ag30-body"><div class="ag30-progress-row"><div class="ag30-progress"><i style="width:${pct}%"></i></div><b>${done}/${TOTAL_PER_UNIT} đã trả lời</b></div>${result?`<div class="ag30-score"><div><b>${result.percent}%</b><span>điểm</span></div><div><b>${result.correct}</b><span>câu đúng</span></div><div><b>${result.wrong}</b><span>câu cần xem lại</span></div></div>`:''}<div class="ag30-list">${qs.map(q=>renderQuestion(q,st.answers[q.id],st.submitted)).join('')}</div><div class="ag30-actions"><span>${st.submitted?'Đã chấm toàn bộ 30 câu.':'Làm đủ 30 câu để mở đáp án và giải thích.'}</span><div><button type="button" class="ag30-btn primary" data-ag30-submit="1" ${st.submitted||!allAnswered(uid)?'disabled':''}>${st.submitted?'Đã chấm':'Nộp bài và chấm'}</button>${st.submitted?'<button type="button" class="ag30-btn" data-ag30-retry="1">Làm lại câu sai</button>':''}<button type="button" class="ag30-btn danger" data-ag30-reset="1">Xóa toàn bộ</button></div></div><p class="ag30-note">Nguồn định hướng: lý thuyết tiếng Việt, công thức, ví dụ và Exam Trap của chính Unit trong ${esc(meta.bookTitle)}. Đây là 30 câu mới do app biên soạn, không sao chép nguyên bài tập của sách.</p>${CURRENT_USER?'':'<div class="ag30-login-note">Em vẫn có thể làm bài khi chưa đăng nhập. Đăng nhập để câu sai được lưu vào Sổ lỗi riêng của tài khoản.</div>'}</div></section>`;
}
function mount(){if(typeof document==='undefined')return;ensureStyle();const uid=currentUid(),detail=document.querySelector('#unit-detail');if(!detail)return;const old=detail.querySelector('.ag30-section');if(!guides()[uid]){old?.remove();return}const html=sectionHtml(uid);if(old)old.outerHTML=html;else detail.insertAdjacentHTML('beforeend',html)}
function refresh(){mount()}
function record(uid){
 const st=unitState(uid),qs=buildQuestions(uid),meta=unitMeta(uid),guide=guides()[uid];
 if(!ROOT.AGMistakeBook?.recordExtraPractice)return;
 ROOT.AGMistakeBook.recordExtraPractice({uid,category:meta.topicTitle||guide.titleVi||meta.title,items:qs.map(q=>{const selected=Number(st.answers[q.id]);return {questionId:q.id,index:q.index,correct:selected===q.correctIndex,prompt:(q.prompt+' — '+q.stem).trim(),userAnswer:Number.isInteger(selected)?q.options[selected]:'',correctAnswer:q.options[q.correctIndex],reason:selected===q.correctIndex?'':q.explanation,fix:q.fix||'Đọc lại lý thuyết của Unit và làm lại câu.',trap:q.trap,skill:'grammar'}})});
}
function openMistake(m){
 if(!m||!m.uid)return;const uid=String(m.uid),st=unitState(uid);st.open=true;st.submitted=false;if(m.questionId)delete st.answers[m.questionId];save();
 try{if(typeof state!=='undefined'){state.book=String(uid).split('-')[0];state.unit=uid}}catch(_e){}
 if(typeof ROOT.setTab==='function')ROOT.setTab('grammar');else document.querySelector('[data-tab="grammar"]')?.click();
 setTimeout(()=>{try{if(typeof ROOT.renderGrammar==='function')ROOT.renderGrammar()}catch(_e){}setTimeout(()=>{mount();const target=document.querySelector(`[data-ag30-question-id="${CSS.escape(String(m.questionId||''))}"]`)||document.querySelectorAll('.ag30-question')[Number(m.questionIndex||0)];if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.animate([{boxShadow:'0 0 0 0 rgba(226,82,82,0)'},{boxShadow:'0 0 0 6px rgba(226,82,82,.25)'},{boxShadow:'0 0 0 0 rgba(226,82,82,0)'}],{duration:1100});target.querySelector('input')?.focus()}},180)},80);
}
function installUi(){
 ensureStyle();const previous=ROOT.renderUnitDetail;ROOT.renderUnitDetail=function(){if(typeof previous==='function')previous.apply(this,arguments);setTimeout(mount,60)};
 document.addEventListener('change',event=>{const input=event.target.closest('[data-ag30-answer]');if(!input)return;const uid=currentUid(),st=unitState(uid);if(st.submitted)return;st.answers[input.dataset.ag30Answer]=Number(input.value);save();refresh()});
 document.addEventListener('click',event=>{
  const section=event.target.closest('.ag30-section');if(!section)return;const uid=section.dataset.ag30Unit||currentUid(),st=unitState(uid);
  if(event.target.closest('[data-ag30-open]')){st.open=true;save();refresh();setTimeout(()=>document.querySelector('.ag30-section')?.scrollIntoView({behavior:'smooth',block:'start'}),40);return}
  if(event.target.closest('[data-ag30-collapse]')){st.open=false;save();refresh();return}
  if(event.target.closest('[data-ag30-submit]')){if(!allAnswered(uid)||st.submitted)return;st.submitted=true;save();record(uid);refresh();return}
  if(event.target.closest('[data-ag30-retry]')){const qs=buildQuestions(uid);for(const q of qs)if(Number(st.answers[q.id])!==q.correctIndex)delete st.answers[q.id];st.submitted=false;save();refresh();return}
  if(event.target.closest('[data-ag30-reset]')){if(confirm('Xóa toàn bộ câu trả lời của bộ 30 câu này?')){DATA.units[uid]={open:true,answers:{},submitted:false};save();refresh()}return}
 });
 ROOT.addEventListener('ag:auth-changed',event=>{CURRENT_USER=event.detail&&event.detail.user||null;load();setTimeout(mount,30)});
 CURRENT_USER=ROOT.AGGrammarAuth?.getUser?.()||null;load();
 ROOT.addEventListener('load',()=>setTimeout(mount,260));
}
ROOT.AGUnit30={generate:buildQuestions,validate:validateAll,stats:()=>validateAll(),openMistake,mount};
if(typeof document!=='undefined')installUi();
})();
