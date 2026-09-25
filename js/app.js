const $=s=>document.querySelector(s);
function getGameCode(){return(localStorage.getItem("eAgoraGameCode")||"").toUpperCase()}
function setGameCode(v){localStorage.setItem("eAgoraGameCode",v.toUpperCase())}
function setPlayerId(v){localStorage.setItem("eAgoraPlayerId",v)}
function getPlayerId(){return localStorage.getItem("eAgoraPlayerId")||""}
function setPlayerName(v){localStorage.setItem("eAgoraPlayerName",v)}
function getPlayerName(){return localStorage.getItem("eAgoraPlayerName")||""}
function showMessage(v,t="info"){const e=$("#message");if(e){e.textContent=v;e.className="message "+t}}
async function getGameByCode(code){const {data,error}=await supabaseClient.from("games").select("*").eq("code",code.toUpperCase()).single();if(error)throw error;return data}
async function getQuestions(){const {data,error}=await supabaseClient.from("questions").select("*").order("number");if(error)throw error;return data}
function scoreAnswers(a){const s={exploracao:0,estabilidade:0,proposito:0,conexao:0,adaptacao:0,persistencia:0};a.forEach(x=>Object.entries(x.scores||{}).forEach(([k,v])=>{if(k in s)s[k]+=Number(v)||0}));return s}
function scorePercentages(s){const m=Math.max(...Object.values(s),1);return Object.fromEntries(Object.entries(s).map(([k,v])=>[k,Math.round(v/m*100)]))}
function trajectoryTitle(s){const k=["exploracao","estabilidade","proposito","conexao"].sort((a,b)=>s[b]-s[a])[0];return({exploracao:"TRAJETÓRIA EXPLORADORA",estabilidade:"TRAJETÓRIA DE ESTABILIDADE",proposito:"TRAJETÓRIA DE PROPÓSITO",conexao:"TRAJETÓRIA DE CONEXÃO"})[k]}
function trajectoryText(s){const k=["exploracao","estabilidade","proposito","conexao"].sort((a,b)=>s[b]-s[a])[0];return({exploracao:"Maior abertura para experimentar possibilidades, mudanças e caminhos novos.",estabilidade:"Maior preocupação com segurança, previsibilidade, planejamento e proteção do que já foi construído.",proposito:"Maior preocupação com objetivos, valores pessoais e coerência entre escolhas e aquilo que considera importante.",conexao:"Maior preocupação com relações, pessoas próximas e o impacto das escolhas sobre quem está ao redor."})[k]}
function escapeHtml(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
