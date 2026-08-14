(function(){
'use strict';
const BASE_STORE='albert_grammar_v24_complete';
let CURRENT_MISTAKE_USER=null;
const UI={active:{},answers:{},submitted:{}};
function userSuffix(){return CURRENT_MISTAKE_USER&&CURRENT_MISTAKE_USER.id?String(CURRENT_MISTAKE_USER.id):'guest'}
function uiStoreKey(){return BASE_STORE+'::'+userSuffix()}
function resetUi(data){UI.active={};UI.answers={};UI.submitted={};if(data&&typeof data==='object')Object.assign(UI,data);UI.active=UI.active||{};UI.answers=UI.answers||{};UI.submitted=UI.submitted||{}}
function loadUiForUser(){let raw=null;try{raw=JSON.parse(localStorage.getItem(uiStoreKey())||'null');if(!raw&&!CURRENT_MISTAKE_USER)raw=JSON.parse(localStorage.getItem(BASE_STORE)||'null')}catch(e){}resetUi(raw||{})}
loadUiForUser();
function save(){try{localStorage.setItem(uiStoreKey(),JSON.stringify(UI))}catch(e){}}
function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function exKey(uid,eid){return uid+'::'+eid}
function ansKey(uid,eid,qi,si){return uid+'::'+eid+'::'+qi+'::'+si}
function currentUnit(){return (typeof state!=='undefined'&&state&&state.unit)||''}
function unitData(){return V24_COMPLETE_DATA[currentUnit()]||null}
function flattenSlots(ex){const out=[];(ex.questions||[]).forEach((q,qi)=>(q.slots||[]).forEach((s,si)=>out.push({q,qi,s,si,key:ansKey(currentUnit(),ex.id,qi,si)})));return out}
function answered(ex){return flattenSlots(ex).filter(x=>String(UI.answers[x.key]??'').trim()).length}
function allAnswered(ex){const a=flattenSlots(ex);return a.length>0&&a.every(x=>String(UI.answers[x.key]??'').trim())}

/* ---------- Chuẩn hoá và chấm đáp án ---------- */
function contractions(s){let x=' '+String(s||'').toLowerCase().replace(/[’‘]/g,"'")+' ';
 const reps=[["can't",'cannot'],["won't",'will not'],["shan't",'shall not'],["isn't",'is not'],["aren't",'are not'],["wasn't",'was not'],["weren't",'were not'],["don't",'do not'],["doesn't",'does not'],["didn't",'did not'],["haven't",'have not'],["hasn't",'has not'],["hadn't",'had not'],["couldn't",'could not'],["wouldn't",'would not'],["shouldn't",'should not'],["mustn't",'must not'],["needn't",'need not'],["i'm",'i am'],["you're",'you are'],["we're",'we are'],["they're",'they are'],["he's",'he is'],["she's",'she is'],["it's",'it is'],["i've",'i have'],["you've",'you have'],["we've",'we have'],["they've",'they have'],["i'll",'i will'],["you'll",'you will'],["we'll",'we will'],["they'll",'they will']];
 reps.forEach(([a,b])=>x=x.split(' '+a+' ').join(' '+b+' '));return x.trim()}
function normBase(s){return contractions(s).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function variants(s){let base=String(s||'').toLowerCase().replace(/[’‘]/g,"'");let set=new Set([normBase(base)]);
 const amb=[[/\b(he|she|it|that|there|what|who)'s\b/g,'$1 is'],[/\b(he|she|it|that|there|what|who)'s\b/g,'$1 has'],[/\b(i|you|he|she|we|they)'d\b/g,'$1 would'],[/\b(i|you|he|she|we|they)'d\b/g,'$1 had']];
 let arr=[base];amb.forEach(([r,rep])=>{arr=arr.concat(arr.map(v=>v.replace(r,rep)))});arr.forEach(v=>set.add(normBase(v)));return set}
function acceptedValues(slot){const vals=[...(slot.accepted||[]),slot.answer||''].map(x=>String(x||'').trim()).filter(Boolean);return [...new Set(vals)]}
function isCorrect(user,slot){const uv=variants(user);return acceptedValues(slot).some(a=>{const av=variants(a);for(const v of uv)if(av.has(v))return true;return false})}
function statusFor(user,slot){if(!slot.gradeable)return 'reference';return isCorrect(user,slot)?'correct':'incorrect'}
function labelText(s,q){const l=String(s.label||q.label||'').replace(/[()]/g,'').trim();return l?'Mục '+l:'Đáp án'}

/* ---------- Bộ giải thích lỗi áp dụng cho toàn bộ Answer Key ---------- */
const AUX=new Set(['am','is','are','was','were','be','been','being','do','does','did','have','has','had','can','could','will','would','shall','should','may','might','must','need','ought']);
const MODALS=new Set(['can','could','will','would','shall','should','may','might','must','need','ought']);
const WH=new Set(['what','where','when','why','who','whom','whose','which','how']);
const PREPS=new Set(['about','above','across','after','against','along','among','around','as','at','before','behind','below','beside','between','by','despite','during','except','for','from','in','inside','into','like','near','of','off','on','onto','opposite','out','outside','over','past','since','through','throughout','to','towards','under','until','up','upon','with','within','without']);
const ARTICLES=new Set(['a','an','the']);
const IRREG={
 'am':'be','is':'be','are':'be','was':'be','were':'be','been':'be','being':'be',
 'does':'do','did':'do','done':'do','doing':'do','has':'have','had':'have','having':'have',
 'went':'go','gone':'go','going':'go','saw':'see','seen':'see','seeing':'see','came':'come','coming':'come',
 'took':'take','taken':'take','taking':'take','made':'make','making':'make','got':'get','gotten':'get','getting':'get',
 'gave':'give','given':'give','giving':'give','wrote':'write','written':'write','writing':'write',
 'spoke':'speak','spoken':'speak','speaking':'speak','knew':'know','known':'know','knowing':'know',
 'thought':'think','thinking':'think','bought':'buy','buying':'buy','brought':'bring','bringing':'bring',
 'found':'find','finding':'find','felt':'feel','feeling':'feel','left':'leave','leaving':'leave',
 'kept':'keep','keeping':'keep','held':'hold','holding':'hold','told':'tell','telling':'tell',
 'said':'say','saying':'say','read':'read','reading':'read','ran':'run','run':'run','running':'run',
 'ate':'eat','eaten':'eat','eating':'eat','drank':'drink','drunk':'drink','drinking':'drink',
 'slept':'sleep','sleeping':'sleep','met':'meet','meeting':'meet','paid':'pay','paying':'pay',
 'sent':'send','sending':'send','spent':'spend','spending':'spend','stood':'stand','standing':'stand',
 'sat':'sit','sitting':'sit','lost':'lose','losing':'lose','won':'win','winning':'win',
 'began':'begin','begun':'begin','beginning':'begin','became':'become','becoming':'become',
 'broke':'break','broken':'break','breaking':'break','chose':'choose','chosen':'choose','choosing':'choose',
 'drove':'drive','driven':'drive','driving':'drive','fell':'fall','fallen':'fall','falling':'fall',
 'forgot':'forget','forgotten':'forget','forgetting':'forget','grew':'grow','grown':'grow','growing':'grow',
 'heard':'hear','hearing':'hear','led':'lead','leading':'lead','lay':'lie','lain':'lie','lying':'lie',
 'rose':'rise','risen':'rise','rising':'rise','showed':'show','shown':'show','showing':'show',
 'swam':'swim','swum':'swim','swimming':'swim','wore':'wear','worn':'wear','wearing':'wear'
};
function tokens(s){return normBase(s).split(' ').filter(Boolean)}
function rawTokens(s){return String(s||'').replace(/[’‘]/g,"'").match(/[A-Za-z]+(?:'[A-Za-z]+)?|\d+/g)||[]}
function baseWord(w){w=String(w||'').toLowerCase();if(IRREG[w])return IRREG[w];if(w.length>4&&/ies$/.test(w))return w.slice(0,-3)+'y';if(w.length>5&&/ing$/.test(w)){let b=w.slice(0,-3);if(/([b-df-hj-np-tv-z])\1$/.test(b))b=b.slice(0,-1);if(b.endsWith('i'))b=b.slice(0,-1)+'y';return b}if(w.length>4&&/ied$/.test(w))return w.slice(0,-3)+'y';if(w.length>4&&/ed$/.test(w)){let b=w.slice(0,-2);if(/([b-df-hj-np-tv-z])\1$/.test(b))b=b.slice(0,-1);if(!b.endsWith('e')&&['lov','liv','mov','us','clos','chang'].some(x=>b.endsWith(x)))b+='e';return b}if(w.length>3&&/es$/.test(w))return w.slice(0,-2);if(w.length>3&&/s$/.test(w)&&!/ss$/.test(w))return w.slice(0,-1);return w}
function counts(a){const m=new Map();a.forEach(x=>m.set(x,(m.get(x)||0)+1));return m}
function sameBag(a,b){if(a.length!==b.length)return false;const x=counts(a),y=counts(b);if(x.size!==y.size)return false;for(const [k,v] of x)if(y.get(k)!==v)return false;return true}
function lcsDiff(user,target){const a=tokens(user),b=tokens(target),n=a.length,m=b.length,dp=Array.from({length:n+1},()=>Array(m+1).fill(0));for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);let i=0,j=0,extra=[],missing=[];while(i<n&&j<m){if(a[i]===b[j]){i++;j++}else if(dp[i+1][j]>=dp[i][j+1])extra.push(a[i++]);else missing.push(b[j++])}while(i<n)extra.push(a[i++]);while(j<m)missing.push(b[j++]);return {a,b,extra,missing}}
function editDistance(a,b){a=normBase(a);b=normBase(b);if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;let p=Array.from({length:b.length+1},(_,i)=>i),c=[];for(let i=1;i<=a.length;i++){c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[b.length]}
function similarity(a,b){const x=tokens(a),y=tokens(b),sx=new Set(x),sy=new Set(y);let inter=0;sx.forEach(t=>{if(sy.has(t))inter++});const jac=inter/Math.max(1,new Set([...x,...y]).size),ed=editDistance(a,b),len=Math.max(1,normBase(a).length,normBase(b).length);return jac*.65+(1-ed/len)*.35}
function bestTarget(user,slot){const vals=acceptedValues(slot);if(!vals.length)return String(slot.answer||'');let best=vals[0],score=-Infinity;for(const v of vals){const s=similarity(user,v);if(s>score){score=s;best=v}}return best}
function shortList(xs,max){const out=[...new Set((xs||[]).filter(Boolean))];return out.slice(0,max||4).map(x=>'“'+x+'”').join(', ')+(out.length>(max||4)?'…':'')}
function isCode(s){return /^[a-j](?:[.)])?$/i.test(String(s||'').trim())||/^\d{1,2}(?:[.)])?$/.test(String(s||'').trim())}
function isQuestionTarget(s,ex){const t=tokens(s);return ex.taskType==='question-writing'||(/[?]\s*$/.test(String(s||''))&&t.length>1)||((WH.has(t[0])||AUX.has(t[0]))&&t.length>=3)}
function questionBlueprint(s){const t=rawTokens(s);if(!t.length)return '';let chunks=[],i=0;if(t[0]&&t[0].toLowerCase()==='how'&&t[1]&&['long','many','much','often','far','old'].includes(t[1].toLowerCase())){chunks.push(t[0]+' '+t[1]);i=2}else if(t[0]){chunks.push(t[0]);i=1}for(;i<t.length&&chunks.length<5;i++)chunks.push(t[i]);return chunks.join(' + ')+'?'}
function guideFor(uid){return (window.V12_GUIDES&&window.V12_GUIDES[uid])||null}
function guideRule(uid,target){const g=guideFor(uid);if(!g||!g.rules||!g.rules.length)return '';const txt=normBase(target),keys=[];if(/\b(am|is|are|was|were)\b.*\b\w+ing\b/.test(txt))keys.push('ing','continuous');if(/\b(have|has|had)\b/.test(txt))keys.push('have','past participle','perfect');if(/\b(will|would|can|could|may|might|must|should|shall)\b/.test(txt))keys.push('modal','will','would');if(/\bto\b/.test(txt))keys.push('to');if(isQuestionTarget(target,{taskType:''}))keys.push('question');let best=g.rules[0],bestScore=-1;for(const r of g.rules){const z=normBase((r.title||'')+' '+(r.formula||'')+' '+(r.explanation||''));let sc=keys.reduce((n,k)=>n+(z.includes(k)?1:0),0);if(sc>bestScore){bestScore=sc;best=r}}return best&&best.formula?best.formula:''}
function isParticiple(w){return /(?:ed|en|wn|nt|lt|pt|ght|ung|unk|orn|old|aid|ade|one|een|iven|aken|oken|ritten|iven|ound)$/.test(String(w||''))||['done','gone','seen','been','made','had','said','told','left','lost','found','built','bought','brought','caught','thought','read','sent','spent','kept','held','paid','met','put','cut','hit'].includes(String(w||''))}
function structureHint(uid,ex,target){const n=normBase(target),t=tokens(target);if(isQuestionTarget(target,ex))return questionBlueprint(target);if(/\bwill have been\b/.test(n)&&t.some(x=>/ing$/.test(x)))return 'Chủ ngữ + will have been + V-ing';if(/\b(have|has|had) been\b/.test(n)&&t.some(x=>/ing$/.test(x)))return 'Chủ ngữ + have/has/had been + V-ing';if(/\b(am|is|are|was|were)\b/.test(n)&&t.some(x=>/ing$/.test(x)))return 'Chủ ngữ + am/is/are/was/were + V-ing';if(/\b(am|is|are|was|were|be|been|being)\b/.test(n)&&t.some(isParticiple))return 'Chủ ngữ + be (chia theo thì) + past participle';if(/\bwill have\b/.test(n))return 'Chủ ngữ + will have + past participle';if(/\b(have|has|had)\b/.test(n))return 'Chủ ngữ + have/has/had + past participle';if(/\bwill\b/.test(n))return 'Chủ ngữ + will + động từ nguyên mẫu';if(t.some(x=>MODALS.has(x)))return 'Chủ ngữ + modal verb + động từ nguyên mẫu';if(/\bused to\b/.test(n))return 'Chủ ngữ + used to + động từ nguyên mẫu';const r=guideRule(uid,target);return r||'Viết đúng phần còn thiếu theo mẫu của Unit'}
function auxAdvice(aux){if(['am','is','are'].includes(aux))return 'I am; he/she/it is; you/we/they are.';if(['was','were'].includes(aux))return 'I/he/she/it was; you/we/they were.';if(['do','does'].includes(aux))return 'I/you/we/they dùng do; he/she/it dùng does; sau do/does dùng động từ nguyên mẫu.';if(aux==='did')return 'Sau did/didn’t, động từ chính luôn ở dạng nguyên mẫu.';if(['have','has'].includes(aux))return 'I/you/we/they dùng have; he/she/it dùng has.';if(aux==='had')return 'Had dùng giống nhau với mọi chủ ngữ và đi với past participle.';if(MODALS.has(aux))return 'Sau modal verb dùng động từ nguyên mẫu không “to”.';return 'Trợ động từ phải đứng đúng vị trí và hòa hợp với chủ ngữ.'}
function phraseAround(toks,word){const i=toks.indexOf(word);if(i<0)return word;return toks.slice(Math.max(0,i-2),Math.min(toks.length,i+3)).join(' ')}
function morphMismatch(user,target){const u=tokens(user),c=tokens(target);for(const cw of c){for(const uw of u){if(uw!==cw&&baseWord(uw)===baseWord(cw))return {user:uw,correct:cw,base:baseWord(cw)}}}return null}
function taskFallback(ex){const map={
 'matching':'Đọc toàn bộ lựa chọn trước khi ghép và chỉ nhập đúng ký hiệu của lựa chọn tương ứng.',
 'choice':'Chọn đúng phương án theo nghĩa của cả câu; không chọn chỉ vì thấy một từ quen.',
 'question-writing':'Câu hỏi phải có đúng từ hỏi/trợ động từ, rồi đến chủ ngữ và động từ chính.',
 'word-order':'Giữ đủ từ đã cho nhưng sắp xếp theo trật tự câu tiếng Anh.',
 'verb-form':'Xác định thì và dạng động từ trước khi điền: nguyên mẫu, V-ing, past simple hay past participle.',
 'correction':'Chỉ sửa phần sai và giữ nguyên những phần đã đúng.',
 'rewrite':'Giữ nguyên nghĩa câu gốc và dùng đúng cấu trúc bắt buộc của đề.',
 'sentence-writing':'Viết một câu hoàn chỉnh, không chỉ nhập một ký hiệu hoặc một từ rời.',
 'same-verb-pair':'Dùng cùng một động từ cho cả hai câu nhưng chia đúng dạng theo ý nghĩa mỗi câu.',
 'picture':'Đối chiếu chính xác nhân vật/hành động trong hình rồi mới chọn cấu trúc.',
 'fill':'Đọc cả phần trước và sau chỗ trống; nhập đủ cụm cần thiết, không thừa hoặc thiếu từ.'
 };return map[ex.taskType]||'Đọc đúng yêu cầu của Exercise và nhập đúng loại đáp án mà đề yêu cầu.'}
function explainWrong(uid,ex,q,slot,user){
 const target=bestTarget(user,slot)||String(slot.answer||'');
 const un=normBase(user),cn=normBase(target),u=tokens(user),c=tokens(target),d=lcsDiff(user,target),guide=guideFor(uid),hint=structureHint(uid,ex,target);
 let reason='',trap='',fix='Dùng mẫu: '+hint+(/[?!.]$/.test(hint)?'':'.');
 if(!un){reason='Em chưa nhập đáp án cho mục này.';trap='Không nộp một ô trống. Hãy đọc đúng dòng mang số câu trong khung đề rồi nhập phần còn thiếu.';return {reason,trap,fix,target}}
 if(isCode(user)&&!isCode(target)){
   reason='Em đã nhập ký hiệu “'+String(user).trim()+'”, nhưng mục này yêu cầu viết '+(isQuestionTarget(target,ex)?'một câu hỏi hoàn chỉnh':'từ/cụm từ hoặc câu hoàn chỉnh')+'. Ký hiệu lựa chọn không thay thế được nội dung câu.';
   trap=isQuestionTarget(target,ex)?'Dạng viết câu hỏi không nhập A/B/C. Trật tự đúng là '+questionBlueprint(target):'Chỉ dùng chữ cái ở bài ghép/chọn đáp án. Với bài điền hoặc viết câu, phải nhập chính nội dung đáp án.';
   return {reason,trap,fix,target};
 }
 if(isCode(target)&&!isCode(user)){
   reason='Bài này yêu cầu chọn ký hiệu đáp án, nhưng em đã nhập cả một từ/câu. Answer Key cần ký hiệu “'+String(target).trim()+'”.';
   trap='Ở dạng matching/choice, nhập đúng chữ cái hoặc số của lựa chọn; không chép lại cả câu trừ khi đề yêu cầu.';
   fix='Chọn “'+String(target).trim()+'” trong danh sách lựa chọn.';return {reason,trap,fix,target};
 }
 if(isCode(target)&&isCode(user)){
   reason='Em chọn “'+String(user).trim()+'”, còn Answer Key ghép mục này với “'+String(target).trim()+'”.';
   trap='Đừng ghép chỉ theo một từ giống nhau; hãy đọc trọn ý của hai vế rồi mới chọn ký hiệu.';
   fix='Đổi lựa chọn thành “'+String(target).trim()+'”.';return {reason,trap,fix,target};
 }
 const tq=isQuestionTarget(target,ex);
 if(tq){
   const ca=c.find(x=>AUX.has(x)),ua=u.find(x=>AUX.has(x)),cw=c.find(x=>WH.has(x));
   if(cw&&!u.includes(cw)){
     reason='Câu hỏi đúng cần từ hỏi “'+cw+'”, nhưng câu của em thiếu hoặc dùng sai từ hỏi này.';
     trap='Chọn từ hỏi theo thông tin cần hỏi, sau đó mới đặt trợ động từ trước chủ ngữ. Mẫu đúng: '+questionBlueprint(target);return {reason,trap,fix,target};
   }
   if(ca&&ua&&ca!==ua){
     reason='Em dùng trợ động từ “'+ua+'”, nhưng Answer Key cần “'+ca+'” để đúng thì và đúng chủ ngữ.';
     trap=auxAdvice(ca)+' Mẫu câu: '+questionBlueprint(target);return {reason,trap,fix,target};
   }
   if(ca&&!u.includes(ca)){
     reason='Câu hỏi đúng cần trợ động từ “'+ca+'” đứng trước chủ ngữ, nhưng câu của em thiếu trợ động từ này.';
     trap='Câu hỏi không giữ nguyên trật tự câu khẳng định. '+auxAdvice(ca)+' Mẫu đúng: '+questionBlueprint(target);return {reason,trap,fix,target};
   }
   if(sameBag(u,c)&&un!==cn){
     reason='Em có gần đủ các từ nhưng sắp xếp sai trật tự câu hỏi.';
     trap='Đặt từ hỏi trước, rồi trợ động từ, chủ ngữ và động từ chính. Mẫu đúng: '+questionBlueprint(target);return {reason,trap,fix,target};
   }
   if(!WH.has(u[0])&&!AUX.has(u[0])){
     reason='Câu của em bắt đầu như câu khẳng định, trong khi đây là câu hỏi.';
     trap='Với câu hỏi, từ hỏi hoặc trợ động từ phải đứng trước chủ ngữ. Mẫu đúng: '+questionBlueprint(target);return {reason,trap,fix,target};
   }
 }
 if(sameBag(u,c)&&un!==cn){reason='Các từ chính gần như đúng nhưng thứ tự từ chưa khớp với Answer Key.';trap='Tiếng Anh phụ thuộc mạnh vào trật tự từ. '+(tq?'Dùng mẫu '+questionBlueprint(target):taskFallback(ex));return {reason,trap,fix,target}}
 const cNot=c.includes('not'),uNot=u.includes('not');
 if(cNot&&!uNot){const na=c.find(x=>AUX.has(x));reason='Đáp án đúng là câu phủ định, nhưng em đã bỏ từ “not”'+(na?' sau “'+na+'”':'')+'.';trap=na?'Trong câu phủ định, dùng “'+na+' + not” rồi giữ đúng dạng động từ chính. '+auxAdvice(na)+' Mẫu cần dùng: '+hint+'.':'Trong câu phủ định, “not” đứng sau trợ động từ hoặc động từ be. Mẫu cần dùng: '+hint+'.';return {reason,trap,fix,target}}
 if(!cNot&&uNot){reason='Em thêm “not” làm câu đổi sang nghĩa phủ định, trong khi Answer Key là câu khẳng định.';trap='Chỉ dùng “not” khi ngữ cảnh thật sự yêu cầu phủ định; kiểm tra nghĩa toàn câu trước khi chia động từ.';return {reason,trap,fix,target}}
 const cAux=c.filter(x=>AUX.has(x)),uAux=u.filter(x=>AUX.has(x));
 const missingAux=cAux.find(x=>!uAux.includes(x)),extraAux=uAux.find(x=>!cAux.includes(x));
 if(missingAux){reason='Cấu trúc đúng cần trợ động từ/động từ be “'+missingAux+'”, nhưng câu của em đã bỏ thành phần này.';trap=auxAdvice(missingAux)+' Mẫu cần dùng: '+hint+'.';return {reason,trap,fix,target}}
 if(extraAux&&cAux.length){reason='Em dùng “'+extraAux+'” nhưng Answer Key dùng “'+cAux[0]+'”. Hai trợ động từ này thể hiện thì hoặc chủ ngữ khác nhau.';trap=auxAdvice(cAux[0])+' Mẫu cần dùng: '+hint+'.';return {reason,trap,fix,target}}
 const cIng=c.find(x=>/ing$/.test(x)),uSameIng=cIng&&u.find(x=>baseWord(x)===baseWord(cIng));
 if(cIng&&uSameIng&&uSameIng!==cIng){reason='Động từ phải ở dạng V-ing “'+cIng+'”, nhưng em dùng “'+uSameIng+'”.';trap='Dạng tiếp diễn cần be + V-ing; sau giới từ cũng dùng V-ing. Mẫu cần dùng: '+hint+'.';return {reason,trap,fix,target}}
 if(cIng&&!u.some(x=>/ing$/.test(x))){reason='Answer Key nhấn mạnh quá trình bằng V-ing, nhưng câu của em chưa có dạng V-ing.';trap='Không dùng động từ nguyên mẫu thay cho V-ing. Mẫu cần dùng: '+hint+'.';return {reason,trap,fix,target}}
 const mm=morphMismatch(user,target);
 if(mm){
   const ci=c.indexOf(mm.correct),before=ci>0?c[ci-1]:'';
   if(/s$/.test(mm.correct)&&mm.base===mm.user){reason='Với chủ ngữ ngôi thứ ba số ít, động từ cần thêm -s/-es: “'+mm.correct+'”, không phải “'+mm.user+'”.';trap='Trong câu khẳng định hiện tại đơn: he/she/it + V-s/es. Nhưng sau does/doesn’t, động từ trở về nguyên mẫu.';return {reason,trap,fix,target}}
   if(/ing$/.test(mm.correct)){reason='Em dùng sai dạng của động từ “'+mm.base+'”. Answer Key cần dạng V-ing “'+mm.correct+'”.';trap=PREPS.has(before)?'Sau giới từ “'+before+'” phải dùng V-ing, không dùng động từ nguyên mẫu hoặc to-infinitive.':'Xác định trước cấu trúc có yêu cầu V-ing hay không; đừng chỉ chép động từ nguyên mẫu.';return {reason,trap,fix,target}}
   if((/ed$/.test(mm.correct)||IRREG[mm.correct])&&mm.correct!==mm.base){reason='Em chọn đúng động từ “'+mm.base+'” nhưng chia sai dạng. Answer Key cần “'+mm.correct+'”, không phải “'+mm.user+'”.';trap='Sau have/has/had cần past participle; trong quá khứ đơn cần V2; sau did/modal lại dùng nguyên mẫu. Hãy nhìn trợ động từ ngay trước động từ.';return {reason,trap,fix,target}}
   if(mm.correct===mm.base&&mm.user!==mm.base){reason='Động từ chính phải ở dạng nguyên mẫu “'+mm.correct+'”, nhưng em dùng “'+mm.user+'”.';trap=before==='to'?'Sau “to” của to-infinitive dùng động từ nguyên mẫu: to + V, ví dụ “to '+mm.correct+'”.':'Sau do/does/did và modal verb, dùng động từ nguyên mẫu không “to”.';return {reason,trap,fix,target}}
 }
 if(d.extra.includes('more')&&c.some(x=>/(?:er|est)$/.test(x))){const comp=c.find(x=>/(?:er|est)$/.test(x));reason='Em dùng đồng thời “more” và dạng so sánh có đuôi trong “'+comp+'”, tạo thành so sánh kép.';trap='Không dùng more + adjective-er hoặc most + adjective-est. Chọn một dạng: “'+comp+'” hoặc more/most + tính từ nguyên dạng.';return {reason,trap,fix,target}}
 const missPrep=d.missing.find(x=>PREPS.has(x)),extraPrep=d.extra.find(x=>PREPS.has(x));
 if(missPrep||extraPrep){const p=missPrep||extraPrep;reason=missPrep?'Cụm đúng cần giới từ “'+missPrep+'”, nhưng em đã bỏ hoặc dùng giới từ khác.':'Em thêm/dùng giới từ “'+extraPrep+'” không đúng với cụm trong Answer Key.';trap='Giới từ phải học theo cả cụm, không dịch từng chữ. Cụm cần nhớ: “'+phraseAround(c,p)+'”.';return {reason,trap,fix,target}}
 const missArt=d.missing.find(x=>ARTICLES.has(x)),extraArt=d.extra.find(x=>ARTICLES.has(x));
 if(missArt||extraArt){const a=missArt||extraArt;reason=missArt?'Câu đúng cần mạo từ “'+a+'”, nhưng em đã bỏ mạo từ.':'Em dùng thêm mạo từ “'+a+'” trong khi Answer Key không dùng ở vị trí này.';trap='a/an dùng với danh từ đếm được số ít chưa xác định; the dùng khi đã xác định; nhiều danh từ chung dùng zero article.';return {reason,trap,fix,target}}
 if(d.missing.length&&d.extra.length===0){reason='Câu trả lời chưa đủ. Em còn thiếu '+shortList(d.missing,5)+' so với Answer Key.';trap='Không chỉ nhập từ khóa chính; hãy điền đủ cả trợ động từ, dạng động từ và từ đi kèm cần thiết. '+taskFallback(ex);return {reason,trap,fix,target}}
 if(d.extra.length&&d.missing.length===0){reason='Câu trả lời có thêm '+shortList(d.extra,5)+' nên nghĩa hoặc cấu trúc khác Answer Key.';trap='Chỉ nhập phần đề yêu cầu; không thêm chủ ngữ, trợ động từ hoặc giới từ đã có sẵn ngoài chỗ trống.';return {reason,trap,fix,target}}
 const dist=editDistance(user,target),maxLen=Math.max(normBase(user).length,cn.length);
 if(maxLen>3&&dist<=Math.max(2,Math.floor(maxLen*.14))){reason='Cấu trúc gần đúng nhưng có lỗi chính tả hoặc thiếu/thừa một vài ký tự so với “'+target+'”.';trap='Sau khi hoàn thành, đọc lại từng từ, đặc biệt đuôi -s, -ed, -ing và dạng bất quy tắc.';return {reason,trap,fix,target}}
 const guideTrap=guide&&guide.traps&&guide.traps.length?guide.traps.find(x=>{const z=normBase(x);return c.some(w=>w.length>3&&z.includes(w))})||guide.traps[0]:'';
 reason='Câu trả lời chưa khớp Answer Key ở '+(d.missing.length?'phần thiếu '+shortList(d.missing,4):d.extra.length?'phần thừa '+shortList(d.extra,4):'dạng hoặc cách sắp xếp từ')+'.';
 trap=(guideTrap?guideTrap+' ':'')+taskFallback(ex)+' Mẫu cần dùng: '+hint+'.';
 return {reason,trap,fix,target};
}

function installFeedbackStyles(){if(typeof document==='undefined'||document.getElementById('v25-accurate-feedback-style'))return;document.head.insertAdjacentHTML('beforeend','<style id="v25-accurate-feedback-style">.v25-why,.v25-fix,.v25-exam-trap{margin-top:10px;padding:11px 13px;border-radius:12px;line-height:1.62}.v25-why{background:#fff8f0;border:1px solid #f1c49f;color:#7a3b24}.v25-fix{background:#eef7ff;border:1px solid #b9d8f6;color:#265578}.v25-exam-trap{background:#fff3d7;border:1px solid #efc96e;color:#6e4b00}.v25-why b,.v25-fix b,.v25-exam-trap b{display:block;margin-bottom:3px}.v24-result.incorrect .v24-meta{margin-top:10px}</style>')}
installFeedbackStyles();
if(typeof window!=='undefined')window.V25_FEEDBACK_ENGINE={explainWrong,bestTarget,structureHint,statusFor,isCorrect};

function inputHtml(uid,ex,q,qi,s,si){const k=ansKey(uid,ex.id,qi,si),val=UI.answers[k]||'';const accepted=s.accepted||[];const isLetter=s.gradeable&&accepted.length&&accepted.every(a=>/^[a-j]$/i.test(String(a).trim()));const long=!isLetter&&(ex.taskType==='open-writing'||String(s.answer||'').length>85);let field='';
 if(isLetter){field='<select class="v24-select" data-v24-answer="'+esc(k)+'"><option value="">-- Chọn --</option>'+Array.from({length:10},(_,i)=>String.fromCharCode(65+i)).map(c=>'<option value="'+c.toLowerCase()+'" '+(String(val).toLowerCase()===c.toLowerCase()?'selected':'')+'>'+c+'</option>').join('')+'</select>'}
 else if(long){field='<textarea class="v24-input" data-v24-answer="'+esc(k)+'" placeholder="Viết câu trả lời của em...">'+esc(val)+'</textarea>'}
 else{field='<input class="v24-input" data-v24-answer="'+esc(k)+'" value="'+esc(val)+'" placeholder="Nhập phần còn thiếu...">'}
 const ok=(accepted||[]).some(a=>/^ok$/i.test(String(a).trim()))?'<button class="v24-ok" data-v24-ok="'+esc(k)+'">Câu đúng - OK</button>':'';
 return '<div class="v24-slot"><label>'+esc(labelText(s,q))+'</label><div class="v24-input-wrap">'+field+ok+'</div></div>'}
function resultHtml(uid,ex,q,qi,s,si){const k=ansKey(uid,ex.id,qi,si),user=UI.answers[k]||'',st=statusFor(user,s);const page=ex.keyPage?('Answer Key trang '+ex.keyPage):'Answer Key trong sách';
 if(st==='correct')return '<div class="v24-result correct"><strong>✓ Chính xác</strong>Câu trả lời của em khớp với Answer Key.<div class="v24-key">'+esc(s.answer)+'</div><span class="v24-meta">Nguồn: '+esc(page)+'</span></div>';
 if(st==='reference')return '<div class="v24-result reference"><strong>Đối chiếu với đáp án mẫu</strong>Đây là câu viết mở hoặc đáp án phức hợp. App không đánh dấu sai máy móc; em hãy so sánh cấu trúc và ý nghĩa với Answer Key.<div class="v24-key">'+esc(s.answer||'Xem đáp án mẫu trong sách.')+'</div><span class="v24-meta">Nguồn: '+esc(page)+'</span></div>';
 const fb=explainWrong(uid,ex,q,s,user);
 return '<div class="v24-result incorrect"><strong>✗ Chưa đúng</strong><div>Đáp án của em: <b>'+esc(user||'(chưa nhập)')+'</b></div><div class="v24-key">Đáp án trong sách: '+esc(s.answer)+'</div><div class="v25-why"><b>Vì sao sai?</b>'+esc(fb.reason)+'</div><div class="v25-fix"><b>Cách sửa</b>'+esc(fb.fix)+'</div><div class="v25-exam-trap"><b>Exam Trap cần nhớ</b>'+esc(fb.trap)+'</div><span class="v24-meta">Nguồn: '+esc(page)+'</span></div>'}
function questionHtml(uid,ex,q,qi,submitted){const statuses=submitted?(q.slots||[]).map((s,si)=>statusFor(UI.answers[ansKey(uid,ex.id,qi,si)]||'',s)):[];const cls=submitted?(statuses.includes('incorrect')?' incorrect':statuses.every(x=>x==='correct')?' correct':' reference'):'';let h='<article class="v24-question'+cls+'" data-v25-question="'+qi+'" data-v25-exercise="'+esc(ex.id)+'"><div class="v24-qhead"><span class="v24-qnum">'+esc(q.label||qi+1)+'</span><b>Câu '+esc(q.label||qi+1)+'</b></div>';
 if(q.helperText)h+='<div class="v24-helper">'+esc(q.helperText)+'</div>';else h+='<div class="v24-refer"><b>Nội dung câu '+esc(q.label||qi+1)+'</b> nằm trong đề bài chính xác ở cột bên trái. Đọc đúng dòng mang số này, sau đó nhập phần còn thiếu vào ô bên dưới.<br><button type="button" class="v25-question-link" data-v25-source="1">Xem đề bài</button></div>';
 h+='<div class="v24-slots">'+(q.slots||[]).map((s,si)=>inputHtml(uid,ex,q,qi,s,si)+(submitted?resultHtml(uid,ex,q,qi,s,si):'')).join('')+'</div></article>';return h}
function score(ex){let c=0,w=0,r=0;flattenSlots(ex).forEach(x=>{const st=statusFor(UI.answers[x.key]||'',x.s);if(st==='correct')c++;else if(st==='incorrect')w++;else r++});const d=c+w;return {c,w,r,p:d?Math.round(c*100/d):0}}

/* ---------- Sổ lỗi liên kết với bài tập và bảng phân tích điểm yếu ---------- */
const MISTAKE_STORE='agv25_mistakes_v4';
const PROFILE_STORE='agv25_learning_profile_v4';
const MISTAKE_FILTER_STORE='agv25_mistake_filters_v2';
function readJson(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v==null?fallback:v}catch(e){return fallback}}
function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}}
function scopedKey(base){return CURRENT_MISTAKE_USER&&CURRENT_MISTAKE_USER.id?base+'::'+CURRENT_MISTAKE_USER.id:''}
let ACTIVE_MISTAKES={};
let LEARNING_PROFILE={version:4,slots:{},migrated:{},legacyMigrated:{}};
let MISTAKE_FILTERS={source:'all',skill:'all',category:'all'};
function loadLearningData(){
 ACTIVE_MISTAKES=CURRENT_MISTAKE_USER?readJson(scopedKey(MISTAKE_STORE),{}):{};
 LEARNING_PROFILE=Object.assign({version:4,slots:{},migrated:{},legacyMigrated:{}},CURRENT_MISTAKE_USER?readJson(scopedKey(PROFILE_STORE),{}):{});
 LEARNING_PROFILE.slots=LEARNING_PROFILE.slots||{};LEARNING_PROFILE.migrated=LEARNING_PROFILE.migrated||{};LEARNING_PROFILE.legacyMigrated=LEARNING_PROFILE.legacyMigrated||{};
 MISTAKE_FILTERS=Object.assign({source:'all',skill:'all',category:'all'},CURRENT_MISTAKE_USER?readJson(scopedKey(MISTAKE_FILTER_STORE),{}):{});
}
function saveLearningData(){if(!CURRENT_MISTAKE_USER)return;writeJson(scopedKey(MISTAKE_STORE),ACTIVE_MISTAKES);writeJson(scopedKey(PROFILE_STORE),LEARNING_PROFILE);writeJson(scopedKey(MISTAKE_FILTER_STORE),MISTAKE_FILTERS)}
function clearSharedLegacyMistakes(){try{if(typeof state!=='undefined')state.mistakes={};localStorage.removeItem('agv5_mistakes')}catch(e){}}
function setMistakeUser(user){
 const next=user&&user.id?{id:String(user.id),email:String(user.email||'')}:null;if((CURRENT_MISTAKE_USER&&CURRENT_MISTAKE_USER.id)===(next&&next.id))return;
 save();saveLearningData();CURRENT_MISTAKE_USER=next;loadUiForUser();loadLearningData();clearSharedLegacyMistakes();
 try{if(typeof state!=='undefined'&&state.tab==='grammar')refresh()}catch(e){}
 try{if(typeof state!=='undefined'&&state.tab==='mistakes')renderMistakeDashboard()}catch(e){}
}
loadLearningData();
function slotId(uid,eid,qi,si){return 'giu::'+uid+'::'+eid+'::'+qi+'::'+si}
function legacySlotId(qid){return 'practice::'+qid}
function unitMeta(uid){
 const fallback=window.V24_COMPLETE_DATA&&window.V24_COMPLETE_DATA[uid]||{};
 let bookId=fallback.book||String(uid||'').split('-')[0]||'english',bookTitle=bookId,unit=fallback.unit||'',title='',category='',topicTitle='';
 try{const books=(typeof V7_SOURCE_BOOKS!=='undefined'&&V7_SOURCE_BOOKS)||[];for(const b of books){const u=(b.units||[]).find(x=>x.uid===uid);if(u){bookId=b.id;bookTitle=b.title||b.short||b.id;unit=u.unit;title=u.title||'';category=u.category||'';topicTitle=u.topicTitle||'';break}}}catch(e){}
 try{const g=(typeof V12_GUIDES!=='undefined'&&V12_GUIDES&&V12_GUIDES[uid])||null;if(g){title=title||g.sourceTitle||g.titleVi||'';category=category||g.category||''}}catch(e){}
 return {uid,bookId,bookTitle,unit,title:title||('Unit '+unit),category,topicTitle};
}
function grammarCategory(meta){
 const t=normBase([meta.title,meta.category,meta.topicTitle].filter(Boolean).join(' '));
 const rules=[
  [/present perfect continuous/,'Hiện tại hoàn thành tiếp diễn'],[/present perfect/,'Hiện tại hoàn thành'],[/present continuous/,'Hiện tại tiếp diễn'],[/present simple/,'Hiện tại đơn'],
  [/past perfect continuous/,'Quá khứ hoàn thành tiếp diễn'],[/past perfect/,'Quá khứ hoàn thành'],[/past continuous/,'Quá khứ tiếp diễn'],[/past simple/,'Quá khứ đơn'],
  [/future perfect continuous|will have been/,'Tương lai hoàn thành tiếp diễn'],[/future perfect|will have done/,'Tương lai hoàn thành'],[/future continuous|will be doing/,'Tương lai tiếp diễn'],[/going to/,'Be going to'],[/future|will and shall|will shall|will would/,'Tương lai và will'],
  [/subject verb agreement|agreement between subject and verb/,'Hòa hợp chủ ngữ - động từ'],[/passive/,'Câu bị động'],[/reported|reporting|indirect speech/,'Câu tường thuật'],[/condition|wish|if clauses/,'Câu điều kiện và wish'],
  [/modal|can could|may might|must have to|should ought/,'Động từ khuyết thiếu'],[/question tag|tag question/,'Câu hỏi đuôi'],[/question|auxiliary verb/,'Câu hỏi và trợ động từ'],
  [/gerund|infinitive|verb ing|to infinitive/,'Danh động từ và động từ nguyên mẫu'],[/relative clause|relative pronoun|whose where whereby/,'Mệnh đề quan hệ'],[/clause|conjunction/,'Mệnh đề và liên từ'],
  [/article|a an the|zero article/,'Mạo từ'],[/quantifier|some any|much many|few little|all both each every|no none/,'Từ chỉ số lượng'],[/pronoun|determiner/,'Đại từ và từ hạn định'],[/noun|compound noun/,'Danh từ'],
  [/comparison|comparative|superlative|as as|more most/,'So sánh'],[/adjective|adverb/,'Tính từ và trạng từ'],[/preposition/,'Giới từ'],[/phrasal|two word verb|three word verb/,'Cụm động từ'],
  [/inversion/,'Đảo ngữ'],[/word order|position of/,'Trật tự từ'],[/subjunctive/,'Thức giả định']
 ];
 for(const [re,label] of rules)if(re.test(t))return label;
 if(meta.topicTitle)return meta.topicTitle;
 if(meta.category)return meta.category;
 return 'Cấu trúc ngữ pháp khác';
}
function topicMeta(topicId){
 try{const t=(typeof TOPICS!=='undefined'&&TOPICS||[]).find(x=>x.id===topicId);if(t)return {title:t.title||topicId,category:t.title||'Ngữ pháp tổng hợp'}}catch(e){}
 return {title:topicId||'Luyện tập tổng hợp',category:'Ngữ pháp tổng hợp'};
}
function classifySkill(ex,q){
 const task=normBase(ex&&ex.taskType||'');
 const text=normBase([ex&&ex.instructionVi,ex&&ex.instructionEn,ex&&ex.context,q&&q.helperText].filter(Boolean).join(' '));
 if(/reading|passage|article|story|email|notice|dialogue|conversation|matching|situation|picture|photo/.test(task))return 'reading';
 if(/read the (text|article|story|email|passage|dialogue|conversation)|complete the (text|article|story|email|passage|dialogue|conversation)|match the|which sentence goes|look at the (picture|photo)|according to the|read the situations|doc doan|doc bai|doc email|doc cau chuyen|doc hoi thoai|ghep|noi cau|tinh huong|tranh minh hoa/.test(text))return 'reading';
 return 'grammar';
}
function classifyLegacySkill(q){
 const t=normBase([q&&q.prompt,q&&q.set,q&&q.type].filter(Boolean).join(' '));
 return /read|passage|article|story|dialogue|conversation|match|which sentence|situation|doan van|hoi thoai|tinh huong/.test(t)?'reading':'grammar';
}
function promptFor(ex,q,qi,s){
 const h=String(q&&q.helperText||'').trim();if(h)return h;
 const task=String(ex&&ex.instructionVi||ex&&ex.instructionEn||'').trim();
 const label=q&&q.label||qi+1,sub=s&&s.label?(' - mục '+s.label):'';
 return (task?task+' — ':'')+'Câu '+label+sub+' trong Exercise '+(ex&&ex.id||'');
}
function grammarSnapshot(uid,ex){
 const vals=[];(ex.questions||[]).forEach((q,qi)=>(q.slots||[]).forEach((s,si)=>{if(s.gradeable)vals.push(ansKey(uid,ex.id,qi,si)+'='+normBase(UI.answers[ansKey(uid,ex.id,qi,si)]||''))}));return vals.join('|');
}
function updateProfileEntry(id,meta,status){
 const p=LEARNING_PROFILE.slots[id]||{attempts:0,correct:0,wrong:0,source:meta.source,skill:meta.skill,category:meta.category,uid:meta.uid||'',topic:meta.topic||'',lastDate:''};
 p.attempts=(p.attempts||0)+1;if(status==='correct')p.correct=(p.correct||0)+1;else if(status==='incorrect')p.wrong=(p.wrong||0)+1;
 p.source=meta.source;p.skill=meta.skill;p.category=meta.category;p.uid=meta.uid||p.uid||'';p.topic=meta.topic||p.topic||'';p.lastDate=new Date().toISOString();LEARNING_PROFILE.slots[id]=p;return p;
}
function recordGrammarAttempt(uid,u,ex,options){
 if(!CURRENT_MISTAKE_USER){clearSharedLegacyMistakes();return false;}
 options=options||{};const snapshot=grammarSnapshot(uid,ex),submissionKey=exKey(uid,ex.id);
 if(!options.force&&LEARNING_PROFILE.migrated[submissionKey]===snapshot)return false;
 LEARNING_PROFILE.migrated[submissionKey]=snapshot;
 const meta=unitMeta(uid),category=grammarCategory(meta),now=new Date().toISOString();
 (ex.questions||[]).forEach((q,qi)=>(q.slots||[]).forEach((s,si)=>{
  if(!s.gradeable)return;const key=ansKey(uid,ex.id,qi,si),user=UI.answers[key]||'',status=statusFor(user,s),id=slotId(uid,ex.id,qi,si),skill=classifySkill(ex,q);
  const p=updateProfileEntry(id,{source:'grammar-in-use',skill,category,uid},status);
  if(status==='incorrect'){
   const fb=explainWrong(uid,ex,q,s,user);
   ACTIVE_MISTAKES[id]={id,source:'grammar-in-use',sourceLabel:'Grammar in Use',uid,bookId:meta.bookId,bookTitle:meta.bookTitle,unit:meta.unit,unitTitle:meta.title,exerciseId:ex.id,exerciseIndex:(u.exercises||[]).indexOf(ex),questionIndex:qi,questionLabel:q.label||qi+1,slotIndex:si,slotLabel:s.label||'',prompt:promptFor(ex,q,qi,s),userAnswer:user,correctAnswer:s.answer||acceptedValues(s)[0]||'',reason:fb.reason,fix:fb.fix,trap:fb.trap,category,skill,taskType:ex.taskType||'',keyPage:ex.keyPage||'',image:ex.image||'',wrongCount:p.wrong||1,attempts:p.attempts||1,date:now};
  }else delete ACTIVE_MISTAKES[id];
 }));
 saveLearningData();window.dispatchEvent(new CustomEvent('agv25-progress-updated'));return true;
}
function legacyAnswer(area,q,i){
 const key=area._quiz.key;if(q.type==='mcq'){const selected=document.querySelector('input[name="'+CSS.escape(key)+'-q'+i+'"]:checked');const user=selected?String(selected.value):'';return {user,correct:String(q.correct),ok:Number(user)===Number(q.correct),displayUser:user?String.fromCharCode(65+Number(user)):'',displayCorrect:String.fromCharCode(65+Number(q.correct))}}
 const el=document.querySelector('[data-text="'+CSS.escape(key)+'-q'+i+'"]'),user=el?el.value:'';const vals=q.answers||[];const ok=vals.some(a=>normBase(a)===normBase(user));return {user,correct:vals[0]||'',ok,displayUser:user,displayCorrect:vals[0]||''};
}
function recordLegacyQuiz(area){
 if(!CURRENT_MISTAKE_USER){clearSharedLegacyMistakes();return false;}
 if(!area||!area._quiz||!area._quiz.submitted)return;const qz=area._quiz;
 const answers=qz.items.map((q,i)=>legacyAnswer(area,q,i).user).join('|');const snapKey='legacy::'+qz.key+'::'+qz.items.map(q=>q.id).join(',');
 if(LEARNING_PROFILE.legacyMigrated[snapKey]===answers)return;LEARNING_PROFILE.legacyMigrated[snapKey]=answers;
 qz.items.forEach((q,i)=>{const r=legacyAnswer(area,q,i),id=legacySlotId(q.id),tm=topicMeta(q.topic),category=tm.category,skill=classifyLegacySkill(q),status=r.ok?'correct':'incorrect';const p=updateProfileEntry(id,{source:'practice',skill,category,topic:q.topic||'',uid:q.unitUid||''},status);
  if(!r.ok){ACTIVE_MISTAKES[id]={id,source:'practice',sourceLabel:'Luyện tập',legacyId:q.id,topic:q.topic||'',uid:q.unitUid||'',prompt:q.prompt||('Câu '+(i+1)),userAnswer:r.displayUser,correctAnswer:typeof qAnswer==='function'?qAnswer(q):r.displayCorrect,reason:q.explanation||'Đáp án của em chưa khớp với đáp án đúng.',fix:'Mở lại bài gốc, đọc phần giải thích rồi làm lại câu này.',trap:q.trap||'Đọc toàn bộ nghĩa của câu trước khi chọn đáp án.',category,skill,wrongCount:p.wrong||1,attempts:p.attempts||1,date:new Date().toISOString()};}
  else{delete ACTIVE_MISTAKES[id];try{if(typeof state!=='undefined'&&state.mistakes)delete state.mistakes[q.id]}catch(e){}}
 });
 clearSharedLegacyMistakes()
 saveLearningData();window.dispatchEvent(new CustomEvent('agv25-progress-updated'));
}
function migrateExistingGrammar(){return false}
function legacyActiveMistakes(){return []}
function allActiveMistakes(){return Object.values(ACTIVE_MISTAKES).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))}
function buildMetrics(active){
 const skills={grammar:{label:'Ngữ pháp',attempts:0,correct:0,wrong:0},reading:{label:'Đọc hiểu / ngữ cảnh',attempts:0,correct:0,wrong:0}},cats={};
 Object.values(LEARNING_PROFILE.slots||{}).forEach(p=>{const sk=skills[p.skill]||skills.grammar;sk.attempts+=p.attempts||0;sk.correct+=p.correct||0;sk.wrong+=p.wrong||0;const c=cats[p.category]||(cats[p.category]={label:p.category,attempts:0,correct:0,wrong:0});c.attempts+=p.attempts||0;c.correct+=p.correct||0;c.wrong+=p.wrong||0});
 active.filter(m=>m.source==='legacy').forEach(m=>{const sk=skills[m.skill]||skills.grammar;sk.attempts++;sk.wrong++;const c=cats[m.category]||(cats[m.category]={label:m.category,attempts:0,correct:0,wrong:0});c.attempts++;c.wrong++});
 Object.values(skills).forEach(x=>{x.accuracy=x.attempts?Math.round(x.correct/x.attempts*100):null;x.errorRate=x.attempts?Math.round(x.wrong/x.attempts*100):null});
 Object.values(cats).forEach(x=>{x.accuracy=x.attempts?Math.round(x.correct/x.attempts*100):null;x.errorRate=x.attempts?Math.round(x.wrong/x.attempts*100):null});
 const categories=Object.values(cats).filter(x=>x.attempts).sort((a,b)=>(b.wrong-a.wrong)||(b.errorRate-a.errorRate)||(b.attempts-a.attempts));
 return {skills,categories,totalAttempts:Object.values(skills).reduce((n,x)=>n+x.attempts,0),totalCorrect:Object.values(skills).reduce((n,x)=>n+x.correct,0),totalWrong:Object.values(skills).reduce((n,x)=>n+x.wrong,0)};
}
const CHART_COLORS=['#2f72ff','#ff9f43','#7b61ff','#14a06f','#e25252','#00a8c6','#f15f9a','#6f8aa7'];
function donutGradient(parts){const total=parts.reduce((n,p)=>n+(p.value||0),0);if(!total)return 'conic-gradient(#e5edf6 0 100%)';let at=0;return 'conic-gradient('+parts.map((p,i)=>{const start=at,end=at+(p.value||0)/total*100;at=end;return (p.color||CHART_COLORS[i%CHART_COLORS.length])+' '+start.toFixed(2)+'% '+end.toFixed(2)+'%'}).join(',')+')'}
function donutHtml(title,parts,center,sub){
 const visible=parts.filter(p=>p.value>0);return '<section class="v25m-chart-card"><h3>'+esc(title)+'</h3><div class="v25m-chart-body"><div class="v25m-donut" style="background:'+donutGradient(parts)+'"><div class="v25m-donut-center"><b>'+esc(center)+'</b><span>'+esc(sub)+'</span></div></div><div class="v25m-legend">'+(visible.length?visible.map((p,i)=>'<div><i style="background:'+(p.color||CHART_COLORS[i%CHART_COLORS.length])+'"></i><span>'+esc(p.label)+'</span><b>'+p.value+'</b></div>').join(''):'<p>Chưa có lỗi để phân tích.</p>')+'</div></div></section>';
}
function weakCategoryList(categories){if(!categories.length)return '<div class="empty">Chưa đủ dữ liệu để xác định loại ngữ pháp yếu.</div>';return '<div class="v25m-weak-list">'+categories.slice(0,10).map((c,i)=>'<div class="v25m-weak-row"><div><b>'+(i+1)+'. '+esc(c.label)+'</b><span>'+c.wrong+' lỗi / '+c.attempts+' lượt · đúng '+(c.accuracy==null?'—':c.accuracy+'%')+'</span></div><div class="v25m-bar"><i style="width:'+Math.max(4,c.errorRate||0)+'%"></i></div></div>').join('')+'</div>'}
function sourceLabel(m){if(m.source==='grammar-in-use')return 'Grammar in Use';if(m.source==='practice')return 'Luyện tập';return 'Luyện tập cũ'}
function mistakeLocation(m){if(m.source==='grammar-in-use')return esc(m.bookTitle)+' · Unit '+esc(m.unit)+' · Exercise '+esc(m.exerciseId)+' · Câu '+esc(m.questionLabel);if(m.uid)return 'Unit '+esc(String(m.uid).split('-').pop());return esc(topicMeta(m.topic).title)}
function mistakeCard(m){return '<article class="v25m-card"><div class="v25m-card-head"><div><span class="v25m-badge '+(m.skill==='reading'?'reading':'grammar')+'">'+esc(m.skill==='reading'?'Đọc hiểu / ngữ cảnh':'Ngữ pháp')+'</span><span class="v25m-badge source">'+esc(sourceLabel(m))+'</span></div><small>'+mistakeLocation(m)+'</small></div><h3>'+esc(m.prompt||'Câu cần ôn lại')+'</h3><div class="v25m-answer-grid"><div><b>Đáp án của em</b><p>'+esc(m.userAnswer||'(chưa lưu)')+'</p></div><div><b>Đáp án đúng</b><p>'+esc(m.correctAnswer||'Xem Answer Key')+'</p></div></div><div class="v25m-diagnosis"><p><b>Vì sao sai?</b> '+esc(m.reason||'Cần xem lại bài gốc.')+'</p><p><b>Cách sửa:</b> '+esc(m.fix||'Làm lại câu này sau khi đọc lý thuyết.')+'</p><p><b>Exam Trap:</b> '+esc(m.trap||'Đọc toàn bộ nghĩa của câu trước khi chọn đáp án.')+'</p></div><div class="v25m-card-meta"><span>'+esc(m.category||'Ngữ pháp')+'</span><span>Sai '+(m.wrongCount||1)+' lần</span></div><div class="actions"><button class="btn primary" data-v25m-open="'+esc(m.id)+'">Làm lại đúng câu này</button><button class="btn" data-v25m-remove="'+esc(m.id)+'">Đã nhớ - xóa khỏi Sổ lỗi</button></div></article>'}
function ensureMistakeStyles(){if(document.getElementById('v25-mistake-dashboard-style'))return;const style=document.createElement('style');style.id='v25-mistake-dashboard-style';style.textContent=`
.v25m-auth-lock{border:1px solid #cfe0f0;border-radius:24px;background:linear-gradient(135deg,#f5fbff,#fffaf0);padding:32px;text-align:center}.v25m-auth-lock .lock-icon{width:56px;height:56px;border-radius:18px;margin:0 auto 12px;display:grid;place-items:center;background:#e8f2ff;color:#2f72ff;font-size:27px}.v25m-auth-lock h2{font:900 25px Nunito;margin:0 0 8px}.v25m-auth-lock p{max-width:620px;margin:0 auto 16px;color:#60758a}.v25m-auth-lock button{border:0;border-radius:14px;background:#2f72ff;color:#fff;padding:10px 15px;font-weight:900}
.v25m-hero{display:grid;grid-template-columns:1.3fr .9fr;gap:18px;align-items:center}.v25m-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.v25m-summary>div{background:#fff;border:1px solid var(--line);border-radius:18px;padding:13px;text-align:center}.v25m-summary b{display:block;font:900 28px Nunito;color:var(--blue)}.v25m-summary span{color:var(--muted);font-size:13px;font-weight:800}.v25m-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:16px 0}.v25m-chart-card{border:1px solid var(--line);border-radius:24px;background:#fff;padding:18px;box-shadow:0 8px 24px rgba(44,101,172,.07)}.v25m-chart-card h3{margin:0 0 14px;font:900 21px Nunito}.v25m-chart-body{display:grid;grid-template-columns:190px 1fr;gap:18px;align-items:center}.v25m-donut{width:190px;height:190px;border-radius:50%;position:relative;box-shadow:inset 0 0 0 1px rgba(23,50,77,.08)}.v25m-donut:after{content:"";position:absolute;inset:36px;border-radius:50%;background:#fff;box-shadow:0 6px 20px rgba(44,101,172,.08)}.v25m-donut-center{position:absolute;inset:48px;z-index:1;display:grid;place-content:center;text-align:center}.v25m-donut-center b{font:900 24px Nunito;color:var(--ink);line-height:1.1}.v25m-donut-center span{font-size:12px;color:var(--muted);line-height:1.25;margin-top:4px}.v25m-legend{display:grid;gap:9px}.v25m-legend>div{display:grid;grid-template-columns:13px 1fr auto;gap:8px;align-items:center}.v25m-legend i{width:13px;height:13px;border-radius:50%}.v25m-legend span{color:#415b73}.v25m-legend b{color:var(--ink)}.v25m-insight{border:1px solid #d8e7f6;border-radius:22px;padding:18px;background:linear-gradient(135deg,#f7fbff,#fffaf0);margin:16px 0}.v25m-insight h3{margin:0 0 8px;font:900 21px Nunito}.v25m-skill-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}.v25m-skill-cards>div{border:1px solid var(--line);background:#fff;border-radius:16px;padding:12px}.v25m-skill-cards b{font-size:20px;color:var(--blue)}.v25m-skill-cards span{display:block;color:var(--muted);font-size:13px}.v25m-weak-list{display:grid;gap:10px}.v25m-weak-row{display:grid;grid-template-columns:minmax(210px,1fr) minmax(150px,.8fr);gap:14px;align-items:center}.v25m-weak-row span{display:block;color:var(--muted);font-size:12px;margin-top:2px}.v25m-bar{height:10px;background:#e8f0f8;border-radius:999px;overflow:hidden}.v25m-bar i{display:block;height:100%;background:linear-gradient(90deg,#ffb34d,#e25252);border-radius:999px}.v25m-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}.v25m-controls label{font-weight:900}.v25m-controls select{width:100%;margin-top:5px;border:1px solid var(--line);border-radius:14px;padding:10px;background:#fff}.v25m-card{border:1px solid var(--line);border-radius:22px;padding:18px;margin:14px 0;background:#fff;box-shadow:0 8px 22px rgba(44,101,172,.06)}.v25m-card-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.v25m-card-head small{color:var(--muted);font-weight:700;text-align:right}.v25m-badge{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:900;margin-right:6px}.v25m-badge.grammar{background:#eaf3ff;color:#185dce}.v25m-badge.reading{background:#fff1d8;color:#965d00}.v25m-badge.source{background:#eefaf5;color:#147052}.v25m-card h3{font:900 18px Nunito;margin:14px 0 10px}.v25m-answer-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.v25m-answer-grid>div{border:1px solid var(--line);border-radius:15px;padding:11px;background:#f8fcff}.v25m-answer-grid p{margin:5px 0 0;white-space:pre-wrap}.v25m-diagnosis{margin-top:10px;border:1px solid #ffd1a0;background:#fff8ea;border-radius:16px;padding:12px}.v25m-diagnosis p{margin:5px 0}.v25m-card-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;color:var(--muted);font-size:12px;font-weight:800}.v25m-history-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 18px}@media(max-width:900px){.v25m-hero,.v25m-charts{grid-template-columns:1fr}.v25m-chart-body{grid-template-columns:160px 1fr}.v25m-donut{width:160px;height:160px}.v25m-donut:after{inset:30px}.v25m-donut-center{inset:40px}.v25m-controls{grid-template-columns:1fr}.v25m-weak-row{grid-template-columns:1fr}.v25m-answer-grid{grid-template-columns:1fr}}@media(max-width:560px){.v25m-summary{grid-template-columns:1fr}.v25m-chart-body{grid-template-columns:1fr;justify-items:center}.v25m-legend{width:100%}.v25m-card-head{display:block}.v25m-card-head small{display:block;text-align:left;margin-top:8px}.v25m-skill-cards{grid-template-columns:1fr}}
`;document.head.appendChild(style)}
function renderMistakeDashboard(){
 ensureMistakeStyles();const area=document.getElementById('mistake-area');if(!area)return;
 if(!CURRENT_MISTAKE_USER){area.innerHTML='<section class="v25m-auth-lock"><div class="lock-icon">🔒</div><h2>Đăng nhập để mở Sổ lỗi</h2><p>Sổ lỗi, biểu đồ điểm yếu và lịch sử làm bài được tách riêng theo từng tài khoản. Dữ liệu của người này không được hiển thị cho người khác.</p><button type="button" data-ag-mistake-login="1">Đăng nhập</button></section>';return;}
 const active=allActiveMistakes(),metrics=buildMetrics(active);
 const skillParts=[{label:'Ngữ pháp',value:metrics.skills.grammar.wrong,color:'#2f72ff'},{label:'Đọc hiểu / ngữ cảnh',value:metrics.skills.reading.wrong,color:'#ff9f43'}];
 const catParts=metrics.categories.slice(0,7).map((c,i)=>({label:c.label,value:c.wrong,color:CHART_COLORS[i%CHART_COLORS.length]}));
 const attemptedSkills=Object.values(metrics.skills).filter(x=>x.attempts);const weakest=attemptedSkills.sort((a,b)=>(b.errorRate||0)-(a.errorRate||0))[0];
 const overallAccuracy=metrics.totalAttempts?Math.round(metrics.totalCorrect/metrics.totalAttempts*100):null;
 const categories=[...new Set(active.map(x=>x.category).filter(Boolean))].sort();
 const filtered=active.filter(m=>(MISTAKE_FILTERS.source==='all'||MISTAKE_FILTERS.source===m.source||(MISTAKE_FILTERS.source==='practice'&&m.source==='practice'))&&(MISTAKE_FILTERS.skill==='all'||MISTAKE_FILTERS.skill===m.skill)&&(MISTAKE_FILTERS.category==='all'||MISTAKE_FILTERS.category===m.category));
 area.innerHTML='<section class="lesson-hero v25m-hero"><div><span class="eyebrow">Sổ lỗi của '+esc(CURRENT_MISTAKE_USER.email||'tài khoản hiện tại')+'</span><h2>'+active.length+' câu đang cần ôn lại</h2><p>Câu sai trong Grammar in Use và Luyện tập được lưu riêng theo tài khoản Supabase đang đăng nhập.</p></div><div class="v25m-summary"><div><b>'+active.length+'</b><span>câu chưa sửa</span></div><div><b>'+metrics.totalAttempts+'</b><span>lượt đã chấm</span></div><div><b>'+(overallAccuracy==null?'—':overallAccuracy+'%')+'</b><span>độ chính xác</span></div></div></section>'+donutHtml('Đang yếu ngữ pháp hay đọc hiểu?',skillParts,String(metrics.totalWrong),'lỗi đã ghi nhận')+'<div class="v25m-charts">'+donutHtml('Lỗi theo loại ngữ pháp',catParts,String(metrics.categories.length),'nhóm đã luyện')+'<section class="v25m-chart-card"><h3>Loại ngữ pháp cần ưu tiên</h3>'+weakCategoryList(metrics.categories)+'</section></div><section class="v25m-insight"><h3>Nhận xét hiện tại</h3><p>'+(weakest?('Phần cần ưu tiên là <b>'+esc(weakest.label)+'</b> với tỷ lệ lỗi '+weakest.errorRate+'% trên '+weakest.attempts+' lượt đã chấm.'):'Hãy làm và nộp thêm bài để app xác định chính xác điểm yếu.')+'</p><div class="v25m-skill-cards"><div><b>'+(metrics.skills.grammar.accuracy==null?'—':metrics.skills.grammar.accuracy+'%')+'</b><span>Độ chính xác ngữ pháp · '+metrics.skills.grammar.attempts+' lượt</span></div><div><b>'+(metrics.skills.reading.accuracy==null?'—':metrics.skills.reading.accuracy+'%')+'</b><span>Độ chính xác đọc hiểu/ngữ cảnh · '+metrics.skills.reading.attempts+' lượt</span></div></div><p style="margin-bottom:0;color:var(--muted);font-size:12px">“Đọc hiểu/ngữ cảnh” được nhận diện từ bài có đoạn văn, hội thoại, tình huống, matching hoặc tranh; các bài còn lại được xếp vào ngữ pháp.</p></section><div class="v25m-history-actions"><button class="btn primary" data-v25m-open-first '+(active.length?'':'disabled')+'>Mở câu sai đầu tiên</button><button class="btn" data-v25m-clear-active '+(active.length?'':'disabled')+'>Xóa các câu trong Sổ lỗi</button><button class="btn" data-v25m-clear-history '+(metrics.totalAttempts?'':'disabled')+'>Xóa lịch sử phân tích</button></div><div class="v25m-controls"><label>Nguồn<select id="v25m-source"><option value="all">Tất cả</option><option value="grammar-in-use">Grammar in Use</option><option value="practice">Luyện tập</option></select></label><label>Kỹ năng<select id="v25m-skill"><option value="all">Tất cả</option><option value="grammar">Ngữ pháp</option><option value="reading">Đọc hiểu / ngữ cảnh</option></select></label><label>Loại ngữ pháp<select id="v25m-category"><option value="all">Tất cả</option>'+categories.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('')+'</select></label></div><div id="v25m-list">'+(filtered.length?filtered.map(mistakeCard).join(''):'<div class="empty">Không có câu sai phù hợp với bộ lọc.</div>')+'</div>';
 const s=document.getElementById('v25m-source'),k=document.getElementById('v25m-skill'),c=document.getElementById('v25m-category');if(s)s.value=MISTAKE_FILTERS.source;if(k)k.value=MISTAKE_FILTERS.skill;if(c)c.value=MISTAKE_FILTERS.category;
}
function findActiveMistake(id){return ACTIVE_MISTAKES[id]||legacyActiveMistakes().find(x=>x.id===id)||null}
function openMistake(m){
 if(!m)return;
 if(m.source==='grammar-in-use'){
  const meta=unitMeta(m.uid),u=window.V24_COMPLETE_DATA&&window.V24_COMPLETE_DATA[m.uid];
  try{state.book=meta.bookId;state.unit=m.uid}catch(e){}
  if(u){const idx=(u.exercises||[]).findIndex(x=>String(x.id)===String(m.exerciseId));const exIndex=Math.max(0,idx),ex=(u.exercises||[])[exIndex];UI.active[m.uid]=exIndex;if(ex){delete UI.answers[ansKey(m.uid,ex.id,Number(m.questionIndex||0),Number(m.slotIndex||0))];delete UI.submitted[exKey(m.uid,ex.id)]}save()}
  if(typeof setTab==='function')setTab('grammar');else document.querySelector('[data-tab="grammar"]')?.click();
  setTimeout(()=>{try{if(typeof renderGrammar==='function')renderGrammar()}catch(e){}setTimeout(()=>{refresh();setTimeout(()=>{const target=document.querySelector('.v24-question[data-v25-question="'+m.questionIndex+'"]');if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.animate([{boxShadow:'0 0 0 0 rgba(226,82,82,0)'},{boxShadow:'0 0 0 6px rgba(226,82,82,.25)'},{boxShadow:'0 0 0 0 rgba(226,82,82,0)'}],{duration:1100});target.querySelector('input,textarea,select')?.focus()}},260)},100)},40);return;
 }
 const qid=m.legacyId||String(m.id||'').replace(/^practice::|^legacy::/,'');
 try{const q=(typeof QUESTIONS!=='undefined'&&QUESTIONS||[]).find(x=>String(x.id)===String(qid));if(q){if(typeof setTab==='function')setTab('practice');else document.querySelector('[data-tab="practice"]')?.click();setTimeout(()=>{try{renderInlineQuiz([q],'#practice-quiz','mistake-one-'+q.id);document.querySelector('#practice-quiz')?.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}},60);return}}catch(e){}
 if(m.uid){const meta=unitMeta(m.uid);try{state.book=meta.bookId;state.unit=m.uid}catch(e){}if(typeof setTab==='function')setTab('grammar');else document.querySelector('[data-tab="grammar"]')?.click();return}
 if(m.topic){try{state.topic=m.topic;const t=(typeof TOPICS!=='undefined'&&TOPICS||[]).find(x=>x.id===m.topic);if(t&&t.subtopics&&t.subtopics[0])state.lesson=t.subtopics[0].id;if(state.open&&state.open.add)state.open.add(m.topic)}catch(e){}if(typeof setTab==='function')setTab('topics');else document.querySelector('[data-tab="topics"]')?.click();return}
 if(typeof setTab==='function')setTab('practice');else document.querySelector('[data-tab="practice"]')?.click();
}
function removeMistake(id){if(!CURRENT_MISTAKE_USER)return;if(ACTIVE_MISTAKES[id])delete ACTIVE_MISTAKES[id];saveLearningData();renderMistakeDashboard()}
function installMistakeDashboard(){
 ensureMistakeStyles();try{window.renderMistakes=renderMistakeDashboard}catch(e){}
 window.AGMistakeBook={setUser:setMistakeUser,getUser:()=>CURRENT_MISTAKE_USER,isReady:()=>!!CURRENT_MISTAKE_USER,render:renderMistakeDashboard};
 window.addEventListener('ag:auth-changed',ev=>setMistakeUser(ev.detail&&ev.detail.user||null));
 if(window.AGGrammarAuth?.getUser)try{setMistakeUser(window.AGGrammarAuth.getUser())}catch(e){}
 document.addEventListener('click',ev=>{
  const mt=ev.target.closest('[data-tab="mistakes"]');if(mt){setTimeout(renderMistakeDashboard,30);return}
  if(ev.target.closest('[data-ag-mistake-login]')){window.AGGrammarAuth?.showLogin?.('mistakes');return}
  const quizSubmit=ev.target.closest('[data-submit-key]');if(quizSubmit){const area=quizSubmit.closest('[data-quiz-key]');setTimeout(()=>recordLegacyQuiz(area),40);return}
  const open=ev.target.closest('[data-v25m-open]');if(open){openMistake(findActiveMistake(open.dataset.v25mOpen));return}
  const rm=ev.target.closest('[data-v25m-remove]');if(rm){removeMistake(rm.dataset.v25mRemove);return}
  if(ev.target.closest('[data-v25m-open-first]')){openMistake(allActiveMistakes()[0]);return}
  if(ev.target.closest('[data-v25m-clear-active]')){if(CURRENT_MISTAKE_USER&&confirm('Xóa toàn bộ câu hiện có trong Sổ lỗi? Lịch sử phân tích vẫn được giữ.')){ACTIVE_MISTAKES={};saveLearningData();renderMistakeDashboard()}return}
  if(ev.target.closest('[data-v25m-clear-history]')){if(CURRENT_MISTAKE_USER&&confirm('Xóa toàn bộ lịch sử điểm đúng/sai dùng cho biểu đồ?')){LEARNING_PROFILE={version:4,slots:{},migrated:{},legacyMigrated:{}};saveLearningData();renderMistakeDashboard()}return}
 });
 document.addEventListener('change',ev=>{if(ev.target.id==='v25m-source')MISTAKE_FILTERS.source=ev.target.value;else if(ev.target.id==='v25m-skill')MISTAKE_FILTERS.skill=ev.target.value;else if(ev.target.id==='v25m-category')MISTAKE_FILTERS.category=ev.target.value;else return;saveLearningData();renderMistakeDashboard()});
 window.addEventListener('agv25-progress-updated',()=>{try{if(typeof state!=='undefined'&&state.tab==='mistakes')renderMistakeDashboard()}catch(e){}});
}

