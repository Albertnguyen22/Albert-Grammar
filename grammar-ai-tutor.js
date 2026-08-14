(function(){
  'use strict';

  const CONFIG={
    supabaseUrl:'https://pdsxreonrlrfcotszblj.supabase.co',
    supabaseKey:'sb_publishable_HifldsDyYLTfaAVPhOVrAA_oCdXFAxw',
    functionName:'albert-grammar-tutor',
    authStorageKey:'sb-pdsxreonrlrfcotszblj-auth-token',
    stateKey:'albert_grammar_ai_tutor_v2',
    maxThreads:24,
    maxMessages:36
  };

  const DEFAULT_THREAD=()=>({
    id:'ag-ai-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),
    title:'Cuộc trò chuyện mới',
    updatedAt:Date.now(),
    messages:[]
  });

  const AI={
    mode:'local',
    threads:[],
    activeId:'',
    user:null,
    client:null,
    authReady:false,
    sending:false,
    knowledge:null
  };

  function esc(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
  }
  function stripHtml(value){
    const tmp=document.createElement('div');
    tmp.innerHTML=String(value||'');
    return (tmp.textContent||tmp.innerText||'').replace(/\s+/g,' ').trim();
  }
  function norm(value){
    return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d')
      .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  }
  function words(value){
    const stop=new Set(['la','cua','va','cho','voi','mot','nhung','the','nay','do','khi','nao','gi','tai','sao','nhu','trong','ve','em','toi','minh','ban','hay','phan','biet','so','sanh','giai','thich','khac','nhau','giua','cau','truc','vi','du','please','the','and','for','with','what','how','why','explain','compare','dung','su','noi','them']);
    return [...new Set(norm(value).split(' ').filter(token=>token.length>1&&!stop.has(token)))];
  }
  function asArray(value){return Array.isArray(value)?value:(value==null?[]:[value]);}
  function plainValue(value){
    if(Array.isArray(value))return value.map(plainValue).filter(Boolean).join(' ');
    if(value&&typeof value==='object')return [value.title,value.desc,value.formula,value.explanation,value.note].map(plainValue).filter(Boolean).join(' ');
    return String(value??'');
  }
  function cleanText(value,max=1800){
    const full=stripHtml(plainValue(value));
    if(full.length<=max)return full;
    const cut=full.slice(0,max);
    const sentence=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('? '),cut.lastIndexOf('! '),cut.lastIndexOf('; '));
    const boundary=sentence>max*.55?sentence+1:cut.lastIndexOf(' ');
    return cut.slice(0,boundary>0?boundary:max).trim()+'…';
  }
  function readState(){
    try{
      const raw=JSON.parse(localStorage.getItem(CONFIG.stateKey)||'null');
      if(raw&&Array.isArray(raw.threads)){
        AI.mode=raw.mode==='external'?'external':'local';
        AI.threads=raw.threads.slice(0,CONFIG.maxThreads);
        AI.activeId=raw.activeId||AI.threads[0]?.id||'';
      }
    }catch(_err){}
    if(!AI.threads.length){const t=DEFAULT_THREAD();AI.threads=[t];AI.activeId=t.id;}
  }
  function saveState(){
    try{
      const trimmed=AI.threads.sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,CONFIG.maxThreads).map(t=>({
        ...t,
        messages:asArray(t.messages).slice(-CONFIG.maxMessages)
      }));
      localStorage.setItem(CONFIG.stateKey,JSON.stringify({mode:AI.mode,activeId:AI.activeId,threads:trimmed}));
    }catch(_err){}
  }
  function activeThread(){
    let thread=AI.threads.find(t=>t.id===AI.activeId);
    if(!thread){thread=DEFAULT_THREAD();AI.threads.unshift(thread);AI.activeId=thread.id;}
    return thread;
  }
  function titleFromQuestion(question){
    const text=String(question||'').trim().replace(/\s+/g,' ');
    return text.length>42?text.slice(0,42)+'…':text||'Cuộc trò chuyện mới';
  }
  function newThread(){
    const t=DEFAULT_THREAD();AI.threads.unshift(t);AI.activeId=t.id;saveState();renderAI();
  }
  function deleteThread(id){
    AI.threads=AI.threads.filter(t=>t.id!==id);
    if(!AI.threads.length)AI.threads=[DEFAULT_THREAD()];
    if(!AI.threads.some(t=>t.id===AI.activeId))AI.activeId=AI.threads[0].id;
    saveState();renderAI();
  }
  function clearThreads(){
    if(!confirm('Xóa toàn bộ lịch sử AI Tutor?'))return;
    AI.threads=[DEFAULT_THREAD()];AI.activeId=AI.threads[0].id;saveState();renderAI();
  }

  function currentUnitGuide(){
    try{
      const uid=(typeof state!=='undefined'&&state&&state.unit)||'';
      if(uid&&typeof V12_GUIDES!=='undefined'&&V12_GUIDES[uid])return {uid,guide:V12_GUIDES[uid]};
    }catch(_err){}
    return null;
  }

  function buildKnowledge(){
    if(AI.knowledge)return AI.knowledge;
    const rows=[];
    try{
      if(typeof TOPICS!=='undefined'){
        TOPICS.forEach(topic=>asArray(topic.subtopics).forEach(sub=>{
          const g=sub.guide||{};
          const uses=asArray(g.whenUse||sub.uses||sub.use).map(x=>typeof x==='string'?x:(x?.title||x?.desc||''));
          const structures=asArray(g.structures).map(item=>({
            title:item.title||'Cấu trúc',
            formula:asArray(item.rows).map(r=>r.join(' | ')).join('\n')||item.formula||'',
            note:item.note||''
          }));
          const examples=asArray(sub.examples).map(x=>({en:x.en||x[0]||'',vi:x.vi||x[1]||'',why:x.note||''}));
          rows.push({
            id:'topic-'+topic.id+'-'+sub.id,
            kind:'topic',
            title:sub.title,
            parent:topic.title,
            summary:g.intro||sub.summary||sub.kidGuide?.why||topic.overview||'',
            uses,
            structures,
            examples,
            traps:asArray(sub.traps||sub.trap),
            signals:asArray(sub.markers),
            source:sub.sources||sub.refs||topic.sources||'Chuyên đề trong app',
            raw:[topic.title,topic.english,sub.title,g.intro,sub.summary,uses.join(' '),structures.map(x=>x.formula).join(' '),examples.map(x=>x.en+' '+x.vi).join(' '),asArray(sub.traps||sub.trap).join(' ')].join(' ')
          });
        }));
      }
    }catch(_err){}
    try{
      if(typeof V12_GUIDES!=='undefined'){
        Object.entries(V12_GUIDES).forEach(([uid,g])=>{
          const uses=asArray(g.uses).map(x=>({title:x?.title||'',desc:x?.desc||'',examples:asArray(x?.examples)}));
          const structures=asArray(g.rules).map(x=>({title:x?.title||'Quy tắc',formula:x?.formula||'',note:x?.explanation||'',examples:asArray(x?.examples)}));
          const examples=[];
          uses.forEach(u=>u.examples.forEach(x=>examples.push({en:x?.[0]||'',vi:x?.[1]||'',why:u.title||''})));
          structures.forEach(r=>r.examples.forEach(x=>examples.push({en:x?.[0]||'',vi:x?.[1]||'',why:r.title||''})));
          rows.push({
            id:uid,
            uid,
            kind:'unit',
            title:g.titleVi||g.sourceTitle||uid,
            parent:g.bookTitle||'Grammar in Use',
            summary:g.summary||'',
            uses:uses.map(x=>x.title+(x.desc?': '+x.desc:'')),
            structures,
            examples:examples.slice(0,12),
            traps:asArray(g.traps),
            signals:asArray(g.signals).flatMap(x=>asArray(x?.items)),
            notes:asArray(g.notes),
            source:`${g.bookTitle||'Grammar in Use'} · Unit ${g.unit||''}${g.sourceTitle?' · '+g.sourceTitle:''}`,
            raw:[g.titleVi,g.sourceTitle,g.bookTitle,g.summary,uses.map(x=>x.title+' '+x.desc).join(' '),structures.map(x=>x.title+' '+x.formula+' '+x.note).join(' '),examples.map(x=>x.en+' '+x.vi).join(' '),asArray(g.traps).join(' '),asArray(g.notes).join(' ')].join(' ')
          });
        });
      }
    }catch(_err){}
    AI.knowledge=rows.map(row=>({...row,norm:norm(row.raw+' '+row.title+' '+row.parent),tokens:words(row.raw+' '+row.title+' '+row.parent)}));
    return AI.knowledge;
  }

  const ALIASES={
    'hien tai don':['present simple','simple present'],
    'hien tai tiep dien':['present continuous','present progressive'],
    'hien tai hoan thanh tiep dien':['present perfect continuous','present perfect progressive'],
    'hien tai hoan thanh':['present perfect'],
    'qua khu hoan thanh tiep dien':['past perfect continuous','past perfect progressive'],
    'qua khu hoan thanh':['past perfect'],
    'qua khu tiep dien':['past continuous','past progressive'],
    'qua khu don':['past simple','simple past'],
    'qua khu tiep dien':['past continuous'],
    'qua khu hoan thanh':['past perfect'],
    'tuong lai hoan thanh tiep dien':['future perfect continuous'],
    'tuong lai hoan thanh':['future perfect'],
    'tuong lai tiep dien':['future continuous'],
    'tuong lai':['future','will','going to'],
    'cau bi dong':['passive'],
    'cau dieu kien loai 0':['zero conditional','general truth if'],
    'cau dieu kien loai 1':['first conditional','if we go','if you see'],
    'cau dieu kien loai 2':['second conditional','if i had','if we went'],
    'cau dieu kien loai 3':['third conditional','if i had known','would have'],
    'cau dieu kien':['conditional','if clause'],
    'menh de quan he':['relative clause','who which that'],
    'cau tuong thuat':['reported speech','indirect speech'],
    'dong tu khuyet thieu':['modal verb','can could may might must should'],
    'danh dong tu':['gerund','v ing'],
    'dong tu nguyen mau':['infinitive','to infinitive'],
    'mao tu':['article','a an the'],
    'gioi tu':['preposition'],
    'dao ngu':['inversion']
  };
  function expandQuery(question){
    let q=norm(question);
    Object.entries(ALIASES).forEach(([key,values])=>{if(q.includes(key))q+=' '+values.join(' ')});
    return q;
  }
  function bestAliasIn(text){
    const q=norm(text);
    const candidates=[];
    Object.entries(ALIASES).forEach(([key,values])=>{
      [key,...values.map(norm)].forEach(alias=>{if(alias&&q.includes(alias))candidates.push({key,alias});});
    });
    candidates.sort((a,b)=>b.alias.length-a.alias.length);
    return candidates[0]?.key||'';
  }
  function topicRowForAlias(key){
    if(!key)return null;
    const index=buildKnowledge();
    return index.find(row=>row.kind==='topic'&&norm(row.title)===key)
      ||index.find(row=>row.kind==='topic'&&norm(row.title).includes(key))
      ||index.find(row=>norm(row.title)===key)
      ||null;
  }
  function comparisonRows(question){
    let q=norm(question)
      .replace(/^.*?phan biet\s+/,'')
      .replace(/^.*?so sanh\s+/,'')
      .replace(/^.*?khac nhau giua\s+/,'');
    const parts=q.split(/\s+(?:va|voi|versus|vs)\s+/).map(x=>x.trim()).filter(Boolean);
    if(parts.length<2)return [];
    const rows=[];
    for(const part of parts.slice(0,3)){
      const row=topicRowForAlias(bestAliasIn(part));
      if(row&&!rows.some(x=>x.id===row.id))rows.push(row);
    }
    return rows;
  }
  function retrieve(question,limit=6){
    const index=buildKnowledge();
    const baseQ=norm(question),q=expandQuery(question),qt=words(q),current=currentUnitGuide()?.uid||'';
    return index.map(row=>{
      let score=0;
      const titleNorm=norm(row.title),parentNorm=norm(row.parent);
      if(q&&row.norm.includes(q))score+=60;
      if(titleNorm.length>3&&baseQ.includes(titleNorm))score+=90;
      qt.forEach(token=>{
        if(titleNorm.includes(token))score+=9;
        else if(parentNorm.includes(token))score+=5;
        else if(row.norm.includes(token))score+=2;
      });
      if(qt.length>=2&&qt.every(token=>row.norm.includes(token)))score+=28;
      if(qt.length>=2&&qt.every(token=>titleNorm.includes(token)))score+=105;
      if(/bai nay|unit nay|phan nay|unit dang mo|bai dang mo|cau nay/.test(q)&&row.uid===current)score+=80;
      if(row.uid===current)score+=2;
      return {...row,score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
  }

  function uniqueText(list,max){
    const seen=new Set(),out=[];
    asArray(list).forEach(value=>{
      const text=cleanText(typeof value==='string'?value:(value?.title||value?.desc||''),700);
      const key=norm(text);
      if(text&&key&&!seen.has(key)&&out.length<max){seen.add(key);out.push(text);}
    });
    return out;
  }
  function normalizeStructured(value){
    if(!value||typeof value!=='object')return null;
    const structures=asArray(value.structures).map(x=>({
      label:cleanText(x?.label||x?.title||'Cấu trúc',120),
      formula:cleanText(x?.formula||x?.structure||'',600),
      note:cleanText(x?.note||x?.explanation||'',600)
    })).filter(x=>x.formula||x.note).slice(0,6);
    const examples=asArray(value.examples).map(x=>({
      en:cleanText(x?.en||x?.english||'',500),
      vi:cleanText(x?.vi||x?.vietnamese||'',500),
      why:cleanText(x?.why||x?.note||'',500)
    })).filter(x=>x.en||x.vi).slice(0,6);
    const sources=asArray(value.sources).map(x=>typeof x==='string'?cleanText(x,300):cleanText([x?.book,x?.unit,x?.topic].filter(Boolean).join(' · '),300)).filter(Boolean).slice(0,8);
    return {
      title:cleanText(value.title||'Giải đáp ngữ pháp',180),
      direct_answer:cleanText(value.direct_answer||value.answer||value.summary||'',1600),
      explanation:uniqueText(value.explanation||value.points||[],8),
      structures,
      examples,
      exam_traps:uniqueText(value.exam_traps||value.traps||[],6),
      sources,
      follow_up:cleanText(value.follow_up||'',500),
      complete:value.complete!==false
    };
  }
  function plainToStructured(text){
    const clean=String(text||'').replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
    try{
      const first=clean.indexOf('{'),last=clean.lastIndexOf('}');
      if(first>=0&&last>first){const parsed=JSON.parse(clean.slice(first,last+1));const normalized=normalizeStructured(parsed);if(normalized)return normalized;}
    }catch(_err){}
    const lines=clean.split(/\n+/).map(x=>x.replace(/^[-*#\d.)\s]+/,'').trim()).filter(Boolean);
    return normalizeStructured({
      title:'Giải đáp ngữ pháp',
      direct_answer:lines.slice(0,2).join(' '),
      explanation:lines.slice(2,10),
      structures:[],examples:[],exam_traps:[],sources:[],complete:true
    });
  }

  function localAnswer(question){
    let hits=retrieve(question,7);
    const current=currentUnitGuide();
    if(!hits.length&&current){
      const row=buildKnowledge().find(x=>x.uid===current.uid);
      if(row)hits=[row];
    }
    if(!hits.length){
      return normalizeStructured({
        title:'Chưa xác định được chủ điểm',
        direct_answer:'Local Knowledge chưa tìm thấy chủ điểm đủ gần với câu hỏi này. Hãy ghi rõ tên thì, cấu trúc hoặc Unit cần hỏi.',
        explanation:['Ví dụ: “Phân biệt present perfect và past simple”.','Ví dụ: “Giải thích Unit 11 của English Grammar in Use”.'],
        follow_up:'Hãy bổ sung một câu ví dụ hoặc tên Unit.'
      });
    }
    const compareRequested=/phan biet|khac nhau|so sanh|versus|\bvs\b/.test(norm(question));
    const exactComparison=compareRequested?comparisonRows(question):[];
    const compare=exactComparison.length>=2;
    const selected=[];
    for(const hit of (compare?exactComparison:hits)){
      if(!selected.some(x=>norm(x.title)===norm(hit.title)))selected.push(hit);
      if(selected.length>=(compare?2:1))break;
    }
    const primary=selected[0];
    const explanation=[];
    if(compare&&selected[1]){
      explanation.push(`${primary.title}: ${cleanText(primary.summary,600)}`);
      explanation.push(`${selected[1].title}: ${cleanText(selected[1].summary,600)}`);
      explanation.push('Điểm quyết định là ý nghĩa và góc nhìn của cả câu; không chọn chỉ dựa vào một từ khóa.');
    }else{
      explanation.push(...uniqueText(primary.uses,6));
      if(!explanation.length&&primary.summary)explanation.push(primary.summary);
      explanation.push(...uniqueText(primary.notes,2));
    }
    const structures=[];
    selected.forEach(row=>asArray(row.structures).slice(0,4).forEach(s=>structures.push({
      label:(compare?row.title+' · ':'')+(s.title||s.label||'Cấu trúc'),
      formula:s.formula||'',
      note:s.note||''
    })));
    const examples=[];
    selected.forEach(row=>asArray(row.examples).slice(0,3).forEach(x=>examples.push(x)));
    const traps=[];
    selected.forEach(row=>traps.push(...uniqueText(row.traps,3)));
    const sources=hits.slice(0,5).map(x=>x.source);
    const queryNorm=norm(question);
    const conditionalType=queryNorm.match(/cau dieu kien loai ([0-3])/);
    const displayTitle=compare&&selected[1]
      ?`Phân biệt ${primary.title} và ${selected[1].title}`
      :conditionalType?`Câu điều kiện loại ${conditionalType[1]}`:primary.title;
    const firstUse=uniqueText(primary.uses,1)[0]||'';
    let directAnswer=compare&&selected[1]
      ?`${primary.title}: ${cleanText(primary.summary,520)} ${selected[1].title}: ${cleanText(selected[1].summary,520)} Vì vậy, hãy xác định mốc thời gian và điều người nói muốn nhấn mạnh trước khi chọn dạng.`
      :cleanText(primary.summary,1200);
    if(!compare&&/cau truc|cong thuc/.test(queryNorm)&&structures[0]){
      directAnswer=`${firstUse?firstUse+'. ':''}Cấu trúc trọng tâm: ${cleanText(structures[0].formula,700)}${structures[0].note?' — '+cleanText(structures[0].note,500):''}`;
    }else if(!compare&&/khi nao dung|cach dung/.test(queryNorm)&&firstUse){
      directAnswer=`${directAnswer}${directAnswer?' ':''}${firstUse}.`;
    }
    return normalizeStructured({
      title:displayTitle,
      direct_answer:directAnswer,
      explanation,
      structures,
      examples,
      exam_traps:traps,
      sources,
      follow_up:'Bạn có thể gửi một câu cụ thể để Tutor phân tích từng thành phần.'
    });
  }

  function contextForExternal(question){
    return retrieve(question,6).map((row,index)=>({
      rank:index+1,
      source:row.source,
      title:row.title,
      summary:cleanText(row.summary,900),
      uses:uniqueText(row.uses,5),
      structures:asArray(row.structures).slice(0,4).map(s=>({title:s.title||s.label,formula:cleanText(s.formula,500),note:cleanText(s.note,400)})),
      examples:asArray(row.examples).slice(0,4),
      traps:uniqueText(row.traps,4)
    }));
  }

  function answerHtml(answer,meta){
    const a=normalizeStructured(answer)||plainToStructured(String(answer||''));
    const sections=[];
    if(a.direct_answer)sections.push(`<section class="ag-ai-direct"><b>Trả lời ngắn gọn</b><p>${esc(a.direct_answer)}</p></section>`);
    if(a.explanation.length)sections.push(`<section class="ag-ai-answer-section"><h4>Giải thích</h4><ol>${a.explanation.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>`);
    if(a.structures.length)sections.push(`<section class="ag-ai-answer-section"><h4>Cấu trúc cần nhớ</h4><div class="ag-ai-structure-grid">${a.structures.map(x=>`<article><b>${esc(x.label)}</b>${x.formula?`<code>${esc(x.formula)}</code>`:''}${x.note?`<p>${esc(x.note)}</p>`:''}</article>`).join('')}</div></section>`);
    if(a.examples.length)sections.push(`<section class="ag-ai-answer-section"><h4>Ví dụ Anh - Việt</h4><div class="ag-ai-example-grid">${a.examples.map(x=>`<article><b>${esc(x.en)}</b>${x.vi?`<span>${esc(x.vi)}</span>`:''}${x.why?`<small>${esc(x.why)}</small>`:''}</article>`).join('')}</div></section>`);
    if(a.exam_traps.length)sections.push(`<section class="ag-ai-traps"><h4>Exam Trap</h4><ul>${a.exam_traps.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`);
    if(a.sources.length)sections.push(`<details class="ag-ai-sources"><summary>Nguồn kiến thức đã dùng</summary><ul>${a.sources.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`);
    if(a.follow_up)sections.push(`<p class="ag-ai-follow">${esc(a.follow_up)}</p>`);
    const badge=meta?.mode==='external'?'External AI · model tự động từ Supabase':'Local Knowledge · dữ liệu trong sách';
    return `<div class="ag-ai-answer"><div class="ag-ai-answer-head"><span>${esc(badge)}</span><b>${esc(a.title)}</b></div>${sections.join('')}</div>`;
  }

  function messageHtml(message){
    if(message.role==='user')return `<div class="ag-ai-message user"><div>${esc(message.text||'')}</div></div>`;
    if(message.pending)return `<div class="ag-ai-message assistant"><div class="ag-ai-thinking"><i></i><i></i><i></i><span>Đang soạn câu trả lời đầy đủ…</span></div></div>`;
    if(message.error)return `<div class="ag-ai-message assistant"><div class="ag-ai-error"><b>AI Tutor chưa trả lời được</b><p>${esc(message.error)}</p></div></div>`;
    return `<div class="ag-ai-message assistant">${answerHtml(message.answer||message.text,message.meta||{})}</div>`;
  }

  function ensureStyle(){
    if(document.getElementById('ag-grammar-ai-tutor-style'))return;
    const style=document.createElement('style');style.id='ag-grammar-ai-tutor-style';style.textContent=`
      #view-ai .content{padding:20px}.ag-ai-shell{display:grid;grid-template-columns:260px minmax(0,1fr);gap:16px;min-height:720px}.ag-ai-history{border:1px solid var(--line);border-radius:24px;background:#fff;padding:13px;display:flex;flex-direction:column;min-height:720px}.ag-ai-history-head{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:4px 3px 12px;border-bottom:1px solid var(--line)}.ag-ai-history-head b{font:900 18px Nunito}.ag-ai-history-head button,.ag-ai-clear{border:1px solid var(--line);background:#fff;border-radius:11px;padding:7px 9px;font-weight:900;color:#24527f}.ag-ai-history-list{display:grid;gap:7px;padding:10px 0;overflow:auto;max-height:600px}.ag-ai-history-item{position:relative;border:1px solid transparent;border-radius:14px;background:#f8fbff;padding:10px 34px 10px 11px;text-align:left;color:#17324d}.ag-ai-history-item.active{border-color:#8fc2ff;background:#eaf5ff}.ag-ai-history-item b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ag-ai-history-item small{display:block;color:#718397;margin-top:3px}.ag-ai-history-delete{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:25px;height:25px;border:0;background:transparent;border-radius:8px;color:#9a4a4a}.ag-ai-clear{margin-top:auto}.ag-ai-main{border:1px solid var(--line);border-radius:26px;background:#fff;overflow:hidden;display:flex;flex-direction:column;min-width:0}.ag-ai-top{padding:18px 20px 13px;background:linear-gradient(135deg,#eef7ff,#fff8dc);border-bottom:1px solid var(--line)}.ag-ai-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.ag-ai-title-row h2{font:900 27px Nunito;margin:0}.ag-ai-title-row p{margin:4px 0 0;color:#63758a}.ag-ai-auto{border:1px solid #b9ddcb;background:#effbf5;color:#176749;border-radius:999px;padding:7px 10px;font-weight:900;font-size:12px;white-space:nowrap}.ag-ai-modes{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.ag-ai-mode{border:1px solid #cfe1f3;background:#fff;border-radius:999px;padding:9px 13px;font-weight:900;color:#315b84}.ag-ai-mode.active{background:#2f72ff;border-color:#2f72ff;color:#fff}.ag-ai-auth{margin:13px 20px 0;border:1px solid #d5e5f4;border-radius:17px;background:#f8fcff;padding:12px}.ag-ai-auth.hidden{display:none!important}.ag-ai-auth-status{display:flex;justify-content:space-between;gap:10px;align-items:center}.ag-ai-auth-status b{color:#17324d}.ag-ai-auth-status span{color:#60758a;font-size:13px}.ag-ai-auth-fields{display:grid;grid-template-columns:1fr 1fr auto auto;gap:8px;margin-top:10px}.ag-ai-auth input{border:1px solid #c8daec;border-radius:12px;padding:10px;background:#fff;min-width:0}.ag-ai-auth button{border:1px solid #b9d3ec;border-radius:12px;background:#fff;padding:9px 11px;font-weight:900}.ag-ai-auth button.primary{background:#2f72ff;color:#fff;border-color:#2f72ff}.ag-ai-chat{flex:1;min-height:420px;max-height:610px;overflow:auto;padding:18px;background:#f8fbff}.ag-ai-message{margin:11px 0;display:flex}.ag-ai-message.user{justify-content:flex-end}.ag-ai-message.user>div{max-width:78%;background:#dff0ff;border:1px solid #bad9fa;border-radius:18px 18px 5px 18px;padding:11px 14px;white-space:pre-wrap}.ag-ai-message.assistant{justify-content:flex-start}.ag-ai-message.assistant>div{width:min(920px,96%)}.ag-ai-answer{border:1px solid #d5e5f4;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 20px rgba(44,101,172,.06)}.ag-ai-answer-head{padding:13px 15px;background:linear-gradient(135deg,#edf6ff,#fff9e8);border-bottom:1px solid #dce8f4}.ag-ai-answer-head span{display:block;color:#2f72ff;font-size:12px;font-weight:900}.ag-ai-answer-head b{display:block;font:900 20px Nunito;margin-top:3px}.ag-ai-direct{padding:14px 15px;background:#f0f8ff;border-bottom:1px solid #dce8f4}.ag-ai-direct b{color:#145dd9}.ag-ai-direct p{margin:5px 0 0;line-height:1.65}.ag-ai-answer-section{padding:14px 15px;border-bottom:1px solid #edf2f7}.ag-ai-answer-section h4,.ag-ai-traps h4{font:900 17px Nunito;margin:0 0 9px}.ag-ai-answer-section ol,.ag-ai-traps ul{margin:0;padding-left:22px}.ag-ai-answer-section li,.ag-ai-traps li{margin:6px 0;line-height:1.58}.ag-ai-structure-grid,.ag-ai-example-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ag-ai-structure-grid article,.ag-ai-example-grid article{border:1px solid #d8e7f6;border-radius:14px;background:#fbfdff;padding:11px}.ag-ai-structure-grid b,.ag-ai-example-grid b{display:block}.ag-ai-structure-grid code{display:block;white-space:pre-wrap;margin-top:7px;background:#edf5ff;border:1px solid #d0e3f7;border-radius:10px;padding:8px;color:#164f9d;font-family:Roboto,Arial,sans-serif;font-weight:800}.ag-ai-structure-grid p{margin:7px 0 0;color:#5b7085}.ag-ai-example-grid span,.ag-ai-example-grid small{display:block;margin-top:4px;color:#617488}.ag-ai-traps{padding:14px 15px;background:#fff7df;border-bottom:1px solid #ecd8a2}.ag-ai-sources{padding:12px 15px}.ag-ai-sources summary{cursor:pointer;font-weight:900;color:#315b84}.ag-ai-follow{margin:0;padding:11px 15px;background:#effbf5;color:#176749;font-weight:800}.ag-ai-thinking,.ag-ai-error{border:1px solid #d5e5f4;background:#fff;border-radius:17px;padding:13px 15px}.ag-ai-thinking{display:flex;align-items:center;gap:7px;color:#5e7488}.ag-ai-thinking i{width:8px;height:8px;border-radius:50%;background:#2f72ff;animation:agAiPulse 1s infinite alternate}.ag-ai-thinking i:nth-child(2){animation-delay:.2s}.ag-ai-thinking i:nth-child(3){animation-delay:.4s}.ag-ai-error{background:#fff3f3;border-color:#efbaba;color:#8f2d2d}.ag-ai-error p{margin:6px 0 0}@keyframes agAiPulse{to{opacity:.2;transform:translateY(-3px)}}.ag-ai-chips{display:flex;gap:7px;overflow:auto;padding:10px 18px;border-top:1px solid var(--line);background:#fff}.ag-ai-chip{white-space:nowrap;border:1px solid #d2e2f2;background:#f8fbff;border-radius:999px;padding:7px 10px;color:#315b84;font-weight:800}.ag-ai-composer{padding:12px 16px 16px;background:#fff;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px}.ag-ai-composer textarea{min-height:76px;max-height:180px;border-radius:16px}.ag-ai-composer button{border:0;border-radius:15px;background:#2f72ff;color:#fff;font-weight:900;padding:0 18px;min-width:92px}.ag-ai-composer button:disabled{opacity:.55}.ag-ai-hint{padding:28px;text-align:center;color:#718397}.ag-ai-context{font-size:12px;color:#657a8f;margin-top:7px}
      @media(max-width:980px){.ag-ai-shell{grid-template-columns:1fr}.ag-ai-history{min-height:0}.ag-ai-history-list{display:flex;max-height:150px;overflow:auto}.ag-ai-history-item{min-width:190px}.ag-ai-clear{margin-top:8px}.ag-ai-main{min-height:650px}.ag-ai-auth-fields{grid-template-columns:1fr 1fr}}
      @media(max-width:650px){#view-ai .content{padding:10px}.ag-ai-title-row{display:block}.ag-ai-auto{display:inline-flex;margin-top:8px}.ag-ai-auth-fields{grid-template-columns:1fr}.ag-ai-chat{padding:11px;max-height:none}.ag-ai-message.user>div{max-width:92%}.ag-ai-structure-grid,.ag-ai-example-grid{grid-template-columns:1fr}.ag-ai-composer{grid-template-columns:1fr}.ag-ai-composer button{min-height:45px}.ag-ai-title-row h2{font-size:24px}}
    `;document.head.appendChild(style);
  }

  function ensurePanel(){
    ensureStyle();
    const root=document.querySelector('#view-ai .content');
    if(!root)return null;
    if(!root.querySelector('.ag-ai-shell')){
      root.innerHTML=`<div class="ag-ai-shell"><aside class="ag-ai-history"><div class="ag-ai-history-head"><div><span class="eyebrow">History</span><b>Lịch sử hỏi đáp</b></div><button type="button" id="ag-ai-new">+ Mới</button></div><div id="ag-ai-history-list" class="ag-ai-history-list"></div><button type="button" class="ag-ai-clear" id="ag-ai-clear">Xóa toàn bộ lịch sử</button></aside><section class="ag-ai-main"><div class="ag-ai-top"><div class="ag-ai-title-row"><div><h2>AI Grammar Tutor</h2><p>Hai nguồn trả lời: kiến thức trong sách và AI ngoài qua Supabase.</p><div id="ag-ai-context" class="ag-ai-context"></div></div><span class="ag-ai-auto">Không cần chọn model</span></div><div class="ag-ai-modes"><button type="button" class="ag-ai-mode" data-ag-ai-mode="local">① Local Knowledge</button><button type="button" class="ag-ai-mode" data-ag-ai-mode="external">② External AI</button></div></div><div id="ag-ai-auth" class="ag-ai-auth hidden"><div class="ag-ai-auth-status"><div><b id="ag-ai-auth-title">Đăng nhập Supabase</b><span id="ag-ai-auth-note">External AI dùng tài khoản ALBERT và model do Supabase tự chọn.</span></div><button type="button" id="ag-ai-signout" class="hidden">Đăng xuất</button></div><div id="ag-ai-auth-fields" class="ag-ai-auth-fields"><input id="ag-ai-email" type="email" autocomplete="username" placeholder="Email"><input id="ag-ai-password" type="password" autocomplete="current-password" placeholder="Mật khẩu"><button type="button" class="primary" id="ag-ai-signin">Đăng nhập</button><button type="button" id="ag-ai-signup">Đăng ký</button></div></div><div id="ag-ai-chat" class="ag-ai-chat"></div><div class="ag-ai-chips"><button class="ag-ai-chip">Phân biệt present perfect và past simple</button><button class="ag-ai-chip">Giải thích câu bị động dễ hiểu</button><button class="ag-ai-chip">Khi nào dùng V-ing và to-infinitive?</button><button class="ag-ai-chip">Phân tích Unit đang mở</button></div><div class="ag-ai-composer"><textarea id="ag-ai-input" placeholder="Hỏi ngữ pháp bằng tiếng Việt. Enter để gửi, Shift+Enter để xuống dòng."></textarea><button type="button" id="grammar-ai-send">Gửi</button></div></section></div>`;
    }
    return root;
  }

  function renderHistory(){
    const list=document.getElementById('ag-ai-history-list');if(!list)return;
    list.innerHTML=AI.threads.sort((a,b)=>b.updatedAt-a.updatedAt).map(t=>`<button type="button" class="ag-ai-history-item ${t.id===AI.activeId?'active':''}" data-ag-ai-thread="${esc(t.id)}"><b>${esc(t.title)}</b><small>${new Date(t.updatedAt).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</small><span class="ag-ai-history-delete" data-ag-ai-delete="${esc(t.id)}">×</span></button>`).join('');
  }
  function renderChat(){
    const chat=document.getElementById('ag-ai-chat');if(!chat)return;
    const messages=activeThread().messages||[];
    chat.innerHTML=messages.length?messages.map(messageHtml).join(''):'<div class="ag-ai-hint"><b>Hãy đặt câu hỏi đầu tiên.</b><br>Local Knowledge bám dữ liệu ba sách trong app; External AI được bổ sung cùng ngữ cảnh đó.</div>';
    requestAnimationFrame(()=>{chat.scrollTop=chat.scrollHeight});
  }
  function updateModeUi(){
    document.querySelectorAll('[data-ag-ai-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.agAiMode===AI.mode));
    const auth=document.getElementById('ag-ai-auth');if(auth)auth.classList.toggle('hidden',AI.mode!=='external');
    const ctx=currentUnitGuide();const el=document.getElementById('ag-ai-context');if(el)el.textContent=ctx?`Ngữ cảnh hiện tại: ${ctx.guide.bookTitle} · Unit ${ctx.guide.unit} · ${ctx.guide.titleVi}`:'Ngữ cảnh hiện tại: toàn bộ 27 chuyên đề và 360 Unit trong app';
    updateAuthUi();
  }
  function updateAuthUi(){
    const title=document.getElementById('ag-ai-auth-title'),note=document.getElementById('ag-ai-auth-note'),fields=document.getElementById('ag-ai-auth-fields'),out=document.getElementById('ag-ai-signout');
    if(!title||!note||!fields||!out)return;
    if(AI.user){title.textContent=AI.user.email||'Đã đăng nhập';note.textContent='External AI sẵn sàng. Supabase tự chọn model đang bật và tự chuyển model khi cần.';fields.classList.add('hidden');out.classList.remove('hidden');}
    else{title.textContent=AI.authReady?'Chưa đăng nhập':'Đang kiểm tra phiên đăng nhập…';note.textContent='Local Knowledge vẫn dùng được. Đăng nhập để gọi External AI qua Supabase.';fields.classList.remove('hidden');out.classList.add('hidden');}
  }
  function renderAI(){
    ensurePanel();renderHistory();renderChat();updateModeUi();
    const sendButton=document.getElementById('grammar-ai-send');
    if(sendButton){sendButton.disabled=AI.sending;sendButton.textContent=AI.sending?'Đang trả lời…':'Gửi';}
  }

  async function loadSupabase(){
    if(window.supabase)return window.supabase;
    await new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-ag-supabase]');if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
      const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';script.async=true;script.dataset.agSupabase='1';script.onload=resolve;script.onerror=()=>{script.dataset.failed='1';script.remove();reject(new Error('Không tải được Supabase JS.'));};document.head.appendChild(script);
    });
    return window.supabase;
  }
  async function initAuth(){
    try{
      const lib=await loadSupabase();
      AI.client=lib.createClient(CONFIG.supabaseUrl.replace(/\/$/,''),CONFIG.supabaseKey,{auth:{storageKey:CONFIG.authStorageKey,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data}=await AI.client.auth.getSession();AI.user=data?.session?.user||null;AI.authReady=true;updateAuthUi();
      AI.client.auth.onAuthStateChange((_event,session)=>{AI.user=session?.user||null;AI.authReady=true;updateAuthUi();});
    }catch(error){AI.authReady=true;updateAuthUi();console.error('[Grammar AI]',error);}
  }
  async function signIn(){
    if(!AI.client)await initAuth();
    const email=document.getElementById('ag-ai-email')?.value.trim()||'',password=document.getElementById('ag-ai-password')?.value||'';
    if(!email||!password){alert('Hãy nhập email và mật khẩu.');return;}
    const {error}=await AI.client.auth.signInWithPassword({email,password});if(error)alert(error.message);else updateAuthUi();
  }
  async function signUp(){
    if(!AI.client)await initAuth();
    const email=document.getElementById('ag-ai-email')?.value.trim()||'',password=document.getElementById('ag-ai-password')?.value||'';
    if(!email||password.length<6){alert('Hãy nhập email và mật khẩu ít nhất 6 ký tự.');return;}
    const {error}=await AI.client.auth.signUp({email,password});if(error)alert(error.message);else alert('Đã gửi đăng ký. Nếu Supabase bật xác nhận email, hãy kiểm tra hộp thư.');
  }
  async function signOut(){if(AI.client)await AI.client.auth.signOut();AI.user=null;updateAuthUi();}

  async function externalAnswer(question,thread){
    if(!AI.client)await initAuth();
    const {data}=await AI.client.auth.getSession();const session=data?.session;
    if(!session)throw new Error('Bạn cần đăng nhập Supabase trước khi dùng External AI.');
    const context=contextForExternal(question);
    const history=asArray(thread.messages).filter(m=>!m.pending&&!m.error).slice(-12).map(m=>{
      if(m.role!=='assistant')return {role:'user',content:m.text||''};
      const a=m.answer||{};
      const concise=[a.direct_answer,...asArray(a.explanation).slice(0,4),...asArray(a.exam_traps).slice(0,2)].filter(Boolean).join('\n');
      return {role:'assistant',content:concise||m.text||''};
    }).filter(m=>m.content);
    const response=await fetch(`${CONFIG.supabaseUrl.replace(/\/$/,'')}/functions/v1/${CONFIG.functionName}`,{
      method:'POST',
      headers:{'Authorization':'Bearer '+session.access_token,'apikey':CONFIG.supabaseKey,'Content-Type':'application/json'},
      body:JSON.stringify({messages:history,question,local_context:context,max_tokens:5200,app:'grammar'})
    });
    const raw=await response.text();let payload=null;try{payload=JSON.parse(raw)}catch(_err){throw new Error('Edge Function trả về dữ liệu không hợp lệ: '+raw.slice(0,180));}
    if(!response.ok||payload?.ok===false)throw new Error(payload?.error||('HTTP '+response.status));
    const answer=normalizeStructured(payload.answer||payload.data)||plainToStructured(payload.answer||payload.text||'');
    if(!answer||(!answer.direct_answer&&!answer.explanation.length))throw new Error('AI trả về nội dung rỗng hoặc chưa hoàn chỉnh.');
    return {answer,meta:{mode:'external',provider:payload.provider||'',model:payload.model||'',repaired:!!payload.repaired}};
  }

  async function send(){
    if(AI.sending)return;
    const input=document.getElementById('ag-ai-input'),question=input?.value.trim()||'';if(!question)return;
    const thread=activeThread();if(!thread.messages.length)thread.title=titleFromQuestion(question);
    thread.messages.push({role:'user',text:question,at:Date.now()});
    const pending={role:'assistant',pending:true,at:Date.now()};thread.messages.push(pending);thread.updatedAt=Date.now();AI.sending=true;saveState();if(input)input.value='';renderAI();
    try{
      let result;
      if(AI.mode==='local')result={answer:localAnswer(question),meta:{mode:'local'}};
      else result=await externalAnswer(question,thread);
      Object.assign(pending,{pending:false,answer:result.answer,meta:result.meta});
    }catch(error){Object.assign(pending,{pending:false,error:error?.message||String(error)});}
    finally{AI.sending=false;thread.updatedAt=Date.now();thread.messages=thread.messages.slice(-CONFIG.maxMessages);saveState();renderAI();}
  }

  function setMode(mode){
    AI.mode=mode==='external'?'external':'local';saveState();renderAI();
    if(AI.mode==='external'&&!AI.client)initAuth();
  }
  function boot(){
    readState();ensurePanel();
    window.renderAI=renderAI;
    window.sendAI=send;
    renderAI();
    if(AI.mode==='external')initAuth();
  }

  document.addEventListener('click',event=>{
    const mode=event.target.closest('[data-ag-ai-mode]');if(mode){setMode(mode.dataset.agAiMode);return;}
    if(event.target.closest('#ag-ai-new')){newThread();return;}
    if(event.target.closest('#ag-ai-clear')){clearThreads();return;}
    const del=event.target.closest('[data-ag-ai-delete]');if(del){event.stopPropagation();deleteThread(del.dataset.agAiDelete);return;}
    const item=event.target.closest('[data-ag-ai-thread]');if(item){AI.activeId=item.dataset.agAiThread;saveState();renderAI();return;}
    if(event.target.closest('#grammar-ai-send')){send();return;}
    if(event.target.closest('#ag-ai-signin')){signIn();return;}
    if(event.target.closest('#ag-ai-signup')){signUp();return;}
    if(event.target.closest('#ag-ai-signout')){signOut();return;}
    const chip=event.target.closest('.ag-ai-chip');if(chip){const input=document.getElementById('ag-ai-input');if(input){input.value=chip.textContent.trim();input.focus();}return;}
  });
  document.addEventListener('keydown',event=>{if(event.target?.id==='ag-ai-input'&&event.key==='Enter'&&!event.shiftKey){event.preventDefault();send();}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
