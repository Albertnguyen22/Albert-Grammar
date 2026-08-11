
(function(){
const V7={section:'units'};
const V7_ONLINE_SOURCES={
  general:[['Cambridge Grammar Today','https://dictionary.cambridge.org/grammar/british-grammar/'],['British Council LearnEnglish Grammar','https://learnenglish.britishcouncil.org/grammar'],['Purdue OWL Grammar/Writing','https://owl.purdue.edu/owl/general_writing/index.html']],
  tenses:[['Cambridge: Present simple or continuous','https://dictionary.cambridge.org/grammar/british-grammar/present-simple-present-continuous'],['British Council: Present perfect','https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/present-perfect'],['British Council: Present perfect simple and continuous','https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/present-perfect-simple-continuous']],
  passive:[['Purdue OWL: Active versus passive voice','https://owl.purdue.edu/owl/general_writing/academic_writing/active_and_passive_voice/active_versus_passive_voice.html'],['Purdue OWL: Choosing passive voice','https://owl.purdue.edu/owl/general_writing/academic_writing/active_and_passive_voice/choosing_passive_voice.html']],
  relative:[['Cambridge: Relative clauses','https://dictionary.cambridge.org/grammar/british-grammar/relative-clauses_1'],['British Council: Relative pronouns and clauses','https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/relative-pronouns-relative-clauses']]
};
function v7Book(){return V7_SOURCE_BOOKS.find(b=>b.id===state.book)||V7_SOURCE_BOOKS[1]||V7_SOURCE_BOOKS[0]}
function v7Find(uid){for(const b of V7_SOURCE_BOOKS){let u=(b.units||[]).find(x=>x.uid===uid);if(u)return {...u,_kind:'unit'};u=(b.supplements||[]).find(x=>x.uid===uid);if(u)return {...u,bookId:b.id,bookTitle:b.title,_kind:'supplement'}}return null}
function v7Clean(s){return String(s||'').replace(/\n{3,}/g,'\n\n').trim()}
function v7IsTense(u){const t=(u.title+' '+(u.category||'')).toLowerCase();return /present|past|future|will|shall|going to|tense|perfect|continuous|simple|used to/.test(t)&&!/(question|passive|reported|relative|article|noun|pronoun|preposition|phrasal|adjective|adverb)/.test(t)}
function v7Type(u){const t=(u.title||'').toLowerCase();const c=(u.category||'').toLowerCase();
 if(/present continuous/.test(t))return 'present-continuous';
 if(/present simple/.test(t))return 'present-simple';
 if(/present perfect continuous/.test(t))return 'present-perfect-continuous';
 if(/present perfect/.test(t))return 'present-perfect';
 if(/past perfect continuous/.test(t))return 'past-perfect-continuous';
 if(/past perfect/.test(t))return 'past-perfect';
 if(/past continuous/.test(t))return 'past-continuous';
 if(/past simple/.test(t))return 'past-simple';
 if(/future continuous|will be doing/.test(t))return 'future-continuous';
 if(/future perfect|will have done|will be doing/.test(t))return 'future-perfect';
 if(/going to/.test(t))return 'going-to';
 if(/will|shall|future/.test(t))return 'future-will';
 if(/passive|is done|was done|being done|been done/.test(t)||c==='passive')return 'passive';
 if(/if|condition|wish|unless|provided/.test(t)||c==='conditionals')return 'conditionals';
 if(/reported|reporting|said|told/.test(t)||c==='reported-speech')return 'reported';
 if(/modal|can|could|may|might|must|should|ought|need/.test(t)||c==='modals')return 'modals';
 if(/relative|who|which|where|whose/.test(t)||c==='relative-clauses')return 'relative';
 if(/article|a\/an| the |zero article|names with and without/.test(' '+t)||c==='articles')return 'articles';
 if(/preposition| at\/on\/in| in\/at\/on/.test(t)||c==='prepositions')return 'prepositions';
 if(/verb\+|ing|infinitive|gerund/.test(t)||c==='gerunds-infinitives')return 'gerunds';
 if(/comparison|superlative|adjective|adverb|so and such|enough|too/.test(t)||c==='comparison')return 'adjadv';
 if(/question|auxiliary|tag/.test(t)||c==='tag-questions')return 'questions';
 if(/some|any|much|many|few|little|all|both|each|every|no\/none/.test(t)||c==='quantifiers')return 'quantifiers';
 if(/phrasal/.test(t)||c==='phrasal-verbs')return 'phrasal';
 return c||'general'}
function v7Rows(type){
 const rows={
 'present-simple':[
  ['Khẳng định','I / You / We / They + động từ nguyên mẫu<br>He / She / It + động từ thêm s/es','I play football every Sunday.<br>She plays football every Sunday.'],
  ['Phủ định','I / You / We / They + do not / don’t + động từ nguyên mẫu<br>He / She / It + does not / doesn’t + động từ nguyên mẫu','They don’t live near here.<br>He doesn’t live near here.'],
  ['Câu hỏi','Do + I / you / we / they + động từ nguyên mẫu?<br>Does + he / she / it + động từ nguyên mẫu?','Do you like English? — Yes, I do.<br>Does she like English? — No, she doesn’t.'],
  ['Wh-question','Wh-word + do/does + chủ ngữ + động từ nguyên mẫu?','Where do you live?<br>What does this word mean?']
 ],
 'present-continuous':[
  ['Khẳng định','I am + V-ing<br>He / She / It is + V-ing<br>You / We / They are + V-ing','I am studying now.<br>She is reading.<br>They are playing.'],
  ['Phủ định','Chủ ngữ + am / is / are + not + V-ing','He isn’t watching TV.<br>We aren’t waiting.'],
  ['Câu hỏi','Am / Is / Are + chủ ngữ + V-ing?','Are you listening?<br>Is it raining?'],
  ['Wh-question','Wh-word + am / is / are + chủ ngữ + V-ing?','What are you doing?<br>Where is she going?']
 ],
 'present-perfect':[
  ['Khẳng định','I / You / We / They have + past participle<br>He / She / It has + past participle','I have finished my homework.<br>She has lost her key.'],
  ['Phủ định','Chủ ngữ + have / has + not + past participle','They haven’t arrived yet.<br>He hasn’t seen it.'],
  ['Câu hỏi','Have / Has + chủ ngữ + past participle?','Have you ever been to London?<br>Has she finished?'],
  ['Wh-question','Wh-word + have / has + chủ ngữ + past participle?','How long have you lived here?']
 ],
 'present-perfect-continuous':[
  ['Khẳng định','I / You / We / They have been + V-ing<br>He / She / It has been + V-ing','I have been studying for two hours.<br>She has been working all day.'],
  ['Phủ định','Chủ ngữ + have / has + not + been + V-ing','He hasn’t been sleeping well.'],
  ['Câu hỏi','Have / Has + chủ ngữ + been + V-ing?','Have you been waiting long?'],
  ['Wh-question','How long + have / has + chủ ngữ + been + V-ing?','How long has it been raining?']
 ],
 'past-simple':[
  ['Khẳng định','Động từ thường: V-ed hoặc cột 2<br>Động từ be: was / were','I watched TV last night.<br>She went home.<br>They were tired.'],
  ['Phủ định','Chủ ngữ + did not / didn’t + động từ nguyên mẫu<br>was / were + not','I didn’t watch TV.<br>He wasn’t at home.'],
  ['Câu hỏi','Did + chủ ngữ + động từ nguyên mẫu?<br>Was / Were + chủ ngữ...?','Did you go out?<br>Were they late?'],
  ['Wh-question','Wh-word + did + chủ ngữ + động từ nguyên mẫu?','When did you arrive?']
 ],
 'past-continuous':[
  ['Khẳng định','I / He / She / It was + V-ing<br>You / We / They were + V-ing','I was doing homework at 8 p.m.<br>They were playing tennis.'],
  ['Phủ định','Chủ ngữ + was / were + not + V-ing','She wasn’t listening.'],
  ['Câu hỏi','Was / Were + chủ ngữ + V-ing?','Were you sleeping?'],
  ['Kết hợp với quá khứ đơn','Past continuous cho hành động đang diễn ra; past simple cho việc chen vào','I was walking home when it started to rain.']
 ],
 'past-perfect':[
  ['Khẳng định','Chủ ngữ + had + past participle','When I arrived, he had left.'],
  ['Phủ định','Chủ ngữ + had not / hadn’t + past participle','She hadn’t finished.'],
  ['Câu hỏi','Had + chủ ngữ + past participle?','Had you seen the film before?'],
  ['So sánh','Past perfect đứng trước một mốc quá khứ khác','I wasn’t hungry because I had already eaten.']
 ],
 'past-perfect-continuous':[
  ['Khẳng định','Chủ ngữ + had been + V-ing','They had been playing for an hour when it rained.'],
  ['Phủ định','Chủ ngữ + had not been + V-ing','He hadn’t been feeling well.'],
  ['Câu hỏi','Had + chủ ngữ + been + V-ing?','Had you been waiting long?'],
  ['Ý nghĩa','Nhấn mạnh quá trình kéo dài trước một thời điểm trong quá khứ','I was tired because I had been working all day.']
 ],
 'future-will':[
  ['Khẳng định','Chủ ngữ + will + động từ nguyên mẫu','I will help you.'],
  ['Phủ định','Chủ ngữ + will not / won’t + động từ nguyên mẫu','She won’t be late.'],
  ['Câu hỏi','Will + chủ ngữ + động từ nguyên mẫu?','Will you come tomorrow?'],
  ['Shall','Shall I / Shall we dùng khi đề nghị hoặc gợi ý','Shall we go out?']
 ],
 'going-to':[
  ['Khẳng định','Chủ ngữ + am / is / are going to + động từ nguyên mẫu','I am going to study tonight.'],
  ['Phủ định','Chủ ngữ + am / is / are not going to + động từ nguyên mẫu','He isn’t going to buy it.'],
  ['Câu hỏi','Am / Is / Are + chủ ngữ + going to + động từ nguyên mẫu?','Are you going to watch the match?'],
  ['Dự đoán có bằng chứng','Dùng khi nhìn thấy dấu hiệu hiện tại','Look at those clouds. It’s going to rain.']
 ],
 'future-continuous':[
  ['Khẳng định','Chủ ngữ + will be + V-ing','This time tomorrow, I will be flying to Japan.'],
  ['Phủ định','Chủ ngữ + will not be + V-ing','I won’t be working at 8 p.m.'],
  ['Câu hỏi','Will + chủ ngữ + be + V-ing?','Will you be using the car tonight?'],
  ['Ý nghĩa','Một hành động đang diễn ra tại một thời điểm trong tương lai','At 9 o’clock, she will be studying.']
 ],
 'future-perfect':[
  ['Khẳng định','Chủ ngữ + will have + past participle','By Friday, I will have finished the report.'],
  ['Phủ định','Chủ ngữ + will not have + past participle','They won’t have arrived by then.'],
  ['Câu hỏi','Will + chủ ngữ + have + past participle?','Will you have completed it by Monday?'],
  ['Hoàn thành trước mốc tương lai','Nhấn mạnh kết quả trước “by + thời điểm”','By 2030, he will have worked here for ten years.']
 ],
 'passive':[
  ['Câu chủ động','Người/vật thực hiện hành động đứng làm chủ ngữ','The teacher explains the lesson.'],
  ['Câu bị động','Người/vật nhận hành động được đưa lên làm chủ ngữ','The lesson is explained by the teacher.'],
  ['Cấu trúc chung','Chủ ngữ nhận hành động + be + past participle','The room is cleaned every day.'],
  ['Bị động với modal','Modal + be + past participle','The work must be finished today.']
 ],
 'reported':[
  ['Tường thuật câu nói','Đổi lời nói trực tiếp sang lời kể lại','She said, “I am tired.” → She said that she was tired.'],
  ['Say và tell','say + something; tell + somebody + something','He said that he was busy.<br>He told me that he was busy.'],
  ['Câu hỏi gián tiếp','Không đảo trợ động từ như câu hỏi trực tiếp','Where do you live? → He asked where I lived.'],
  ['Mệnh lệnh / yêu cầu','ask/tell + object + to V','“Open the door.” → She told me to open the door.']
 ],
 'relative':[
  ['Người','who / that làm chủ ngữ hoặc tân ngữ','The girl who sits next to me is Lan.'],
  ['Vật / con vật / ý tưởng','which / that','The book which I bought is useful.'],
  ['Sở hữu','whose + danh từ','The man whose car was stolen called the police.'],
  ['Nơi chốn / thời gian','where / when','This is the town where I was born.']
 ],
 'conditionals':[
  ['Điều kiện loại 0','If + present simple, present simple','If you heat water, it boils.'],
  ['Điều kiện loại 1','If + present simple, will + V','If it rains, we will stay home.'],
  ['Điều kiện loại 2','If + past simple, would + V','If I had more time, I would learn Chinese.'],
  ['Điều kiện loại 3','If + past perfect, would have + past participle','If I had known, I would have helped.']
 ],
 'modals':[
  ['Khả năng / năng lực','can, could, be able to','I can swim.'],
  ['Suy đoán','may, might, must, can’t','He must be tired.'],
  ['Nghĩa vụ / lời khuyên','must, have to, should, ought to','You should see a doctor.'],
  ['Modal perfect','modal + have + past participle','You should have told me.']
 ],
 'gerunds':[
  ['Sau một số động từ','verb + V-ing','I enjoy reading.'],
  ['Sau một số động từ khác','verb + to V','I want to go home.'],
  ['Sau giới từ','preposition + V-ing','She is good at singing.'],
  ['Sau tân ngữ','verb + object + to V','I want you to listen.']
 ],
 'articles':[
  ['a / an','Dùng với danh từ đếm được số ít, khi nói lần đầu hoặc chưa xác định','I saw a dog.'],
  ['the','Dùng khi người nghe biết rõ người/vật nào','The dog was black.'],
  ['zero article','Không dùng mạo từ với danh từ chung, bữa ăn, môn học, ngôn ngữ trong nhiều trường hợp','I like music.'],
  ['Tên riêng','Có tên dùng the, có tên không dùng the','the United States; Vietnam']
 ],
 'prepositions':[
  ['Thời gian','at + giờ; on + ngày; in + tháng/năm/buổi','at 7 o’clock; on Monday; in July'],
  ['Nơi chốn','in = trong khu vực; on = trên bề mặt; at = điểm cụ thể','in Vietnam; on the table; at the bus stop'],
  ['Đi sau tính từ/danh từ/động từ','afraid of, interested in, reason for, depend on','She is interested in music.'],
  ['Cụm cố định','Nhiều giới từ phải học theo cụm','listen to, wait for, good at']
 ],
 'adjadv':[
  ['Tính từ','Bổ nghĩa cho danh từ hoặc đứng sau linking verbs','a beautiful day; She looks tired.'],
  ['Trạng từ','Bổ nghĩa cho động từ, tính từ hoặc cả câu','He speaks slowly.'],
  ['So sánh hơn','short adjective + -er; more + long adjective','bigger; more interesting'],
  ['So sánh nhất','the + -est; the most + adjective','the biggest; the most useful']
 ],
 'questions':[
  ['Câu hỏi Yes/No','Đảo trợ động từ lên trước chủ ngữ','Do you like it?'],
  ['Câu hỏi Wh-','Wh-word + trợ động từ + chủ ngữ + động từ chính','Where do you live?'],
  ['Câu hỏi đuôi','Mệnh đề chính khẳng định → đuôi phủ định và ngược lại','You are tired, aren’t you?'],
  ['Trợ động từ thay thế','Dùng do/does/did/have/can… để tránh lặp','I like tea. So do I.']
 ],
 'quantifiers':[
  ['some / any','some thường trong câu khẳng định; any thường trong phủ định/câu hỏi','I have some money. I don’t have any money.'],
  ['many / much','many + danh từ đếm được số nhiều; much + không đếm được','many books; much water'],
  ['few / little','few + danh từ đếm được; little + không đếm được','few friends; little time'],
  ['all / both / each / every','Chỉ số lượng toàn bộ, cả hai, từng người/vật','Both boys are here. Every student has a book.']
 ],
 'phrasal':[
  ['Cụm động từ','Động từ + tiểu từ tạo nghĩa mới','give up = từ bỏ'],
  ['Có thể tách','Một số cụm cho tân ngữ đứng giữa','turn the light on / turn on the light'],
  ['Không tách','Một số cụm không tách được','look after children'],
  ['Học theo ngữ cảnh','Không dịch từng từ rời rạc','put off = hoãn, không phải “đặt ra ngoài”']
 ]};
 return rows[type]||[
  ['Mẫu câu chính','Nhìn ví dụ trong Unit và xác định phần được thay đổi','Từ đó rút ra khung câu để tự đặt câu mới.'],
  ['Dạng khẳng định / phủ định / câu hỏi','Kiểm tra trợ động từ, dạng động từ và trật tự từ','Sai thường nằm ở trợ động từ hoặc thứ tự từ.'],
  ['Từ đi kèm','Ghi nhớ cụm cố định hoặc giới từ đi kèm nếu có','depend on, interested in, afraid of...'],
  ['Ý nghĩa','Luôn dịch cả câu sang tiếng Việt trước khi chọn cấu trúc','Không chọn đáp án chỉ vì thấy một từ khóa.']
 ];
}
function v7Uses(type,u){const title=u.title||'';const d={
 'present-simple':['Diễn tả thói quen, lịch sinh hoạt hoặc việc lặp đi lặp lại.','Diễn tả sự thật hiển nhiên, quy luật tự nhiên hoặc điều đúng nói chung.','Dùng với lịch trình cố định: giờ tàu, giờ học, chương trình, thời khóa biểu.'],
 'present-continuous':['Diễn tả việc đang xảy ra ngay lúc nói.','Diễn tả tình huống tạm thời quanh hiện tại, không nhất thiết đúng mãi.','Diễn tả sự thay đổi đang diễn ra: getting better, increasing, becoming...','Dùng cho kế hoạch cá nhân đã sắp xếp trong tương lai gần.'],
 'present-perfect':['Diễn tả hành động trong quá khứ nhưng còn liên hệ với hiện tại.','Diễn tả trải nghiệm trong đời: ever, never, before.','Diễn tả việc vừa xảy ra hoặc đã/chưa xảy ra: just, already, yet.','Dùng với khoảng thời gian chưa kết thúc: today, this week, this year.'],
 'present-perfect-continuous':['Nhấn mạnh hành động bắt đầu trong quá khứ và vẫn tiếp tục hoặc vừa mới dừng.','Dùng để nói “đã làm bao lâu rồi”.','Nhấn mạnh quá trình hoặc dấu vết hiện tại: tired, wet, dirty, out of breath.'],
 'past-simple':['Diễn tả hành động đã kết thúc trong quá khứ.','Dùng khi có mốc thời gian đã xong: yesterday, last week, in 2010.','Kể chuỗi sự kiện lần lượt trong quá khứ.'],
 'past-continuous':['Diễn tả hành động đang diễn ra tại một thời điểm quá khứ.','Dùng làm nền cho một hành động khác chen vào.','Dùng với while/when để kể hai hành động trong quá khứ.'],
 'past-perfect':['Diễn tả hành động xảy ra trước một hành động hoặc mốc thời gian khác trong quá khứ.','Giúp người đọc hiểu thứ tự trước/sau trong câu chuyện quá khứ.'],
 'past-perfect-continuous':['Nhấn mạnh quá trình kéo dài trước một mốc quá khứ.','Thường giải thích lý do cho một trạng thái trong quá khứ: tired, wet, angry...'],
 'future-will':['Quyết định ngay lúc nói.','Dự đoán, lời hứa, lời đề nghị hoặc lời mời.','Shall I/Shall we dùng khi đề nghị giúp hoặc gợi ý cùng làm.'],
 'going-to':['Nói về dự định đã có trước lúc nói.','Dự đoán dựa trên dấu hiệu đang thấy ở hiện tại.'],
 'future-continuous':['Nói về hành động sẽ đang diễn ra tại một thời điểm trong tương lai.','Dùng để hỏi kế hoạch một cách lịch sự hoặc tự nhiên.'],
 'future-perfect':['Nói rằng một việc sẽ hoàn thành trước một mốc trong tương lai.','Thường đi với by, by the time, before.'],
 'passive':['Dùng khi muốn nhấn mạnh người/vật nhận hành động hơn là người làm.','Dùng khi không biết, không cần nói hoặc không muốn nêu người thực hiện hành động.','Trong văn học thuật, bị động giúp tập trung vào quy trình/kết quả.'],
 'reported':['Dùng để kể lại lời nói, câu hỏi, yêu cầu, lời khuyên của người khác.','Cần đổi đại từ, thời gian, nơi chốn và đôi khi lùi thì.','Trong câu hỏi gián tiếp, trật tự từ trở về dạng câu khẳng định.'],
 'relative':['Dùng để bổ sung thông tin cho danh từ đứng trước.','Mệnh đề xác định giúp biết chính xác người/vật nào.','Mệnh đề không xác định thêm thông tin phụ và thường có dấu phẩy.'],
 'conditionals':['Dùng để nói điều kiện và kết quả.','Loại điều kiện phụ thuộc vào khả năng xảy ra và thời gian: hiện tại, tương lai, giả định hoặc quá khứ trái thực tế.'],
 'modals':['Dùng để nói khả năng, xin phép, nghĩa vụ, lời khuyên, suy đoán.','Modal không thêm s/es và luôn đi với động từ nguyên mẫu không to.'],
 'gerunds':['Học động từ nào đi với V-ing, động từ nào đi với to V.','Sau giới từ luôn dùng V-ing.','Một số động từ đổi nghĩa khi đi với V-ing hoặc to V.'],
 'articles':['Dùng để cho biết danh từ đã xác định hay chưa xác định.','a/an thường dùng khi nói lần đầu; the khi cả người nói và người nghe đều biết rõ.'],
 'prepositions':['Dùng để nối danh từ/cụm danh từ với thời gian, nơi chốn, nguyên nhân hoặc quan hệ ý nghĩa.','Nhiều giới từ trong tiếng Anh là cụm cố định, cần học theo cụm.'],
 'adjadv':['Dùng để mô tả người/vật, hành động hoặc mức độ.','Chú ý vị trí tính từ, trạng từ và dạng so sánh.'],
 'questions':['Dùng để hỏi thông tin, xác nhận, hoặc nối câu tự nhiên bằng trợ động từ.','Sai thường ở trật tự trợ động từ và chủ ngữ.'],
 'quantifiers':['Dùng để nói số lượng nhiều/ít/toàn bộ/không có.','Cần phân biệt danh từ đếm được và không đếm được.'],
 'phrasal':['Dùng rất nhiều trong giao tiếp tự nhiên.','Nghĩa của phrasal verb thường không suy ra bằng cách dịch từng từ.']
};return d[type]||[`Unit này thuộc phần “${title}”. Em cần đọc ví dụ gốc, xác định chức năng của cấu trúc, rồi luyện bằng cách đặt câu mới theo mẫu.`,`Trước khi làm bài, hãy dịch ý cả câu sang tiếng Việt để biết câu cần diễn tả thời gian, số lượng, quan hệ hay hành động nào.`]}
function v7Signals(type){return ({
 'present-simple':['always','usually','often','sometimes','never','every day / week','on Mondays','facts / general truths'],
 'present-continuous':['now','right now','at the moment','Look!','Listen!','today / this week với nghĩa tạm thời','getting / becoming / increasing'],
 'present-perfect':['ever','never','just','already','yet','so far','recently','lately','for','since','today / this week chưa kết thúc'],
 'present-perfect-continuous':['for','since','how long','all morning / all day','recently','lately','dấu vết hiện tại: tired, wet, dirty'],
 'past-simple':['yesterday','last night / week / year','ago','in 2010','when I was...','finished time'],
 'past-continuous':['while','when','at 8 o’clock yesterday','this time last week','in the middle of an action'],
 'past-perfect':['before','after','by the time','already / just trong quá khứ','when + past simple'],
 'past-perfect-continuous':['for','since','before + past time','when + past simple','tired/wet/angry because...'],
 'future-will':['I think','probably','maybe','I promise','I’ll help','Shall I...?','Shall we...?'],
 'going-to':['I’ve decided','I’m going to','Look at...','evidence now','intention'],
 'future-continuous':['this time tomorrow','at 8 p.m. tomorrow','will be V-ing'],
 'future-perfect':['by Friday','by the time','before next year','will have done'],
 'passive':['by + agent','be + past participle','unknown agent','focus on result'],
 'reported':['said that','told me that','asked if/whether','asked wh-','told/asked + object + to V'],
 'relative':['who','which','that','whose','where','when','comma in non-defining clause'],
 'conditionals':['if','unless','as long as','provided that','wish','would','would have'],
 'modals':['can','could','may','might','must','have to','should','ought to','needn’t'],
 'gerunds':['enjoy + V-ing','want + to V','preposition + V-ing','object + to V'],
 'articles':['a/an','the','zero article','first mention / second mention'],
 'prepositions':['at/on/in','to/from/for/of/about','fixed phrases'],
 'adjadv':['-ly','more/most','-er/-est','as...as','too/enough'],
 'questions':['do/does/did','is/are/was/were','have/has','question tag'],
 'quantifiers':['some/any','much/many','few/little','all/both/every/each'],
 'phrasal':['up','out','off','on','away','back','object position']
 })[type]||['đọc ví dụ trong Unit','xem từ đi kèm','kiểm tra nghĩa cả câu']}
function v7Traps(type){return ({
 'present-simple':['Đừng thêm s/es sau trợ động từ does: “Does she likes?” sai; phải là “Does she like?”','Không dùng hiện tại đơn cho việc đang xảy ra ngay lúc nói.'],
 'present-continuous':['Không dùng continuous với nhiều stative verbs như know, believe, understand, want trong nghĩa thông thường.','Đừng quên động từ be: “She studying” sai; phải là “She is studying”.'],
 'present-perfect':['Không dùng present perfect với thời gian đã kết thúc: yesterday, last week, in 2010.','Been to = đã đi và về; gone to = đã đi và hiện chưa về.'],
 'present-perfect-continuous':['Không dùng với stative verbs: “I have been knowing” sai; dùng “I have known”.','Dùng simple khi nhấn mạnh kết quả hoàn thành, continuous khi nhấn mạnh quá trình.'],
 'past-simple':['Sau did/didn’t, động từ chính về nguyên mẫu: “Did you went?” sai.','was/were không dùng did trong câu hỏi/phủ định.'],
 'past-continuous':['Không dùng past continuous cho chuỗi hành động ngắn hoàn tất lần lượt.','Hành động chen vào thường dùng past simple, không phải past continuous.'],
 'past-perfect':['Không lạm dụng past perfect khi thứ tự đã rõ và chỉ kể theo trình tự thời gian.','Past perfect luôn nhìn từ một mốc quá khứ khác, không dùng độc lập như present perfect.'],
 'future-will':['Không dùng will cho kế hoạch cá nhân đã sắp xếp chắc chắn nếu muốn nhấn mạnh arrangement; dùng present continuous.','Sau will, động từ không thêm s/es.'],
 'going-to':['Không nhầm “be going to” với hiện tại tiếp diễn nếu sau going to là động từ chính.','Phải chia be: I am, he is, they are.'],
 'passive':['Bị động cần past participle, không dùng V-ed máy móc với động từ bất quy tắc.','Không thêm by + agent nếu người làm không quan trọng.'],
 'reported':['Câu hỏi gián tiếp không đảo trợ động từ: “He asked where did I live” sai.','Tell cần tân ngữ người nghe: tell me, tell him.'],
 'relative':['Mệnh đề không xác định phải dùng dấu phẩy và không dùng that thay cho who/which.','Không lặp tân ngữ: “The book which I bought it” sai.'],
 'conditionals':['Không dùng will trong mệnh đề if của điều kiện loại 1: “If it will rain” sai.','Loại 2 dùng quá khứ để nói giả định hiện tại, không nhất thiết là quá khứ thật.'],
 'modals':['Sau modal dùng động từ nguyên mẫu không to: can go, must do.','Modal không thêm s/es ở ngôi thứ ba.'],
 'gerunds':['Sau giới từ dùng V-ing, không dùng to V.','Một số động từ đổi nghĩa: remember doing khác remember to do.'],
 'articles':['Không dùng a/an với danh từ số nhiều hoặc không đếm được.','the không phải lúc nào cũng dịch là “cái đó”; hãy xét người nghe có biết cụ thể không.'],
 'prepositions':['Không dịch giới từ từng chữ từ tiếng Việt sang tiếng Anh.','Học theo cụm: listen to, depend on, good at.'],
 'adjadv':['Tính từ bổ nghĩa danh từ; trạng từ bổ nghĩa động từ.','Không dùng more với tính từ đã thêm -er.'],
 'questions':['Sau trợ động từ, động từ chính về dạng nguyên mẫu.','Câu hỏi đuôi phải đổi cực: khẳng định → phủ định, phủ định → khẳng định.'],
 'quantifiers':['many dùng với danh từ đếm được số nhiều; much dùng với danh từ không đếm được.','a few/a little mang nghĩa có một ít; few/little thường mang nghĩa gần như không đủ.'],
 'phrasal':['Không đoán nghĩa bằng cách dịch từng từ.','Một số phrasal verb tách được, một số không; cần học ví dụ.']
 })[type]||['Không học thuộc công thức rời rạc; hãy đọc nghĩa cả câu.','Kiểm tra dạng động từ, trợ động từ và từ đi kèm trước khi chọn đáp án.']}
function v7Example(type){return ({
 'present-simple':'Every morning, Lan walks to school. = Mỗi sáng Lan đi bộ đến trường.',
 'present-continuous':'Lan is walking to school now. = Lan đang đi bộ đến trường bây giờ.',
 'present-perfect':'Lan has finished her homework. = Lan đã làm xong bài tập, hiện kết quả là bài đã xong.',
 'past-simple':'Lan visited Hue last summer. = Lan đã thăm Huế mùa hè năm ngoái.',
 'past-continuous':'Lan was doing homework when I called. = Lan đang làm bài thì tôi gọi.',
 'past-perfect':'Lan had left before I arrived. = Lan đã rời đi trước khi tôi đến.',
 'future-will':'I’ll help you with this exercise. = Cô/ba sẽ giúp con làm bài này.',
 'going-to':'Look at the sky. It is going to rain. = Nhìn trời kìa, sắp mưa rồi.',
 'passive':'The window was broken. = Cửa sổ đã bị vỡ / được làm vỡ.',
 'reported':'She said that she was tired. = Cô ấy nói rằng cô ấy mệt.',
 'relative':'The boy who is wearing a blue shirt is my brother. = Cậu bé đang mặc áo xanh là em trai tôi.'
 })[type]||'Hãy lấy một câu ví dụ trong Unit, dịch sang tiếng Việt, rồi thay chủ ngữ/động từ để tự tạo câu mới.'}
function v7Sources(type){let arr=[...V7_ONLINE_SOURCES.general];if(v7IsTense({title:type,category:type})||String(type).includes('present')||String(type).includes('past')||String(type).includes('future'))arr=[...V7_ONLINE_SOURCES.tenses,...arr];if(type==='passive')arr=[...V7_ONLINE_SOURCES.passive,...arr];if(type==='relative')arr=[...V7_ONLINE_SOURCES.relative,...arr];return arr}
function v7Explain(u){const type=v7Type(u);const isT=v7IsTense(u)||type.startsWith('present')||type.startsWith('past')||type.startsWith('future')||type==='going-to';const title=e(u.title);const uses=v7Uses(type,u);const signals=v7Signals(type);const traps=v7Traps(type);const rows=v7Rows(type);const sourceLinks=v7Sources(type).map(([n,url])=>`<a target="_blank" href="${url}">${e(n)}</a>`).join('');
return `<section class="v7-vn-card"><span class="eyebrow">Giải thích tiếng Việt theo Unit sách</span><h3>${isT?'Cách hiểu nhanh trước khi học cấu trúc':'Dịch ý lý thuyết trong sách cho dễ hiểu'}</h3><p><b>${title}</b>: ${isT?'Unit này dạy cách nhìn thời gian của hành động. Trước khi chọn thì, hãy tự hỏi: việc này là thói quen, đang diễn ra, đã hoàn thành, hay kéo dài đến một mốc?':'Unit này dạy một điểm ngữ pháp cụ thể. Em nên đọc ví dụ trong sách trước, sau đó nhìn bảng cấu trúc và làm bài theo từng bước.'}</p><div class="v7-grid"><div class="v7-use"><b>Cách dùng</b><ol>${uses.map(x=>`<li>${e(x)}</li>`).join('')}</ol></div><div class="v7-note"><b>Ví dụ dễ hiểu</b><p>${e(v7Example(type))}</p><b>Exam Trap</b><ul>${traps.map(x=>`<li>${e(x)}</li>`).join('')}</ul></div></div>${isT?`<h3>Cấu trúc câu</h3>`:`<h3>Bảng cấu trúc / mẫu dùng</h3>`}<div class="v7-structure"><table><thead><tr><th>Loại câu / chức năng</th><th>Cách viết đầy đủ</th><th>Ví dụ</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${e(r[0])}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>${isT?`<h3>Dấu hiệu nhận biết</h3><div class="v7-signals">${signals.map((s,i)=>`<span class="v7-signal ${i>5?'warn':''}">${e(s)}</span>`).join('')}</div>`:`<h3>Từ khóa / điểm cần chú ý</h3><div class="v7-signals">${signals.map(s=>`<span class="v7-signal">${e(s)}</span>`).join('')}</div>`}<div class="v7-helpbox"><b>Cách học phần này:</b><ol><li>Đọc ví dụ mở đầu trong sách để hiểu ngữ cảnh.</li><li>Đối chiếu ví dụ với bảng cấu trúc tiếng Việt ở trên.</li><li>Làm bài tập, nhưng chưa mở đáp án cho đến khi đã nhập xong.</li><li>Sau khi nộp, so sánh với Key và đọc lại Exam Trap.</li></ol></div><p class="v7-source-links"><b>Nguồn bổ sung dễ hiểu:</b> ${sourceLinks}</p></section>`}
function v7TheoryText(u){let raw=v7Clean(u.theory||'');if(!raw)return '';let lines=raw.split('\n').slice(0,80).join('\n');let vi=lines.replace(/Study this example situation:?/gi,'Xem tình huống ví dụ trong sách:')
.replace(/Compare:?/gi,'So sánh:').replace(/Remember:?/gi,'Ghi nhớ:').replace(/Note:?/gi,'Lưu ý:').replace(/positive/gi,'câu khẳng định').replace(/negative/gi,'câu phủ định').replace(/question/gi,'câu hỏi').replace(/short forms?/gi,'dạng viết tắt').replace(/We use/gi,'Chúng ta dùng').replace(/we use/gi,'chúng ta dùng');
return `<section class="v7-vn-card"><h3>Lý thuyết trong sách - bản đọc dễ hiểu</h3><p class="v7-small">Phần dưới giữ ví dụ và trật tự của Unit, đồng thời Việt hóa các nhãn chính để học sinh Việt Nam dễ theo dõi. Với bản scan, một số chữ OCR có thể chưa đẹp, nhưng bài học chính đã được giải thích bằng tiếng Việt ở phần trên.</p><div class="v7-ex-body">${e(vi)}</div><details class="v7-raw"><summary></summary><pre>${e(raw)}</pre></details></section>`}
function v7ExerciseInputs(ex,idx){const body=String(ex.body||'');let nums=[];body.split('\n').forEach(line=>{const m=line.match(/^\s*(\d{1,2})[\.)\s]/);if(m)nums.push(m[1])});nums=[...new Set(nums)].slice(0,30);if(nums.length<2)nums=['1'];return `<div class="v7-answer-grid">${nums.map(n=>`<label>Câu ${e(n)}<input data-v7-answer="1" placeholder="Nhập đáp án câu ${e(n)}..."></label>`).join('')}</div>`}
function v7RenderExercises(u){const exs=u.exercises||[];if(!exs.length)return '<section class="card"><h3 class="section-title">Bài tập</h3><p>Unit này chưa có bài tập trong dữ liệu nguồn.</p></section>';return `<section class="card"><h3 class="section-title">Bài tập trong sách đã chuyển thành bài làm</h3><p class="v7-small">Không chèn ảnh PDF. Mỗi nhóm Exercise được chuyển thành văn bản và ô nhập đáp án. Học sinh phải nhập hết các ô thì mới mở được đáp án sách.</p>${exs.map((ex,i)=>`<article class="v7-exercise"><div class="v7-ex-title"><b>${e(ex.title||('Exercise '+(i+1)))}</b><span class="v7-unit-kind">${e(ex.id||'')}</span></div><div class="v7-ex-body">${e(v7Clean(ex.body||''))}</div>${v7ExerciseInputs(ex,i)}</article>`).join('')}<div class="v7-submit" data-v7-unit-box="${e(u.uid)}"><span id="v7-note-${e(u.uid)}">Hãy nhập hết đáp án trước khi mở Key.</span><button class="btn primary" data-v7-submit="${e(u.uid)}" disabled>Nộp bài và mở đáp án sách</button></div><div class="v7-key" id="v7-key-${e(u.uid)}"><b>Key to Exercises / đáp án trong sách:</b>\n\n${e(v7Clean(u.answerKey||'PDF nguồn chưa có Key riêng cho Unit này hoặc OCR chưa nhận được phần đáp án.'))}\n\n<b>Cách tự kiểm tra:</b> Với câu trả lời mở như “write about yourself”, đáp án trong sách thường chỉ là example answers. Hãy so sánh cấu trúc, thì, trợ động từ và nghĩa, không ép phải giống từng chữ.</div></section>`}
function v7RenderSupplement(item){let isKey=/key/i.test(item.kind||item.label||'');return `<section class="v7-banner"><span class="eyebrow">${e(item.bookTitle||'Grammar in Use')} · ${e(item.label||item.kind||'Supplement')}</span><h2>${e(item.title||item.label||'Supplement')}</h2><p>Trang ${e(item.page||'')} trong tài liệu nguồn. ${isKey?'Đây là phần đáp án/tham khảo.':'Đây là phần phụ lục, Additional Exercises, Study Guide hoặc Grammar Reminder trong sách.'}</p></section><section class="v7-supplement"><pre>${e(v7Clean(item.body||''))}</pre>${!isKey?`<div class="v7-submit" data-v7-unit-box="${e(item.uid)}"><span id="v7-note-${e(item.uid)}">Nhập ghi chú/bài làm trước khi mở đáp án nếu có.</span><button class="btn primary" data-v7-submit="${e(item.uid)}">Đánh dấu đã học / mở phần tham khảo</button></div><div class="v7-key" id="v7-key-${e(item.uid)}"><b>Ghi chú:</b> Nếu phần này có Key riêng trong sách, hãy chọn mục Key tương ứng ở danh sách bên trái.</div>`:''}</section>`}
function v7UpdateSubmit(box){if(!box)return;const btn=box.querySelector('[data-v7-submit]');const note=box.querySelector('[id^="v7-note-"]');const inputs=[...document.querySelectorAll('[data-v7-answer]')];if(!inputs.length){if(btn)btn.disabled=false;return}const done=inputs.filter(i=>i.value.trim()).length;if(note)note.textContent=`Đã nhập ${done}/${inputs.length} ô đáp án.`;if(btn)btn.disabled=done<inputs.length}
window.renderGrammar=function(){const book=v7Book();const search=norm($('#unit-search')?.value||'');const units=(book.units||[]).map(u=>({...u,_kind:'unit'}));const supps=(book.supplements||[]).map(u=>({...u,_kind:'supplement'}));let items=V7.section==='units'?units:V7.section==='supplements'?supps:units.concat(supps);items=items.filter(u=>!search||norm((u.unit||u.page||'')+' '+(u.title||'')+' '+(u.label||'')).includes(search));if(!items.some(u=>u.uid===state.unit))state.unit=(items[0]?.uid)||((book.units||[])[0]?.uid);if($('#book-select'))$('#book-select').value=state.book;if($('#unit-count'))$('#unit-count').textContent=`${items.length}/${(book.units||[]).length+(book.supplements||[]).length} mục`;const sectionHtml=`<div class="v7-book-sections"><button class="v7-section-btn ${V7.section==='units'?'active':''}" data-v7-section="units">Units</button><button class="v7-section-btn ${V7.section==='supplements'?'active':''}" data-v7-section="supplements">Additional / Key / Appendix</button><button class="v7-section-btn ${V7.section==='all'?'active':''}" data-v7-section="all">Tất cả</button></div>`;$('#unit-list').innerHTML=sectionHtml+(items.map(u=>`<button class="unit-item ${u.uid===state.unit?'active':''}" data-unit="${e(u.uid)}"><div class="v7-unit-badge"><span>${u._kind==='unit'?`${e(book.short)} Unit ${e(u.unit)}`:`${e(book.short)} p.${e(u.page||'')}`}</span><span class="v7-unit-kind">${u._kind==='unit'?'Unit':e(u.kind||'Extra')}</span></div><div class="unit-title">${e(u.title||u.label||'')}</div><small>${u._kind==='unit'?e(u.topicTitle||u.level||''):e(u.label||'')}</small></button>`).join('')||'<div class="empty">Không tìm thấy mục phù hợp.</div>');renderUnitDetail()}
window.renderUnitDetail=function(){const u=v7Find(state.unit);if(!u){$('#unit-detail').innerHTML='<div class="empty">Không tìm thấy Unit.</div>';return}if(u._kind==='supplement'){$('#unit-detail').innerHTML=v7RenderSupplement(u);return}const exCount=(u.exercises||[]).length;const html=`<section class="v7-banner"><span class="eyebrow">${e(u.bookTitle)} · Unit ${e(u.unit)} · trang lý thuyết ${e(u.theoryPage||'')}</span><h2>${e(u.title)}</h2><p>Phần Grammar in Use này bám theo Unit trong sách. App giải thích lại bằng tiếng Việt trước, đưa toàn bộ nhóm Exercise của Unit vào ô làm bài.</p><div class="v7-tagrow"><span class="v7-tag">${e(u.level||'')}</span><span class="v7-tag">${e(u.topicTitle||u.category||'')}</span><span class="v7-tag">${exCount} nhóm Exercise</span><a class="v7-tag" target="_blank" href="${e(u.youtube||'https://www.youtube.com/results?search_query='+encodeURIComponent(u.title+' English grammar Vietnamese'))}">Video YouTube</a></div></section>${v7Explain(u)}${v7TheoryText(u)}${v7RenderExercises(u)}`;$('#unit-detail').innerHTML=html;v7UpdateSubmit(document.querySelector(`[data-v7-unit-box="${CSS.escape(u.uid)}"]`))}
document.addEventListener('click',ev=>{const sec=ev.target.closest('[data-v7-section]');if(sec){V7.section=sec.dataset.v7Section;state.unit='';renderGrammar();return}const sub=ev.target.closest('[data-v7-submit]');if(sub){const uid=sub.dataset.v7Submit;const key=document.getElementById('v7-key-'+uid);if(key)key.classList.add('show');const note=document.getElementById('v7-note-'+uid);if(note)note.textContent='Đã nộp bài. Đáp án/Key đã mở bên dưới.';sub.disabled=true;sub.textContent='Đã mở đáp án';return}});
document.addEventListener('input',ev=>{if(ev.target.matches('[data-v7-answer]')){v7UpdateSubmit(ev.target.closest('.card')?.querySelector('[data-v7-unit-box]')||document.querySelector('[data-v7-unit-box]'))}});
document.addEventListener('change',ev=>{if(ev.target.id==='book-select'){state.book=ev.target.value;state.unit='';V7.section='units';setTimeout(renderGrammar,0)}});
window.addEventListener('load',()=>{try{document.getElementById('stat-units').textContent=V7_SOURCE_BOOKS.reduce((a,b)=>a+(b.units||[]).length,0);document.getElementById('stat-bookq').textContent=V7_SOURCE_BOOKS.reduce((a,b)=>a+(b.units||[]).reduce((x,u)=>x+(u.exercises||[]).length,0),0);document.getElementById('stat-totalq').textContent='V5+';const ey=document.querySelector('.hero .eyebrow');if(ey)ey.textContent='Bản V10 · Giữ nguyên lý thuyết V8';}catch(e){}renderGrammar();});
})();