function panelHtml(uid,u,ex){
 const id=exKey(uid,ex.id),submitted=!!UI.submitted[id],total=flattenSlots(ex).length,done=answered(ex),pct=total?Math.round(done*100/total):0;
 const imgSrc=(window.V25_EXERCISE_IMAGES&&window.V25_EXERCISE_IMAGES[ex.image])||'';
 let h='<div class="v24-panel"><section class="v24-task"><span class="v24-kicker">Bài này yêu cầu em làm gì?</span><h4>'+esc(ex.instructionVi)+'</h4><ul class="v24-steps">'+(ex.steps||[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+(ex.instructionEn?'<details class="v24-original"><summary>Xem yêu cầu gốc bằng tiếng Anh</summary><div>'+esc(ex.instructionEn)+'</div></details>':'')+'</section>';
 h+='<div class="v25-workspace"><div class="v25-source-column"><section class="v24-source-card" id="v25-source-card"><div class="v24-source-top"><b>Đề bài đầy đủ - đúng Exercise trong sách</b><span>'+esc(u.book)+' · Unit '+esc(u.unit)+' · Exercise '+esc(ex.id)+'</span></div><img class="v24-source-img" data-v26-image-key="'+esc(ex.image)+'" data-v24-zoom="'+esc(imgSrc)+'" '+(imgSrc?'src="'+esc(imgSrc)+'"':'')+' loading="lazy" alt="Exercise '+esc(ex.id)+'" onerror="this.style.display=\'none\';this.nextElementSibling.classList.add(\'show\')"><div class="v25-image-fallback loading show"><span class="v25-fast-spinner" aria-hidden="true"></span><b>Đang tải đề bài...</b><small>Lần đầu mở có thể mất vài giây.</small></div><div class="v25-source-status">Đề bài chỉ được tải khi em mở Exercise để app chạy nhanh hơn.</div><button type="button" class="v25-open-source" data-v24-zoom="'+esc(imgSrc)+'">Mở đề toàn màn hình</button><p class="v24-source-note">Đọc câu mang đúng số ở khung đề này. Các ô trả lời tương ứng được xếp theo hàng dọc ở cột bên phải.</p></section></div><div class="v25-answer-column">';
 h+='<div class="v24-progress-row"><div class="v24-progress"><i style="width:'+pct+'%"></i></div><b data-v24-progress>'+done+'/'+total+' mục đã trả lời</b></div>';
 if(submitted){const s=score(ex);h+='<div class="v24-score"><div><b>'+s.p+'%</b><span>điểm tự chấm</span></div><div><b>'+s.c+'</b><span>đúng</span></div><div><b>'+s.w+'</b><span>chưa đúng</span></div><div><b>'+s.r+'</b><span>đáp án mẫu</span></div></div>'}
 h+='<div class="v24-list">'+(ex.questions||[]).map((q,qi)=>questionHtml(uid,ex,q,qi,submitted)).join('')+'</div>';
 h+='<div class="v24-actions"><button class="v24-btn primary" data-v24-submit="1" '+((submitted||!allAnswered(ex))?'disabled':'')+'>'+(submitted?'Đã chấm theo Answer Key':'Nộp bài và chấm theo Answer Key')+'</button>'+(submitted?'<button class="v24-btn" data-v24-retry="1">Làm lại câu sai</button>':'')+'<button class="v24-btn danger" data-v24-reset="1">Xóa toàn bộ bài làm</button></div><p class="v24-legend">Đáp án chỉ hiện sau khi nộp. Khi sai, app phân tích đúng phần sai của câu và đưa Exam Trap tương ứng; không dùng một lời nhắc chung cho mọi câu.</p></div></div></div>';return h}
function sectionHtml(){const uid=currentUnit(),u=V24_COMPLETE_DATA[uid];if(!u)return '<section class="v11-exercises v24-exercises"><div class="v24-empty">Không tìm thấy dữ liệu Exercise của Unit này.</div></section>';let ai=Number(UI.active[uid]||0);if(ai<0||ai>=u.exercises.length)ai=0;UI.active[uid]=ai;const tabs=u.exercises.map((ex,i)=>'<button class="v24-tab '+(i===ai?'active ':'')+(UI.submitted[exKey(uid,ex.id)]?'done':'')+'" data-v24-tab="'+i+'">Exercise '+esc(ex.id)+'</button>').join('');return '<section class="v11-exercises v24-exercises" data-v24-unit="'+esc(uid)+'"><div class="v24-head"><h3>Bài tập Grammar in Use - đầy đủ đề bài</h3><p>Mỗi Exercise dùng đúng khung đề từ sách, các ô trả lời xếp theo hàng dọc và chấm bằng Answer Key của chính sách.</p><div class="v24-coverage"><span>✓ '+V24_COMPLETE_STATS.units+'/360 Unit</span><span>✓ '+V24_COMPLETE_STATS.exercises+' Exercise</span><span>✓ '+V24_COMPLETE_STATS.slots+' mục trả lời</span><span>✓ Giải thích lỗi theo từng đáp án</span></div></div><div class="v24-tabs">'+tabs+'</div>'+panelHtml(uid,u,u.exercises[ai])+'</section>'}
function mount(){const detail=document.querySelector('#unit-detail');if(!detail||!currentUnit())return;const old=detail.querySelector('.v11-exercises,.v19-exercises,.v10-exercises');if(old)old.outerHTML=sectionHtml();else detail.insertAdjacentHTML('beforeend',sectionHtml());document.title='Albert Grammar';if(window.V26_applyExerciseImages)window.V26_applyExerciseImages(detail)}
function refresh(){const old=document.querySelector('.v24-exercises');if(old){old.outerHTML=sectionHtml();if(window.V26_applyExerciseImages)window.V26_applyExerciseImages(document.querySelector('#unit-detail'))}else mount()}
const previous=window.renderUnitDetail;window.renderUnitDetail=function(){if(typeof previous==='function')previous.apply(this,arguments);setTimeout(mount,0)};
window.addEventListener('load',()=>setTimeout(()=>{if(typeof state!=='undefined'&&state&&state.tab==='grammar')mount();const q=document.body;if(!document.querySelector('.v24-zoom'))q.insertAdjacentHTML('beforeend','<div class="v24-zoom"><button aria-label="Đóng">×</button><img alt="Phóng to đề bài"></div>')},180));
document.addEventListener('click',e=>{const sourceBtn=e.target.closest('[data-v25-source]');if(sourceBtn){const card=document.querySelector('#v25-source-card');if(card){card.scrollIntoView({behavior:'smooth',block:'start'});card.animate([{boxShadow:'0 0 0 0 rgba(57,119,238,0)'},{boxShadow:'0 0 0 6px rgba(57,119,238,.25)'},{boxShadow:'0 0 0 0 rgba(57,119,238,0)'}],{duration:900});}return}const tab=e.target.closest('[data-v24-tab]');if(tab){UI.active[currentUnit()]=Number(tab.dataset.v24Tab);save();refresh();return}const ok=e.target.closest('[data-v24-ok]');if(ok){UI.answers[ok.dataset.v24Ok]='OK';save();refresh();return}const submit=e.target.closest('[data-v24-submit]');if(submit){const uid=currentUnit(),u=unitData(),ex=u&&u.exercises[Number(UI.active[uid]||0)];if(ex&&allAnswered(ex)&&!UI.submitted[exKey(uid,ex.id)]){UI.submitted[exKey(uid,ex.id)]=true;save();recordGrammarAttempt(uid,u,ex,{force:true});refresh()}return}const reset=e.target.closest('[data-v24-reset]');if(reset){const u=unitData(),ex=u&&u.exercises[Number(UI.active[currentUnit()]||0)];if(ex&&confirm('Xóa toàn bộ câu trả lời của Exercise này?')){flattenSlots(ex).forEach(x=>delete UI.answers[x.key]);delete UI.submitted[exKey(currentUnit(),ex.id)];save();refresh()}return}const retry=e.target.closest('[data-v24-retry]');if(retry){const u=unitData(),ex=u&&u.exercises[Number(UI.active[currentUnit()]||0)];if(ex){flattenSlots(ex).forEach(x=>{if(statusFor(UI.answers[x.key]||'',x.s)!=='correct')delete UI.answers[x.key]});delete UI.submitted[exKey(currentUnit(),ex.id)];save();refresh()}return}const zoom=e.target.closest('[data-v24-zoom]');if(zoom){const z=document.querySelector('.v24-zoom');z.querySelector('img').src=zoom.dataset.v24Zoom;z.classList.add('open');return}if(e.target.closest('.v24-zoom button')||e.target.classList.contains('v24-zoom'))document.querySelector('.v24-zoom')?.classList.remove('open')});
document.addEventListener('input',e=>{const f=e.target.closest('[data-v24-answer]');if(!f)return;UI.answers[f.dataset.v24Answer]=f.value;save();const u=unitData(),ex=u&&u.exercises[Number(UI.active[currentUnit()]||0)];if(!ex)return;const sec=f.closest('.v24-exercises'),p=sec&&sec.querySelector('[data-v24-progress]'),bar=sec&&sec.querySelector('.v24-progress i'),btn=sec&&sec.querySelector('[data-v24-submit]');const t=flattenSlots(ex).length,d=answered(ex);if(p)p.textContent=d+'/'+t+' mục đã trả lời';if(bar)bar.style.width=(t?Math.round(d*100/t):0)+'%';if(btn)btn.disabled=!allAnswered(ex)});
installMistakeDashboard();
})();
