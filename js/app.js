// =====================================================
// タッケン3ヶ月 アプリ本体
// データはすべて localStorage に保存(サーバー不要)
// =====================================================

const EXAM_DATE = "2026-10-18"; // 10月第3日曜(年度に合わせて変更可)
const STORAGE_KEY = "takken3m";

// ---------- 状態の読み書き ----------
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
const state = Object.assign(
  { stats: {}, plan: {}, review: {}, mocks: [], studyDays: [] },
  loadState()
);

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function markStudiedToday() {
  const t = todayStr();
  if (!state.studyDays.includes(t)) {
    state.studyDays.push(t);
    saveState();
  }
}

// ---------- 12週間ロードマップ ----------
const PLAN = [
  { week: 1, phase: "インプット期", title: "宅建業法①(免許・宅建士)",
    tasks: ["テキスト:免許制度・宅建士制度を読む", "一問一答:宅建業法を毎日10問", "用語に慣れる(完璧を目指さない)"] },
  { week: 2, phase: "インプット期", title: "宅建業法②(営業保証金・媒介契約)",
    tasks: ["テキスト:営業保証金・保証協会・媒介契約", "一問一答:宅建業法を毎日10問", "数字(1000万/60万/3ヶ月など)を暗記カード化"] },
  { week: 3, phase: "インプット期", title: "宅建業法③(35条・37条・8種制限)",
    tasks: ["テキスト:重要事項説明・契約書面・自ら売主制限", "一問一答:宅建業法を毎日10問", "35条と37条の違いを表にまとめる"] },
  { week: 4, phase: "インプット期", title: "権利関係①(意思表示・代理・時効)",
    tasks: ["テキスト:意思表示・制限行為能力・代理・時効", "一問一答:権利関係を毎日10問", "宅建業法の復習も並行(週2回)"] },
  { week: 5, phase: "アウトプット期", title: "権利関係②(物権変動・抵当権・借地借家法)",
    tasks: ["テキスト:対抗要件・抵当権・借地借家法", "一問一答:権利関係を毎日10問", "過去問:宅建業法を分野別に解き始める"] },
  { week: 6, phase: "アウトプット期", title: "法令上の制限①(都市計画法・建築基準法)",
    tasks: ["テキスト:開発許可・用途地域・建蔽率容積率", "一問一答:法令上の制限を毎日10問", "数字の暗記表を作る(1000㎡/4m/2mなど)"] },
  { week: 7, phase: "アウトプット期", title: "法令上の制限②(農地法・区画整理・盛土)",
    tasks: ["テキスト:農地法・国土法・区画整理・盛土規制法", "一問一答:法令上の制限を毎日10問", "弱点復習を毎日消化する習慣をつける"] },
  { week: 8, phase: "アウトプット期", title: "税・その他(税法・地価公示・免除科目)",
    tasks: ["テキスト:不動産取得税・固定資産税・地価公示", "一問一答:税・その他を毎日10問", "過去問:権利関係の頻出テーマのみ解く"] },
  { week: 9, phase: "仕上げ期", title: "過去問演習①(分野別を横断)",
    tasks: ["過去問:宅建業法を2年分", "ミニ模試を1回受けて時間感覚を作る", "弱点復習をゼロにする"] },
  { week: 10, phase: "仕上げ期", title: "過去問演習②(年度別に通す)",
    tasks: ["過去問:年度別を2回分(2時間計測)", "間違えた分野をテキストに戻って確認", "ミニ模試1回"] },
  { week: 11, phase: "仕上げ期", title: "弱点潰し+統計・法改正",
    tasks: ["正答率が低い分野を集中演習", "統計問題・最新法改正を暗記(最新資料で!)", "ミニ模試1回(38点以上を目標)"] },
  { week: 12, phase: "仕上げ期", title: "総仕上げ(新しいことはやらない)",
    tasks: ["これまでの間違い問題だけを総復習", "5点免除科目・統計の最終暗記", "前日は早く寝る。当日は宅建業法から解く"] },
];

