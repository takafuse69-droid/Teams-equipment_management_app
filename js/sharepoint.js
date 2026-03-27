/* =============================================
   SharePoint連携モジュール
   localStorage フォールバック付き
   ============================================= */

class SharePointService {
  constructor() {
    this.siteUrl = localStorage.getItem('sp_site_url') || '';
    this.connected = false;
    this.lists = {
      equipment: '機器マスタ',
      inspection: '点検情報',
      failure: '故障履歴',
      result: '点検結果'
    };
  }

  // --- 設定 ---
  configure(siteUrl) {
    this.siteUrl = siteUrl.replace(/\/$/, '');
    localStorage.setItem('sp_site_url', this.siteUrl);
  }

  isConfigured() {
    return !!this.siteUrl;
  }

  // --- SharePoint REST API ヘルパー ---
  async getDigest() {
    const res = await fetch(`${this.siteUrl}/_api/contextinfo`, {
      method: 'POST',
      headers: { 'Accept': 'application/json;odata=verbose' },
      credentials: 'include'
    });
    const data = await res.json();
    return data.d.GetContextWebInformation.FormDigestValue;
  }

  async ensureList(listName, fields) {
    try {
      // Check if list exists
      const res = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')`,
        { headers: { 'Accept': 'application/json;odata=verbose' }, credentials: 'include' }
      );
      if (res.ok) return true;

      // Create list
      const digest = await this.getDigest();
      const createRes = await fetch(`${this.siteUrl}/_api/web/lists`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest
        },
        credentials: 'include',
        body: JSON.stringify({
          '__metadata': { 'type': 'SP.List' },
          'AllowContentTypes': true,
          'BaseTemplate': 100,
          'ContentTypesEnabled': true,
          'Title': listName
        })
      });

      if (!createRes.ok) throw new Error('リスト作成に失敗しました');

      // Add fields
      for (const field of fields) {
        await this.addField(listName, field, digest);
      }

      return true;
    } catch (e) {
      console.error('SharePoint list error:', e);
      return false;
    }
  }

  async addField(listName, field, digest) {
    const fieldTypeMap = {
      'Text': 2,
      'Number': 9,
      'DateTime': 4,
      'Choice': 6,
      'Note': 3,
      'Currency': 10
    };

    const body = {
      '__metadata': { 'type': 'SP.Field' },
      'Title': field.name,
      'FieldTypeKind': fieldTypeMap[field.type] || 2,
      'Required': field.required || false
    };

    await fetch(
      `${this.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/fields`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest
        },
        credentials: 'include',
        body: JSON.stringify(body)
      }
    );
  }

  // --- CRUD Operations ---
  async saveItem(listType, data) {
    if (this.siteUrl) {
      try {
        return await this._saveToSharePoint(listType, data);
      } catch (e) {
        console.warn('SharePoint保存失敗、ローカルに保存:', e);
      }
    }
    return this._saveToLocal(listType, data);
  }

  async getItems(listType) {
    if (this.siteUrl) {
      try {
        return await this._getFromSharePoint(listType);
      } catch (e) {
        console.warn('SharePoint取得失敗、ローカルから読込:', e);
      }
    }
    return this._getFromLocal(listType);
  }

  async deleteItem(listType, key) {
    if (this.siteUrl) {
      try {
        return await this._deleteFromSharePoint(listType, key);
      } catch (e) {
        console.warn('SharePoint削除失敗、ローカルから削除:', e);
      }
    }
    return this._deleteFromLocal(listType, key);
  }

  // --- SharePoint CRUD ---
  async _saveToSharePoint(listType, data) {
    const listName = this.lists[listType];
    const digest = await this.getDigest();

    // Check if item exists (update) or create new
    const existingId = await this._findItemId(listName, data.equipmentId);

    if (existingId) {
      // Update
      await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items(${existingId})`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': digest,
            'IF-MATCH': '*',
            'X-HTTP-Method': 'MERGE'
          },
          credentials: 'include',
          body: JSON.stringify(this._mapToSPFields(data))
        }
      );
    } else {
      // Create
      const spData = this._mapToSPFields(data);
      spData['__metadata'] = { 'type': `SP.Data.${listName.replace(/\s/g, '_x0020_')}ListItem` };

      await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': digest
          },
          credentials: 'include',
          body: JSON.stringify(spData)
        }
      );
    }
    // Also save locally as cache
    this._saveToLocal(listType, data);
    return true;
  }

  async _getFromSharePoint(listType) {
    const listName = this.lists[listType];
    const res = await fetch(
      `${this.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items?$top=5000`,
      { headers: { 'Accept': 'application/json;odata=verbose' }, credentials: 'include' }
    );
    if (!res.ok) throw new Error('取得失敗');
    const data = await res.json();
    return data.d.results.map(item => this._mapFromSPFields(listType, item));
  }

  async _deleteFromSharePoint(listType, key) {
    const listName = this.lists[listType];
    const itemId = await this._findItemId(listName, key);
    if (!itemId) return false;

    const digest = await this.getDigest();
    await fetch(
      `${this.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items(${itemId})`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'IF-MATCH': '*',
          'X-HTTP-Method': 'DELETE'
        },
        credentials: 'include'
      }
    );
    this._deleteFromLocal(listType, key);
    return true;
  }

  async _findItemId(listName, equipmentId) {
    try {
      const res = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items?$filter=Title eq '${equipmentId}'&$select=Id`,
        { headers: { 'Accept': 'application/json;odata=verbose' }, credentials: 'include' }
      );
      const data = await res.json();
      if (data.d.results.length > 0) return data.d.results[0].Id;
      return null;
    } catch { return null; }
  }

  _mapToSPFields(data) {
    // Use 'Title' for equipmentId, other fields mapped directly
    const sp = { Title: data.equipmentId };
    Object.keys(data).forEach(key => {
      if (key !== 'equipmentId') {
        sp[key] = data[key];
      }
    });
    return sp;
  }

  _mapFromSPFields(listType, item) {
    const data = { equipmentId: item.Title };
    Object.keys(item).forEach(key => {
      if (!key.startsWith('__') && key !== 'Title' && key !== 'Id'
        && key !== 'AuthorId' && key !== 'EditorId') {
        data[key] = item[key];
      }
    });
    return data;
  }

  // --- LocalStorage CRUD ---
  _getStorageKey(listType) {
    return `eq_mgmt_${listType}`;
  }

  _saveToLocal(listType, data) {
    const key = this._getStorageKey(listType);
    const items = JSON.parse(localStorage.getItem(key) || '[]');

    if (listType === 'failure') {
      // 故障履歴は同じ機器管理番号で複数レコード可能
      const idx = items.findIndex(item =>
        item.equipmentId === data.equipmentId &&
        item.failureDate === data.failureDate
      );
      if (idx >= 0) {
        items[idx] = data;
      } else {
        items.push(data);
      }
    } else {
      // 機器マスタ・点検情報はキーで一意
      const idx = items.findIndex(item => item.equipmentId === data.equipmentId);
      if (idx >= 0) {
        items[idx] = data;
      } else {
        items.push(data);
      }
    }

    localStorage.setItem(key, JSON.stringify(items));
    return true;
  }

  _getFromLocal(listType) {
    const key = this._getStorageKey(listType);
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  _deleteFromLocal(listType, keyValue) {
    const key = this._getStorageKey(listType);
    let items = JSON.parse(localStorage.getItem(key) || '[]');
    items = items.filter(item => item.equipmentId !== keyValue);
    localStorage.setItem(key, JSON.stringify(items));
    return true;
  }

  // --- SharePoint リスト初期化 ---
  async initializeLists() {
    if (!this.siteUrl) return false;

    const equipmentFields = [
      { name: 'Maker', type: 'Text' },
      { name: 'EquipmentName', type: 'Text' },
      { name: 'EquipmentDetail', type: 'Note' },
      { name: 'ModelNumber', type: 'Text' },
      { name: 'LotNumber', type: 'Text' },
      { name: 'TotalCost', type: 'Currency' },
      { name: 'EquipmentCost', type: 'Currency' },
      { name: 'IQOQCost', type: 'Currency' },
      { name: 'IntroductionDate', type: 'DateTime' },
      { name: 'ValidationNumber', type: 'Text' },
      { name: 'ProcedureNumber', type: 'Text' },
      { name: 'PersonInCharge', type: 'Text' },
      { name: 'Location', type: 'Text' },
      { name: 'Status', type: 'Choice' }
    ];

    const inspectionFields = [
      { name: 'IsInspectionTarget', type: 'Text' },
      { name: 'YearlyInspectionAgency', type: 'Text' },
      { name: 'InspectionFrequency', type: 'Number' },
      { name: 'FirstInspectionDate', type: 'DateTime' },
      { name: 'NextInspectionDate', type: 'DateTime' },
      { name: 'IsInspectionTarget2', type: 'Text' },
      { name: 'YearlyInspectionAgency2', type: 'Text' },
      { name: 'InspectionFrequency2', type: 'Number' },
      { name: 'FirstInspectionDate2', type: 'DateTime' },
      { name: 'NextInspectionDate2', type: 'DateTime' },
      { name: 'MonthlyInspectionTarget', type: 'Text' },
      { name: 'MonthlyInspectionAgency', type: 'Text' },
      { name: 'MonthlyInspectionFrequency', type: 'Number' },
      { name: 'FirstMonthlyInspectionDate', type: 'DateTime' },
      { name: 'NextMonthlyInspectionDate', type: 'DateTime' }
    ];

    const failureFields = [
      { name: 'FailureDate', type: 'DateTime' },
      { name: 'PersonInCharge', type: 'Text' },
      { name: 'ImplementationDate', type: 'DateTime' },
      { name: 'ImplementationDetail', type: 'Note' },
      { name: 'OperationCheck', type: 'Choice' }
    ];

    const inspectionResultFields = [
      { name: 'InspectionType', type: 'Text' },
      { name: 'PersonInCharge', type: 'Text' },
      { name: 'InspectedBy', type: 'Text' },
      { name: 'InspectionDate', type: 'DateTime' },
      { name: 'Result', type: 'Text' },
      { name: 'Remarks', type: 'Text' }
    ];

    const r1 = await this.ensureList(this.lists.equipment, equipmentFields);
    const r2 = await this.ensureList(this.lists.inspection, inspectionFields);
    const r3 = await this.ensureList(this.lists.failure, failureFields);
    const r4 = await this.ensureList(this.lists.result, inspectionResultFields);

    return r1 && r2 && r3 && r4;
  }
}

// Global instance
const spService = new SharePointService();
