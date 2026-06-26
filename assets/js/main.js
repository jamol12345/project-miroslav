/* ============================================================
   Центр «Мирослав» — клиентская логика
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Мобильное меню ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("mobile-menu");

  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Открыть меню");
    menu.classList.remove("is-open");
  }
  function openMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Закрыть меню");
    menu.classList.add("is-open");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeMenu() : openMenu();
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- Появление секций при скролле ---------- */
  const reveals = document.querySelectorAll(".reveal");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reveals.length && !prefersReducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Видеогалерея «Наши специалисты» ---------- */
  const specialistCards = document.querySelectorAll(".specialist-card");

  if (specialistCards.length) {
    const videos = [];

    specialistCards.forEach(function (card) {
      const video = card.querySelector(".specialist-card__video");
      const playBtn = card.querySelector(".specialist-card__play");
      if (!video) return;
      videos.push(video);

      // Клик по золотой кнопке-постеру запускает ролик
      if (playBtn) {
        playBtn.addEventListener("click", function () {
          video.play();
        });
      }

      // При старте — прячем постер и ставим остальные ролики на паузу
      video.addEventListener("play", function () {
        card.classList.add("is-playing");
        videos.forEach(function (other) {
          if (other !== video) other.pause();
        });
      });

      // По окончании — возвращаем постер
      video.addEventListener("ended", function () {
        card.classList.remove("is-playing");
        video.currentTime = 0;
      });
    });
  }

  /* ---------- Карусель отзывов ---------- */
  const reviewsTrack = document.getElementById("reviews-track");

  if (reviewsTrack) {
    const prevBtn = document.querySelector(".reviews-nav--prev");
    const nextBtn = document.querySelector(".reviews-nav--next");
    const dotsWrap = document.getElementById("reviews-dots");
    const behavior = prefersReducedMotion ? "auto" : "smooth";

    function metrics() {
      const cards = reviewsTrack.children;
      if (!cards.length) return { step: reviewsTrack.clientWidth || 1, pages: 1 };
      const cardW = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(reviewsTrack).columnGap) || 0;
      const per = cardW + gap;
      const visible = Math.max(1, Math.round((reviewsTrack.clientWidth + gap) / per));
      return { step: visible * per, pages: Math.max(1, Math.ceil(cards.length / visible)) };
    }
    function pageCount() { return metrics().pages; }
    function currentPage() {
      return Math.round(reviewsTrack.scrollLeft / metrics().step);
    }
    function updateDots() {
      if (!dotsWrap) return;
      const cur = currentPage();
      Array.prototype.forEach.call(dotsWrap.children, function (dot, i) {
        dot.classList.toggle("is-active", i === cur);
      });
    }
    function buildDots() {
      if (!dotsWrap) return;
      const n = pageCount();
      dotsWrap.innerHTML = "";
      for (let i = 0; i < n; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Показать отзывы, страница " + (i + 1));
        b.addEventListener("click", function () {
          reviewsTrack.scrollTo({ left: i * metrics().step, behavior: behavior });
        });
        dotsWrap.appendChild(b);
      }
      updateDots();
    }

    if (prevBtn) prevBtn.addEventListener("click", function () {
      reviewsTrack.scrollBy({ left: -metrics().step, behavior: behavior });
    });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      reviewsTrack.scrollBy({ left: metrics().step, behavior: behavior });
    });

    let rafPending = false;
    reviewsTrack.addEventListener("scroll", function () {
      if (rafPending) return;
      rafPending = true;
      window.requestAnimationFrame(function () { updateDots(); rafPending = false; });
    });

    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildDots, 200);
    });

    buildDots();
  }

  /* ---------- Форма заявки (фронт-валидация + экран успеха) ---------- */
  const form = document.getElementById("lead-form");
  const success = document.getElementById("form-success");

  if (form) {
    const fields = [
      { id: "name", validate: function (v) { return v.trim().length >= 2; } },
      { id: "contact-method", validate: function (v) { return v.trim().length >= 4; } },
      { id: "message", validate: function (v) { return v.trim().length >= 2; } },
    ];

    function validateField(field) {
      const input = document.getElementById(field.id);
      const wrap = input.closest(".form-field");
      const ok = field.validate(input.value);
      wrap.classList.toggle("has-error", !ok);
      return ok;
    }

    // Снимать ошибку по мере ввода
    fields.forEach(function (field) {
      const input = document.getElementById(field.id);
      input.addEventListener("input", function () {
        const wrap = input.closest(".form-field");
        if (wrap.classList.contains("has-error")) validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let valid = true;
      let firstInvalid = null;
      fields.forEach(function (field) {
        const ok = validateField(field);
        if (!ok && !firstInvalid) firstInvalid = document.getElementById(field.id);
        valid = valid && ok;
      });

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Прототип: бэкенда нет — показываем экран успеха.
      // На проде здесь будет fetch() на endpoint / Telegram-уведомление.
      form.style.display = "none";
      if (success) {
        success.classList.add("is-active");
        success.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
      }
    });
  }

  /* ---------- Квиз «Что вас беспокоит» → форма заявки ---------- */
  const quizOptions = document.querySelectorAll(".quiz-option");

  if (quizOptions.length && form) {
    const messageField = document.getElementById("message");
    const nameField = document.getElementById("name");

    quizOptions.forEach(function (option) {
      option.addEventListener("click", function () {
        const topic = option.getAttribute("data-topic") || "";

        // Подставляем тему в поле вопроса, не затирая уже введённый текст
        if (messageField) {
          const prefix = "Тема обращения: " + topic + ". ";
          messageField.value = /^Тема обращения: /.test(messageField.value)
            ? prefix
            : prefix + messageField.value;
          const wrap = messageField.closest(".form-field");
          if (wrap) wrap.classList.remove("has-error");
        }

        // Плавно ведём человека к форме и ставим курсор в первое поле
        const target = document.getElementById("contact");
        if (target) {
          target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
        }
        if (nameField) {
          window.setTimeout(function () { nameField.focus({ preventScroll: true }); }, prefersReducedMotion ? 0 : 500);
        }
      });
    });
  }

  /* ---------- 3D-наклон карточек при наведении ---------- */
  const tiltCards = document.querySelectorAll(".master-card, .service-card");
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  if (tiltCards.length && !prefersReducedMotion && !coarsePointer) {
    const MAX_TILT = 8; // градусов

    tiltCards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.classList.add("is-tilt");
        card.style.transform =
          "perspective(900px) rotateY(" + (px * MAX_TILT).toFixed(2) + "deg) " +
          "rotateX(" + (-py * MAX_TILT).toFixed(2) + "deg) translateZ(8px)";
      });

      card.addEventListener("mouseleave", function () {
        card.classList.remove("is-tilt");
        card.style.transform = "";
      });
    });
  }
})();
