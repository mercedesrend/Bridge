/* Bridge — frontend */

const API = "";
const state = {
  sessionId: null,
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
};

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
  if (src === "live") return `<span class="pill pill-live">live AI</span>`;
  if (src === "scripted_after_error")
    return `<span class="pill pill-scripted">fallback used</span>`;
  return `<span class="pill pill-scripted">scripted</span>`;
}

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.detail) msg = body.detail;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

function syncTheme() {
  const landing =
    $("#phase-before").classList.contains("is-active") &&
    !$("#before-form").classList.contains("hidden");
  document.body.classList.toggle("theme-dark", landing);
  document.body.classList.toggle("theme-light", !landing);
}

function goto(phase) {
  $$(".phase").forEach((p) => p.classList.remove("is-active"));
  $(`#phase-${phase}`).classList.add("is-active");
  $$(".nav-link").forEach((s) =>
    s.classList.toggle("is-active", s.dataset.phase === phase)
  );
  syncTheme();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$(".nav-link").forEach((s) =>
  s.addEventListener("click", () => goto(s.dataset.phase))
);
$$("[data-goto]").forEach((b) =>
  b.addEventListener("click", () => goto(b.dataset.goto))
);

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

    $("#reading_level").innerHTML = opts.reading_levels
      .map((r) => `<option value="${r.code}">${esc(r.label)}</option>`)
      .join("");

    const setHint = () => {
      const lvl = opts.reading_levels.find(
        (r) => r.code === $("#reading_level").value
      );
      $("#reading-hint").textContent = lvl ? lvl.hint : "";
    };
    $("#reading_level").addEventListener("change", setHint);
    setHint();

    const m = opts.mode;
    const live = m.llm === "live";
    $("#mode-pill").className = `pill ${live ? "pill-live" : "pill-scripted"}`;
    $("#mode-pill").textContent = live ? `live · ${m.model}` : "scripted mode";
  } catch (err) {
    $("#mode-pill").textContent = "backend offline";
    toast("Can't reach the backend. Is it running on port 8000?");
  }
}

function setLangChip(code) {
  const chip = $("#lang-chip");
  if (!code) {
    chip.classList.add("hidden");
    return;
  }
  chip.textContent = languageName(code);
  chip.classList.remove("hidden");
}

