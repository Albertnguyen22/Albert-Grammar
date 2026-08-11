(function(){
window.V25_EXERCISE_IMAGES=window.V25_EXERCISE_IMAGES||{};
const pending=window.V26_IMAGE_PENDING=window.V26_IMAGE_PENDING||{};
function loadScript(src){
  if(pending[src]) return pending[src];
  pending[src]=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src; s.async=true;
    s.onload=()=>resolve();
    s.onerror=()=>reject(new Error('Khong tai duoc '+src));
    document.head.appendChild(s);
  });
  return pending[src];
}
window.V26_loadExerciseImage=async function(key){
  if(window.V25_EXERCISE_IMAGES[key]) return window.V25_EXERCISE_IMAGES[key];
  const chunk=window.V26_IMAGE_CHUNK_MANIFEST&&window.V26_IMAGE_CHUNK_MANIFEST[key];
  if(!chunk) throw new Error('Khong tim thay chunk cho '+key);
  await loadScript(chunk);
  if(!window.V25_EXERCISE_IMAGES[key]) throw new Error('Chunk khong chua '+key);
  return window.V25_EXERCISE_IMAGES[key];
};
window.V26_applyExerciseImages=async function(root){
  root=root||document;
  const imgs=[...root.querySelectorAll('img[data-v26-image-key]')];
  await Promise.all(imgs.map(async img=>{
    const key=img.dataset.v26ImageKey;
    const card=img.closest('.v24-source-card');
    const fallback=card&&card.querySelector('.v25-image-fallback');
    try{
      const src=await window.V26_loadExerciseImage(key);
      img.src=src; img.dataset.v24Zoom=src; img.style.display='';
      const btn=card&&card.querySelector('.v25-open-source');
      if(btn) btn.dataset.v24Zoom=src;
      if(fallback) fallback.classList.remove('show');
    }catch(err){
      img.style.display='none';
      if(fallback){fallback.classList.add('show');fallback.innerHTML='Không tải được khung đề. Hãy kiểm tra các tệp <b>exercise-images-*.js</b> đã được upload đầy đủ.';}
      console.error(err);
    }
  }));
};
})();