// 試験日から逆算して「今が第何週か」を出す(12週前より前なら第1週)
function currentWeek() {
  const days = daysToExam();
  const w = 12 - Math.ceil(days / 7) + 1;
  return Math.min(Math.max(w, 1), 12);
}
function daysToExam() {
  const ms = new Date(EXAM_DATE) - new Date(todayStr());
  return Math.max(Math.round(ms / 86400000), 0);
}

// ---------- タブ切替 ----------
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("view-" + tab.dataset.view).classList.add("active");
    render(tab.dataset.view);
  });
});

function render(view) {
  if (view === "home") renderHome();
  if (view === "plan") renderPlan();
  if (view === "quiz") renderQuizSetup();
  if (view === "review") renderReview();
  if (view === "mock") renderMockSetup();
  if (view === "stats") renderStats();
}

// ---------- ホーム ----------
function renderHome() {
  document.getElementById("countdown-days").textContent = daysToExam();
  document.getElementById("exam-date-label").textContent =
    EXAM_DATE.replace(/(\d+)-(\d+)-(\d+)/, "$1年$2月$3日");

  const week = currentWeek();
  const plan = PLAN[week - 1];
  document.getElementById("today-week").textContent = `第${week}週:${plan.title}`;

  const due = dueReviewIds().length;
  const tasks = [...plan.tasks];
  if (due > 0) tasks.unshift(`🔥 弱点復習が ${due} 問たまっています(最優先で消化!)`);
  document.getElementById("today-tasks").innerHTML = tasks
    .map((t) => `<div class="task-item"><span class="dot">▶</span><span>${t}</span></div>`)
    .join("");

  // サマリー
  let total = 0, correct = 0;
  Object.values(state.stats).forEach((s) => { total += s.total; correct += s.correct; });
  document.getElementById("sum-answered").textContent = total;
  document.getElementById("sum-accuracy").textContent =
    total ? Math.round((correct / total) * 100) + "%" : "--%";
  document.getElementById("sum-due").textContent = due;
  document.getElementById("sum-streak").textContent = streak() + "日";
}

function streak() {
  const days = new Set(state.studyDays);
  let count = 0;
  let offset = days.has(todayStr()) ? 0 : -1; // 今日まだ学習していなければ昨日から数える
  while (days.has(todayStr(offset - count))) count++;
  return count;
}

// ---------- 学習計画 ----------
function renderPlan() {
  const week = currentWeek();
  const list = document.getElementById("plan-list");
  list.innerHTML = "";
  PLAN.forEach((p) => {
    const done = p.tasks.filter((_, i) => state.plan[`${p.week}-${i}`]).length;
    const div = document.createElement("div");
    div.className = "plan-week" + (p.week === week ? " open" : "");
    div.innerHTML = `
      <div class="plan-week-header ${p.week === week ? "current" : ""}">
        <span>第${p.week}週:${p.title}${p.week === week ? " 👈今週" : ""}
          <div class="phase">${p.phase}</div></span>
        <span class="plan-progress">${done}/${p.tasks.length}</span>
      </div>
      <div class="plan-tasks">
        ${p.tasks.map((t, i) => {
          const key = `${p.week}-${i}`;
          const checked = state.plan[key] ? "checked" : "";
          return `<div class="plan-task ${checked ? "done" : ""}">
            <input type="checkbox" id="pt-${key}" data-key="${key}" ${checked}>
            <label for="pt-${key}">${t}</label></div>`;
        }).join("")}
      </div>`;
    div.querySelector(".plan-week-header").addEventListener("click", () =>
      div.classList.toggle("open")
    );
    div.querySelectorAll("input").forEach((cb) =>
      cb.addEventListener("change", () => {
        state.plan[cb.dataset.key] = cb.checked;
        saveState();
        markStudiedToday();
        renderPlan();
      })
    );
    list.appendChild(div);
  });
}

