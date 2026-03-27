/* =============================================
   機器登録フォーム
   ============================================= */

const EquipmentModule = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><span class="icon">🏭</span> 機器登録</h1>
        <p class="page-subtitle">新しい機器の情報を登録します</p>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">機器情報入力</span>
          <button class="btn btn-sm btn-secondary" id="equipClearBtn">クリア</button>
        </div>
        <form id="equipmentForm" autocomplete="off">
          <div class="form-grid">
            <!-- 設備管理番号 -->
            <div class="form-group">
              <label class="form-label">設備管理番号 <span class="required">*必須</span></label>
              <input type="text" class="form-input" id="eq_id" placeholder="例：医薬-123" required>
            </div>

            <!-- 使用部局 -->
            <div class="form-group">
              <label class="form-label">使用部局 <span class="required">*必須</span></label>
              <input type="text" class="form-input" id="eq_department" placeholder="選択または入力" required list="departmentList">
              <datalist id="departmentList">
                <option value="医薬専用">
                <option value="医薬・健食兼用">
              </datalist>
            </div>

            <!-- メーカー -->
            <div class="form-group">
              <label class="form-label">メーカー</label>
              <input type="text" class="form-input" id="eq_maker" placeholder="メーカー名">
            </div>

            <!-- 機器名 -->
            <div class="form-group">
              <label class="form-label">機器名</label>
              <input type="text" class="form-input" id="eq_name" placeholder="機器名称">
            </div>

            <!-- 型番 -->
            <div class="form-group">
              <label class="form-label">型番 <span class="required">*必須</span></label>
              <input type="text" class="form-input" id="eq_model" placeholder="型番" required>
            </div>

            <!-- シリアル番号 -->
            <div class="form-group">
              <label class="form-label">シリアル番号 <span class="required">*必須</span></label>
              <input type="text" class="form-input" id="eq_serialNumber" placeholder="シリアル番号" required>
            </div>

            <!-- 機器内容 -->
            <div class="form-group full-width">
              <label class="form-label">機器内容</label>
              <textarea class="form-textarea" id="eq_detail" placeholder="機器の詳細説明"></textarea>
            </div>

            <!-- 購入総額 -->
            <div class="form-group">
              <label class="form-label">購入総額（円）</label>
              <input type="number" class="form-input" id="eq_totalCost" placeholder="0" min="0">
            </div>

            <!-- 費用内訳 -->
            <div class="form-group full-width">
              <label class="form-label" style="margin-bottom:4px;">費用内訳</label>
              <div class="cost-group" style="grid-template-columns:1fr 1fr 1fr;">
                <div class="cost-item">
                  <label class="form-label">機器費（円）</label>
                  <input type="number" class="form-input" id="eq_equipCost" placeholder="0" min="0">
                </div>
                <div class="cost-item">
                  <label class="form-label">IQ/OQ費（円）</label>
                  <input type="number" class="form-input" id="eq_iqoqCost" placeholder="0" min="0">
                </div>
                <div class="cost-item">
                  <label class="form-label">その他の費用（円）</label>
                  <input type="number" class="form-input" id="eq_otherCost" placeholder="0" min="0">
                </div>
              </div>
            </div>

            <!-- 導入日 -->
            <div class="form-group">
              <label class="form-label">導入日 <span class="required">*必須</span></label>
              <input type="date" class="form-input" id="eq_introDate" required>
            </div>

            <!-- バリデーション番号 -->
            <div class="form-group">
              <label class="form-label">バリデーション番号</label>
              <input type="text" class="form-input" id="eq_validNum" placeholder="バリデーション番号">
            </div>

            <!-- 手順書番号 -->
            <div class="form-group">
              <label class="form-label">手順書番号</label>
              <input type="text" class="form-input" id="eq_procNum" placeholder="手順書番号">
            </div>

            <!-- 機器担当者 -->
            <div class="form-group">
              <label class="form-label">機器担当者 <span class="required">*必須</span></label>
              <input type="text" class="form-input" id="eq_person" placeholder="担当者名" required>
            </div>

            <!-- 設置場所 -->
            <div class="form-group">
              <label class="form-label">設置場所</label>
              <select class="form-select" id="eq_location">
                <option value="">-- 選択 --</option>
                <option value="試験室">試験室</option>
                <option value="機器分析室">機器分析室</option>
                <option value="天秤室">天秤室</option>
                <option value="微生物試験室">微生物試験室</option>
                <option value="事務所">事務所</option>
                <option value="ボンベ室">ボンベ室</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <!-- ステータス -->
            <div class="form-group">
              <label class="form-label">ステータス</label>
              <select class="form-select" id="eq_status">
                <option value="登録中：使用不可">登録中：使用不可</option>
                <option value="稼働中：使用可">稼働中：使用可</option>
                <option value="点検中：使用不可">点検中：使用不可</option>
                <option value="故障中：使用不可">故障中：使用不可</option>
                <option value="遊休：使用不可">遊休：使用不可</option>
                <option value="廃棄済">廃棄済</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="equipResetBtn">リセット</button>
            <button type="submit" class="btn btn-primary">💾 保存</button>
          </div>
        </form>
      </div>
    `;

    this._bindEvents();
  },

  _bindEvents() {
    const form = document.getElementById('equipmentForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._save();
    });

    document.getElementById('equipClearBtn').addEventListener('click', () => this._clear());
    document.getElementById('equipResetBtn').addEventListener('click', () => this._clear());

    // Auto-calculate total cost
    const equipCost = document.getElementById('eq_equipCost');
    const iqoqCost = document.getElementById('eq_iqoqCost');
    const otherCost = document.getElementById('eq_otherCost');
    const totalCost = document.getElementById('eq_totalCost');

    const calcTotal = () => {
      const e = parseFloat(equipCost.value) || 0;
      const i = parseFloat(iqoqCost.value) || 0;
      const o = parseFloat(otherCost.value) || 0;
      totalCost.value = e + i + o;
    };
    equipCost.addEventListener('input', calcTotal);
    iqoqCost.addEventListener('input', calcTotal);
    otherCost.addEventListener('input', calcTotal);

    // 設備管理番号の自動修正 (全角 -> 半角)
    document.getElementById('eq_id').addEventListener('blur', (e) => {
      let val = e.target.value;
      // 全角数字を半角に変換
      val = val.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      // 全角ハイフン等を半角に変換
      val = val.replace(/[－ー—―]/g, '-');
      e.target.value = val;
    });
  },

  _collectData() {
    return {
      equipmentId: document.getElementById('eq_id').value.trim(),
      department: document.getElementById('eq_department').value.trim(),
      maker: document.getElementById('eq_maker').value.trim(),
      equipmentName: document.getElementById('eq_name').value.trim(),
      equipmentDetail: document.getElementById('eq_detail').value.trim(),
      modelNumber: document.getElementById('eq_model').value.trim(),
      serialNumber: document.getElementById('eq_serialNumber').value.trim(),
      totalCost: document.getElementById('eq_totalCost').value || '0',
      equipmentCost: document.getElementById('eq_equipCost').value || '0',
      iqoqCost: document.getElementById('eq_iqoqCost').value || '0',
      otherCost: document.getElementById('eq_otherCost').value || '0',
      introductionDate: document.getElementById('eq_introDate').value,
      validationNumber: document.getElementById('eq_validNum').value.trim(),
      procedureNumber: document.getElementById('eq_procNum').value.trim(),
      personInCharge: document.getElementById('eq_person').value.trim(),
      location: document.getElementById('eq_location').value,
      status: document.getElementById('eq_status').value
    };
  },

  async _save() {
    const data = this._collectData();

    // 必須項目バリデーション
    const errors = [];
    if (!data.equipmentId) errors.push('設備管理番号');
    if (!data.department) errors.push('使用部局');
    if (!data.modelNumber) errors.push('型番');
    if (!data.serialNumber) errors.push('シリアル番号');
    if (!data.introductionDate) errors.push('導入日');
    if (!data.personInCharge) errors.push('機器担当者');

    if (errors.length > 0) {
      App.showToast('以下の必須項目を入力してください：\n' + errors.join('、'), 'error');
      return;
    }

    // 形式バリデーション: 医薬-XXX (XXXは数字)
    const idRegex = /^医薬-\d+$/;
    if (!idRegex.test(data.equipmentId)) {
      App.showToast('入力値は、「医薬-XXX」で空白や他の記号を含むことができません', 'error');
      return;
    }

    // 重複チェック (新規登録時のみ、またはIDが変更された場合)
    const existingItems = spService._getFromLocal('equipment');
    const isDuplicate = existingItems.some(item => item.equipmentId === data.equipmentId);
    
    // 現在編集中のアイテムがあるか確認 (簡易的な判定)
    // 実際には編集モードの状態管理が必要だが、ここでは「既存のIDと一致し、かつフォームがそのデータで埋められているか」を考慮
    // ただし、ユーザーの要求通り「同一番号が入力された場合」を優先
    if (isDuplicate) {
      // 編集中の場合は重複を許容したいが、現在のコード構造では「保存」ボタンが新規・更新兼用。
      // ここでは、単純に重複をエラーとする（既存の更新ロジックがTitle/equipmentIdをキーにしているため）
      // もし既存アイテムの更新であれば、spService._saveToLocal が上書きするので動作はするが、
      // ユーザーが「重複できない」と明示しているため、新規登録時のガードを想定。
      // ※既存データの編集時にIDを変えずに保存できるよう、簡易的なチェックを入れる
      const currentId = document.getElementById('eq_id').dataset.originalId; 
      if (data.equipmentId !== currentId) {
        App.showToast('この番号は登録済みです', 'error');
        return;
      }
    }

    try {
      await spService.saveItem('equipment', data);
      App.showToast('機器情報を保存しました', 'success');
      CalendarModule.refresh();
      this._clear();
    } catch (e) {
      App.showToast('保存に失敗しました: ' + e.message, 'error');
    }
  },

  _clear() {
    document.getElementById('equipmentForm').reset();
    document.getElementById('eq_id').removeAttribute('data-original-id');
  },

  // Load existing data into form for editing
  loadData(equipmentId) {
    const items = spService._getFromLocal('equipment');
    const item = items.find(i => i.equipmentId === equipmentId);
    if (!item) return;

    document.getElementById('eq_id').value = item.equipmentId || '';
    document.getElementById('eq_id').dataset.originalId = item.equipmentId || '';
    document.getElementById('eq_department').value = item.department || '';
    document.getElementById('eq_maker').value = item.maker || '';
    document.getElementById('eq_name').value = item.equipmentName || '';
    document.getElementById('eq_detail').value = item.equipmentDetail || '';
    document.getElementById('eq_model').value = item.modelNumber || '';
    document.getElementById('eq_serialNumber').value = item.serialNumber || item.lotNumber || '';
    document.getElementById('eq_totalCost').value = item.totalCost || '';
    document.getElementById('eq_equipCost').value = item.equipmentCost || '';
    document.getElementById('eq_iqoqCost').value = item.iqoqCost || '';
    document.getElementById('eq_otherCost').value = item.otherCost || '';
    document.getElementById('eq_introDate').value = item.introductionDate || '';
    document.getElementById('eq_validNum').value = item.validationNumber || '';
    document.getElementById('eq_procNum').value = item.procedureNumber || '';
    document.getElementById('eq_person').value = item.personInCharge || '';
    document.getElementById('eq_location').value = item.location || '';
    document.getElementById('eq_status').value = item.status || '登録中：使用不可';
  }
};
