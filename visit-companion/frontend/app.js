/* Bridge — frontend */

const API = "";
const state = {
  sessionId: null,
  sessionSnap: null,
  brief: null,
  recap: null,
  turns: [],
  playIndex: 0,
  view: "plain",
  options: null,
  audit: [],
  asked: new Set(),
  notes: "",
  playing: false,
  playTimer: null,
  speaker: "doctor",
  listening: false,
  recognition: null,
  uiLang: "en",
  bigText: false,
  helpingFamily: false,
  screen: "lang",
};

const BACK = {
  home: "lang",
  visit: "home",
  story: "visit",
  "brief-q": "story",
  "brief-more": "brief-q",
  consent: "brief-q",
  live: "consent",
  after: "live",
  "after-note": "after",
  "after-gaps": "after-note",
};

const DARK_SCREENS = new Set(["lang", "home"]);
const ASK_SCREENS = new Set(["brief-q", "brief-more", "after", "after-note", "after-gaps"]);

function showScreen(id) {
  state.screen = id;
  document.body.dataset.screen = id;
  $$(".screen").forEach((s) => s.classList.toggle("is-on", s.dataset.screen === id));
  const dark = DARK_SCREENS.has(id);
  document.body.classList.toggle("theme-dark", dark);
  document.body.classList.toggle("theme-light", !dark);
  const chapter = ["lang", "home", "visit", "story", "brief-q", "brief-more"].includes(id)
    ? "before"
    : ["consent", "live"].includes(id)
      ? "during"
      : "after";
  $$(".dots i").forEach((d) => d.classList.toggle("is-on", d.dataset.p === chapter));
  $("#btn-back")?.classList.toggle("hidden", id === "lang" || !BACK[id]);
  $("#btn-reset")?.classList.toggle("hidden", id === "lang");
  window.scrollTo(0, 0);
  const body = document.querySelector(`.screen.is-on .screen-body`);
  if (body) body.scrollTop = 0;
  if (!$("#ask-panel")?.classList.contains("hidden")) renderAskStarters();
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

function toast(msg, ms = 3200) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("is-up");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("is-up"), ms);
}

function languageName(code) {
  const lang = state.options?.languages?.find((l) => l.code === code);
  return lang ? lang.native : code;
}

function sourcePill(src) {
  if (src === "bedrock" || src === "aws") return `<span class="pill pill-live">AWS</span>`;
  if (src === "live") return `<span class="pill pill-live">live AI</span>`;
  if (src === "scripted_after_error")
    return `<span class="pill pill-scripted">fallback used</span>`;
  return `<span class="pill pill-scripted">scripted</span>`;
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  let body = opts.body;
  if (body && state.sessionSnap) {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object" && !parsed.session) {
        parsed.session = state.sessionSnap;
        body = JSON.stringify(parsed);
      }
    } catch (_) {}
  }
  const res = await fetch(API + path, { ...opts, headers, body });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody.detail) msg = errBody.detail;
    } catch (_) {}
    throw new Error(msg);
  }
  const data = await res.json();
  if (data.session) state.sessionSnap = data.session;
  return data;
}

function syncTheme() {
  const dark = DARK_SCREENS.has(state.screen || "lang");
  document.body.classList.toggle("theme-dark", dark);
  document.body.classList.toggle("theme-light", !dark);
}

function goto(phase) {
  if (phase === "before") showScreen(state.brief ? "brief-q" : "home");
  else if (phase === "during") showScreen(state.sessionId ? "consent" : "home");
  else if (phase === "after") showScreen(state.recap ? "after-note" : "after");
}

$$(".nav-link").forEach((s) =>
  s.addEventListener("click", () => goto(s.dataset.phase))
);
$$("[data-goto]").forEach((b) =>
  b.addEventListener("click", () => goto(b.dataset.goto))
);

$("#btn-back")?.addEventListener("click", () => {
  const prev = BACK[state.screen];
  if (prev) showScreen(prev);
});

function markDone(phase) {
  const step = $(`.nav-link[data-phase="${phase}"]`);
  if (step) step.classList.add("is-done");
}

function renderAudit(entries) {
  if (!entries) return;
  state.audit = entries;
  $("#audit-count").textContent = entries.length;
  $("#audit-list").innerHTML = entries
    .map((e) => {
      const time = new Date(e.at).toLocaleTimeString();
      const detail = Object.entries(e.detail || {})
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      return `<li><code>${esc(e.action)}</code> · ${esc(time)}${
        detail ? " · " + esc(detail) : ""
      }</li>`;
    })
    .join("");
}

async function loadOptions() {
  try {
    const opts = await api("/api/options");
    state.options = opts;

    $("#language").innerHTML = opts.languages
      .map(
        (l) =>
          `<option value="${l.code}">${esc(l.native)}${
            l.native !== l.label ? ` — ${esc(l.label)}` : ""
          }</option>`
      )
      .join("");
    if ($("#ui-language")) {
      $("#ui-language").innerHTML = opts.languages
        .map((l) => `<option value="${l.code}">${esc(l.native)}</option>`)
        .join("");
    }
    if ($("#lang-bar")) {
      $("#lang-bar").innerHTML = opts.languages
        .map(
          (l) =>
            `<button type="button" class="lang-chip" data-lang="${esc(l.code)}">${esc(l.native)}</button>`
        )
        .join("");
      $$(".lang-chip").forEach((b) =>
        b.addEventListener("click", () => setUiLang(b.dataset.lang))
      );
    }

    if ($("#reading_level") && $("#reading_level").tagName === "SELECT") {
      $("#reading_level").innerHTML = opts.reading_levels
        .map((r) => `<option value="${r.code}">${esc(r.label)}</option>`)
        .join("");
      const setHint = () => {
        const lvl = opts.reading_levels.find(
          (r) => r.code === $("#reading_level").value
        );
        if ($("#reading-hint")) $("#reading-hint").textContent = lvl ? lvl.hint : "";
      };
      $("#reading_level").addEventListener("change", setHint);
      setHint();
    }

    const m = opts.mode;
    const live = m.llm === "live" || m.llm === "bedrock";
    if ($("#mode-pill")) {
      $("#mode-pill").className = `pill ${live ? "pill-live" : "pill-scripted"}`;
      $("#mode-pill").textContent = live
        ? `${m.llm} · ${(m.model || "").split(".").pop()}`
        : "scripted mode";
    }

    let saved = "en";
    try {
      saved = localStorage.getItem("bridge-lang") || "en";
    } catch (_) {}
    setUiLang(saved);
  } catch (err) {
    if ($("#mode-pill")) $("#mode-pill").textContent = "backend offline";
    toast("Can't reach the backend. Is it running on port 8000?");
  }
}

