/* =============================================
   故障対応フォーム
   ============================================= */

const FailureModule = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><span class="icon">🔧</span> 故障対応</h1>
        <p class="page-subtitle">機器の故障履歴と対応内容を記録します</p>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">故障情報入力</span>
          <button class="btn btn-sm btn-secondary" id="failClearBtn">クリア</button>
        </div>
        <form id="failureForm" autocomplete="off">
          <div class="form-grid">
            <!-- 設備機器番号 -->
            <div class="form-group">
              <label class="form-label">設備機器番号 <span class="required">*必須</span></label>
              <input type="text" class="form-input" id="fail_id" placeholder="例：医薬-123" required list="failEquipmentIdList">
              <datalist id="failEquipmentIdList"></datalist>
            </div>

            <!-- 機器名（自動表示） -->
            <div class="form-group">
              <label class="form-label">機器名</label>
              <input type="text" class="form-input" id="fail_eqName" readonly style="opacity:0.7;">
            </div>

            <!-- 故障日 -->
            <div class="form-group">
              <label class="form-label">故障日</label>
              <input type="date" class="form-input" id="fail_date">
            </div>

            <!-- 担当者 -->
            <div class="form-group">
              <label class="form-label">担当者</label>
              <input type="text" class="form-input" id="fail_person" placeholder="対応担当者名">
            </div>

            <!-- 実施日 -->
            <div class="form-group">
              <label class="form-label">実施日</label>
              <input type="date" class="form-input" id="fail_implDate">
            </div>

            <!-- 稼働確認 -->
            <div class="form-group">
              <label class="form-label">稼働確認</label>
              <select class="form-select" id="fail_check">
                <option value="">-- 選択 --</option>
                <option value="適合">適合</option>
                <option value="不適合">不適合</option>
              </select>
            </div>

            <!-- 実施内容 -->
            <div class="form-group full-width">
              <label class="form-label">実施内容</label>
              <textarea class="form-textarea" id="fail_detail" placeholder="故障対応の詳細内容を記入"></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="failResetBtn">リセット</button>
            <button type="submit" class="btn btn-primary">💾 保存</button>
          </div>
        </form>
      </div>

      <!-- 故障履歴リスト -->
      <div class="card" style="margin-top:24px;">
        <div class="card-header">
          <span class="card-title">故障履歴一覧</span>
        </div>
        <div id="failureListTable"></div>
      </div>
    `;

    this._bindEvents();
    this._populateEquipmentIds();
    this._renderList();
  },

  _bindEvents() {
    const form = document.getElementById('failureForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._save();
    });

    document.getElementById('failClearBtn').addEventListener('click', () => this._clear());
    document.getElementById('failResetBtn').addEventListener('click', () => this._clear());

    // Auto-fill equipment name
    document.getElementById('fail_id').addEventListener('input', (e) => {
      const id = e.target.value.trim();
      const items = spService._getFromLocal('equipment');
      const found = items.find(i => i.equipmentId === id);
      document.getElementById('fail_eqName').value = found ? found.equipmentName : '';
    });
  },

  _populateEquipmentIds() {
    const items = spService._getFromLocal('equipment');
    const datalist = document.getElementById('failEquipmentIdList');
    datalist.innerHTML = items.map(i =>
      `<option value="${i.equipmentId}">${i.equipmentName || ''}</option>`
    ).join('');
  },

  _collectData() {
    return {
      equipmentId: document.getElementById('fail_id').value.trim(),
      failureDate: document.getElementById('fail_date').value,
      personInCharge: document.getElementById('fail_person').value.trim(),
      implementationDate: document.getElementById('fail_implDate').value,
      implementationDetail: document.getElementById('fail_detail').value.trim(),
      operationCheck: document.getElementById('fail_check').value
    };
  },

  async _save() {
    const data = this._collectData();

    if (!data.equipmentId) {
      App.showToast('機器管理番号は必須です', 'error');
      return;
    }

    try {
      await spService.saveItem('failure', data);
      App.showToast('故障履歴を保存しました', 'success');
      this._clear();
      this._renderList();
    } catch (e) {
      App.showToast('保存に失敗しました: ' + e.message, 'error');
    }
  },

  _renderList() {
    const container = document.getElementById('failureListTable');
    const items = spService._getFromLocal('failure');
    const equipments = spService._getFromLocal('equipment');

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔧</div>
          <p class="empty-state-text">故障履歴はまだ登録されていません</p>
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
              <th>故障日</th>
              <th>担当者</th>
              <th>実施日</th>
              <th>稼働確認</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => {
              const eq = equipments.find(e => e.equipmentId === item.equipmentId);
              return `
                <tr>
                  <td>${item.equipmentId}</td>
                  <td>${eq ? eq.equipmentName : '-'}</td>
                  <td>${item.failureDate || '-'}</td>
                  <td>${item.personInCharge || '-'}</td>
                  <td>${item.implementationDate || '-'}</td>
                  <td>
                    ${item.operationCheck
                      ? `<span class="conformance-badge ${item.operationCheck === '適合' ? 'pass' : 'fail'}">
                           ${item.operationCheck}
                         </span>`
                      : '-'
                    }
                  </td>
                  <td>
                    <button class="btn btn-sm btn-secondary fail-detail-btn" data-idx="${idx}">詳細</button>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    // Bind detail buttons
    container.querySelectorAll('.fail-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = items[parseInt(btn.dataset.idx)];
        this._showDetail(item);
      });
    });
  },

  _showDetail(item) {
    const equipments = spService._getFromLocal('equipment');
    const eq = equipments.find(e => e.equipmentId === item.equipmentId);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <h2 style="margin-bottom:16px;font-size:1.1rem;">故障対応詳細</h2>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:0.9rem;">
          <span style="color:var(--text-muted);">設備機器番号:</span><span>${item.equipmentId}</span>
          <span style="color:var(--text-muted);">機器名:</span><span>${eq ? eq.equipmentName : '-'}</span>
          <span style="color:var(--text-muted);">故障日:</span><span>${item.failureDate || '-'}</span>
          <span style="color:var(--text-muted);">担当者:</span><span>${item.personInCharge || '-'}</span>
          <span style="color:var(--text-muted);">実施日:</span><span>${item.implementationDate || '-'}</span>
          <span style="color:var(--text-muted);">稼働確認:</span>
          <span>${item.operationCheck
            ? `<span class="conformance-badge ${item.operationCheck === '適合' ? 'pass' : 'fail'}">${item.operationCheck}</span>`
            : '-'}</span>
          <span style="color:var(--text-muted);">実施内容:</span>
          <span style="white-space:pre-wrap;">${item.implementationDetail || '-'}</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },

  _loadData(item) {
    if (!item) return;
    document.getElementById('fail_id').value = item.equipmentId || '';
    document.getElementById('fail_date').value = item.failureDate || '';
    document.getElementById('fail_person').value = item.personInCharge || '';
    document.getElementById('fail_implDate').value = item.implementationDate || '';
    document.getElementById('fail_detail').value = item.implementationDetail || '';
    document.getElementById('fail_check').value = item.operationCheck || '';
    // Trigger equipment name lookup
    document.getElementById('fail_id').dispatchEvent(new Event('input'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _clear() {
    document.getElementById('failureForm').reset();
    document.getElementById('fail_eqName').value = '';
  }
};
