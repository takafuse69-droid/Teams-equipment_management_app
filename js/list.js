/* =============================================
   機器リスト表示
   ============================================= */

const ListModule = {
  currentTab: 'equipment',
  
  // カラム定義: keyはデータプロパティ名、labelは表示名、sourceはデータ元
  COLUMN_DEFINITIONS: {
    equipmentId: { label: '管理番号', source: 'equipment', fixed: true },
    equipmentName: { label: '機器名', source: 'equipment', default: true },
    department: { label: '使用部局', source: 'equipment', default: true },
    maker: { label: 'メーカー', source: 'equipment', default: true },
    modelNumber: { label: '型番', source: 'equipment' },
    serialNumber: { label: 'シリアル番号', source: 'equipment' },
    equipmentDetail: { label: '機器内容', source: 'equipment' },
    totalCost: { label: '購入総額', source: 'equipment' },
    equipmentCost: { label: '機器費', source: 'equipment' },
    iqoqCost: { label: 'IQ/OQ費', source: 'equipment' },
    otherCost: { label: 'その他費用', source: 'equipment' },
    introductionDate: { label: '導入日', source: 'equipment' },
    validationNumber: { label: 'バリデーション番号', source: 'equipment' },
    procedureNumber: { label: '手順書番号', source: 'equipment' },
    location: { label: '設置場所', source: 'equipment' },
    personInCharge: { label: '機器担当者', source: 'equipment' },
    status: { label: 'ステータス', source: 'equipment', default: true },
    
    isInspectionTarget: { label: '点検対象', source: 'inspection' },
    yearlyInspectionAgency: { label: '点検機関', source: 'inspection' },
    inspectionFrequency: { label: '点検回数/年', source: 'inspection', default: true },
    nextInspectionDate: { label: '次回点検日(年)', source: 'inspection', default: true },
    monthlyInspectionTarget: { label: '月次対象', source: 'inspection' },
    monthlyInspectionFrequency: { label: '月次回数', source: 'inspection' },
    nextMonthlyInspectionDate: { label: '次回点検日(月)', source: 'inspection' }
  },

  selectedColumns: [],
  sortKey: 'equipmentId',
  sortOrder: 'asc', // 'asc' or 'desc'
  currentViewData: [], // CSV出力用

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><span class="icon">📋</span> 機器リスト</h1>
        <p class="page-subtitle">登録済みデータの一覧表示</p>
      </div>

      <!-- タブ切替 -->
      <div class="tab-nav" id="listTabs">
        <button class="tab-btn active" data-tab="equipment">機器マスタ</button>
        <button class="tab-btn" data-tab="result">点検実施結果</button>
        <button class="tab-btn" data-tab="failure">故障履歴</button>
      </div>

      <!-- 検索・フィルタ -->
      <div class="filter-bar" style="justify-content: space-between;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div class="search-input-wrapper">
            <span class="search-icon">🔎</span>
            <input type="text" class="form-input" id="listSearch" placeholder="検索...">
          </div>
          <select class="form-select" id="listStatusFilter" style="width:180px;">
            <option value="">全ステータス</option>
            <option value="登録中：使用不可">登録中：使用不可</option>
            <option value="稼働中：使用可">稼働中：使用可</option>
            <option value="点検中：使用不可">点検中：使用不可</option>
            <option value="故障中：使用不可">故障中：使用不可</option>
            <option value="遊休：使用不可">遊休：使用不可</option>
            <option value="廃棄済">廃棄済</option>
          </select>
        </div>
        
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn btn-secondary" id="exportCsvBtn">📥 csv出力</button>
          <div id="columnSelectorWrapper" style="position: relative;">
            <button class="btn btn-secondary" id="toggleColSelectorBtn">⚙️ 表示項目設定</button>
            <div id="columnSelectorDropdown" class="card dropdown-content" style="display:none; position:absolute; right:0; top:40px; z-index:100; min-width:450px; padding:12px; box-shadow: var(--shadow-lg);">
              <div style="font-weight:bold; margin-bottom:8px; font-size:0.9rem;">表示する項目を選択</div>
              <div id="columnChecklist" style="font-size:0.8rem;">
                <!-- JSで動的に生成 -->
              </div>
              <div style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:8px; text-align:right;">
                <button class="btn btn-sm btn-primary" id="saveColumnsBtn">設定を保存</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div id="listContent"></div>
      </div>
    `;

    this._initColumns();
    this._bindEvents();
    this._renderTab();
  },

  _initColumns() {
    const saved = localStorage.getItem('equipment_list_columns');
    if (saved) {
      this.selectedColumns = JSON.parse(saved);
    } else {
      this.selectedColumns = Object.keys(this.COLUMN_DEFINITIONS).filter(key => 
        this.COLUMN_DEFINITIONS[key].default || this.COLUMN_DEFINITIONS[key].fixed
      );
    }
  },

  _bindEvents() {
    // Tab switching
    document.getElementById('listTabs')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-btn')) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentTab = e.target.dataset.tab;
        this._renderTab();
      }
    });

    // Integrated Search and Status Filter
    document.getElementById('listSearch')?.addEventListener('input', () => this._renderTab());
    document.getElementById('listStatusFilter')?.addEventListener('change', () => this._renderTab());

    // CSV Export
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => this._exportToCSV());

    // Column Selector Toggle
    document.getElementById('toggleColSelectorBtn')?.addEventListener('click', () => {
      const dropdown = document.getElementById('columnSelectorDropdown');
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) this._renderColumnChecklist();
    });

    // Save Columns
    document.getElementById('saveColumnsBtn')?.addEventListener('click', () => {
      const checks = document.querySelectorAll('.col-check:checked');
      this.selectedColumns = Array.from(checks).map(c => c.value);
      localStorage.setItem('equipment_list_columns', JSON.stringify(this.selectedColumns));
      document.getElementById('columnSelectorDropdown').style.display = 'none';
      this._renderTab();
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('columnSelectorWrapper');
      const dropdown = document.getElementById('columnSelectorDropdown');
      if (wrapper && !wrapper.contains(e.target)) {
        if (dropdown) dropdown.style.display = 'none';
      }
    });

    // Sort Click Handler
    document.getElementById('listContent')?.addEventListener('click', (e) => {
      const header = e.target.closest('.sortable-header');
      if (header) {
        const key = header.dataset.key;
        if (this.sortKey === key) {
          this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortKey = key;
          this.sortOrder = 'asc';
        }
        this._renderTab();
      }
    });
  },

  _renderColumnChecklist() {
    const grid = document.getElementById('columnChecklist');
    if (!grid) return;

    const sources = {
      equipment: '機器登録',
      inspection: '点検設定'
    };

    let html = '';
    for (const [sourceKey, sourceLabel] of Object.entries(sources)) {
      html += `<div class="col-group-title" style="font-weight:bold; margin: 12px 0 6px; color:var(--primary-color); border-bottom:1px solid var(--border-color); padding-bottom:4px;">${sourceLabel}</div>`;
      html += `<div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px; margin-bottom:10px;">`;
      
      Object.keys(this.COLUMN_DEFINITIONS).forEach(key => {
        const def = this.COLUMN_DEFINITIONS[key];
        if (def.source === sourceKey) {
          const checked = this.selectedColumns.includes(key) ? 'checked' : '';
          const disabled = def.fixed ? 'disabled' : '';
          html += `
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
              <input type="checkbox" class="col-check" value="${key}" ${checked} ${disabled}>
              <span>${def.label}</span>
            </label>
          `;
        }
      });
      html += `</div>`;
    }
    grid.innerHTML = html;
  },

  _getFilteredBaseData() {
    return spService._getFromLocal('equipment');
  },

  _renderTab() {
    const container = document.getElementById('listContent');
    const colSelector = document.getElementById('columnSelectorWrapper');
    if (!container) return;

    // 表示項目設定ボタンの表示制御（機器マスタの時だけ表示）
    if (colSelector) {
      colSelector.style.display = (this.currentTab === 'equipment') ? 'block' : 'none';
    }

    switch (this.currentTab) {
      case 'equipment': this._renderEquipmentTable(container); break;
      case 'result': this._renderResultTable(container); break;
      case 'failure': this._renderFailureTable(container); break;
    }
  },

  _renderEquipmentTable(container) {
    const query = (document.getElementById('listSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('listStatusFilter')?.value || '';
    const equipments = this._getFilteredBaseData();
    const inspections = spService._getFromLocal('inspection');

    // データのマージ
    let items = equipments.map(eq => {
      const insp = inspections.find(i => i.equipmentId === eq.equipmentId) || {};
      return { ...eq, ...insp };
    });

    // 統合検索
    if (query || statusFilter) {
      items = items.filter(item => {
        if (statusFilter && item.status !== statusFilter) return false;
        if (!query) return true;
        const searchPool = Object.values(item).map(v => String(v || '').toLowerCase()).join(' ');
        return searchPool.includes(query);
      });
    }

    // ソート
    if (this.sortKey) {
      items.sort((a, b) => {
        let valA = a[this.sortKey] || '';
        let valB = b[this.sortKey] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        // 数値項目のソート
        const numericKeys = ['totalCost', 'equipmentCost', 'iqoqCost', 'otherCost', 'inspectionFrequency', 'monthlyInspectionFrequency'];
        if (numericKeys.some(k => this.sortKey.includes(k))) {
          valA = parseFloat(valA) || 0;
          valB = parseFloat(valB) || 0;
        }
        
        if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.currentViewData = items; // CSV出力用

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏭</div>
          <p class="empty-state-text">条件に合致するデータはありません</p>
        </div>`;
      return;
    }

    const headerCells = this.selectedColumns.map(key => {
      const def = this.COLUMN_DEFINITIONS[key];
      const isActive = this.sortKey === key;
      const icon = isActive ? (this.sortOrder === 'asc' ? ' 🔼' : ' 🔽') : ' ↕️';
      return `<th class="sortable-header" data-key="${key}" style="cursor:pointer;">
                ${def.label}<span class="sort-icon" style="font-size:0.7rem; margin-left:4px; opacity:${isActive?1:0.3}">${icon}</span>
              </th>`;
    }).join('');

    container.innerHTML = `
      <div class="data-table-container">
        <table class="data-table">
          <thead><tr>${headerCells}<th>操作</th></tr></thead>
          <tbody>
            ${items.map(item => `
              <tr>
                ${this.selectedColumns.map(key => {
                  let val = item[key];
                  // 旧データ互換性: lotNumberがあればそれを使用
                  if (key === 'serialNumber' && (val === undefined || val === null)) val = item['lotNumber'];
                  val = val || '-';
                  if (key === 'equipmentId') return `<td><strong>${val}</strong></td>`;
                  if (key === 'status') return `<td>${this._statusBadge(val)}</td>`;
                  return `<td>${val}</td>`;
                }).join('')}
                <td>
                  <div style="display:flex; gap:4px;">
                    <button class="btn btn-sm btn-secondary list-edit-btn" data-id="${item.equipmentId}" data-type="equipment">機器</button>
                    <button class="btn btn-sm btn-secondary list-edit-btn" data-id="${item.equipmentId}" data-type="inspection">点検</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;font-size:0.8rem;color:var(--text-muted); display:flex; justify-content:space-between;">
        <span>${items.length} 件表示</span>
        <span>※ヘッダーをクリックで並べ替えが可能です</span>
      </div>`;

    this._bindTableActions(container);
  },

  _renderResultTable(container) {
    const query = (document.getElementById('listSearch')?.value || '').toLowerCase();
    const results = spService._getFromLocal('result');
    const equipments = spService._getFromLocal('equipment');

    let items = results.map(r => {
      const eq = equipments.find(e => e.equipmentId === r.equipmentId) || {};
      return { ...r, equipmentName: eq.equipmentName };
    });

    if (query) {
      items = items.filter(item => Object.values(item).some(v => String(v || '').toLowerCase().includes(query)));
    }

    this.currentViewData = items;

    container.innerHTML = `
      <div class="data-table-container">
        <table class="data-table">
          <thead><tr><th>点検日</th><th>管理番号</th><th>機器名</th><th>点検項目</th><th>結果</th></tr></thead>
          <tbody>
            ${items.sort((a,b)=>b.inspectionDate.localeCompare(a.inspectionDate)).map(item => `
              <tr>
                <td>${item.inspectionDate}</td>
                <td><strong>${item.equipmentId}</strong></td>
                <td>${item.equipmentName || '-'}</td>
                <td>${item.inspectionType}</td>
                <td><span class="status-badge ${item.result==='適合'?'success':'failure'}">${item.result}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  _renderFailureTable(container) {
    const query = (document.getElementById('listSearch')?.value || '').toLowerCase();
    const failures = spService._getFromLocal('failure');
    const equipments = spService._getFromLocal('equipment');

    let items = failures.map(f => {
      const eq = equipments.find(e => e.equipmentId === f.equipmentId) || {};
      return { ...f, equipmentName: eq.equipmentName };
    });

    if (query) {
      items = items.filter(item => Object.values(item).some(v => String(v || '').toLowerCase().includes(query)));
    }

    this.currentViewData = items;

    container.innerHTML = `
      <div class="data-table-container">
        <table class="data-table">
          <thead><tr><th>故障日</th><th>管理番号</th><th>機器名</th><th>内容</th><th>操作</th></tr></thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.failureDate}</td>
                <td><strong>${item.equipmentId}</strong></td>
                <td>${item.equipmentName || '-'}</td>
                <td>${item.implementationContent || '-'}</td>
                <td><button class="btn btn-sm btn-secondary list-edit-btn" data-id="${item.equipmentId}" data-type="failure">編集</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    this._bindTableActions(container);
  },

  _exportToCSV() {
    if (!this.currentViewData || this.currentViewData.length === 0) {
      alert('出力するデータがありません。');
      return;
    }

    let headers = [];
    let keys = [];

    if (this.currentTab === 'equipment') {
      headers = this.selectedColumns.map(key => this.COLUMN_DEFINITIONS[key].label);
      keys = this.selectedColumns;
    } else if (this.currentTab === 'result') {
      headers = ['点検日', '管理番号', '機器名', '点検項目', '結果', '実施者'];
      keys = ['inspectionDate', 'equipmentId', 'equipmentName', 'inspectionType', 'result', 'inspectedBy'];
    } else if (this.currentTab === 'failure') {
      headers = ['故障日', '管理番号', '機器名', '内容', '実施日', '対応者'];
      keys = ['failureDate', 'equipmentId', 'equipmentName', 'implementationContent', 'implementationDate', 'implementationPersonInCharge'];
    }

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const item of this.currentViewData) {
      const row = keys.map(key => {
        let val = item[key];
        // CSV出力時も旧データ互換性を維持
        if (key === 'serialNumber' && (val === undefined || val === null)) val = item['lotNumber'];
        val = val || '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `機器管理_${this.currentTab}_${new Date().toISOString().slice(0,10)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  _statusBadge(status) {
    const map = {
      '登録中：使用不可': 'registering',
      '稼働中：使用可': 'active',
      '点検中：使用不可': 'inspection',
      '故障中：使用不可': 'failure',
      '遊休：使用不可': 'idle',
      '廃棄済': 'retired'
    };
    const cls = map[status] || 'active';
    return `<span class="status-badge ${cls}">${status || '-'}</span>`;
  },

  _bindTableActions(container) {
    container.querySelectorAll('.list-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        if (type === 'equipment') {
          App.navigateTo('equipment');
          setTimeout(() => EquipmentModule.loadData(id), 100);
        } else if (type === 'inspection') {
          App.navigateTo('inspection');
          setTimeout(() => InspectionModule._loadData(id), 100);
        }
      });
    });
  }
};