function setUiLang(code) {
  state.uiLang = code || "en";
  if ($("#language")) $("#language").value = state.uiLang;
  if ($("#ui-language")) $("#ui-language").value = state.uiLang;
  $$(".lang-chip").forEach((c) =>
    c.classList.toggle("is-on", c.dataset.lang === state.uiLang)
  );
  applyI18n();
  renderRights();
  renderPhrases();
  renderAskStarters();
  try {
    localStorage.setItem("bridge-lang", state.uiLang);
  } catch (_) {}
}

function renderRights() {
  const el = $("#rights-card");
  if (!el) return;
  el.innerHTML = `
    <h2>${esc(t("rightsTitle"))}</h2>
    <p>${esc(t("rightsBody"))}</p>
    <div class="desk-card" id="desk-card-text">${esc(
      t("deskCard", { lang: languageName(state.uiLang) })
    )}</div>
    <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-desk">${esc(
      t("showDesk")
    )}</button>`;
  $("#btn-copy-desk")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("#desk-card-text").textContent);
      toast(t("copied"));
    } catch (_) {}
  });
}

function renderPhrases() {
  const el = $("#brief-phrases");
  if (!el) return;
  const items = [
    ["slow", "phraseSlow"],
    ["questions", "phraseQuestions"],
    ["write", "phraseWrite"],
    ["repeat", "phraseRepeat"],
  ];
  el.innerHTML = `
    <div class="card">
      <h2>${esc(t("phrasesTitle"))}</h2>
      <p class="hint">${esc(t("phrasesHint"))}</p>
      <div class="phrase-grid">${items
        .map(
          ([id, key]) => `<button type="button" class="phrase" data-copy="${esc(
            PHRASE_EN[id] + "\n" + t(key)
          )}">
            <span class="phrase-en">${esc(PHRASE_EN[id])}</span>
            <span class="phrase-local">${esc(t(key))}</span>
          </button>`
        )
        .join("")}</div>
    </div>`;
  el.querySelectorAll(".phrase").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        toast(t("copied"));
      } catch (_) {}
    })
  );
}

function renderFastPhrase() {
  const el = $("#brief-phrase-fast");
  if (!el) return;
  const line = PHRASE_EN.questions + "\n" + t("phraseQuestions");
  el.innerHTML = `
    <div class="card">
      <p class="tx-kicker">${esc(t("ifRushed"))}</p>
      <button type="button" class="phrase" data-copy="${esc(line)}">
        <span class="phrase-en">${esc(PHRASE_EN.questions)}</span>
        <span class="phrase-local">${esc(t("phraseQuestions"))}</span>
      </button>
    </div>`;
  el.querySelector(".phrase")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(line);
      toast(t("copied"));
    } catch (_) {}
  });
}

function fillDemoForm() {
  const d = state.options?.demo_patient;
  if (!d) return false;
  $("#condition").value = d.condition;
  $("#symptoms").value = d.symptoms;
  $("#language").value = d.language;
  if ($("#reading_level") && d.reading_level) $("#reading_level").value = d.reading_level;
  if ($("#age_range")) $("#age_range").value = d.age_range || "";
  if ($("#other_conditions")) $("#other_conditions").value = d.other_conditions || "";
  if ($("#medications")) $("#medications").value = d.medications || "";
  if ($("#allergies")) $("#allergies").value = d.allergies || "";
  if ($("#family_history")) $("#family_history").value = d.family_history || "";
  if ($("#context")) $("#context").value = d.context || "";
  setUiLang(d.language);
  return true;
}

function collectPrepPayload() {
  const helping = $("#helping-family")?.checked;
  const extra = ($("#context")?.value || "").trim();
  const context = [extra, helping ? "A family member is helping with this visit." : ""]
    .filter(Boolean)
    .join(" ");
  return {
    condition: $("#condition").value.trim(),
    symptoms: $("#symptoms").value.trim(),
    language: $("#language").value,
    reading_level: $("#reading_level").value,
    context,
    history: {
      age_range: $("#age_range")?.value || "",
      other_conditions: ($("#other_conditions")?.value || "").trim(),
      medications: ($("#medications")?.value || "").trim(),
      allergies: ($("#allergies")?.value || "").trim(),
      family_history: ($("#family_history")?.value || "").trim(),
    },
  };
}

function applyPrepResult(data, payload) {
  state.sessionId = data.session_id;
  state.brief = data.brief;
  state.asked = new Set();
  renderAudit(data.audit);
  renderBrief(data.brief);
  setUiLang(payload.language);
  renderRights();
  renderPhrases();
  renderFastPhrase();
  markDone("before");
  showScreen("brief-q");
}