// ---------- 一問一答 ----------
let quizSession = null;

function renderQuizSetup() {
  document.getElementById("quiz-panel").classList.add("hidden");
  document.getElementById("quiz-setup").classList.remove("hidden");
  const box = document.getElementById("quiz-cat-buttons");
  box.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, c]) => {
    const n = QUESTIONS.filter((q) => q.cat === key && q.type === "ox").length;
    const btn = document.createElement("button");
    btn.className = "cat-btn";
    btn.style.borderLeft = `6px solid ${c.color}`;
    btn.innerHTML = `${c.name}<small>${n}問収録</small>`;
    btn.addEventListener("click", () => startQuiz(key));
    box.appendChild(btn);
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz(cat) {
  const pool = shuffle(QUESTIONS.filter((q) => q.cat === cat && q.type === "ox")).slice(0, 10);
  quizSession = { pool, index: 0, correct: 0, mode: "quiz" };
  document.getElementById("quiz-setup").classList.add("hidden");
  document.getElementById("quiz-panel").classList.remove("hidden");
  showQuizQuestion(document.getElementById("quiz-panel"));
}

function showQuizQuestion(panel) {
  const s = quizSession;
  if (s.index >= s.pool.length) return showQuizResult(panel);
  const q = s.pool[s.index];
  panel.innerHTML = `
    <div class="quiz-progress">${s.index + 1} / ${s.pool.length} 問目
      ・${CATEGORIES[q.cat].name}</div>
    <div class="quiz-q">${q.q}</div>
    <div class="ox-buttons">
      <button class="btn maru" data-ans="true">○</button>
      <button class="btn batsu" data-ans="false">×</button>
    </div>
    <div id="quiz-feedback"></div>`;
  panel.querySelectorAll("[data-ans]").forEach((btn) =>
    btn.addEventListener("click", () => answerQuiz(panel, q, btn.dataset.ans === "true"))
  );
}

function answerQuiz(panel, q, userAns) {
  const ok = userAns === q.a;
  recordAnswer(q, ok);
  quizSession.correct += ok ? 1 : 0;
  panel.querySelectorAll("[data-ans]").forEach((b) => (b.disabled = true));
  document.getElementById("quiz-feedback").innerHTML = `
    <div class="judge ${ok ? "ok" : "ng"}">${ok ? "正解! 🎉" : "不正解…(正解は " + (q.a ? "○" : "×") + ")"}</div>
    <div class="explanation">💡 ${q.exp}</div>
    <button class="btn primary" id="quiz-next">次の問題へ ▶</button>`;
  document.getElementById("quiz-next").addEventListener("click", () => {
    quizSession.index++;
    showQuizQuestion(panel);
  });
}

function showQuizResult(panel) {
  const s = quizSession;
  const pct = Math.round((s.correct / s.pool.length) * 100);
  if (s.mode === "review") {
    panel.innerHTML = `
      <div class="result-summary">
        <div>復習おつかれさまでした!</div>
        <div class="big">${s.correct} / ${s.pool.length} 問正解(${pct}%)</div>
        <p class="note">正解した問題は次の復習日へ、間違えた問題は明日また出題されます。</p>
        <button class="btn primary" id="review-refresh">復習画面に戻る</button>
      </div>`;
    document.getElementById("review-refresh").addEventListener("click", renderReview);
    return;
  }
  panel.innerHTML = `
    <div class="result-summary">
      <div>おつかれさまでした!</div>
      <div class="big">${s.correct} / ${s.pool.length} 問正解(${pct}%)</div>
      <p class="note">${pct >= 80 ? "この調子!✨" : "間違えた問題は「弱点復習」タブで明日以降に再出題されます。"}</p>
      <button class="btn primary" id="quiz-again">もう一度</button>
      <button class="btn" id="quiz-back">分野を選び直す</button>
    </div>`;
  document.getElementById("quiz-again").addEventListener("click", () => startQuiz(s.pool[0].cat));
  document.getElementById("quiz-back").addEventListener("click", renderQuizSetup);
}

// ---------- 解答の記録+間隔反復への登録 ----------
const REVIEW_INTERVALS = [1, 3, 7]; // box0→1日後, box1→3日後, box2→7日後

function recordAnswer(q, ok) {
  markStudiedToday();
  if (!state.stats[q.cat]) state.stats[q.cat] = { total: 0, correct: 0 };
  state.stats[q.cat].total++;
  if (ok) state.stats[q.cat].correct++;

  const rev = state.review[q.id];
  if (!ok) {
    // 間違い → ボックス0(明日再出題)
    state.review[q.id] = { box: 0, due: todayStr(1) };
  } else if (rev) {
    // 復習中の問題に正解 → 次のボックスへ、box3到達で卒業
    const nextBox = rev.box + 1;
    if (nextBox >= REVIEW_INTERVALS.length) delete state.review[q.id];
    else state.review[q.id] = { box: nextBox, due: todayStr(REVIEW_INTERVALS[nextBox]) };
  }
  saveState();
}

function dueReviewIds() {
  const t = todayStr();
  return Object.entries(state.review)
    .filter(([, r]) => r.due <= t)
    .map(([id]) => id);
}

// ---------- 弱点復習 ----------
function renderReview() {
  const panel = document.getElementById("review-panel");
  const ids = dueReviewIds();
  const totalRegistered = Object.keys(state.review).length;
  if (ids.length === 0) {
    panel.innerHTML = `<div class="review-empty">
      ${totalRegistered === 0
        ? "復習する問題はありません。<br>「一問一答」で間違えた問題がここに登録されます。"
        : `今日の復習は完了しています! 🎉<br>(復習待ち:${totalRegistered}問が後日出題されます)`}
    </div>`;
    return;
  }
  const pool = shuffle(ids.map((id) => QUESTIONS.find((q) => q.id === id)).filter(Boolean));
  quizSession = { pool, index: 0, correct: 0, mode: "review" };
  showQuizQuestion(panel);
}

// ---------- ミニ模試 ----------
const MOCK_MINUTES = 20;
let mockTimer = null;

function renderMockSetup() {
  document.getElementById("mock-panel").classList.add("hidden");
  document.getElementById("mock-setup").classList.remove("hidden");
  if (mockTimer) { clearInterval(mockTimer); mockTimer = null; }
  const hist = state.mocks.slice(-5).reverse();
  document.getElementById("mock-history").innerHTML = hist.length
    ? "<h2 style='margin-top:16px'>📜 直近の結果</h2>" +
      hist.map((m) => `<div class="task-item"><span class="dot">▶</span>
        <span>${m.date}: <b>${m.score}/${m.total}問</b>(${Math.round((m.score / m.total) * 100)}%)</span></div>`).join("")
    : "";
}

document.getElementById("mock-start").addEventListener("click", startMock);

function startMock() {
  const pool = shuffle(QUESTIONS.filter((q) => q.type === "choice4"));
  quizSession = { pool, index: 0, correct: 0, answers: [], mode: "mock", endAt: Date.now() + MOCK_MINUTES * 60000 };
  document.getElementById("mock-setup").classList.add("hidden");
  const panel = document.getElementById("mock-panel");
  panel.classList.remove("hidden");
  mockTimer = setInterval(() => updateMockTimer(panel), 1000);
  showMockQuestion(panel);
}

function updateMockTimer(panel) {
  const el = panel.querySelector(".mock-timer");
  if (!el) return;
  const left = Math.max(0, quizSession.endAt - Date.now());
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
  el.textContent = `⏱ ${m}:${String(s).padStart(2, "0")}`;
  if (left <= 0) { clearInterval(mockTimer); mockTimer = null; showMockResult(panel, true); }
}

function showMockQuestion(panel) {
  const sess = quizSession;
  if (sess.index >= sess.pool.length) return showMockResult(panel, false);
  const q = sess.pool[sess.index];
  panel.innerHTML = `
    <div class="quiz-progress"><span class="mock-timer"></span>
      問${sess.index + 1} / ${sess.pool.length}・${CATEGORIES[q.cat].name}</div>
    <div class="quiz-q">${q.q}</div>
    <div class="choice-list">
      ${q.choices.map((c, i) => `<button class="choice-btn" data-i="${i}">${i + 1}. ${c}</button>`).join("")}
    </div>
    <div id="mock-feedback"></div>`;
  updateMockTimer(panel);
  panel.querySelectorAll(".choice-btn").forEach((btn) =>
    btn.addEventListener("click", () => answerMock(panel, q, Number(btn.dataset.i)))
  );
}

function answerMock(panel, q, chosen) {
  const ok = chosen === q.a;
  recordAnswer(q, ok);
  quizSession.correct += ok ? 1 : 0;
  quizSession.answers.push({ id: q.id, chosen, ok });
  panel.querySelectorAll(".choice-btn").forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.a) btn.classList.add("correct");
    else if (i === chosen) btn.classList.add("wrong");
  });
  document.getElementById("mock-feedback").innerHTML = `
    <div class="judge ${ok ? "ok" : "ng"}">${ok ? "正解! 🎉" : `不正解…(正解は ${q.a + 1})`}</div>
    <div class="explanation">💡 ${q.exp}</div>
    <button class="btn primary" id="mock-next">次へ ▶</button>`;
  document.getElementById("mock-next").addEventListener("click", () => {
    quizSession.index++;
    showMockQuestion(panel);
  });
}

