/* =============================================
   点検登録フォーム
   ============================================= */

const InspectionModule = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><span class="icon">🔍</span> 点検設定</h1>
        <p class="page-subtitle">機器の点検スケジュール（年次・月次）を設定・管理します</p>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">点検スケジュール</span>
          <button class="btn btn-sm btn-secondary" id="inspClearBtn">クリア</button>
        </div>
        <form id="inspectionForm" autocomplete="off">
          <div class="form-grid">
            <!-- 設備機器番号 -->
            <div class="form-group">
              <label class="form-label">設備機器番号 <span class="required">*必須</span></label>
              <input type="text" class="form-input" id="insp_id" placeholder="例：医薬-123" required list="equipmentIdList">
              <datalist id="equipmentIdList"></datalist>
              <span class="form-hint">登録済みの機器番号を入力してください</span>
            </div>

            <!-- 機器名 -->
            <div class="form-group">
              <label class="form-label">機器名</label>
              <input type="text" class="form-input" id="insp_eqName" readonly style="opacity:0.7;">
            </div>

            <div class="full-width" style="margin: 16px 0 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
              定期点検設定
              <button type="button" class="btn btn-sm btn-secondary" id="addYearly2Btn" style="font-size: 0.75rem; padding: 2px 8px;">＋追加</button>
            </div>

            <!-- 定期点検：点検対象 -->
            <div class="form-group">
              <label class="form-label">点検対象</label>
              <select class="form-input" id="insp_target">
                <option value="対象">対象</option>
                <option value="対象外">対象外</option>
              </select>
            </div>

            <!-- 定期点検：点検機関 -->
            <div class="form-group">
              <label class="form-label">点検機関</label>
              <input type="text" class="form-input" id="insp_agency" placeholder="自社、メーカー、その他（自由入力）" list="agencyList">
              <datalist id="agencyList">
                <option value="自社"></option>
                <option value="メーカー"></option>
              </datalist>
            </div>

            <!-- 定期点検回数/年 -->
            <div class="form-group">
              <label class="form-label">定期点検回数/年</label>
              <input type="number" class="form-input" id="insp_frequency" placeholder="例: 2" min="1" max="52">
            </div>

            <!-- 初回点検日 -->
            <div class="form-group">
              <label class="form-label">初回点検日</label>
              <input type="date" class="form-input" id="insp_firstDate">
            </div>

            <!-- 定期点検：次回定期点検日（年） -->
            <div class="form-group full-width" style="margin-bottom: 16px;">
              <label class="form-label">次回定期点検日（年）</label>
              <input type="text" class="form-input" id="insp_nextDate" readonly style="opacity:0.7; max-width: 50%;">
            </div>

            <!-- 2次点検設定エリア（デフォルト非表示） -->
            <div id="yearly2Container" class="full-width" style="display: none; border-top: 1px dashed var(--border-color); padding-top: 16px; margin-top: 8px;">
              <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 12px; color: var(--accent-primary);">定期点検設定（2件目）</div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">点検対象</label>
                  <select class="form-input" id="insp_target2">
                    <option value="対象">対象</option>
                    <option value="対象外">対象外</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">点検機関</label>
                  <input type="text" class="form-input" id="insp_agency2" placeholder="自社、メーカー等" list="agencyList">
                </div>
                <div class="form-group">
                  <label class="form-label">定期点検回数/年</label>
                  <input type="number" class="form-input" id="insp_frequency2" placeholder="例: 1" min="1" max="52">
                </div>
                <div class="form-group">
                  <label class="form-label">初回点検日</label>
                  <input type="date" class="form-input" id="insp_firstDate2">
                </div>
                <div class="form-group full-width" style="margin-bottom: 16px;">
                  <label class="form-label">次回定期点検日（年）</label>
                  <input type="text" class="form-input" id="insp_nextDate2" readonly style="opacity:0.7; max-width: 50%;">
                </div>
              </div>
            </div>

            <div class="full-width" style="margin: 16px 0 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; font-weight: bold;">
              月次点検設定
            </div>

            <!-- 月次点検：点検対象 -->
            <div class="form-group">
              <label class="form-label">点検対象</label>
              <select class="form-input" id="insp_targetMonth">
                <option value="対象">対象</option>
                <option value="対象外">対象外</option>
              </select>
            </div>

            <!-- 月次点検：点検機関 -->
            <div class="form-group">
              <label class="form-label">点検機関</label>
              <input type="text" class="form-input" id="insp_agencyMonth" placeholder="自社、メーカー、その他（自由入力）" list="agencyList">
            </div>

            <!-- 月次点検回数 -->
            <div class="form-group">
              <label class="form-label">月次点検回数</label>
              <input type="number" class="form-input" id="insp_freqMonth" placeholder="例: 1" min="1" max="12">
            </div>

            <!-- 初回点検日（月） -->
            <div class="form-group">
              <label class="form-label">初回点検日（月）</label>
              <input type="date" class="form-input" id="insp_firstDateMonth">
            </div>

            <!-- 次回月次点検日 -->
            <div class="form-group full-width">
              <label class="form-label">次回月次点検日</label>
              <input type="text" class="form-input" id="insp_nextDateMonth" readonly style="opacity:0.7; max-width: 50%;">
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="inspResetBtn">リセット</button>
            <button type="submit" class="btn btn-primary">💾 保存</button>
          </div>
        </form>
      </div>

      <!-- 設定済みリスト -->
      <div class="card" style="margin-top:24px;">
        <div class="card-header">
          <span class="card-title">設定済み点検スケジュール</span>
        </div>
        <div id="inspectionListTable"></div>
      </div>
    `;

    this._bindEvents();
    this._populateEquipmentIds();
    this._renderList();
  },

  _bindEvents() {
    const form = document.getElementById('inspectionForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._save();
    });

    document.getElementById('inspClearBtn').addEventListener('click', () => this._clear());
    document.getElementById('inspResetBtn').addEventListener('click', () => this._clear());

    // 機器名自動補完
    document.getElementById('insp_id').addEventListener('input', (e) => {
      const id = e.target.value.trim();
      const items = spService._getFromLocal('equipment');
      const found = items.find(i => i.equipmentId === id);
      document.getElementById('insp_eqName').value = found ? found.equipmentName : '';
    });

    // 次回点検日（年）計算
    document.getElementById('insp_firstDate').addEventListener('change', () => this._calcNextYearly());
    document.getElementById('insp_frequency').addEventListener('input', () => this._calcNextYearly());

    // 次回点検日（月）計算
    document.getElementById('insp_firstDateMonth').addEventListener('change', () => this._calcNextMonthly());
    document.getElementById('insp_freqMonth').addEventListener('input', () => this._calcNextMonthly());

    // 設備機器番号の自動修正
    document.getElementById('insp_id').addEventListener('blur', (e) => {
      let val = e.target.value;
      val = val.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      val = val.replace(/[－ー—―]/g, '-');
      e.target.value = val;
    });

    // 2件目追加ボタン
    document.getElementById('addYearly2Btn').addEventListener('click', () => {
      const container = document.getElementById('yearly2Container');
      container.style.display = container.style.display === 'none' ? 'block' : 'none';
      const btn = document.getElementById('addYearly2Btn');
      btn.textContent = container.style.display === 'none' ? '＋追加' : '－削除';
    });

    // 2件目の次回点検日計算
    document.getElementById('insp_firstDate2').addEventListener('change', () => this._calcNextYearly(2));
    document.getElementById('insp_frequency2').addEventListener('input', () => this._calcNextYearly(2));
  },

  _calcNextYearly(suffix = '') {
    const firstDate = document.getElementById('insp_firstDate' + suffix).value;
    const freq = parseInt(document.getElementById('insp_frequency' + suffix).value) || 0;
    const target = document.getElementById('insp_nextDate' + suffix);
    
    if (firstDate && freq > 0) {
      const d = new Date(firstDate);
      if (isNaN(d.getTime())) {
        target.value = '';
        return;
      }
      const months = Math.floor(12 / freq);
      d.setMonth(d.getMonth() + months);
      target.value = d.toISOString().split('T')[0];
    } else {
      target.value = '';
    }
  },

  _calcNextMonthly() {
    const firstDate = document.getElementById('insp_firstDateMonth').value;
    const freq = parseInt(document.getElementById('insp_freqMonth').value) || 0;
    const target = document.getElementById('insp_nextDateMonth');

    if (firstDate && freq > 0) {
      const d = new Date(firstDate);
      if (isNaN(d.getTime())) {
        target.value = '';
        return;
      }
      // 月次点検回数（ヶ月）を加算する仕様
      d.setMonth(d.getMonth() + freq);
      target.value = d.toISOString().split('T')[0];
    } else {
      target.value = '';
    }
  },

  _populateEquipmentIds() {
    const items = spService._getFromLocal('equipment');
    const datalist = document.getElementById('equipmentIdList');
    datalist.innerHTML = items.map(i =>
      `<option value="${i.equipmentId}">${i.equipmentName || ''}</option>`
    ).join('');
  },

  _collectData() {
    return {
      equipmentId: document.getElementById('insp_id').value.trim(),
      isInspectionTarget: document.getElementById('insp_target').value,
      yearlyInspectionAgency: document.getElementById('insp_agency').value.trim(),
      inspectionFrequency: document.getElementById('insp_frequency').value || '0',
      firstInspectionDate: document.getElementById('insp_firstDate').value,
      nextInspectionDate: document.getElementById('insp_nextDate').value,

      isInspectionTarget2: document.getElementById('insp_target2').value,
      yearlyInspectionAgency2: document.getElementById('insp_agency2').value.trim(),
      inspectionFrequency2: document.getElementById('insp_frequency2').value || '0',
      firstInspectionDate2: document.getElementById('insp_firstDate2').value,
      nextInspectionDate2: document.getElementById('insp_nextDate2').value,

      monthlyInspectionTarget: document.getElementById('insp_targetMonth').value,
      monthlyInspectionAgency: document.getElementById('insp_agencyMonth').value.trim(),
      monthlyInspectionFrequency: document.getElementById('insp_freqMonth').value || '0',
      firstMonthlyInspectionDate: document.getElementById('insp_firstDateMonth').value,
      nextMonthlyInspectionDate: document.getElementById('insp_nextDateMonth').value
    };
  },

  async _save() {
    const data = this._collectData();

    // 必須チェック（設備機器番号のみ）
    if (!data.equipmentId) {
      App.showToast('設備機器番号を入力してください。', 'error');
      return;
    }

    // 機器マスタに存在するかチェック
    const equipments = spService._getFromLocal('equipment');
    const exists = equipments.some(e => e.equipmentId === data.equipmentId);
    if (!exists) {
      App.showToast('この番号は登録されていません', 'error');
      return;
    }

    // 重複チェック
    const existing = spService._getFromLocal('inspection');
    const currentId = document.getElementById('insp_id').dataset.originalId;
    if (data.equipmentId !== currentId && existing.some(item => item.equipmentId === data.equipmentId)) {
      App.showToast('この番号の点検スケジュールは既に登録済みです', 'error');
      return;
    }

    try {
      await spService.saveItem('inspection', data);
      App.showToast('点検スケジュールを保存しました', 'success');
      CalendarModule.refresh();
      this._clear();
      this._renderList();
    } catch (e) {
      App.showToast('保存に失敗しました: ' + e.message, 'error');
    }
  },

  _renderList() {
    const container = document.getElementById('inspectionListTable');
    const items = spService._getFromLocal('inspection');
    const equipments = spService._getFromLocal('equipment');

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <p class="empty-state-text">設定済みのスケジュールはありません</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>設備機器番号</th>
              <th>機器名</th>
              <th>点検対象</th>
              <th>年次 (回/日)</th>
              <th>月次 (回/日)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const eq = equipments.find(e => e.equipmentId === item.equipmentId);
              return `
                <tr>
                  <td>${item.equipmentId}</td>
                  <td>${eq ? eq.equipmentName : '-'}</td>
                  <td><span class="status-badge ${item.isInspectionTarget === '対象' ? 'active' : 'retired'}">${item.isInspectionTarget || '対象'}</span></td>
                  <td>${item.inspectionFrequency}回 / ${item.nextInspectionDate || '-'}</td>
                  <td>${item.monthlyInspectionFrequency || 0}回 / ${item.nextMonthlyInspectionDate || '-'}</td>
                  <td>
                    <button class="btn btn-sm btn-secondary insp-edit-btn" data-id="${item.equipmentId}">編集</button>
                    <button class="btn btn-sm btn-danger insp-del-btn" data-id="${item.equipmentId}">削除</button>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    container.querySelectorAll('.insp-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this._loadData(btn.dataset.id));
    });
    container.querySelectorAll('.insp-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('この設定を削除しますか？')) {
          spService._deleteFromLocal('inspection', btn.dataset.id);
          this._renderList();
          CalendarModule.refresh();
          App.showToast('削除しました', 'info');
        }
      });
    });
  },

  _loadData(equipmentId) {
    const items = spService._getFromLocal('inspection');
    const item = items.find(i => i.equipmentId === equipmentId);
    if (!item) return;

    const idInput = document.getElementById('insp_id');
    idInput.value = item.equipmentId || '';
    idInput.dataset.originalId = item.equipmentId || '';
    
    document.getElementById('insp_target').value = item.isInspectionTarget || '対象';
    document.getElementById('insp_agency').value = item.yearlyInspectionAgency || '';
    document.getElementById('insp_frequency').value = item.inspectionFrequency || '';
    document.getElementById('insp_firstDate').value = item.firstInspectionDate || '';
    document.getElementById('insp_nextDate').value = item.nextInspectionDate || '';
    
    // 2件目
    const target2 = item.isInspectionTarget2;
    if (target2 || item.inspectionFrequency2 > 0) {
      document.getElementById('yearly2Container').style.display = 'block';
      document.getElementById('addYearly2Btn').textContent = '－削除';
      document.getElementById('insp_target2').value = target2 || '対象';
      document.getElementById('insp_agency2').value = item.yearlyInspectionAgency2 || '';
      document.getElementById('insp_frequency2').value = item.inspectionFrequency2 || '';
      document.getElementById('insp_firstDate2').value = item.firstInspectionDate2 || '';
      document.getElementById('insp_nextDate2').value = item.nextInspectionDate2 || '';
    } else {
      document.getElementById('yearly2Container').style.display = 'none';
      document.getElementById('addYearly2Btn').textContent = '＋追加';
    }

    document.getElementById('insp_targetMonth').value = item.monthlyInspectionTarget || '対象';
    document.getElementById('insp_agencyMonth').value = item.monthlyInspectionAgency || '';
    document.getElementById('insp_freqMonth').value = item.monthlyInspectionFrequency || '';
    document.getElementById('insp_firstDateMonth').value = item.firstMonthlyInspectionDate || '';
    document.getElementById('insp_nextDateMonth').value = item.nextMonthlyInspectionDate || '';

    idInput.dispatchEvent(new Event('input'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _clear() {
    const form = document.getElementById('inspectionForm');
    form.reset();
    document.getElementById('insp_id').removeAttribute('data-original-id');
    document.getElementById('insp_eqName').value = '';
    document.getElementById('insp_nextDate').value = '';
    document.getElementById('insp_nextDate2').value = '';
    document.getElementById('insp_nextDateMonth').value = '';
    document.getElementById('yearly2Container').style.display = 'none';
    document.getElementById('addYearly2Btn').textContent = '＋追加';
  }
};
