const CalendarModule = {
  currentDate: new Date(), // 中心となる月

  render(container) {
    this.container = container;
    this.refresh();
  },

  refresh() {
    if (!this.container) return;

    // メインコンテナの作成
    this.container.innerHTML = `
      <div class="calendar-main-container">
        <div class="calendar-scroll-area">
          <div class="card" style="margin-bottom: 8px;">
            <div class="calendar-month-header" style="border-bottom:none; margin-bottom:0;">
              <span class="calendar-title">📅 点検カレンダー</span>
              <div class="calendar-nav-controls">
                <button class="btn btn-sm btn-secondary" id="calPrev1" title="前の1ヶ月">◀️ 前の1ヶ月</button>
                <button class="btn btn-sm btn-secondary" id="calToday" title="今月に戻る">📍 今月</button>
                <button class="btn btn-sm btn-secondary" id="calNext1" title="次の1ヶ月">次の1ヶ月 ▶️</button>
              </div>
            </div>
          </div>
          <div id="calendarScrollArea" style="display:flex; flex-direction:column; gap:16px;">
            <!-- 4ヶ月分のカレンダーと予定リストがここに挿入される -->
          </div>
        </div>
      </div>
    `;

    this._renderFourMonths();
    this._bindEvents();
  },

  _bindEvents() {
    document.getElementById('calPrev1')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.refresh();
    });
    document.getElementById('calNext1')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.refresh();
    });
    document.getElementById('calToday')?.addEventListener('click', () => {
      this.currentDate = new Date();
      this.refresh();
    });
  },

  _renderFourMonths() {
    const scrollArea = document.getElementById('calendarScrollArea');
    const startMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    
    for (let i = 0; i < 4; i++) {
      const targetMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      const monthItem = document.createElement('div');
      monthItem.className = 'calendar-month-item';
      
      monthItem.innerHTML = `
        <div class="calendar-month-grid-part">
          <div class="calendar-month-header">
            <span class="calendar-month-title">${targetMonth.getFullYear()}年 ${targetMonth.getMonth() + 1}月</span>
          </div>
          <div class="calendar-grid"></div>
        </div>
        <div class="calendar-month-list-part">
          <div class="calendar-upcoming-title" style="margin-bottom:12px;">点検予定</div>
          <div class="month-specific-list"></div>
        </div>
      `;
      
      scrollArea.appendChild(monthItem);
      
      // グリッドの描画
      this._renderMonthGrid(targetMonth.getFullYear(), targetMonth.getMonth(), monthItem.querySelector('.calendar-grid'));
      
      // その月の予定リストの描画
      this._renderMonthSpecificList(targetMonth.getFullYear(), targetMonth.getMonth(), monthItem.querySelector('.month-specific-list'));
    }
  },

  _renderMonthSpecificList(year, month, listContainer) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const inspections = spService._getFromLocal('inspection');
    const equipments = spService._getFromLocal('equipment');
    const today = new Date().toISOString().split('T')[0];

    let list = [];
    inspections.forEach(insp => {
      const eq = equipments.find(e => e.equipmentId === insp.equipmentId);
      const checkAndAdd = (date, nameSuffix) => {
        if (date >= startStr && date <= endStr) {
          list.push({
            date: date,
            equipmentId: insp.equipmentId,
            name: (eq ? eq.equipmentName : insp.equipmentId) + nameSuffix,
            person: eq ? eq.personInCharge : '-',
            overdue: date < today
          });
        }
      };
      checkAndAdd(insp.nextInspectionDate, ' (定期1)');
      checkAndAdd(insp.nextInspectionDate2, ' (定期2)');
      checkAndAdd(insp.nextMonthlyInspectionDate, ' (月次)');
    });

    list.sort((a,b) => a.date.localeCompare(b.date));

    if (!list.length) {
      listContainer.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; margin-top:20px;">表示期間に予定なし</p>`;
      return;
    }

    listContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${list.map(it => `
          <div class="upcoming-item ${it.overdue?'overdue':''}" 
               title="${it.equipmentId} / ${it.name}"
               data-id="${it.equipmentId}" data-person="${it.person}" style="cursor:pointer; padding:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
               <span style="font-weight:600; font-size:0.8rem; color:var(--accent-primary);">${it.date}</span>
               ${it.overdue?'<span style="color:var(--danger); font-size:0.7rem;">⚠️ 期限超過</span>':''}
            </div>
            <div class="upcoming-text" style="font-size:0.85rem; margin-top:4px;">
              ${it.equipmentId} / ${it.name}
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">担当: ${it.person}</div>
          </div>`).join('')}
      </div>`;

    listContainer.querySelectorAll('.upcoming-item').forEach(item => {
      item.addEventListener('click', () => {
        App.navigateTo('result', { equipmentId: item.dataset.id, personInCharge: item.dataset.person });
      });
    });
  },

  _renderMonthGrid(year, month, gridEl) {
    const inspDates = this._getInspectionDates();
    const todayStr = new Date().toISOString().split('T')[0];
    const dayHeaders = ['日','月','火','水','木','金','土'];
    let html = dayHeaders.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();
    const prevLast = new Date(year, month, 0);

    // 前月の埋め
    for (let i = startDow - 1; i >= 0; i--) {
      html += `<div class="calendar-day other-month">
        <span class="day-number">${prevLast.getDate() - i}</span>
      </div>`;
    }

    // 当月
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const isToday = ds === todayStr;
      const hasInsp = inspDates[ds];
      
      let cls = 'calendar-day';
      if (isToday) cls += ' today';
      
      let indicators = '';
      if (hasInsp) {
        indicators = `<div class="inspection-indicators">
          ${hasInsp.map(insp => `<span class="inspection-dot ${insp.isOverdue?'overdue':''}" title="${insp.equipmentName}"></span>`).join('')}
        </div>`;
      }
      
      html += `
        <div class="${cls}">
          <span class="day-number">${day}</span>
          ${indicators}
        </div>`;
    }

    // 翌月の埋め
    const endDow = lastDay.getDay();
    for (let i = 1; i <= 6 - endDow; i++) {
      html += `<div class="calendar-day other-month">
        <span class="day-number">${i}</span>
      </div>`;
    }

    gridEl.innerHTML = html;
  },

  _getInspectionDates() {
    const inspections = spService._getFromLocal('inspection');
    const equipments = spService._getFromLocal('equipment');
    const dates = {};
    const todayStr = new Date().toISOString().split('T')[0];

    inspections.forEach(insp => {
      const eq = equipments.find(e => e.equipmentId === insp.equipmentId);
      const fields = [
        'nextInspectionDate', 'firstInspectionDate',
        'nextInspectionDate2', 'firstInspectionDate2',
        'nextMonthlyInspectionDate', 'firstMonthlyInspectionDate'
      ];
      
      fields.forEach(f => {
        const dateStr = insp[f];
        if (!dateStr) return;
        if (!dates[dateStr]) dates[dateStr] = [];
        
        dates[dateStr].push({
          equipmentId: insp.equipmentId,
          equipmentName: eq ? eq.equipmentName : insp.equipmentId,
          isOverdue: dateStr < todayStr
        });
      });
    });
    return dates;
  }
};