function showMockResult(panel, timeUp) {
  if (mockTimer) { clearInterval(mockTimer); mockTimer = null; }
  const sess = quizSession;
  const answered = sess.answers.length;
  state.mocks.push({ date: todayStr(), score: sess.correct, total: sess.pool.length });
  saveState();
  const pct = Math.round((sess.correct / sess.pool.length) * 100);
  panel.innerHTML = `
    <div class="result-summary">
      ${timeUp ? "<div>⏱ 時間切れ!</div>" : "<div>模試終了!</div>"}
      <div class="big">${sess.correct} / ${sess.pool.length} 問正解(${pct}%)</div>
      <p class="note">本試験の合格ラインは約7割(50問中34〜38点)。${
        pct >= 70 ? "合格ライン超え!この調子✨" : "7割を目指して弱点復習を回しましょう。"
      }${timeUp && answered < sess.pool.length ? `<br>※時間内に${answered}問しか解けませんでした。ペース配分を意識しましょう。` : ""}</p>
      <button class="btn primary" id="mock-retry">もう一度</button>
      <button class="btn" id="mock-back">戻る</button>
    </div>`;
  document.getElementById("mock-retry").addEventListener("click", startMock);
  document.getElementById("mock-back").addEventListener("click", renderMockSetup);
}

// ---------- 成績 ----------
function renderStats() {
  const box = document.getElementById("stats-bars");
  box.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, c]) => {
    const s = state.stats[key] || { total: 0, correct: 0 };
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    box.innerHTML += `
      <div class="stat-row">
        <div class="stat-head">
          <span><b>${c.name}</b></span>
          <span>${s.total ? `${pct}%(${s.correct}/${s.total}問)` : "未学習"}</span>
        </div>
        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${c.color}"></div></div>
      </div>`;
  });
  box.innerHTML += `<p class="note">💡 目標:宅建業法90%、法令上の制限・税その他75%、権利関係60%。</p>`;
}

// ---------- リセット ----------
document.getElementById("reset-data").addEventListener("click", () => {
  if (confirm("学習記録(解答履歴・復習キュー・計画チェック)をすべて削除します。よろしいですか?")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});

// ---------- 初期表示 ----------
renderHome();