$("#btn-demo").addEventListener("click", () => {
  const d = state.options?.demo_patient;
  if (!d) return;
  $("#condition").value = d.condition;
  $("#symptoms").value = d.symptoms;
  $("#language").value = d.language;
  $("#reading_level").value = d.reading_level;
  $("#reading_level").dispatchEvent(new Event("change"));
  toast("Demo loaded — Spanish-speaking, first specialist visit");
  $("#prep-form").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#prep-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const original = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = `<span class="loading"><span class="spinner"></span>Pulling studies…</span>`;

  try {
    const payload = {
      condition: $("#condition").value.trim(),
      symptoms: $("#symptoms").value.trim(),
      language: $("#language").value,
      reading_level: $("#reading_level").value,
    };
    const data = await api("/api/prep", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.sessionId = data.session_id;
    state.brief = data.brief;
    state.asked = new Set();
    renderAudit(data.audit);
    renderBrief(data.brief);
    setLangChip(payload.language);
    $("#before-form").classList.add("hidden");
    $("#before-result").classList.remove("hidden");
    markDone("before");
    syncTheme();
  } catch (err) {
    toast(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
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
              q.priority === "high" ? `<span class="pill pill-high">ask first</span>` : ""
            }</div>
            <div class="q-why">${esc(q.why)}</div>
          </span>
        </label>`;
      }
      return `<li>
        <div class="q-text">${esc(q.question)} ${
          q.priority === "high" ? `<span class="pill pill-high">ask first</span>` : ""
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
        <h2>You do not have to be a good guest</h2>
        <ul class="tip-list">${tips.map((t) => `<li>${esc(t.tip)}</li>`).join("")}</ul>
      </div>`
    : "";

  const qs = b.questions || [];
  $("#brief-questions").innerHTML = qs.length
    ? `<div class="card">
        <p class="tx-kicker">Take this in with you</p>
        <h2>Questions, in order</h2>
        <p class="hint" style="margin-bottom:14px">Ask the ones marked first. Check them off in the room so we can see what never came up.</p>
        <div id="prep-q-list">${questionsHtml(qs, true)}</div>
      </div>`
    : "";
  if (qs.length) bindQuestionChecks($("#prep-q-list"));

  const std = b.standard_treatments || [];
  const emerging = b.emerging_options || [];
  $("#brief-treatments").innerHTML =
    std.length || emerging.length
      ? `<div class="tx-grid">
          ${
            std.length
              ? `<div class="card tx-card">
                  <p class="tx-kicker">Usually offered</p>
                  <h2>Standard care</h2>
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
                  <p class="tx-kicker">Often not mentioned unless you ask</p>
                  <h2>Newer options</h2>
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

  const trials = b.trials || [];
  $("#brief-trials").innerHTML = trials.length
    ? `<div class="card">
        <p class="tx-kicker">Treatment observability</p>
        <h2>Studies worth asking about</h2>
        <p class="hint" style="margin-bottom:14px">Not a match — a conversation starter. Matching by condition only, not eligibility. Ask your doctor if any of this applies to you.</p>
        ${trials
          .map(
            (t) => `<div class="src">
              <div>
                <a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.title)}</a>
                <div class="src-meta">${esc(t.status || "")}${
                  (t.locations || [])[0] ? " · " + esc(t.locations[0]) : ""
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
        <h2>Where this came from</h2>
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
  toast("No problem — Prepare and For the family still work without captions.");
});

$("#btn-consent").addEventListener("click", async () => {
  if (!state.sessionId) {
    toast("Start with Prepare so we know your language.");
    goto("before");
    return;
  }
  try {
    const consentText = $(".consent-list").innerText;
    const data = await api("/api/session/consent", {
      method: "POST",
      body: JSON.stringify({
        session_id: state.sessionId,
        consent_given: true,
        consent_text_shown: consentText,
      }),
    });
    renderAudit(data.audit);
    $("#consent-gate").classList.add("hidden");
    $("#live-view").classList.remove("hidden");
    renderLiveQuestions();
    markDone("during");
    toast("Captions on. Nothing leaves this phone.");
  } catch (err) {
    toast(err.message);
  }
});

function renderLiveQuestions() {
  const qs = state.brief?.questions || [];
  $("#live-questions").innerHTML = qs.length
    ? `<p class="tx-kicker">Your list</p>
       <h2>Check off what you asked</h2>
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
  if (btn) btn.textContent = "Start listening";
  setSttStatus("Mic off — or simulate the visit for the demo.");
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
    $("#btn-mic").textContent = "Stop listening";
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
    goto("before");
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
    $("#after-empty").classList.add("hidden");
    $("#after-result").classList.remove("hidden");
    markDone("after");
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
            (g) => `<div class="gap">
              <div class="gap-q">${esc(g.question)}</div>
              <div class="gap-why">${esc(g.why_it_matters)}</div>
              <div class="gap-how"><strong>What to do:</strong> ${esc(g.how_to_follow_up)}</div>
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
    toast("Copied — send it to whoever helps you decide");
  } catch (err) {
    toast("Could not copy");
  }
});

$("#btn-print").addEventListener("click", () => window.print());

$("#btn-export").addEventListener("click", async () => {
  try {
    const data = await api(`/api/session/${state.sessionId}/export`);
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
  $("#before-form").classList.remove("hidden");
  $("#before-result").classList.add("hidden");
  $("#consent-gate").classList.remove("hidden");
  $("#live-view").classList.add("hidden");
  $("#after-empty").classList.remove("hidden");
  $("#after-result").classList.add("hidden");
  $("#consent-check").checked = false;
  $("#btn-consent").disabled = true;
  $("#btn-play").disabled = false;
  $("#btn-play").textContent = "Simulate appointment";
  $("#btn-mic").textContent = "Start listening";
  $("#btn-mic").disabled = false;
  $("#transcript").innerHTML = "";
  $("#terms-panel").classList.add("hidden");
  $("#btn-recap").disabled = false;
  $("#btn-recap").textContent = "Write it for my family";
  if ($("#live-notes")) $("#live-notes").value = "";
  $$(".nav-link").forEach((s) => s.classList.remove("is-done"));
  setLangChip(null);
  renderAudit([]);
  goto("before");
});

loadOptions();
syncTheme();

$("#brand-home").addEventListener("click", (e) => {
  e.preventDefault();
  goto("before");
});