async function runPrep() {
  const payload = collectPrepPayload();
  if (!payload.condition) throw new Error("Tell us what the visit is about.");
  const data = await api("/api/prep", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  applyPrepResult(data, payload);
  return data;
}

$("#btn-demo")?.addEventListener("click", () => {
  if (!fillDemoForm()) return;
  toast(t("loadDemo"));
  showScreen("visit");
});

$("#btn-demo-live")?.addEventListener("click", () => startDemoCaptions({ autoplay: true }));

$("#prep-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  showScreen("story");
});

function questionsHtml(qs, interactive) {
  if (!qs.length) return "";
  const items = qs
    .map((q, i) => {
      const asked = state.asked.has(i);
      if (interactive) {
        return `<label class="q-check ${asked ? "is-on" : ""}">
          <input type="checkbox" data-q="${i}" ${asked ? "checked" : ""} />
          <span>
            <div class="q-text">${esc(q.question)} ${
              q.priority === "high" ? `<span class="pill pill-high">${esc(t("askFirst"))}</span>` : ""
            }</div>
            <div class="q-why">${esc(q.why)}</div>
          </span>
        </label>`;
      }
      return `<li>
        <div class="q-text">${esc(q.question)} ${
          q.priority === "high" ? `<span class="pill pill-high">${esc(t("askFirst"))}</span>` : ""
        }</div>
        <div class="q-why">${esc(q.why)}</div>
      </li>`;
    })
    .join("");
  return interactive
    ? items
    : `<ul class="q-list">${items}</ul>`;
}

function bindQuestionChecks(root) {
  root.querySelectorAll("input[data-q]").forEach((box) => {
    box.addEventListener("change", () => {
      const i = Number(box.dataset.q);
      if (box.checked) state.asked.add(i);
      else state.asked.delete(i);
      box.closest(".q-check").classList.toggle("is-on", box.checked);
    });
  });
}

