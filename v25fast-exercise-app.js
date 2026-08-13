(function(){
'use strict';
const STORE='albert_grammar_v24_complete';
const UI={active:{},answers:{},submitted:{}};
try{Object.assign(UI,JSON.parse(localStorage.getItem(STORE)||'{}')||{})}catch(e){}
function save(){try{localStorage.setItem(STORE,JSON.stringify(UI))}catch(e){}}
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
function questionHtml(uid,ex,q,qi,submitted){const statuses=submitted?(q.slots||[]).map((s,si)=>statusFor(UI.answers[ansKey(uid,ex.id,qi,si)]||'',s)):[];const cls=submitted?(statuses.includes('incorrect')?' incorrect':statuses.every(x=>x==='correct')?' correct':' reference'):'';let h='<article class="v24-question'+cls+'"><div class="v24-qhead"><span class="v24-qnum">'+esc(q.label||qi+1)+'</span><b>Câu '+esc(q.label||qi+1)+'</b></div>';
 if(q.helperText)h+='<div class="v24-helper">'+esc(q.helperText)+'</div>';else h+='<div class="v24-refer"><b>Nội dung câu '+esc(q.label||qi+1)+'</b> nằm trong đề bài chính xác ở cột bên trái. Đọc đúng dòng mang số này, sau đó nhập phần còn thiếu vào ô bên dưới.<br><button type="button" class="v25-question-link" data-v25-source="1">Xem đề bài</button></div>';
 h+='<div class="v24-slots">'+(q.slots||[]).map((s,si)=>inputHtml(uid,ex,q,qi,s,si)+(submitted?resultHtml(uid,ex,q,qi,s,si):'')).join('')+'</div></article>';return h}
function score(ex){let c=0,w=0,r=0;flattenSlots(ex).forEach(x=>{const st=statusFor(UI.answers[x.key]||'',x.s);if(st==='correct')c++;else if(st==='incorrect')w++;else r++});const d=c+w;return {c,w,r,p:d?Math.round(c*100/d):0}}
function panelHtml(uid,u,ex){
 const id=exKey(uid,ex.id),submitted=!!UI.submitted[id],total=flattenSlots(ex).length,done=answered(ex),pct=total?Math.round(done*100/total):0;
 const imgSrc=(window.V25_EXERCISE_IMAGES&&window.V25_EXERCISE_IMAGES[ex.image])||'';
 let h='<div class="v24-panel"><section class="v24-task"><span class="v24-kicker">Bài này yêu cầu em làm gì?</span><h4>'+esc(ex.instructionVi)+'</h4><ul class="v24-steps">'+(ex.steps||[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+(ex.instructionEn?'<details class="v24-original"><summary>Xem yêu cầu gốc bằng tiếng Anh</summary><div>'+esc(ex.instructionEn)+'</div></details>':'')+'</section>';
 h+='<div class="v25-workspace"><div class="v25-source-column"><section class="v24-source-card" id="v25-source-card"><div class="v24-source-top"><b>Đề bài đầy đủ - đúng Exercise trong sách</b><span>'+esc(u.book)+' · Unit '+esc(u.unit)+' · Exercise '+esc(ex.id)+'</span></div><img class="v24-source-img" data-v26-image-key="'+esc(ex.image)+'" data-v24-zoom="'+esc(imgSrc)+'" '+(imgSrc?'src="'+esc(imgSrc)+'"':'')+' loading="lazy" alt="Exercise '+esc(ex.id)+'" onerror="this.style.display=\'none\';this.nextElementSibling.classList.add(\'show\')"><div class="v25-image-fallback loading show"><span class="v25-fast-spinner" aria-hidden="true"></span><b>Đang tải đề bài...</b><small>Lần đầu mở có thể mất vài giây.</small></div><div class="v25-source-status">Đề bài chỉ được tải khi em mở Exercise để app chạy nhanh hơn.</div><button type="button" class="v25-open-source" data-v24-zoom="'+esc(imgSrc)+'">Mở đề toàn màn hình</button><p class="v24-source-note">Đọc câu mang đúng số ở khung đề này. Các ô trả lời tương ứng được xếp theo hàng dọc ở cột bên phải.</p></section></div><div class="v25-answer-column">';
 h+='<div class="v24-progress-row"><div class="v24-progress"><i style="width:'+pct+'%"></i></div><b data-v24-progress>'+done+'/'+total+' mục đã trả lời</b></div>';
 if(submitted){const s=score(ex);h+='<div class="v24-score"><div><b>'+s.p+'%</b><span>điểm tự chấm</span></div><div><b>'+s.c+'</b><span>đúng</span></div><div><b>'+s.w+'</b><span>chưa đúng</span></div><div><b>'+s.r+'</b><span>đáp án mẫu</span></div></div>'}
 h+='<div class="v24-list">'+(ex.questions||[]).map((q,qi)=>questionHtml(uid,ex,q,qi,submitted)).join('')+'</div>';
 h+='<div class="v24-actions"><button class="v24-btn primary" data-v24-submit="1" '+(!allAnswered(ex)?'disabled':'')+'>Nộp bài và chấm theo Answer Key</button>'+(submitted?'<button class="v24-btn" data-v24-retry="1">Làm lại câu sai</button>':'')+'<button class="v24-btn danger" data-v24-reset="1">Xóa toàn bộ bài làm</button></div><p class="v24-legend">Đáp án chỉ hiện sau khi nộp. Khi sai, app phân tích đúng phần sai của câu và đưa Exam Trap tương ứng; không dùng một lời nhắc chung cho mọi câu.</p></div></div></div>';return h}
function sectionHtml(){const uid=currentUnit(),u=V24_COMPLETE_DATA[uid];if(!u)return '<section class="v11-exercises v24-exercises"><div class="v24-empty">Không tìm thấy dữ liệu Exercise của Unit này.</div></section>';let ai=Number(UI.active[uid]||0);if(ai<0||ai>=u.exercises.length)ai=0;UI.active[uid]=ai;const tabs=u.exercises.map((ex,i)=>'<button class="v24-tab '+(i===ai?'active ':'')+(UI.submitted[exKey(uid,ex.id)]?'done':'')+'" data-v24-tab="'+i+'">Exercise '+esc(ex.id)+'</button>').join('');return '<section class="v11-exercises v24-exercises" data-v24-unit="'+esc(uid)+'"><div class="v24-head"><h3>Bài tập Grammar in Use - đầy đủ đề bài</h3><p>Mỗi Exercise dùng đúng khung đề từ sách, các ô trả lời xếp theo hàng dọc và chấm bằng Answer Key của chính sách.</p><div class="v24-coverage"><span>✓ '+V24_COMPLETE_STATS.units+'/360 Unit</span><span>✓ '+V24_COMPLETE_STATS.exercises+' Exercise</span><span>✓ '+V24_COMPLETE_STATS.slots+' mục trả lời</span><span>✓ Giải thích lỗi theo từng đáp án</span></div></div><div class="v24-tabs">'+tabs+'</div>'+panelHtml(uid,u,u.exercises[ai])+'</section>'}
function mount(){const detail=document.querySelector('#unit-detail');if(!detail||!currentUnit())return;const old=detail.querySelector('.v11-exercises,.v19-exercises,.v10-exercises');if(old)old.outerHTML=sectionHtml();else detail.insertAdjacentHTML('beforeend',sectionHtml());document.title='Albert Grammar Việt Nam V25 Fast';if(window.V26_applyExerciseImages)window.V26_applyExerciseImages(detail)}
function refresh(){const old=document.querySelector('.v24-exercises');if(old){old.outerHTML=sectionHtml();if(window.V26_applyExerciseImages)window.V26_applyExerciseImages(document.querySelector('#unit-detail'))}else mount()}
const previous=window.renderUnitDetail;window.renderUnitDetail=function(){if(typeof previous==='function')previous.apply(this,arguments);setTimeout(mount,0)};
window.addEventListener('load',()=>setTimeout(()=>{if(typeof state!=='undefined'&&state&&state.tab==='grammar')mount();const q=document.body;if(!document.querySelector('.v24-zoom'))q.insertAdjacentHTML('beforeend','<div class="v24-zoom"><button aria-label="Đóng">×</button><img alt="Phóng to đề bài"></div>')},180));
document.addEventListener('click',e=>{const sourceBtn=e.target.closest('[data-v25-source]');if(sourceBtn){const card=document.querySelector('#v25-source-card');if(card){card.scrollIntoView({behavior:'smooth',block:'start'});card.animate([{boxShadow:'0 0 0 0 rgba(57,119,238,0)'},{boxShadow:'0 0 0 6px rgba(57,119,238,.25)'},{boxShadow:'0 0 0 0 rgba(57,119,238,0)'}],{duration:900});}return}const tab=e.target.closest('[data-v24-tab]');if(tab){UI.active[currentUnit()]=Number(tab.dataset.v24Tab);save();refresh();return}const ok=e.target.closest('[data-v24-ok]');if(ok){UI.answers[ok.dataset.v24Ok]='OK';save();refresh();return}const submit=e.target.closest('[data-v24-submit]');if(submit){const u=unitData(),ex=u&&u.exercises[Number(UI.active[currentUnit()]||0)];if(ex&&allAnswered(ex)){UI.submitted[exKey(currentUnit(),ex.id)]=true;save();refresh()}return}const reset=e.target.closest('[data-v24-reset]');if(reset){const u=unitData(),ex=u&&u.exercises[Number(UI.active[currentUnit()]||0)];if(ex&&confirm('Xóa toàn bộ câu trả lời của Exercise này?')){flattenSlots(ex).forEach(x=>delete UI.answers[x.key]);delete UI.submitted[exKey(currentUnit(),ex.id)];save();refresh()}return}const retry=e.target.closest('[data-v24-retry]');if(retry){const u=unitData(),ex=u&&u.exercises[Number(UI.active[currentUnit()]||0)];if(ex){flattenSlots(ex).forEach(x=>{if(statusFor(UI.answers[x.key]||'',x.s)!=='correct')delete UI.answers[x.key]});delete UI.submitted[exKey(currentUnit(),ex.id)];save();refresh()}return}const zoom=e.target.closest('[data-v24-zoom]');if(zoom){const z=document.querySelector('.v24-zoom');z.querySelector('img').src=zoom.dataset.v24Zoom;z.classList.add('open');return}if(e.target.closest('.v24-zoom button')||e.target.classList.contains('v24-zoom'))document.querySelector('.v24-zoom')?.classList.remove('open')});
document.addEventListener('input',e=>{const f=e.target.closest('[data-v24-answer]');if(!f)return;UI.answers[f.dataset.v24Answer]=f.value;save();const u=unitData(),ex=u&&u.exercises[Number(UI.active[currentUnit()]||0)];if(!ex)return;const sec=f.closest('.v24-exercises'),p=sec&&sec.querySelector('[data-v24-progress]'),bar=sec&&sec.querySelector('.v24-progress i'),btn=sec&&sec.querySelector('[data-v24-submit]');const t=flattenSlots(ex).length,d=answered(ex);if(p)p.textContent=d+'/'+t+' mục đã trả lời';if(bar)bar.style.width=(t?Math.round(d*100/t):0)+'%';if(btn)btn.disabled=!allAnswered(ex)});
})();
