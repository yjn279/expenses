/**
 * 家計簿ダッシュボード - Google Apps Script Backend
 *
 * このスクリプトをGoogle Apps Scriptエディタにコピーし、
 * ウェブアプリとしてデプロイしてください。
 *
 * スプレッドシート構成:
 * - P/L シート: 月次の収支データ (month, category, type, amount)
 * - B/S シート: 初期残高 (initialBalance) と開始月 (startMonth)
 */

// スプレッドシートID（PropertiesServiceから取得、未設定の場合は空文字列）
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '';

// シート名
const PL_SHEET_NAME = 'P/L';
const BS_SHEET_NAME = 'B/S';

/**
 * GET リクエストハンドラ - データ取得
 */
function doGet(e) {
  try {
    const data = getHouseholdData();
    return createJsonResponse({ success: true, data: data });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * POST リクエストハンドラ - レコード追加（単一/バッチ対応）、残高更新
 */
function doPost(e) {
  try {
    const input = JSON.parse(e.postData.contents);

    // 残高更新リクエスト: { balance: { month: "YYYY-MM", balance: number } } 形式
    if (input.balance) {
      updateBalance(input.balance);
      return createJsonResponse({ success: true });
    }

    // バッチ入力対応: { transactions: [...] } 形式
    if (input.transactions && Array.isArray(input.transactions)) {
      addTransactions(input.transactions);
    } else {
      // 単一入力（後方互換）
      addTransaction(input);
    }

    return createJsonResponse({ success: true });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message }, 400);
  }
}

/**
 * JSONレスポンスを作成
 * @param data - レスポンスデータ
 * @param statusCode - 未使用（Google Apps ScriptのContentServiceはHTTPステータスコードを設定できないため）
 */
function createJsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * 家計簿データを取得
 */
function getHouseholdData() {
  if (!SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID is not configured');
  }

  let ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (error) {
    throw new Error('Failed to open spreadsheet: ' + error.message);
  }

  const settings = getSettings(ss);
  const transactions = getTransactions(ss);
  const balances = getBalances(ss);
  const categoryData = extractCategoriesByType(transactions);
  const monthlyData = aggregateMonthlyData(transactions, settings, balances);
  const yearlyData = aggregateYearlyData(monthlyData);

  return {
    settings: settings,
    monthlyData: monthlyData,
    yearlyData: yearlyData,
    categories: categoryData.expenseCategories, // 後方互換
    expenseCategories: categoryData.expenseCategories,
    incomeCategories: categoryData.incomeCategories
  };
}

/**
 * B/Sシートから設定情報を取得
 */
function getSettings(ss) {
  const sheet = ss.getSheetByName(BS_SHEET_NAME);
  if (!sheet) {
    return { initialBalance: 0, startMonth: '' };
  }

  const data = sheet.getDataRange().getValues();
  let initialBalance = 0;
  let startMonth = '';

  // ヘッダー行を除いてデータを探す
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === 'initialBalance' || row[0] === '初期残高') {
      initialBalance = Number(row[1]) || 0;
    }
    if (row[0] === 'startMonth' || row[0] === '開始月') {
      startMonth = formatMonth(row[1]);
    }
  }

  return { initialBalance: initialBalance, startMonth: startMonth };
}

/**
 * P/Lシートからトランザクションを取得
 */
function getTransactions(ss) {
  const sheet = ss.getSheetByName(PL_SHEET_NAME);
  if (!sheet) {
    return [];
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return [];
  }

  const transactions = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // 空行をスキップ

    transactions.push({
      month: formatMonth(row[0]),
      category: String(row[1] || ''),
      type: String(row[2] || '').toLowerCase() === 'income' ? 'income' : 'expense',
      amount: Number(row[3]) || 0
    });
  }

  return transactions;
}

/**
 * 月を YYYY-MM 形式にフォーマット
 */
function formatMonth(value) {
  if (!value) return '';

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return year + '-' + month;
  }

  // 既に YYYY-MM 形式の場合
  if (/^\d{4}-\d{2}$/.test(String(value))) {
    return String(value);
  }

  return String(value);
}

/**
 * カテゴリ一覧を支出・収入別に抽出（出現順を保持）
 */
