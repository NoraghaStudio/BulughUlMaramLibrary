/* ============================================
   BULUGH AL-MARAM — HIFZ PLANNER
   Generate schedules and track memorization
   ============================================ */

const Memorization = (() => {
  const STORAGE_KEY = 'bulugh-hifz-plan';
  const TOTAL_HADITHS = 1351;
  let currentPlan = null;

  function init() {
    _load();
  }

  function _load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        currentPlan = JSON.parse(stored);
      }
    } catch {
      currentPlan = null;
    }
  }

  function _save() {
    if (currentPlan) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPlan));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // --- Date Helpers ---
  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function formatGregorian(date) {
    return new Intl.DateTimeFormat('ar-SA', { 
      year: 'numeric', month: 'long', day: 'numeric', numberingSystem: 'latn' 
    }).format(date);
  }

  function formatHijri(date) {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { 
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(date);
  }

  // --- Plan Generation ---
  function generatePlanByRate(rate) {
    if (!rate || rate < 1) return;
    
    const schedule = [];
    let currentHadith = 1;
    let dayNum = 1;
    const startDate = new Date();
    startDate.setHours(0,0,0,0);

    while (currentHadith <= TOTAL_HADITHS) {
      let start = currentHadith;
      let end = Math.min(start + rate - 1, TOTAL_HADITHS);
      
      const currentDate = addDays(startDate, dayNum - 1);

      schedule.push({
        dayNum,
        dateIso: currentDate.toISOString(),
        gregDateStr: formatGregorian(currentDate),
        hijriDateStr: formatHijri(currentDate),
        startHadith: start,
        endHadith: end,
        count: end - start + 1,
        completed: false
      });

      currentHadith = end + 1;
      dayNum++;
    }

    currentPlan = { schedule, createdAt: startDate.toISOString() };
    _save();
    renderPlanView();
  }

  function generatePlanByDeadline(deadlineStr) {
    if (!deadlineStr) return;
    
    const startDate = new Date();
    startDate.setHours(0,0,0,0);
    const deadlineDate = new Date(deadlineStr);
    deadlineDate.setHours(0,0,0,0);

    const diffTime = deadlineDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays <= 0) {
      alert('الرجاء اختيار تاريخ مستقبلي.');
      return;
    }

    const rate = Math.ceil(TOTAL_HADITHS / diffDays);
    generatePlanByRate(rate);
  }

  function resetPlan() {
    if (confirm('هل أنت متأكد من حذف الخطة الحالية والبدء من جديد؟')) {
      currentPlan = null;
      _save();
      renderPlanView();
    }
  }

  function insertOffDay(dayNum) {
    if (!currentPlan) return;
    const index = currentPlan.schedule.findIndex(d => d.dayNum === dayNum);
    if (index !== -1) {
      currentPlan.schedule.splice(index, 0, {
        dayNum: 0, // placeholder, will be recalculated
        count: 0,
        completed: false
      });
      recalculateSchedule();
    }
  }

  function removeOffDay(dayNum) {
    if (!currentPlan) return;
    const index = currentPlan.schedule.findIndex(d => d.dayNum === dayNum);
    if (index !== -1 && currentPlan.schedule[index].count === 0) {
      currentPlan.schedule.splice(index, 1);
      recalculateSchedule();
    }
  }

  function recalculateSchedule() {
    if (!currentPlan) return;
    
    const startDate = new Date(currentPlan.createdAt);
    let currentHadith = 1;
    let dayNum = 1;
    
    // Process existing array items
    for (let i = 0; i < currentPlan.schedule.length; i++) {
      let day = currentPlan.schedule[i];
      const currentDate = addDays(startDate, dayNum - 1);
      
      day.dayNum = dayNum;
      day.dateIso = currentDate.toISOString();
      day.gregDateStr = formatGregorian(currentDate);
      day.hijriDateStr = formatHijri(currentDate);
      
      if (day.count > 0) {
        day.startHadith = currentHadith;
        let end = Math.min(currentHadith + day.count - 1, TOTAL_HADITHS);
        day.endHadith = end;
        day.count = end - currentHadith + 1; // adjust count if clamped by TOTAL_HADITHS
        currentHadith = end + 1;
      } else {
        day.startHadith = null;
        day.endHadith = null;
      }
      dayNum++;
    }
    
    // If we haven't reached TOTAL_HADITHS, append more days
    while (currentHadith <= TOTAL_HADITHS) {
      let lastValidCount = 5; 
      for (let k = currentPlan.schedule.length - 1; k >= 0; k--) {
         if (currentPlan.schedule[k].count > 0) {
            lastValidCount = currentPlan.schedule[k].count;
            break;
         }
      }
      
      let count = Math.min(lastValidCount, TOTAL_HADITHS - currentHadith + 1);
      const currentDate = addDays(startDate, dayNum - 1);
      
      currentPlan.schedule.push({
        dayNum: dayNum,
        dateIso: currentDate.toISOString(),
        gregDateStr: formatGregorian(currentDate),
        hijriDateStr: formatHijri(currentDate),
        startHadith: currentHadith,
        endHadith: currentHadith + count - 1,
        count: count,
        completed: false
      });
      
      currentHadith += count;
      dayNum++;
    }
    
    // Slice off trailing days if we reached TOTAL_HADITHS early
    let lastValidIndex = -1;
    for (let i = 0; i < currentPlan.schedule.length; i++) {
        if (currentPlan.schedule[i].count > 0 && currentPlan.schedule[i].endHadith === TOTAL_HADITHS) {
            lastValidIndex = i;
            break;
        }
    }
    
    if (lastValidIndex !== -1) {
        currentPlan.schedule = currentPlan.schedule.slice(0, lastValidIndex + 1);
    }
    
    _save();
    renderPlanView();
  }

  function toggleDayStatus(dayNum) {
    if (!currentPlan) return;
    const day = currentPlan.schedule.find(d => d.dayNum === dayNum);
    if (day) {
      day.completed = !day.completed;
      _save();
      _updateStats();
      
      // Update DOM visually without full re-render
      const card = document.querySelector(`.hifz-day-card[data-day="${dayNum}"]`);
      if (card) {
        card.classList.toggle('hifz-day-card--completed', day.completed);
      }
    }
  }

  // --- Rendering ---
  function renderPlanView() {
    const formContainer = document.getElementById('hifz-planner-form-container');
    const statsContainer = document.getElementById('hifz-stats-container');
    const scheduleContainer = document.getElementById('hifz-schedule-container');
    const resetBtn = document.getElementById('hifz-reset-btn');

    if (!formContainer || !scheduleContainer) return;

    if (!currentPlan) {
      // Show form, hide schedule
      formContainer.style.display = 'block';
      statsContainer.style.display = 'none';
      resetBtn.style.display = 'none';
      scheduleContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon"><svg class="ui-icon" style="width: 48px; height: 48px;"><use href="#icon-edit"></use></svg></div>
          <h3 class="empty-state__title">لا توجد خطة حالية</h3>
          <p class="empty-state__text">قم بتحديد عدد الأحاديث اليومية أو تاريخ الختم لإنشاء جدولك المخصص.</p>
        </div>
      `;
      return;
    }

    // Hide form, show schedule
    formContainer.style.display = 'none';
    statsContainer.style.display = 'flex';
    resetBtn.style.display = 'inline-flex';

    // Render schedule
    scheduleContainer.innerHTML = currentPlan.schedule.map(day => `
      <div class="hifz-day-card ${day.completed ? 'hifz-day-card--completed' : ''} ${day.count === 0 ? 'hifz-day-card--off' : ''}" data-day="${day.dayNum}">
        ${day.count > 0 ? `<input type="checkbox" class="hifz-day__checkbox" data-action="toggle-day" data-day="${day.dayNum}" ${day.completed ? 'checked' : ''}>` : '<div style="width: 24px;"></div>'}
        <div class="hifz-day__number">اليوم ${day.dayNum}</div>
        <div class="hifz-day__dates">
          <span class="hifz-day__date-hijri">${day.hijriDateStr}</span>
          <span class="hifz-day__date-greg">${day.gregDateStr}</span>
        </div>
        <div class="hifz-day__range">
          ${day.count > 0 ? `الأحاديث (${day.startHadith} - ${day.endHadith})` : `<span class="hifz-day__off-label"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg> يوم راحة</span>`}
        </div>
        <div class="hifz-day__actions" style="display: flex; gap: var(--space-2);">
          ${day.count > 0 ? `
            <button class="btn btn--ghost btn--icon-sm" data-action="view-hadith" data-hadith="${day.startHadith}" data-tooltip="عرض الأحاديث"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></button>
            <button class="btn btn--ghost btn--icon-sm" data-action="insert-off" data-day="${day.dayNum}" data-tooltip="إضافة يوم راحة قبله"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg></button>
          ` : `
            <button class="btn btn--ghost btn--icon-sm" data-action="remove-off" data-day="${day.dayNum}" data-tooltip="إلغاء يوم الراحة"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          `}
        </div>
      </div>
    `).join('');

    // Attach event listeners
    scheduleContainer.querySelectorAll('[data-action="toggle-day"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const dayNum = parseInt(e.target.dataset.day);
        toggleDayStatus(dayNum);
      });
    });

    scheduleContainer.querySelectorAll('[data-action="view-hadith"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const startHadith = e.target.closest('button').dataset.hadith;
        if (window.Router) {
          Router.navigate('hadith/' + startHadith);
        }
      });
    });

    scheduleContainer.querySelectorAll('[data-action="insert-off"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dayNum = parseInt(e.target.closest('button').dataset.day);
        insertOffDay(dayNum);
      });
    });

    scheduleContainer.querySelectorAll('[data-action="remove-off"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dayNum = parseInt(e.target.closest('button').dataset.day);
        removeOffDay(dayNum);
      });
    });

    _updateStats();
  }

  function _updateStats() {
    if (!currentPlan) return;

    let totalDays = currentPlan.schedule.length;
    let completedDays = 0;
    let completedHadiths = 0;

    for (const day of currentPlan.schedule) {
      if (day.completed) {
        completedDays++;
        completedHadiths += day.count;
      }
    }

    const daysLeft = totalDays - completedDays;
    const hadithsLeft = TOTAL_HADITHS - completedHadiths;
    const percent = Math.round((completedHadiths / TOTAL_HADITHS) * 100);

    const elDays = document.getElementById('hifz-days-left');
    const elHadiths = document.getElementById('hifz-hadiths-left');
    const elPercent = document.getElementById('hifz-percent');

    if (elDays) elDays.textContent = daysLeft;
    if (elHadiths) elHadiths.textContent = hadithsLeft;
    if (elPercent) elPercent.textContent = percent + '%';
  }

  // Support for the router (replacing old renderMemorizeView)
  function initPlannerUI() {
    const radioRate = document.querySelector('input[value="rate"]');
    const radioDeadline = document.querySelector('input[value="deadline"]');
    
    if (radioRate && radioDeadline) {
      radioRate.onchange = () => {
        document.getElementById('hifz-input-rate').style.display = 'flex';
        document.getElementById('hifz-input-deadline').style.display = 'none';
      };
      radioDeadline.onchange = () => {
        document.getElementById('hifz-input-rate').style.display = 'none';
        document.getElementById('hifz-input-deadline').style.display = 'flex';
      };
    }

    document.getElementById('hifz-generate-btn')?.addEventListener('click', () => {
      const mode = document.querySelector('input[name="plan_mode"]:checked')?.value;
      if (mode === 'rate') {
        const rate = parseInt(document.getElementById('hifz-rate-value').value);
        generatePlanByRate(rate);
      } else {
        const deadline = document.getElementById('hifz-deadline-value').value;
        generatePlanByDeadline(deadline);
      }
    });

    document.getElementById('hifz-reset-btn')?.addEventListener('click', resetPlan);

    // Initial render
    renderPlanView();
  }

  // To keep compatibility with progress view if needed, though we replaced the core stats
  function renderProgressView() {
    const container = document.getElementById('progress-content');
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon"><svg class="ui-icon" style="width: 48px; height: 48px;"><use href="#icon-construction"></use></svg></div>
        <h3 class="empty-state__title">صفحة التقدم قيد التطوير</h3>
        <p class="empty-state__text">الرجاء متابعة إنجازك من خلال علامة تبويب "خطة الحفظ".</p>
      </div>
    `;
  }

  return {
    init,
    initPlannerUI,
    generatePlanByRate,
    generatePlanByDeadline,
    toggleDayStatus,
    insertOffDay,
    removeOffDay,
    renderPlanView,
    renderProgressView
  };
})();
