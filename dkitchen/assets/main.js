/* ═══════════════════════════════════════════════
   多味厨房官网 · 交互脚本（Android.com 风格）
   ═══════════════════════════════════════════════ */
(function () {
  "use strict";

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 启动闪屏 ---------- */
  const splash = $("#splash");
  const hideSplash = () => splash && splash.classList.add("hide");
  window.addEventListener("load", () => setTimeout(hideSplash, reducedMotion ? 0 : 700));
  setTimeout(hideSplash, 2200); // 兜底

  /* ---------- 2. 导航滚动阴影 + 进度条 + 返回顶部 ---------- */
  const nav = $("#topbar");
  const progress = $("#scrollProgress");
  const backTop = $("#backTop");
  let navTick = false;
  function onScroll() {
    if (navTick) return;
    navTick = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle("scrolled", y > 6);
      backTop.classList.toggle("show", y > 700);
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      navTick = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));

  /* ---------- 2.5 Material 波纹 ---------- */
  const RIPPLE_SEL = ".btn, .fcard, .card, .dl-card, .seg-btn, .faq-q, .car-btn, .drawer-nav a, .nav-links a, .marquee-track span";
  document.addEventListener("pointerdown", (e) => {
    const host = e.target.closest(RIPPLE_SEL);
    if (!host || reducedMotion) return;
    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ink = document.createElement("span");
    ink.className = "ripple-ink";
    ink.style.width = ink.style.height = size + "px";
    ink.style.left = e.clientX - rect.left - size / 2 + "px";
    ink.style.top = e.clientY - rect.top - size / 2 + "px";
    host.appendChild(ink);
    setTimeout(() => ink.remove(), 700);
  });

  /* ---------- 3. 公告条关闭 ---------- */
  const banner = $("#banner");
  $("#bannerClose").addEventListener("click", () => banner.classList.add("hide"));

  /* ---------- 4. 移动端抽屉 ---------- */
  const drawer = $("#drawer"), scrim = $("#scrim");
  function setDrawer(open) {
    drawer.classList.toggle("show", open);
    scrim.classList.toggle("show", open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  $("#menuBtn").addEventListener("click", () => setDrawer(true));
  scrim.addEventListener("click", () => setDrawer(false));
  $$(".drawer-nav a, .drawer-cta").forEach((a) => a.addEventListener("click", () => setDrawer(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setDrawer(false); });

  /* ---------- 5. 滚动显现（交错） ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.style.setProperty("--d", el.dataset.delay || 0);
      el.classList.add("in");
      io.unobserve(el);
    }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- 6. 数字滚动 ---------- */
  const nio = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target, target = +el.dataset.count, dur = 1500, t0 = performance.now();
      (function tick(t) {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
      nio.unobserve(el);
    }),
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => nio.observe(el));

  /* ---------- 7. 冰箱分区切换 ---------- */
  const fdTemp = $("#fdTemp");
  $$("#fridgeSeg .seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("#fridgeSeg .seg-btn").forEach((b) => { b.classList.toggle("active", b === btn); b.setAttribute("aria-selected", b === btn); });
      const zone = btn.dataset.view;
      $$("#fridgeDemo .shelf").forEach((s) => s.classList.toggle("hidden", s.dataset.zone !== zone));
      if (fdTemp) fdTemp.textContent = zone === "cooling" ? "4℃" : "-18℃";
      $$("#fridgeDemo .shelf:not(.hidden) .pop").forEach((item) => {
        item.style.animation = "none";
        void item.offsetWidth;
        item.style.animation = "";
      });
    });
  });
  const fio = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { $$("#fridgeDemo .shelf").forEach((s) => s.classList.add("in")); fio.disconnect(); }
  }), { threshold: 0.35 });
  const fd = $("#fridgeDemo");
  if (fd) fio.observe(fd);

  /* ---------- 8. AI 打字机（循环） ---------- */
  const aiText = $("#aiText");
  const lines = [
    "推荐「番茄炖牛腩」🍅 牛腩今天到期，正好优先消耗！炖 90 分钟软烂入味…",
    "试试「芝士番茄焗饭」🧀 剩余芝士片 + 番茄 + 鸡蛋，烤箱 200℃ 12 分钟搞定～",
    "来一份「牛腩蔬菜汤面」🍜 生菜最后烫 10 秒，一锅出，晚餐 25 分钟！",
  ];
  let li = 0, ci = 0, deleting = false;
  function typeLoop() {
    if (!aiText) return;
    const cur = lines[li];
    if (!deleting) {
      aiText.textContent = cur.slice(0, ++ci);
      if (ci === cur.length) { deleting = true; setTimeout(typeLoop, 3200); return; }
      setTimeout(typeLoop, 42 + Math.random() * 46);
    } else {
      aiText.textContent = cur.slice(0, --ci);
      if (ci === 0) { deleting = false; li = (li + 1) % lines.length; setTimeout(typeLoop, 480); return; }
      setTimeout(typeLoop, 12);
    }
  }
  const aio = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { typeLoop(); aio.disconnect(); }
  }), { threshold: 0.3 });
  if (aiText) aio.observe(aiText.closest(".ai-demo") || aiText);

  /* ---------- 9. 小票识别 ---------- */
  const receipt = $("#receiptDemo");
  function playReceipt() {
    if (!receipt) return;
    receipt.classList.remove("scanning", "scanned");
    void receipt.offsetWidth;
    receipt.classList.add("scanning");
    setTimeout(() => receipt.classList.add("scanned"), 700);
  }
  const rio = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { playReceipt(); rio.disconnect(); }
  }), { threshold: 0.45 });
  if (receipt) rio.observe(receipt);
  const replay = $("#replayScan");
  replay && replay.addEventListener("click", playReceipt);

  /* ---------- 10. 米家温度盘 ---------- */
  const dial = $("#dial"), dialFg = $("#dialFg"), dialTemp = $("#dialTemp"), dialZone = $("#dialZone");
  const CIRC = 2 * Math.PI * 52;
  function setDial(temp, zoneLabel, cooling) {
    if (!dialFg) return;
    const pct = cooling ? 0.24 : 0.82;
    dial.classList.toggle("cold", !cooling);
    dialTemp.textContent = temp + "℃";
    dialZone.textContent = zoneLabel;
    dialFg.style.strokeDasharray = CIRC;
    dialFg.style.strokeDashoffset = CIRC;
    requestAnimationFrame(() => { dialFg.style.strokeDashoffset = CIRC * (1 - pct); });
  }
  const dio = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { setDial(4, "冷藏室设定", true); dio.disconnect(); }
  }), { threshold: 0.4 });
  if (dial) dio.observe(dial);
  $$("#dialSeg .seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
      setDial(+btn.dataset.temp, btn.dataset.zone, btn.dataset.cool === "1");
    });
  });
  function bindSwitch(id, label) {
    const sw = $(id);
    sw && sw.addEventListener("click", () => {
      sw.classList.toggle("on");
      showSnackbar(sw.classList.contains("on") ? label + "已开启（实验功能演示）" : label + "已关闭");
    });
  }
  bindSwitch("#swCool", "💨 速冷模式");
  bindSwitch("#swFreeze", "❄️ 速冻模式");
  const betaSw = $("#betaSwitch");
  betaSw && betaSw.addEventListener("click", () => {
    betaSw.classList.toggle("on");
    showSnackbar(betaSw.classList.contains("on") ? "🚀 已加入预览体验计划（演示）" : "已退出预览体验计划（演示）");
  });

  /* ---------- 11. 界面预览轮播 ---------- */
  const car = $("#carousel"), dots = $("#carDots");
  if (car && dots) {
    const shots = $$(".shot", car);
    shots.forEach((_, i) => {
      const d = document.createElement("button");
      d.setAttribute("aria-label", "第 " + (i + 1) + " 屏");
      if (i === 0) d.classList.add("active");
      d.addEventListener("click", () => shots[i].scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" }));
      dots.appendChild(d);
    });
    let raf;
    car.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = car.scrollLeft + car.clientWidth / 2;
        let best = 0, bd = Infinity;
        shots.forEach((s, i) => {
          const c = s.offsetLeft + s.offsetWidth / 2;
          const d = Math.abs(c - center);
          if (d < bd) { bd = d; best = i; }
        });
        $$("button", dots).forEach((b, i) => b.classList.toggle("active", i === best));
      });
    }, { passive: true });
    $("#carPrev").addEventListener("click", () => car.scrollBy({ left: -car.clientWidth * 0.7, behavior: "smooth" }));
    $("#carNext").addEventListener("click", () => car.scrollBy({ left: car.clientWidth * 0.7, behavior: "smooth" }));
  }

  /* ---------- 12. FAQ 手风琴 ---------- */
  $$(".faq-item").forEach((item) => {
    const q = $(".faq-q", item);
    q.addEventListener("click", () => {
      const open = item.classList.contains("open");
      $$(".faq-item.open").forEach((o) => { o.classList.remove("open"); $(".faq-q", o).setAttribute("aria-expanded", "false"); });
      if (!open) { item.classList.add("open"); q.setAttribute("aria-expanded", "true"); }
    });
  });

  /* ---------- 13. Snackbar ---------- */
  const snackbar = $("#snackbar");
  let snackTimer;
  function showSnackbar(msg) {
    snackbar.textContent = msg;
    snackbar.classList.add("show");
    clearTimeout(snackTimer);
    snackTimer = setTimeout(() => snackbar.classList.remove("show"), 2800);
  }
  window.showSnackbar = showSnackbar;
  $$("[data-snackbar]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (el.getAttribute("href") === "#") e.preventDefault();
      showSnackbar(el.dataset.snackbar);
    });
  });

  /* ---------- 14. Hero 手机 3D 视差（指针细腻时） ---------- */
  const stage = $(".hero-stage"), phoneWrap = $("#phoneTilt"), phone = phoneWrap && $(".phone", phoneWrap);
  if (stage && phone && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    let rafT = null, tx = 0, ty = 0;
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * 8; ty = -py * 6;
      if (!rafT) rafT = requestAnimationFrame(() => {
        phone.style.transform = `rotateY(${tx}deg) rotateX(${ty}deg)`;
        rafT = null;
      });
    });
    stage.addEventListener("pointerleave", () => { phone.style.transform = ""; });
  }
})();
