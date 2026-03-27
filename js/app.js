/* =============================================
   アプリケーション メインモジュール
   ============================================= */

const App = {
  currentPage: 'equipment',

  init() {
    this._bindNavigation();
    TabManager.init();
    this._migrateStatuses();
    // 初期タブとして機器登録を開く
    TabManager.openTab('equipment');
    this._updateConnectionStatus();
  },

  _bindNavigation() {
    document.querySelectorAll('.nav-menu a[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        TabManager.openTab(link.dataset.page);
      });
    });
  },

  _migrateStatuses() {
    // 既存データのステータス名を新定義に変換
    const equipments = (typeof spService !== 'undefined' && spService._getFromLocal) ? spService._getFromLocal('equipment') : [];
    if (!equipments || equipments.length === 0) return;

    const map = {
      '稼働中': '稼働中：使用可',
      '点検中': '点検中：使用不可',
      '故障中': '故障中：使用不可',
      '遊休': '遊休：使用不可'
    };
    
    let changed = false;
    const migrated = equipments.map(eq => {
      if (map[eq.status]) {
        changed = true;
        return { ...eq, status: map[eq.status] };
      }
      return eq;
    });

    if (changed) {
      localStorage.setItem('eq_mgmt_equipment', JSON.stringify(migrated));
      console.log('Status migration complete.');
    }
  },

  navigateTo(page, data = null) {
    // 他のモジュールから特定のページを（データ付きで）開くためのブリッジ
    TabManager.openTab(page, data);
  },

  _renderSettings(container) {
    const currentUrl = spService.siteUrl || '';
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><span class="icon">⚙️</span> SharePoint設定</h1>
        <p class="page-subtitle">SharePointサイトとの接続を設定します</p>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">接続設定</span>
        </div>
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">SharePointサイトURL</label>
            <input type="url" class="form-input" id="spSiteUrl"
              placeholder="https://your-tenant.sharepoint.com/sites/your-site"
              value="${currentUrl}">
            <span class="form-hint">SharePointサイトの完全なURLを入力してください</span>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" id="spDisconnect">切断</button>
          <button class="btn btn-primary" id="spConnect">🔗 接続・リスト作成</button>
        </div>
      </div>
      <div class="card" style="margin-top:24px;">
        <div class="card-header">
          <span class="card-title">データ管理</span>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">
          ローカルストレージのデータをエクスポート・インポートできます。
        </p>
        <div class="form-actions" style="justify-content:flex-start;">
          <button class="btn btn-secondary" id="exportBtn">📤 エクスポート</button>
          <button class="btn btn-secondary" id="importBtn">📥 インポート</button>
          <input type="file" id="importFile" accept=".json,.csv" style="display:none;">
        </div>
      </div>
    `;

    // Bind events
    document.getElementById('spConnect').addEventListener('click', async () => {
      const url = document.getElementById('spSiteUrl').value.trim();
      if (!url) {
        this.showToast('URLを入力してください', 'error');
        return;
      }
      spService.configure(url);
      this.showToast('接続設定を保存しました。リストを初期化中...', 'info');
      const ok = await spService.initializeLists();
      if (ok) {
        this.showToast('SharePointリストの初期化が完了しました', 'success');
      } else {
        this.showToast('リスト初期化に失敗。URL・権限を確認してください', 'error');
      }
      this._updateConnectionStatus();
    });

    document.getElementById('spDisconnect').addEventListener('click', () => {
      localStorage.removeItem('sp_site_url');
      spService.siteUrl = '';
      document.getElementById('spSiteUrl').value = '';
      this._updateConnectionStatus();
      this.showToast('SharePoint接続を切断しました', 'info');
    });

    document.getElementById('exportBtn').addEventListener('click', () => this._exportData());
    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', (e) => {
      this._importData(e);
    });
  },

  _exportData() {
    const data = {
      equipment: spService._getFromLocal('equipment'),
      inspection: spService._getFromLocal('inspection'),
      failure: spService._getFromLocal('failure'),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('データをエクスポートしました', 'success');
  },

  async _importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();

    reader.onload = async (ev) => {
      try {
        let importedData = {};
        if (isCsv) {
          importedData = this._parseCSV(ev.target.result);
        } else {
          importedData = JSON.parse(ev.target.result);
        }

        if (importedData.equipment) localStorage.setItem('eq_mgmt_equipment', JSON.stringify(importedData.equipment));
        if (importedData.inspection) localStorage.setItem('eq_mgmt_inspection', JSON.stringify(importedData.inspection));
        if (importedData.failure) localStorage.setItem('eq_mgmt_failure', JSON.stringify(importedData.failure));

        this.showToast('データをローカルにインポートしました', 'success');
        CalendarModule.refresh();
        this.navigateTo(this.currentPage);

        // SharePoint同期の確認
        if (spService.isConfigured() && importedData.equipment) {
          const sync = confirm('インポートしたデータをSharePointリストにも反映（同期）しますか？\n※既存のデータは上書きされる可能性があります。');
          if (sync) {
            this.showToast('SharePoint同期を開始します...', 'info');
            await this._syncToSharePoint(importedData.equipment);
            this.showToast('SharePointとの同期が完了しました', 'success');
          }
        }
      } catch (err) {
        console.error(err);
        this.showToast('インポートに失敗しました: 不正なファイル形式', 'error');
      }
    };
    reader.readAsText(file);
  },

  _parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) throw new Error('データが足りません');

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1);

    // ヘッダーマッピング定義
    const mapping = {
      '設備管理番号': 'equipmentId',
      '使用部局': 'department',
      'メーカー': 'maker',
      '機器名': 'equipmentName',
      '型番': 'modelNumber',
      'シリアル番号': 'serialNumber',
      '機器内容': 'equipmentDetail',
      '購入総額': 'totalCost',
      '機器費': 'equipmentCost',
      'IQ/OQ費': 'iqoqCost',
      'その他の費用': 'otherCost',
      '導入日': 'introductionDate',
      'バリデーション番号': 'validationNumber',
      '手順書番号': 'procedureNumber',
      '機器担当者': 'personInCharge',
      '設置場所': 'location',
      'ステータス': 'status'
    };

    const equipmentList = rows.map(row => {
      // 簡易的なCSVパース (カンマ区切り、ダブルクォート対応)
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const item = {};
      headers.forEach((header, index) => {
        const key = mapping[header] || header;
        item[key] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
      });
      return item;
    });

    return { equipment: equipmentList };
  },

  async _syncToSharePoint(equipmentList) {
    let successCount = 0;
    for (const item of equipmentList) {
      try {
        await spService.saveItem('equipment', item);
        successCount++;
      } catch (e) {
        console.warn(`同期失敗: ${item.equipmentId}`, e);
      }
    }
    console.log(`Sync complete: ${successCount}/${equipmentList.length}`);
  },

  _updateConnectionStatus() {
    const dot = document.getElementById('connectionDot');
    const text = document.getElementById('connectionStatus');
    if (spService.isConfigured()) {
      dot.style.background = 'var(--success)';
      text.textContent = 'SharePoint接続中';
    } else {
      dot.style.background = 'var(--warning)';
      text.textContent = 'ローカル保存';
    }
  },

  // Toast notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

/**
 * Tab Manager
 * Handles multi-tab interface in the center pane
 */
const TabManager = {
  tabs: new Map(), // pageId: { element, panel }
  activeTabId: null,

  init() {
    this.tabsHeader = document.getElementById('tabsHeader');
    this.tabsContent = document.getElementById('tabsContent');
  },

  openTab(pageId, data = null) {
    // すでに開いている場合はアクティブにする
    if (this.tabs.has(pageId)) {
      this.activateTab(pageId);
      // データがある場合は再描画
      if (data) {
        this._renderPageContent(pageId, this.tabs.get(pageId).panel, data);
      }
      return;
    }

    const pageInfo = this._getPageInfo(pageId);
    
    // タブアイテムの作成
    const tabItem = document.createElement('div');
    tabItem.className = 'tab-item';
    tabItem.dataset.id = pageId;
    tabItem.innerHTML = `
      <span class="tab-icon">${pageInfo.icon}</span>
      <span class="tab-title">${pageInfo.title}</span>
      <span class="tab-close" title="閉じる">✕</span>
    `;
    
    // コンテンツパネルの作成
    const tabPanel = document.createElement('div');
    tabPanel.className = 'tab-panel';
    tabPanel.id = `panel-${pageId}`;
    
    // DOMに追加
    this.tabsHeader.appendChild(tabItem);
    this.tabsContent.appendChild(tabPanel);
    
    // Mapに保存
    this.tabs.set(pageId, { element: tabItem, panel: tabPanel });
    
    // タブクリックイベント
    tabItem.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close')) {
        this.closeTab(pageId);
      } else {
        this.activateTab(pageId);
      }
    });

    // 初期コンテンツの描画
    this._renderPageContent(pageId, tabPanel, data);
    
    // アクティブ化
    this.activateTab(pageId);
  },

  activateTab(pageId) {
    this.activeTabId = pageId;
    
    // タブの表示切り替え
    document.querySelectorAll('.tab-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === pageId);
    });
    
    // パネルの表示切り替え
    document.querySelectorAll('.tab-panel').forEach(el => {
      el.classList.toggle('active', el.id === `panel-${pageId}`);
    });

    // ナビゲーションのアクティブ状態更新
    document.querySelectorAll('.nav-menu a').forEach(a => {
      a.classList.toggle('active', a.dataset.page === pageId);
    });
    
    // カレンダー等のリフレッシュが必要な場合
    if (pageId === 'calendar') {
      CalendarModule.refresh();
    }
  },

  closeTab(pageId) {
    const tab = this.tabs.get(pageId);
    if (!tab) return;
    
    tab.element.remove();
    tab.panel.remove();
    this.tabs.delete(pageId);
    
    // 閉じられたタブがアクティブだった場合、別のタブを表示
    if (this.activeTabId === pageId) {
      const remainingIds = Array.from(this.tabs.keys());
      if (remainingIds.length > 0) {
        this.activateTab(remainingIds[remainingIds.length - 1]);
      } else {
        this.activeTabId = null;
      }
    }
  },

  _renderPageContent(pageId, container, data) {
    switch (pageId) {
      case 'equipment': EquipmentModule.render(container); break;
      case 'inspection': InspectionModule.render(container); break;
      case 'calendar': CalendarModule.render(container); break;
      case 'result': ResultModule.render(container, data); break;
      case 'failure': FailureModule.render(container); break;
      case 'list': ListModule.render(container); break;
      case 'settings': App._renderSettings(container); break;
    }
  },

  _getPageInfo(pageId) {
    const config = {
      equipment: { title: '機器登録', icon: '🏭' },
      inspection: { title: '点検設定', icon: '🔍' },
      calendar: { title: '点検カレンダー', icon: '📅' },
      result: { title: '点検結果記録', icon: '📋' },
      failure: { title: '故障対応', icon: '🔧' },
      list: { title: '機器リスト', icon: '📋' },
      settings: { title: '設定', icon: '⚙️' }
    };
    return config[pageId] || { title: pageId, icon: '📄' };
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