function renderBrief(b) {
  const meta = b._meta || {};

  const note = (b.personalized_note || "").trim();
  if ($("#brief-for-you")) {
    $("#brief-for-you").innerHTML = note
      ? `<div class="card">
          <p class="tx-kicker">${esc(t("forYou"))}</p>
          <p>${esc(note)}</p>
        </div>`
      : "";
  }

  $("#brief-summary").innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px">
      <h2 style="margin:0">What this means</h2>
      ${sourcePill(meta.llm_source)}
    </div>
    <p>${esc(b.plain_summary)}</p>
    ${
      (b.key_numbers || []).length
        ? `<div class="notice">${b.key_numbers
            .map(
              (n) =>
                `<strong>${esc(n.label)}</strong> — ${esc(n.meaning)}${
                  n.typical_target ? ` <em>${esc(n.typical_target)}</em>` : ""
                }`
            )
            .join("<br>")}</div>`
        : ""
    }`;

  const tips = b.visit_tips || [];
  $("#brief-tips").innerHTML = tips.length
    ? `<div class="card">
        <p class="tx-kicker">How to use the room</p>
        <h2>${esc(t("howToUse"))}</h2>
        <ul class="tip-list">${tips.map((t) => `<li>${esc(t.tip)}</li>`).join("")}</ul>
      </div>`
    : "";

  const qs = b.questions || [];
  $("#brief-questions").innerHTML = qs.length
    ? `<div class="card">
        <p class="tx-kicker">Take this in with you</p>
        <h2>${esc(t("questionsInOrder"))}</h2>
        <p class="hint" style="margin-bottom:14px">Ask the ones marked first. Check them off in the room so we can see what never came up.</p>
        <div id="prep-q-list">${questionsHtml(qs, true)}</div>
      </div>`
    : "";
  if (qs.length) bindQuestionChecks($("#prep-q-list"));

  const trialAsk = $("#brief-trial-ask");
  if (trialAsk) {
    const top = (b.trials || [])[0];
    trialAsk.innerHTML = top
      ? `<div class="card">
          <p class="tx-kicker">${esc(t("worthAsking"))}</p>
          <h2>${esc(t("askThisStudy"))}</h2>
          <p class="hint" style="margin-bottom:12px">${esc(t("trialSiteDecides"))}</p>
          <div class="src">
            <div>
              <a href="${esc(top.url)}" target="_blank" rel="noopener">${esc(top.title)}</a>
              <div class="src-meta">${esc(top.status || "")}${
                (top.locations || [])[0] ? " · " + esc(top.locations[0]) : ""
              }</div>
            </div>
          </div>
        </div>`
      : "";
  }

  const std = b.standard_treatments || [];
  const emerging = b.emerging_options || [];
  $("#brief-treatments").innerHTML =
    std.length || emerging.length
      ? `<div class="tx-grid">
          ${
            std.length
              ? `<div class="card tx-card">
                  <p class="tx-kicker">${esc(t("usuallyOffered"))}</p>
                  <h2>${esc(t("standardCare"))}</h2>
                  <ul class="item-list">${std
                    .map(
                      (t) => `<li>
                        <h3>${esc(t.name)}</h3>
                        <p class="q-why">${esc(t.what_it_is)}</p>
                        <p class="q-why"><strong>Why it matters:</strong> ${esc(t.why_it_matters)}</p>
                        ${
                          t.common_side_effects
                            ? `<p class="q-why"><strong>Side effects:</strong> ${esc(t.common_side_effects)}</p>`
                            : ""
                        }
                      </li>`
                    )
                    .join("")}</ul>
                </div>`
              : ""
          }
          ${
            emerging.length
              ? `<div class="card tx-card">
                  <p class="tx-kicker">${esc(t("oftenNot"))}</p>
                  <h2>${esc(t("newerOptions"))}</h2>
                  <ul class="item-list">${emerging
                    .map(
                      (t) => `<li>
                        <h3>${esc(t.name)}</h3>
                        <p class="q-why">${esc(t.what_it_is)}</p>
                        <p class="q-why"><strong>Why ask:</strong> ${esc(t.why_ask)}</p>
                        ${t.status ? `<p class="src-meta">${esc(t.status)}</p>` : ""}
                      </li>`
                    )
                    .join("")}</ul>
                </div>`
              : ""
          }
        </div>`
      : "";

  const trials = (b.trials || []).slice(0, 2);
  $("#brief-trials").innerHTML = trials.length
    ? `<div class="card">
        <p class="tx-kicker">${esc(t("worthAsking"))}</p>
        <h2>${esc(t("studiesAsk"))}</h2>
        <p class="hint" style="margin-bottom:14px">${esc(t("trialSiteDecides"))}</p>
        ${trials
          .map(
            (tr) => `<div class="src">
              <div>
                <a href="${esc(tr.url)}" target="_blank" rel="noopener">${esc(tr.title)}</a>
                <div class="src-meta">${esc(tr.status || "")}${
                  (tr.locations || [])[0] ? " · " + esc(tr.locations[0]) : ""
                }</div>
              </div>
            </div>`
          )
          .join("")}
      </div>`
    : "";

  const flags = b.red_flags || [];
  $("#brief-flags").innerHTML = flags.length
    ? `<div class="card card-consent">
        <h2>Do not wait on these</h2>
        <ul class="item-list">${flags
          .map(
            (f) =>
              `<li><h3>${esc(f.sign)}</h3><p class="q-why">${esc(f.action)}</p></li>`
          )
          .join("")}</ul>
      </div>`
    : "";

  const sources = b.sources || [];
  const papers = meta.papers_found || 0;
  const nTrials = meta.trials_found || trials.length;
  $("#brief-sources").innerHTML = sources.length
    ? `<div class="card">
        <h2>${esc(t("whereFrom"))}</h2>
        <p class="hint" style="margin-bottom:12px">
          ${papers ? `${papers} papers. ` : ""}${nTrials ? `${nTrials} studies. ` : ""}Every link is a real, checkable source — we do not invent citations.
        </p>
        ${sources
          .map(
            (s) => `<div class="src">
              <div>
                <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>
                <div class="src-meta">${esc(s.source)}${s.detail ? " · " + esc(s.detail) : ""}</div>
              </div>
            </div>`
          )
          .join("")}
      </div>`
    : "";
}

$("#consent-check").addEventListener("change", (e) => {
  $("#btn-consent").disabled = !e.target.checked;
});

$("#btn-skip-consent").addEventListener("click", () => {
  showScreen("live");
  renderLiveQuestions();
  toast(t("skipCaptionsHint"));
});

async function recordConsent(text) {
  const data = await api("/api/session/consent", {
    method: "POST",
    body: JSON.stringify({
      session_id: state.sessionId,
      consent_given: true,
      consent_text_shown: text,
    }),
  });
  renderAudit(data.audit);
  return data;
}

function showLiveView() {
  showScreen("live");
  renderLiveQuestions();
  markDone("during");
}

async function startDemoCaptions({ autoplay = true } = {}) {
  const liveBtn = $("#btn-demo-live");
  const visitBtn = $("#btn-demo-visit");
  try {
    if (liveBtn) liveBtn.disabled = true;
    if (visitBtn) visitBtn.disabled = true;
    if (!state.sessionId) {
      if (!fillDemoForm()) {
        toast("Can't reach the backend. Is it running on port 8000?");
        return;
      }
      toast("Preparing the demo patient…");
      await runPrep();
    }
    await recordConsent("Demo visit — simulated captions. No live microphone.");
    showLiveView();
    $("#btn-play")?.classList.add("is-pulse");
    if (autoplay) {
      $("#btn-play")?.click();
    } else {
      toast(t("liveHow"));
    }
  } catch (err) {
    toast(err.message);
  } finally {
    if (liveBtn) liveBtn.disabled = false;
    if (visitBtn) visitBtn.disabled = false;
  }
}

$("#btn-demo-visit")?.addEventListener("click", () =>
  startDemoCaptions({ autoplay: true })
);

$("#btn-consent").addEventListener("click", async () => {
  if (!state.sessionId) {
    toast(t("needPrep"));
    showScreen("home");
    return;
  }
  try {
    const consentText = $(".consent-list").innerText;
    await recordConsent(consentText);
    showLiveView();
    toast("Captions on. Nothing leaves this phone.");
  } catch (err) {
    toast(err.message);
  }
});

function renderLiveQuestions() {
  const qs = state.brief?.questions || [];
  $("#live-questions").innerHTML = qs.length
    ? `<p class="tx-kicker">${esc(t("yourList"))}</p>
       <h2>${esc(t("checkOff"))}</h2>
       <div id="live-q-list">${questionsHtml(qs, true)}</div>`
    : `<p class="hint">No prepared questions yet.</p>`;
  if (qs.length) bindQuestionChecks($("#live-q-list"));
}

$$("[data-view]").forEach((t) =>
  t.addEventListener("click", () => {
    $$("[data-view]").forEach((x) => x.classList.remove("is-active"));
    t.classList.add("is-active");
    state.view = t.dataset.view;
    renderTranscript();
  })
);

const STT_LANG = {
  en: "en-US",
  es: "es-US",
  zh: "zh-CN",
  vi: "vi-VN",
  tl: "fil-PH",
  ar: "ar-SA",
  ru: "ru-RU",
  ko: "ko-KR",
  pt: "pt-BR",
  fr: "fr-FR",
  ht: "ht-HT",
  bn: "bn-IN",
};

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

function setSttStatus(msg) {
  const el = $("#stt-status");
  if (el) el.textContent = msg;
}

function showInterim(who, text) {
  const box = $("#live-interim");
  if (!box) return;
  $("#interim-who").textContent = who;
  $("#interim-text").textContent = text || "…";
  box.classList.toggle("hidden", !text);
}

function hideInterim() {
  showInterim("Hearing…", "");
}

function setListeningUi(on) {
  $("#stt-bars")?.classList.toggle("hidden", !on);
  $("#live-view")?.classList.toggle("is-listening", on);
}

async function appendSpokenTurn({ speaker, lang, text }) {
  const data = await api("/api/interpret", {
    method: "POST",
    body: JSON.stringify({
      session_id: state.sessionId,
      append: true,
      turns: [{ speaker, lang, text }],
    }),
  });
  state.turns = [...state.turns, ...data.turns];
  state.playIndex = state.turns.length;
  renderAudit(data.audit);
  $("#live-sub").innerHTML = `${esc(data.disclaimer)} ${sourcePill(data.source)}`;
  hideInterim();
  renderTranscript();
  renderTerms();
  const last = $("#transcript")?.lastElementChild;
  last?.scrollIntoView({ behavior: "smooth", block: "end" });
}

function stopMic() {
  state.listening = false;
  try {
    state.recognition?.stop();
  } catch (_) {}
  state.recognition = null;
  setListeningUi(false);
  hideInterim();
  const btn = $("#btn-mic");
  if (btn) btn.textContent = t("startListening");
  setSttStatus(t("micOff"));
}

function startMic() {
  if (!SpeechRecognition) {
    toast("Live listening needs Chrome or Edge. Use Simulate appointment for the demo.");
    return;
  }
  stopPlay();
  const speaker = state.speaker || "doctor";
  const patientLang = $("#language")?.value || state.brief?._meta?.language || "es";
  const recLang = speaker === "patient" ? STT_LANG[patientLang] || "en-US" : "en-US";

  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = recLang;

  rec.onstart = () => {
    state.listening = true;
    setListeningUi(true);
    $("#btn-mic").textContent = t("stopListening");
    setSttStatus(
      speaker === "patient"
        ? "Listening to you…"
        : "Listening to the doctor…"
    );
  };
  rec.onerror = (e) => {
    if (e.error === "not-allowed") {
      toast("Microphone permission was blocked. Use Simulate appointment instead.");
    } else if (e.error !== "no-speech") {
      toast("Could not hear that. Try again, or simulate the visit.");
    }
  };
  rec.onend = () => {
    if (state.listening) {
      try {
        rec.start();
      } catch (_) {
        stopMic();
      }
    }
  };
  rec.onresult = async (event) => {
    let interim = "";
    let finals = [];
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const piece = event.results[i][0].transcript.trim();
      if (!piece) continue;
      if (event.results[i].isFinal) finals.push(piece);
      else interim += (interim ? " " : "") + piece;
    }
    if (interim) {
      showInterim(speaker === "patient" ? "You" : "Doctor", interim);
    }
    for (const text of finals) {
      showInterim(speaker === "patient" ? "You" : "Doctor", text);
      try {
        await appendSpokenTurn({
          speaker,
          lang: speaker === "patient" ? patientLang : "en",
          text,
        });
      } catch (err) {
        toast(err.message);
      }
    }
  };

  state.recognition = rec;
  try {
    rec.start();
  } catch (err) {
    toast("Could not start the microphone.");
    stopMic();
  }
}

async function fetchInterpreted() {
  const data = await api("/api/interpret", {
    method: "POST",
    body: JSON.stringify({
      session_id: state.sessionId,
      use_demo_transcript: true,
    }),
  });
  state.turns = data.turns;
  renderAudit(data.audit);
  $("#live-sub").innerHTML = `${esc(data.disclaimer)} ${sourcePill(data.source)}`;
  return data;
}

function stopPlay() {
  state.playing = false;
  clearTimeout(state.playTimer);
}

function finishPlay() {
  stopPlay();
  setListeningUi(false);
  hideInterim();
  setSttStatus("Simulation finished.");
  $("#btn-play").textContent = "Appointment finished";
  $("#btn-play").disabled = true;
  renderTerms();
}

function advanceLine() {
  if (state.playIndex >= state.turns.length) {
    finishPlay();
    return;
  }
  const turn = state.turns[state.playIndex];
  const who = turn.speaker === "patient" ? "You" : "Doctor";
  showInterim(who, turn.text);
  setSttStatus("Hearing… (simulated speech-to-text)");
  state.playTimer = setTimeout(() => {
    hideInterim();
    state.playIndex++;
    renderTranscript();
    const last = $("#transcript")?.lastElementChild;
    last?.scrollIntoView({ behavior: "smooth", block: "end" });
    if (state.playIndex >= state.turns.length) {
      finishPlay();
      return;
    }
    if (state.playing) {
      state.playTimer = setTimeout(advanceLine, 400);
    }
  }, 1100);
}

$("#btn-mic").addEventListener("click", () => {
  if (state.listening) stopMic();
  else startMic();
});

$$("[data-speaker]").forEach((b) =>
  b.addEventListener("click", () => {
    $$("[data-speaker]").forEach((x) => x.classList.remove("is-active"));
    b.classList.add("is-active");
    state.speaker = b.dataset.speaker;
    if (state.listening) {
      stopMic();
      startMic();
    }
  })
);

$("#btn-play").addEventListener("click", async () => {
  const btn = $("#btn-play");
  if (state.playing) {
    stopPlay();
    setListeningUi(false);
    hideInterim();
    btn.textContent = "Continue";
    return;
  }
  stopMic();
  btn.disabled = true;
  try {
    if (!state.turns.length) {
      btn.innerHTML = `<span class="loading"><span class="spinner"></span>Translating…</span>`;
      await fetchInterpreted();
    }
    state.playing = true;
    setListeningUi(true);
    setSttStatus("Simulating live captions from the room…");
    btn.textContent = "Pause";
    btn.disabled = false;
    advanceLine();
  } catch (err) {
    toast(err.message);
    btn.textContent = "Simulate appointment";
    btn.disabled = false;
  }
});

$("#btn-play-all").addEventListener("click", async () => {
  try {
    stopPlay();
    stopMic();
    if (!state.turns.length) await fetchInterpreted();
    state.playIndex = state.turns.length;
    hideInterim();
    renderTranscript();
    finishPlay();
  } catch (err) {
    toast(err.message);
  }
});

function renderTranscript() {
  const shown = state.turns.slice(0, state.playIndex);
  $("#transcript").innerHTML = shown
    .map((t) => {
      const who = t.speaker === "patient" ? "You" : "Doctor";
      let main, sub;
      if (state.view === "original") {
        main = t.text;
        sub = t.translation !== t.text ? t.translation : "";
      } else if (state.view === "translation") {
        main = t.translation || t.text;
        sub = t.text;
      } else {
        main = t.plain || t.translation || t.text;
        sub = t.text;
      }
      return `<div class="turn turn-${esc(t.speaker)}">
        <div class="turn-who">${who}</div>
        <div class="turn-text">${esc(main)}</div>
        ${sub && sub !== main ? `<div class="turn-sub">${esc(sub)}</div>` : ""}
      </div>`;
    })
    .join("");
}

function renderTerms() {
  const terms = [];
  const seen = new Set();
  state.turns.forEach((t) =>
    (t.terms || []).forEach((x) => {
      const key = (x.term || "").toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        terms.push(x);
      }
    })
  );
  if (!terms.length) return;
  $("#terms-panel").classList.remove("hidden");
  $("#terms-list").innerHTML = terms
    .map(
      (x) => `<div class="term">
        <div class="term-name">${esc(x.term)}</div>
        <div class="term-means">${esc(x.means)}</div>
      </div>`
    )
    .join("");
}

$("#btn-recap").addEventListener("click", async () => {
  if (!state.sessionId) {
    toast("Start with Prepare.");
    showScreen("home");
    return;
  }
  const btn = $("#btn-recap");
  btn.disabled = true;
  btn.innerHTML = `<span class="loading"><span class="spinner"></span>Reading the visit back…</span>`;
  try {
    const data = await api("/api/recap", {
      method: "POST",
      body: JSON.stringify({ session_id: state.sessionId }),
    });
    state.recap = data.recap;
    renderAudit(data.audit);
    renderRecap(data.recap);
    markDone("after");
    showScreen("after-note");
  } catch (err) {
    toast(err.message);
    btn.disabled = false;
    btn.textContent = "Write it for my family";
  }
});

function renderRecap(r) {
  const meta = r._meta || {};
  const prepared = state.brief?.questions || [];
  const gaps = r.unanswered_questions || [];
  const answered = Math.max(prepared.length - gaps.length, 0);

  $("#recap-headline").innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:8px">
      <h2 style="margin:0">Your visit</h2>${sourcePill(meta.llm_source)}
    </div>
    <p>${esc(r.headline)}</p>`;

  $("#recap-family").innerHTML = r.family_note
    ? `<div class="card">
        <p class="tx-kicker">Forward this</p>
        <h2>Note for your family</h2>
        <p class="family-note">${esc(r.family_note)}</p>
      </div>`
    : "";

  $("#recap-score").innerHTML = prepared.length
    ? `<div class="card">
        <p class="tx-kicker">What got asked</p>
        <div class="score">
          <div><b>${prepared.length}</b><span>prepared</span></div>
          <div><b>${answered}</b><span>covered</span></div>
          <div><b>${gaps.length}</b><span>still open</span></div>
        </div>
      </div>`
    : "";

  $("#recap-gaps").innerHTML = gaps.length
    ? `<div class="card">
        <h2>${gaps.length} question${gaps.length > 1 ? "s" : ""} you prepared never got answered</h2>
        <p class="hint" style="margin-bottom:14px">People often say “no more questions” when they feel rushed. That is not the same as being done.</p>
        ${gaps
          .map(
            (g, i) => `<div class="gap">
              <div class="gap-q">${esc(g.question)}</div>
              <div class="gap-why">${esc(g.why_it_matters)}</div>
              <div class="gap-how"><strong>What to do:</strong> ${esc(g.how_to_follow_up)}</div>
              <button type="button" class="btn btn-ghost btn-sm" data-gap-i="${i}">${esc(t("copyPortal"))}</button>
            </div>`
          )
          .join("")}
      </div>`
    : `<div class="card"><h2>Everything you planned to ask got covered</h2>
        <p class="hint">We checked your prepared questions against the conversation.</p></div>`;

  const decided = r.what_was_decided || [];
  $("#recap-decided").innerHTML = decided.length
    ? `<div class="card"><h2>What was decided</h2><ul class="item-list">${decided
        .map(
          (d) => `<li><h3>${esc(d.item)}</h3><p class="q-why">${esc(d.detail)}</p></li>`
        )
        .join("")}</ul></div>`
    : "";

  const meds = r.medications || [];
  $("#recap-meds").innerHTML = meds.length
    ? `<div class="card"><h2>Your medicine</h2><ul class="item-list">${meds
        .map(
          (m) => `<li>
            <h3>${esc(m.name)} ${esc(m.dose || "")}</h3>
            <p class="q-why">${esc(m.frequency || "")}${
            m.instructions ? " · " + esc(m.instructions) : ""
          }</p>
            ${m.watch_for ? `<p class="q-why"><strong>Watch for:</strong> ${esc(m.watch_for)}</p>` : ""}
          </li>`
        )
        .join("")}</ul></div>`
    : "";

  const places = r.places_to_go || [];
  const kindLabel = {
    today: "Today",
    referral: "Referral",
    followup: "Follow up",
    trial: "Study",
  };
  $("#recap-places").innerHTML = places.length
    ? `<div class="card">
        <p class="tx-kicker">Where to go</p>
        <h2>Places and people</h2>
        <ul class="item-list">${places
          .map(
            (p) => `<li>
              <h3>${esc(p.place)} ${
                p.kind
                  ? `<span class="pill pill-muted">${esc(kindLabel[p.kind] || p.kind)}</span>`
                  : ""
              }</h3>
              <p class="q-why">${esc(p.why)}</p>
              <p class="q-why"><strong>How:</strong> ${esc(p.how)}</p>
            </li>`
          )
          .join("")}</ul>
      </div>`
    : "";

  const next = r.next_steps || [];
  $("#recap-next").innerHTML = next.length
    ? `<div class="card"><h2>What to do next</h2><ul class="item-list">${next
        .map(
          (n) => `<li><div class="q-text">${esc(n.step)}</div><div class="q-why">${esc(n.when)}</div></li>`
        )
        .join("")}</ul></div>`
    : "";

  const so = r.second_opinion;
  $("#recap-opinion").innerHTML = so
    ? `<div class="card"><h2>Do you need another doctor’s view?</h2>
        <p><strong>${so.worth_considering ? "Worth considering." : "Not usually needed yet."}</strong></p>
        <p class="q-why">${esc(so.reasoning)}</p></div>`
    : "";
}

