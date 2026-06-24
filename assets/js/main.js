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
})();
