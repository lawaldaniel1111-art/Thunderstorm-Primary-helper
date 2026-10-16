const STORAGE_KEY = "thunderstormMathsV1";
const LEVEL_NAMES = ["Curious Starter", "Number Explorer", "Pattern Hunter", "Equation Ace", "Math Strategist", "Thunder Brain"];
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function yesterdayKey() {
  const d = new Date(); d.setDate(d.getDate()-1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function freshState() {
  return { xp:0, attempts:0, correct:0, dailyCount:0, lastDaily:"", lastActive:"", streak:0, activities:[], dailyClaimed:"" };
}
function loadState() {
  try { return { ...freshState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return freshState(); }
}
let state = loadState();
let quiz = { questions:[], index:0, answered:false, selected:null, earned:0 };
let battle = { active:false, round:0, player:1, scores:[0,0], answered:false, question:null };

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { showToast("Could not save in this browser. Check storage settings."); }
}
function levelInfo() {
  const level = Math.floor(state.xp / 100) + 1;
  return { level, name: LEVEL_NAMES[Math.min(level-1, LEVEL_NAMES.length-1)], into: state.xp % 100, percent: state.xp % 100 };
}
function accuracy() { return state.attempts ? Math.round(state.correct / state.attempts * 100) : 0; }
function addActivity(label, detail, xp=0) {
  state.activities.unshift({ label, detail, xp, date: new Date().toLocaleDateString() });
  state.activities = state.activities.slice(0, 8);
}
function awardXP(amount, label) {
  const oldLevel = levelInfo().level;
  state.xp += amount;
  addActivity(label, "Completed", amount);
  saveState(); renderStats();
  if (levelInfo().level > oldLevel) showToast(`LEVEL UP! You reached Level ${levelInfo().level} ⚡`);
  else showToast(`+${amount} XP earned!`);
}
function recordAttempt(isCorrect) {
  state.attempts++;
  if (isCorrect) state.correct++;
  saveState(); renderStats();
}
let toastTimer;
function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function renderStats() {
  const info = levelInfo();
  $("#topXp").textContent = `${state.xp} XP`;
  $("#topStreak").textContent = `${state.streak} day${state.streak===1?"":"s"}`;
  $("#dashXp").innerHTML = `${state.xp} <small>XP</small>`;
  $("#dashLevel").textContent = `Level ${info.level}`;
  $("#levelCaption").textContent = info.name;
  $("#levelTitle").textContent = `Level ${info.level} · ${info.name}`;
  $("#levelBadge").textContent = String(info.level).padStart(2,"0");
  $("#levelProgress").style.width = `${info.percent}%`;
  $("#levelProgressText").textContent = `${info.into} / 100 XP to next level`;
  $("#levelPercent").textContent = `${info.percent}%`;
  $("#dashSolved").textContent = state.correct;
  $("#dashAccuracy").textContent = `${accuracy()}%`;
  $("#progressXp").textContent = state.xp;
  $("#progressCorrect").textContent = state.correct;
  $("#progressAttempts").textContent = state.attempts;
  $("#progressDaily").textContent = state.dailyCount;
  $("#progressAccuracy").textContent = `${accuracy()}%`;
  $("#accuracyBar").style.width = `${accuracy()}%`;
  $("#progressMessage").textContent = state.attempts
    ? `You've answered ${state.correct} out of ${state.attempts} questions correctly. Keep practising to improve your accuracy.`
    : "Complete a quiz to begin building your stats.";
  renderActivity();
}
function renderActivity() {
  const list = $("#activityList");
  if (!state.activities.length) {
    list.innerHTML = '<p class="panel-note">Your completed activities will appear here.</p>'; return;
  }
  list.innerHTML = state.activities.map(a =>
    `<div class="activity-item"><div><strong>${escapeHTML(a.label)}</strong><br><span>${escapeHTML(a.detail)} · ${escapeHTML(a.date)}</span></div><strong>+${Number(a.xp)||0} XP</strong></div>`
  ).join("");
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
}
function goTo(view) {
  $$(".view").forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
  $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  const titles = {dashboard:"Dashboard",quiz:"Quizzes",lessons:"Lessons",daily:"Daily challenge",progress:"My progress",battle:"Math battle"};
  $("#pageTitle").textContent = titles[view] || "Dashboard";
  $(".sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-view]").forEach(btn => btn.addEventListener("click", () => goTo(btn.dataset.view)));
$$("[data-go]").forEach(btn => btn.addEventListener("click", () => goTo(btn.dataset.go)));
$("#menuToggle").addEventListener("click", () => $(".sidebar").classList.toggle("open"));

const LESSONS = {
  algebra: {
    tag:"ALGEBRA", title:"Solving equations", intro:"An equation is like a balanced scale. Whatever you do to one side, do to the other side too.",
    steps:["Start with 3x + 7 = 25.","Subtract 7 from both sides: 3x = 18.","Divide both sides by 3: x = 6.","Check: 3 × 6 + 7 = 25, so the answer is correct."],
    example:"Example: 2x + 4 = 14 → 2x = 10 → x = 5."
  },
  percentages: {
    tag:"PERCENTAGES", title:"Percentages made simple", intro:"Percent means “out of 100”. To find a percentage of an amount, change the percentage into a fraction or decimal and multiply.",
    steps:["Find 20% of 80.","Convert 20% to a decimal: 20 ÷ 100 = 0.2.","Multiply: 0.2 × 80 = 16.","So, 20% of 80 is 16."],
    example:"Quick trick: 10% of 80 is 8, so 20% is double that: 16."
  },
  order: {
    tag:"ARITHMETIC", title:"Order of operations", intro:"When an expression has several operations, follow a consistent order so everyone gets the same answer.",
    steps:["Work out brackets first.","Then calculate powers and roots.","Multiply and divide from left to right.","Add and subtract from left to right."],
    example:"Example: 4 + 3 × 2 = 4 + 6 = 10, not 14. Multiplication comes before addition."
  },
  geometry: {
    tag:"GEOMETRY", title:"Area of a triangle", intro:"The area of a triangle is half the area of a rectangle with the same base and perpendicular height.",
    steps:["Write the formula: Area = ½ × base × height.","Use the base, for example 10 cm.","Use the perpendicular height, for example 6 cm.","Area = ½ × 10 × 6 = 30 cm²."],
    example:"Remember to write square units for area, such as cm² or m²."
  }
};
$$(".lesson-open").forEach(btn => btn.addEventListener("click", () => {
  const lesson = LESSONS[btn.dataset.lesson];
  const detail = $("#lessonDetail");
  detail.innerHTML = `<span class="lesson-tag">${lesson.tag}</span><h3>${lesson.title}</h3><p>${lesson.intro}</p><ol>${lesson.steps.map(s=>`<li>${s}</li>`).join("")}</ol><p class="example">${lesson.example}</p>`;
  detail.classList.remove("hidden");
  detail.scrollIntoView({behavior:"smooth",block:"start"});
}));

function q(question, answer, options, explanation, topic) {
  return { question, answer:String(answer), options:options.map(String), explanation, topic };
}
const QUESTION_BANK = {
  arithmetic: [
    q("What is 18 × 7?",126,[116,126,136,146],"18 × 7 = (10 × 7) + (8 × 7) = 70 + 56 = 126.","Arithmetic"),
    q("Calculate 144 ÷ 12.",12,[10,11,12,14],"12 × 12 = 144, so 144 ÷ 12 = 12.","Arithmetic"),
    q("Evaluate 8 + 4 × 3.",20,[20,36,24,16],"Multiply first: 4 × 3 = 12. Then 8 + 12 = 20.","Arithmetic"),
    q("What is 3² + 4²?",25,[12,24,25,49],"3² = 9 and 4² = 16. Then 9 + 16 = 25.","Arithmetic"),
    q("What is the square root of 169?",13,[11,12,13,14],"13 × 13 = 169, so √169 = 13.","Arithmetic"),
    q("Calculate 2.5 + 3.75.",6.25,[5.25,6,6.25,6.75],"Write 2.50 + 3.75 = 6.25.","Arithmetic")
  ],
  algebra: [
    q("Solve: x + 9 = 17.",8,[6,7,8,9],"Subtract 9 from both sides: x = 17 − 9 = 8.","Algebra"),
    q("Solve: 4x = 36.",9,[7,8,9,12],"Divide both sides by 4: x = 36 ÷ 4 = 9.","Algebra"),
    q("Solve: 2x + 3 = 15.",6,[5,6,7,9],"Subtract 3: 2x = 12. Divide by 2: x = 6.","Algebra"),
    q("If y = 3, what is 2y²?",18,[12,18,36,9],"Square first: 3² = 9. Then 2 × 9 = 18.","Algebra"),
    q("Solve: 5x − 10 = 20.",6,[4,5,6,8],"Add 10: 5x = 30. Divide by 5: x = 6.","Algebra"),
    q("Simplify: 3a + 2a.", "5a",["5a","6a","5a²","a"],"Combine like terms: 3a + 2a = 5a.","Algebra")
  ],
  percentages: [
    q("What is 25% of 80?",20,[15,20,25,30],"25% is one quarter. 80 ÷ 4 = 20.","Percentages"),
    q("A ₦2,000 item has a 10% discount. How much is the discount?",200,[100,150,200,250],"10% = 0.10. Then 0.10 × 2,000 = ₦200.","Percentages"),
    q("Write 0.45 as a percentage.","45%",["4.5%","45%","0.45%","450%"],"Multiply a decimal by 100: 0.45 × 100 = 45%.","Percentages"),
    q("What is 15% of 200?",30,[15,20,30,35],"10% of 200 is 20 and 5% is 10. Total = 30.","Percentages"),
    q("A score rises from 50 to 60. What is the percentage increase?", "20%",["10%","15%","20%","25%"],"Increase = 10. Percentage increase = 10 ÷ 50 × 100 = 20%.","Percentages"),
    q("Express 3/4 as a percentage.","75%",["25%","50%","75%","80%"],"3 ÷ 4 = 0.75. Multiply by 100 to get 75%.","Percentages")
  ],
  geometry: [
    q("A rectangle is 8 cm long and 5 cm wide. What is its area?",40,[13,26,40,80],"Area = length × width = 8 × 5 = 40 cm².","Geometry"),
    q("What is the sum of angles in a triangle?",180, [90,180,270,360],"The interior angles of every triangle add up to 180°.","Geometry"),
    q("A triangle has base 10 cm and height 6 cm. What is its area?",30,[16,30,60,120],"Area = ½ × base × height = ½ × 10 × 6 = 30 cm².","Geometry"),
    q("Find the perimeter of a square with side 7 cm.",28,[14,21,28,49],"A square has four equal sides: 4 × 7 = 28 cm.","Geometry"),
    q("How many degrees are in a right angle?",90,[45,90,180,360],"A right angle measures exactly 90°.","Geometry"),
    q("A circle has diameter 10 cm. What is its radius?",5,[2.5,5,10,20],"The radius is half the diameter: 10 ÷ 2 = 5 cm.","Geometry")
  ]
};
function shuffle(items) {
  const arr = [...items];
  for (let i=arr.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}
function startQuiz() {
  const topic = $("#quizTopic").value;
  const source = topic === "mixed" ? Object.values(QUESTION_BANK).flat() : QUESTION_BANK[topic];
  quiz = { questions:shuffle(source).slice(0,5), index:0, answered:false, selected:null, earned:0 };
  renderQuizQuestion();
}
$("#startQuiz").addEventListener("click", startQuiz);
function renderQuizQuestion() {
  const area = $("#quizArea");
  if (quiz.index >= quiz.questions.length) {
    area.innerHTML = `<div class="empty-icon">✦</div><h3>Quiz complete!</h3><p>You earned ${quiz.earned} XP from this quiz.</p><p class="panel-note">Keep practising to strengthen your skills.</p><button id="quizAgain" class="primary-btn">Try another quiz →</button>`;
    $("#quizAgain").addEventListener("click", startQuiz);
    addActivity("Quick quiz", `${quiz.earned > 0 ? "Quiz completed" : "Quiz finished"}`, 0);
    saveState(); renderActivity();
    return;
  }
  const item = quiz.questions[quiz.index];
  quiz.answered = false; quiz.selected = null;
  area.innerHTML = `<div class="question-top"><span>QUESTION ${quiz.index+1} OF ${quiz.questions.length}</span><strong>${item.topic}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${quiz.index/quiz.questions.length*100}%"></div></div><h3 class="question-text">${item.question}</h3><div class="option-grid">${shuffle(item.options).map(opt=>`<button class="option-btn" data-answer="${escapeHTML(opt)}">${escapeHTML(opt)}</button>`).join("")}</div><p id="quizFeedback" class="question-feedback" aria-live="polite">Choose your answer.</p><div class="question-actions"><span class="panel-note">Correct answer = 10 XP</span><button id="quizNext" class="secondary-btn" disabled>${quiz.index===quiz.questions.length-1?"Finish quiz":"Next question"} →</button></div>`;
  $$(".option-btn").forEach(btn => btn.addEventListener("click", () => answerQuiz(btn, item)));
  $("#quizNext").addEventListener("click", () => { if (!quiz.answered) return; quiz.index++; renderQuizQuestion(); });
}
function answerQuiz(button, item) {
  if (quiz.answered) return;
  quiz.answered = true;
  const isCorrect = button.dataset.answer === item.answer;
  quiz.selected = button.dataset.answer;
  $$(".option-btn").forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.answer === item.answer) btn.classList.add("correct");
    else if (btn === button && !isCorrect) btn.classList.add("wrong");
  });
  const feedback = $("#quizFeedback");
  feedback.textContent = `${isCorrect ? "Correct! +10 XP. " : `Not quite. The answer is ${item.answer}. `}${item.explanation}`;
  feedback.style.color = isCorrect ? "var(--green)" : "#ff9cb8";
  recordAttempt(isCorrect);
  if (isCorrect) { quiz.earned += 10; awardXP(10, "Quiz answer"); }
  $("#quizNext").disabled = false;
}

$("#dailyForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const feedback = $("#dailyFeedback");
  if (state.dailyClaimed === todayKey()) {
    feedback.className = "feedback success"; feedback.textContent = "Daily challenge already completed today. Great job showing up!";
    return;
  }
  const value = Number($("#dailyAnswer").value);
  const isCorrect = value === 6;
  recordAttempt(isCorrect);
  if (isCorrect) {
    state.dailyClaimed = todayKey(); state.dailyCount++;
    const today = todayKey();
    if (state.lastActive === yesterdayKey()) state.streak++;
    else if (state.lastActive !== today) state.streak = 1;
    state.lastActive = today; state.lastDaily = today;
    awardXP(25, "Daily challenge");
    feedback.className = "feedback success"; feedback.textContent = "Correct! 3x + 7 = 25 → 3x = 18 → x = 6. You earned 25 XP!";
    $("#dailyAnswer").disabled = true;
    $("#dailyForm button").disabled = true;
  } else {
    feedback.className = "feedback error"; feedback.textContent = "Not quite. First subtract 7 from both sides: 3x = 18. Then divide by 3. Try 6!";
  }
});
if (state.dailyClaimed === todayKey()) {
  $("#dailyAnswer").disabled = true; $("#dailyForm button").disabled = true;
  $("#dailyFeedback").className = "feedback success";
  $("#dailyFeedback").textContent = "Daily challenge completed! Come back tomorrow for your next mission.";
}