function familyText() {
  const r = state.recap;
  if (!r) return "";
  const gaps = r.unanswered_questions || [];
  const meds = r.medications || [];
  const places = r.places_to_go || [];
  const notes = $("#live-notes")?.value?.trim();
  return [
    "Bridge — note for family",
    r.headline,
    r.family_note ? `\n${r.family_note}` : "",
    meds.length
      ? `\nMedicine:\n${meds.map((m) => `- ${m.name} ${m.dose || ""} ${m.frequency || ""}`).join("\n")}`
      : "",
    gaps.length
      ? `\nStill unanswered:\n${gaps.map((g) => `- ${g.question}`).join("\n")}`
      : "",
    places.length
      ? `\nWhere to go:\n${places.map((p) => `- ${p.place}: ${p.how}`).join("\n")}`
      : "",
    notes ? `\nNotes from the room:\n${notes}` : "",
    "\nThis is not a medical record. Confirm with the care team.",
  ]
    .filter(Boolean)
    .join("\n");
}

$("#btn-copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(familyText());
    toast(t("copied"));
  } catch (err) {
    toast("Could not copy");
  }
});

function portalMessage(g) {
  const q = (g && g.question) || "";
  return state.uiLang === "es"
    ? `Hola, en mi cita no alcancé a preguntar:\n\n${q}\n\n¿Me pueden responder por el portal o en la próxima cita? Gracias.`
    : `Hello, I did not get to ask this at my visit:\n\n${q}\n\nCould you answer through the portal or at my next appointment? Thank you.`;
}