function extractCategoriesByType(transactions) {
  const expenseCategories = [];
  const incomeCategories = [];
  const seen = { expense: {}, income: {} };

  transactions.forEach(function(t) {
    if (!t.category) return;

    if (t.type === 'expense' && !seen.expense[t.category]) {
      seen.expense[t.category] = true;
      expenseCategories.push(t.category);
    } else if (t.type === 'income' && !seen.income[t.category]) {
      seen.income[t.category] = true;
      incomeCategories.push(t.category);
    }
  });

  return {
    expenseCategories: expenseCategories,
    incomeCategories: incomeCategories
  };
}

/**
 * B/Sシートから月ごとの残高を取得
 * @param ss - スプレッドシートオブジェクト
 * @return {Object} 月（YYYY-MM）をキー、残高を値とするオブジェクト
 */
function getBalances(ss) {
  const sheet = ss.getSheetByName(BS_SHEET_NAME);
  if (!sheet) {
    return {};
  }

  const data = sheet.getDataRange().getValues();
  const balances = {};

  // ヘッダー行を除いてデータを探す
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const monthValue = row[0];
    const balanceValue = row[1];

    // 月の形式をチェック（YYYY-MM形式または設定情報のキーでない場合）
    if (monthValue && typeof monthValue === 'string' && /^\d{4}-\d{2}$/.test(monthValue)) {
      const month = formatMonth(monthValue);
      if (month) {
        balances[month] = Number(balanceValue) || 0;
      }
    }
  }

  return balances;
}

/**
 * 月次データを集計
 */
function aggregateMonthlyData(transactions, settings, balances) {
  const monthlyMap = {};

  // トランザクションから月次データを集計
  transactions.forEach(function(t) {
    if (!t.month) return;

    if (!monthlyMap[t.month]) {
      monthlyMap[t.month] = {
        month: t.month,
        income: 0,
        expense: 0,
        categoryExpense: {}
      };
    }

    const monthData = monthlyMap[t.month];

    if (t.type === 'income') {
      monthData.income += t.amount;
    } else {
      monthData.expense += t.amount;

      if (!monthData.categoryExpense[t.category]) {
        monthData.categoryExpense[t.category] = 0;
      }
      monthData.categoryExpense[t.category] += t.amount;
    }
  });

  // 残高データがあるがトランザクションがない月も追加
  Object.keys(balances).forEach(function(month) {
    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month: month,
        income: 0,
        expense: 0,
        categoryExpense: {}
      };
    }
  });

  const sortedMonths = Object.keys(monthlyMap).sort();

  const result = sortedMonths.map(function(month) {
    const data = monthlyMap[month];
    const profit = data.income - data.expense;
    
    // B/Sシートから取得した残高があればそれを使用、なければ計算値を使用
    let totalAssets;
    if (balances[month] !== undefined) {
      totalAssets = balances[month];
    } else {
      // 残高がない場合は、前月の残高から計算
      // 最初の月の場合は初期残高を使用
      let previousBalance = settings.initialBalance;
      for (let i = 0; i < sortedMonths.length; i++) {
        if (sortedMonths[i] === month) {
          break;
        }
        const prevMonth = sortedMonths[i];
        if (balances[prevMonth] !== undefined) {
          previousBalance = balances[prevMonth];
        } else {
          const prevData = monthlyMap[prevMonth];
          previousBalance = previousBalance + (prevData.income - prevData.expense);
        }
      }
      totalAssets = previousBalance + profit;
    }

    return {
      month: data.month,
      income: data.income,
      expense: data.expense,
      profit: profit,
      totalAssets: totalAssets,
      categoryExpense: data.categoryExpense
    };
  });

  return result;
}

/**
 * 年次データを集計
 */