function randomBattleQuestion() {
  const pool = Object.values(QUESTION_BANK).flat();
  return pool[Math.floor(Math.random()*pool.length)];
}
function startBattle() {
  battle = { active:true, round:1, player:1, scores:[0,0], answered:false, question:randomBattleQuestion() };
  $("#p1Score").textContent = "0"; $("#p2Score").textContent = "0";
  renderBattleQuestion();
}
$("#startBattle").addEventListener("click", startBattle);
function renderBattleQuestion() {
  const area = $("#battleArea");
  if (battle.round > 10) {
    battle.active = false;
    const winner = battle.scores[0]===battle.scores[1] ? "It's a draw!" : `Player ${battle.scores[0]>battle.scores[1]?1:2} wins the battle!`;
    area.innerHTML = `<div class="empty-icon">🏆</div><h3>${winner}</h3><p>Final score: Player 1 ${battle.scores[0]} — ${battle.scores[1]} Player 2</p><button id="battleAgain" class="primary-btn">Battle again →</button>`;
    $("#battleAgain").addEventListener("click", startBattle);
    addActivity("Math battle", winner, 0); saveState(); renderActivity();
    return;
  }
  battle.player = battle.round % 2 === 1 ? 1 : 2;
  battle.question = randomBattleQuestion(); battle.answered = false;
  const item = battle.question;
  area.innerHTML = `<div class="question-top"><span>ROUND ${Math.ceil(battle.round/2)} OF 5</span><strong>PLAYER ${battle.player}'S TURN</strong></div><h3 class="question-text">${item.question}</h3><div class="option-grid">${shuffle(item.options).map(opt=>`<button class="option-btn" data-battle-answer="${escapeHTML(opt)}">${escapeHTML(opt)}</button>`).join("")}</div><p id="battleQuestionFeedback" class="question-feedback">Player ${battle.player}, choose carefully!</p>`;
  $$(".option-btn").forEach(btn => btn.addEventListener("click", () => answerBattle(btn, item)));
}
function answerBattle(button, item) {
  if (battle.answered) return;
  battle.answered = true;
  const isCorrect = button.dataset.battleAnswer === item.answer;
  $$(".option-btn").forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.battleAnswer === item.answer) btn.classList.add("correct");
    else if (btn===button && !isCorrect) btn.classList.add("wrong");
  });
  if (isCorrect) battle.scores[battle.player-1]++;
  $("#p1Score").textContent = battle.scores[0]; $("#p2Score").textContent = battle.scores[1];
  $("#battleQuestionFeedback").textContent = `${isCorrect?"Correct! Point scored.":"Not this time."} ${item.explanation}`;
  recordAttempt(isCorrect);
  const next = document.createElement("button");
  next.className = "primary-btn"; next.textContent = battle.round===10 ? "See results →" : "Next turn →";
  next.style.marginTop = "14px";
  next.addEventListener("click", () => { battle.round++; renderBattleQuestion(); });
  $("#battleArea").appendChild(next);
}

$("#resetProgress").addEventListener("click", () => {
  if (!confirm("Reset all Thunderstorm Maths progress saved in this browser? This cannot be undone.")) return;
  state = freshState(); saveState(); renderStats();
  $("#dailyAnswer").disabled = false; $("#dailyForm button").disabled = false; $("#dailyAnswer").value = "";
  $("#dailyFeedback").textContent = ""; $("#dailyFeedback").className = "feedback";
  showToast("Progress reset on this device.");
});

renderStats();