$("#recap-gaps")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-gap-i]");
  if (!btn) return;
  const gap = (state.recap?.unanswered_questions || [])[Number(btn.dataset.gapI)];
  if (!gap) return;
  try {
    await navigator.clipboard.writeText(portalMessage(gap));
    toast(t("portalCopied"));
  } catch (_) {
    toast("Could not copy");
  }
});

$("#btn-print").addEventListener("click", () => window.print());

$("#btn-export").addEventListener("click", async () => {
  try {
    const data = await api(`/api/session/${state.sessionId}/export`, {
      method: "POST",
      body: JSON.stringify({ session_id: state.sessionId }),
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visit-summary-${state.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Downloaded");
  } catch (err) {
    toast(err.message);
  }
});

$("#btn-reset").addEventListener("click", () => {
  stopPlay();
  stopMic();
  Object.assign(state, {
    sessionId: null,
    sessionSnap: null,
    brief: null,
    recap: null,
    turns: [],
    playIndex: 0,
    asked: new Set(),
    notes: "",
    playing: false,
    speaker: "doctor",
    listening: false,
    recognition: null,
  });
  $("#consent-check").checked = false;
  $("#btn-consent").disabled = true;
  $("#btn-play").disabled = false;
  $("#btn-play").textContent = t("simulate");
  $("#btn-mic").textContent = t("startListening");
  $("#btn-mic").disabled = false;
  $("#transcript").innerHTML = "";
  $("#terms-panel").classList.add("hidden");
  $("#btn-recap").disabled = false;
  $("#btn-recap").textContent = t("writeFamily");
  if ($("#live-notes")) $("#live-notes").value = "";
  if ($("#ask-log")) $("#ask-log").innerHTML = "";
  $("#ask-panel")?.classList.add("hidden");
  $("#ask-toggle")?.setAttribute("aria-expanded", "false");
  renderAudit([]);
  applyI18n();
  showScreen("lang");
});

$("#brand-home").addEventListener("click", (e) => {
  e.preventDefault();
  showScreen("lang");
});

$("#ui-language")?.addEventListener("change", (e) => setUiLang(e.target.value));
$("#language")?.addEventListener("change", (e) => setUiLang(e.target.value));
$("#helping-family")?.addEventListener("change", (e) => {
  state.helpingFamily = e.target.checked;
});
$("#btn-text")?.addEventListener("click", () => {
  state.bigText = !state.bigText;
  document.body.classList.toggle("big-text", state.bigText);
  $("#btn-text").textContent = t(state.bigText ? "textNormal" : "textAa");
});

async function submitPrepFrom(btn) {
  if (!($("#condition")?.value || "").trim()) {
    toast(t("needCondition"));
    showScreen("visit");
    return;
  }
  const original = btn?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="loading"><span class="spinner"></span>${esc(t("pulling"))}</span>`;
  }
  try {
    await runPrep();
  } catch (err) {
    toast(err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = original;
    }
  }
}

$("#btn-lang-next")?.addEventListener("click", () => showScreen("home"));
$("#btn-start")?.addEventListener("click", () => showScreen("visit"));
$("#btn-visit-next")?.addEventListener("click", () => {
  if (!($("#condition")?.value || "").trim()) {
    toast(t("needCondition"));
    return;
  }
  showScreen("story");
});
$("#btn-story-go")?.addEventListener("click", (e) => submitPrepFrom(e.currentTarget));
$("#btn-story-skip")?.addEventListener("click", () => {
  if ($("#medications")) $("#medications").value = "";
  if ($("#other_conditions")) $("#other_conditions").value = "";
  if ($("#allergies")) $("#allergies").value = "";
  if ($("#family_history")) $("#family_history").value = "";
  if ($("#context")) $("#context").value = "";
  if ($("#age_range")) $("#age_range").value = "";
  submitPrepFrom($("#btn-story-go"));
});
$("#btn-to-room")?.addEventListener("click", () => showScreen("consent"));
$("#btn-to-room-2")?.addEventListener("click", () => showScreen("consent"));
$("#btn-brief-more")?.addEventListener("click", () => showScreen("brief-more"));
$("#btn-visit-over")?.addEventListener("click", () => showScreen("after"));
$("#btn-to-gaps")?.addEventListener("click", () => showScreen("after-gaps"));
$("#btn-done")?.addEventListener("click", () => showScreen("home"));

function askStarterList() {
  const es = state.uiLang === "es";
  const screen = state.screen;
  if (screen === "consent" || screen === "live") {
    return es
      ? ["¿Cómo pido un intérprete?", "¿Qué digo si no entiendo?", "¿Puedo pedir que hablen más despacio?"]
      : ["How do I ask for an interpreter?", "What do I say if I don’t understand?", "How do I ask them to slow down?"];
  }
  if (screen === "brief-q" || screen === "brief-more") {
    return es
      ? ["¿Qué es un estudio clínico?", "¿Qué son las medicinas GLP-1?", "¿Qué significa la A1C?"]
      : ["What is a clinical trial?", "What are GLP-1 medicines?", "What does A1C mean?"];
  }
  if (screen === "after-note" || screen === "after-gaps") {
    return es
      ? ["¿Qué escribo en el portal?", "¿Qué es una medicina GLP-1?", "¿El doctor se enoja si pregunto después?"]
      : ["What should I write in the portal?", "What is a GLP-1 medicine?", "Will the doctor mind if I ask after?"];
  }
  return es
    ? [
        "¿Qué significa la A1C?",
        "¿Cómo maneja el azúcar mi cuerpo?",
        "¿Por qué se pone borrosa la vista?",
        "¿Qué es la metformina?",
      ]
    : [
        "What does A1C mean?",
        "How does my body handle sugar?",
        "Why can eyes get blurry?",
        "What is metformin?",
      ];
}

function renderAskStarters() {
  const el = $("#ask-starters");
  if (!el) return;
  el.innerHTML = askStarterList()
    .map((q) => `<button type="button" class="ask-chip">${esc(q)}</button>`)
    .join("");
  el.querySelectorAll(".ask-chip").forEach((btn) =>
    btn.addEventListener("click", () => sendAsk(btn.textContent))
  );
}

function appendAsk(role, html) {
  const log = $("#ask-log");
  if (!log) return;
  const div = document.createElement("div");
  div.className = `ask-msg ${role}`;
  div.innerHTML = html;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

async function sendAsk(text) {
  const message = (text || "").trim();
  if (!message) return;
  const input = $("#ask-input");
  if (input) input.value = "";
  appendAsk("user", esc(message));
  const thinking = state.uiLang === "es" ? "Pensando…" : "Thinking…";
  appendAsk("bot", `<em>${esc(thinking)}</em>`);
  const pending = $("#ask-log")?.lastElementChild;
  try {
    const data = await api("/api/ask", {
      method: "POST",
      body: JSON.stringify({
        message,
        session_id: state.sessionId,
        language: state.uiLang,
      }),
    });
    const r = data.reply || {};
    const related = (r.related_questions || [])
      .map((q) => `<button type="button" class="ask-chip">${esc(q)}</button>`)
      .join("");
    const doctor = r.ask_your_doctor
      ? `<div class="ask-follow"><strong>${esc(t("askDoctor"))}:</strong> ${esc(r.ask_your_doctor)}</div>`
      : "";
    if (pending) {
      pending.innerHTML = `${esc(r.answer || "")}${doctor}${
        related ? `<div class="ask-follow">${related}</div>` : ""
      }`;
      pending.querySelectorAll(".ask-chip").forEach((btn) =>
        btn.addEventListener("click", () => sendAsk(btn.textContent))
      );
    }
    if (data.audit) renderAudit(data.audit);
  } catch (err) {
    if (pending) pending.textContent = err.message;
  }
}

function setAskOpen(open) {
  $("#ask-panel")?.classList.toggle("hidden", !open);
  $("#ask-toggle")?.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) {
    renderAskStarters();
    $("#ask-input")?.focus();
  }
}

$("#ask-toggle")?.addEventListener("click", () => {
  const open = $("#ask-panel")?.classList.contains("hidden");
  setAskOpen(open);
});
$("#ask-close")?.addEventListener("click", () => setAskOpen(false));
$("#ask-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  sendAsk($("#ask-input")?.value);
});

renderAskStarters();
loadOptions();
showScreen("lang");
