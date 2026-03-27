/* =============================================
   点検結果モジュール
   ============================================= */

const ResultModule = {
  render(container, initialData = null) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><span class="icon">📋</span> 点検結果登録</h1>
        <p class="page-subtitle">実施した点検（月次・定期・故障対応等）の結果を記録します</p>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">点検結果入力</span>
          <button class="btn btn-sm btn-secondary" id="resClearBtn">クリア</button>
        </div>
        <form id="resultForm" autocomplete="off">
          <div class="form-grid">
            <!-- 設備機器番号 -->
            <div class="form-group">
              <label class="form-label">設備機器番号 <span class="required">*必須</span></label>
              <input type="text" class="form-input" id="res_eqId" placeholder="例：医薬-123" required list="equipmentIdList" value="${initialData?.equipmentId || ''}">
              <datalist id="equipmentIdList"></datalist>
            </div>

            <!-- 機器名（自動補完） -->
            <div class="form-group">
              <label class="form-label">機器名</label>
              <input type="text" class="form-input" id="res_eqName" readonly style="opacity:0.7;">
            </div>

            <!-- 点検項目 -->
            <div class="form-group">
              <label class="form-label">点検項目 <span class="required">*必須</span></label>
              <select class="form-input" id="res_type" required>
                <option value="">選択してください</option>
                <option value="月次点検">月次点検</option>
                <option value="定期点検">定期点検</option>
                <option value="その他（故障対応等）">その他（故障対応等）</option>
              </select>
            </div>

            <!-- 機器担当者 -->
            <div class="form-group">
              <label class="form-label">機器担当者</label>
              <input type="text" class="form-input" id="res_manager" placeholder="例：山田 太郎" value="${initialData?.personInCharge || ''}">
            </div>

            <!-- 点検実施者 -->
            <div class="form-group">
              <label class="form-label">点検実施者 <span class="required">*必須</span></label>
              <input type="text" class="form-input" id="res_inspector" placeholder="例：佐藤 花子" required>
            </div>

            <!-- 点検日 -->
            <div class="form-group">
              <label class="form-label">点検日 <span class="required">*必須</span></label>
              <input type="date" class="form-input" id="res_date" required value="${new Date().toISOString().split('T')[0]}">
            </div>

            <!-- 点検結果 -->
            <div class="form-group">
              <label class="form-label">点検結果 <span class="required">*必須</span></label>
              <select class="form-input" id="res_status" required>
                <option value="">選択してください</option>
                <option value="適合">適合</option>
                <option value="不適合">不適合</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <!-- 点検状況 -->
            <div class="form-group">
              <label class="form-label">点検状況 <span class="required">*必須</span></label>
              <select class="form-input" id="res_inspectionStatus" required>
                <option value="実施前">実施前</option>
                <option value="完了">完了</option>
                <option value="故障">故障</option>
                <option value="要：メーカー点検">要：メーカー点検</option>
              </select>
            </div>

            <!-- 備考 -->
            <div class="form-group full-width">
              <label class="form-label">備考（不適合内容など）</label>
              <textarea class="form-input" id="res_remarks" rows="3" placeholder="点検時の特記事項があれば入力してください"></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="reset" class="btn btn-secondary">リセット</button>
            <button type="submit" class="btn btn-primary">💾 点検結果を保存</button>
          </div>
        </form>
      </div>

      <!-- 履歴リスト -->
      <div class="card" style="margin-top:24px;">
        <div class="card-header">
          <span class="card-title">最近の点検実施履歴</span>
        </div>
        <div id="resultListTable"></div>
      </div>
    `;

    this._bindEvents();
    this._populateEquipmentIds();
    this._renderList();

    // 初期データがある場合は機器名補完を発火
    if (initialData?.equipmentId) {
      document.getElementById('res_eqId').dispatchEvent(new Event('input'));
    }
  },

  _bindEvents() {
    const form = document.getElementById('resultForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._save();
    });

    document.getElementById('resClearBtn').addEventListener('click', () => {
      form.reset();
      document.getElementById('res_eqName').value = '';
    });

    // 機器名自動補完
    document.getElementById('res_eqId').addEventListener('input', (e) => {
      const id = e.target.value.trim();
      const items = spService._getFromLocal('equipment');
      const found = items.find(i => i.equipmentId === id);
      document.getElementById('res_eqName').value = found ? found.equipmentName : '';
    });
  },

  _populateEquipmentIds() {
    const items = spService._getFromLocal('equipment');
    const datalist = document.getElementById('equipmentIdList');
    datalist.innerHTML = items.map(i =>
      `<option value="${i.equipmentId}">${i.equipmentName || ''}</option>`
    ).join('');
  },

  async _save() {
    const data = {
      equipmentId: document.getElementById('res_eqId').value.trim(),
      inspectionType: document.getElementById('res_type').value,
      personInCharge: document.getElementById('res_manager').value,
      inspectedBy: document.getElementById('res_inspector').value,
      inspectionDate: document.getElementById('res_date').value,
      result: document.getElementById('res_status').value,
      inspectionStatus: document.getElementById('res_inspectionStatus').value,
      remarks: document.getElementById('res_remarks').value
    };

    try {
      await spService.saveItem('result', data);
      
      // 機器ステータスの自動更新連動
      if (data.inspectionStatus === '故障' || data.inspectionStatus === '要：メーカー点検' || data.inspectionStatus === '完了') {
        const equipments = spService._getFromLocal('equipment');
        const eq = equipments.find(e => e.equipmentId === data.equipmentId);
        if (eq) {
          let newStatus = '';
          if (data.inspectionStatus === '故障') newStatus = '故障中：使用不可';
          else if (data.inspectionStatus === '要：メーカー点検') newStatus = '点検中：使用不可';
          else if (data.inspectionStatus === '完了') newStatus = '稼働中：使用可';

          const updatedEq = { ...eq, status: newStatus };
          await spService.saveItem('equipment', updatedEq);
          App.showToast(`機器ステータスを「${newStatus}」に更新しました`, 'info');
        }
      }

      App.showToast('点検結果を保存しました', 'success');
      document.getElementById('resultForm').reset();
      document.getElementById('res_eqName').value = '';
      this._renderList();
    } catch (e) {
      App.showToast('保存に失敗しました: ' + e.message, 'error');
    }
  },

  _renderList() {
    const container = document.getElementById('resultListTable');
    const items = spService._getFromLocal('result');
    const equipments = spService._getFromLocal('equipment');

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <p class="empty-state-text">実施履歴はまだありません</p>
        </div>`;
      return;
    }

    // 日付順にソート（新しい順）
    const sorted = [...items].sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate));

    container.innerHTML = `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>点検日</th>
              <th>設備機器番号</th>
              <th>点検項目</th>
              <th>結果</th>
              <th>点検状況</th>
              <th>実施者</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.slice(0, 20).map(item => {
              const resClass = item.result === '適合' ? 'success' : (item.result === '不適合' ? 'failure' : 'warning');
              return `
                <tr>
                  <td>${item.inspectionDate}</td>
                  <td>${item.equipmentId}</td>
                  <td>${item.inspectionType}</td>
                  <td><span class="status-badge ${resClass}">${item.result}</span></td>
                  <td>${item.inspectionStatus || '-'}</td>
                  <td>${item.inspectedBy}</td>
                  <td>
                    <button class="btn btn-sm btn-danger res-del-btn" data-id="${item.id || item.equipmentId + item.inspectionDate}">削除</button>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    container.querySelectorAll('.res-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('この実施記録を削除しますか？')) {
          // localStorageのキー設計上、IDがない場合は検索して削除
          const all = spService._getFromLocal('result');
          const filtered = all.filter(it => (it.id || it.equipmentId + it.inspectionDate) !== btn.dataset.id);
          localStorage.setItem('eq_mgmt_result', JSON.stringify(filtered));
          this._renderList();
          App.showToast('削除しました', 'info');
        }
      });
    });
  }
};