function aggregateYearlyData(monthlyData) {
  const yearlyMap = {};

  monthlyData.forEach(function(m) {
    const year = m.month.substring(0, 4);

    if (!yearlyMap[year]) {
      yearlyMap[year] = {
        year: year,
        income: 0,
        expense: 0,
        categoryExpense: {},
        lastTotalAssets: 0
      };
    }

    const yearData = yearlyMap[year];
    yearData.income += m.income;
    yearData.expense += m.expense;
    yearData.lastTotalAssets = m.totalAssets; // その年の最後の月の総資産（年次データのtotalAssetsとして使用）

    Object.keys(m.categoryExpense).forEach(function(cat) {
      if (!yearData.categoryExpense[cat]) {
        yearData.categoryExpense[cat] = 0;
      }
      yearData.categoryExpense[cat] += m.categoryExpense[cat];
    });
  });

  const sortedYears = Object.keys(yearlyMap).sort();

  return sortedYears.map(function(year) {
    const data = yearlyMap[year];
    return {
      year: data.year,
      income: data.income,
      expense: data.expense,
      profit: data.income - data.expense,
      totalAssets: data.lastTotalAssets,
      categoryExpense: data.categoryExpense
    };
  });
}

/**
 * 単一トランザクションのバリデーション
 */
function validateTransaction(input) {
  if (!input.month || !/^\d{4}-\d{2}$/.test(input.month)) {
    throw new Error('Invalid month format. Expected YYYY-MM');
  }

  if (!input.category || typeof input.category !== 'string') {
    throw new Error('Category is required');
  }

  if (input.category.length < 1 || input.category.length > 50) {
    throw new Error('Category name must be between 1 and 50 characters');
  }

  if (input.type !== 'income' && input.type !== 'expense') {
    throw new Error('Type must be "income" or "expense"');
  }

  if (typeof input.amount !== 'number' || input.amount < 0) {
    throw new Error('Amount must be a non-negative number');
  }

  if (input.amount > 1000000000) {
    throw new Error('Amount exceeds maximum allowed value');
  }
}

/**
 * トランザクションを追加（単一）
 */
function addTransaction(input) {
  validateTransaction(input);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(PL_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(PL_SHEET_NAME);
    sheet.appendRow(['month', 'category', 'type', 'amount']);
  }

  sheet.appendRow([input.month, input.category, input.type, input.amount]);
}

/**
 * トランザクションを追加（バッチ）
 */
function addTransactions(inputs) {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error('Transactions array is required');
  }

  inputs.forEach(function(input, index) {
    try {
      validateTransaction(input);
    } catch (e) {
      throw new Error('Transaction ' + index + ': ' + e.message);
    }
  });

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(PL_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(PL_SHEET_NAME);
    sheet.appendRow(['month', 'category', 'type', 'amount']);
  }

  const rows = inputs.map(function(input) {
    return [input.month, input.category, input.type, input.amount];
  });

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, 4).setValues(rows);
}

/**
 * 残高を更新（B/Sシートに月ごとの残高を保存）
 * @param input - { month: "YYYY-MM", balance: number } 形式のオブジェクト
 */
function updateBalance(input) {
  if (!input.month || !/^\d{4}-\d{2}$/.test(input.month)) {
    throw new Error('Invalid month format. Expected YYYY-MM');
  }

  if (typeof input.balance !== 'number' || input.balance < 0) {
    throw new Error('Balance must be a non-negative number');
  }

  if (input.balance > 1000000000) {
    throw new Error('Balance exceeds maximum allowed value');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(BS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(BS_SHEET_NAME);
  }

  const data = sheet.getDataRange().getValues();
  let found = false;
  const month = formatMonth(input.month);

  // 既存の残高データを探す
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const monthValue = row[0];
    
    // 月の形式をチェック（YYYY-MM形式で、設定情報のキーでない場合）
    if (monthValue && typeof monthValue === 'string' && /^\d{4}-\d{2}$/.test(monthValue)) {
      const existingMonth = formatMonth(monthValue);
      if (existingMonth === month) {
        // 既存の行を更新
        sheet.getRange(i + 1, 2).setValue(input.balance);
        found = true;
        break;
      }
    }
  }

  // 見つからなかった場合は新規追加
  if (!found) {
    sheet.appendRow([month, input.balance]);
  }
}

/**
 * テスト用関数 - スプレッドシートIDを設定
 */
function setSpreadsheetId(id) {
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
}

/**
 * テスト用関数 - データ取得をテスト
 */
function testGetData() {
  const data = getHouseholdData();
  Logger.log(JSON.stringify(data, null, 2));
}
