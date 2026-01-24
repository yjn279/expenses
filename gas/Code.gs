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

// スプレッドシートID（環境に応じて変更）
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
 * POST リクエストハンドラ - レコード追加（単一/バッチ対応）
 */
function doPost(e) {
  try {
    const input = JSON.parse(e.postData.contents);

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
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 設定情報を取得
  const settings = getSettings(ss);

  // P/Lデータを取得
  const transactions = getTransactions(ss);

  // カテゴリ一覧を抽出（支出・収入別）
  const categoryData = extractCategoriesByType(transactions);

  // 月次データを集計
  const monthlyData = aggregateMonthlyData(transactions, settings);

  // 年次データを集計
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

  // ヘッダー行: month, category, type, amount
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
 * カテゴリ一覧を抽出（重複排除）- 後方互換用
 */
function extractCategories(transactions) {
  const categorySet = {};
  transactions.forEach(function(t) {
    if (t.category && t.type === 'expense') {
      categorySet[t.category] = true;
    }
  });
  return Object.keys(categorySet).sort();
}

/**
 * カテゴリ一覧を支出・収入別に抽出
 */
function extractCategoriesByType(transactions) {
  const expenseSet = {};
  const incomeSet = {};

  transactions.forEach(function(t) {
    if (!t.category) return;

    if (t.type === 'expense') {
      expenseSet[t.category] = true;
    } else if (t.type === 'income') {
      incomeSet[t.category] = true;
    }
  });

  return {
    expenseCategories: Object.keys(expenseSet).sort(),
    incomeCategories: Object.keys(incomeSet).sort()
  };
}

/**
 * 月次データを集計
 */
function aggregateMonthlyData(transactions, settings) {
  // 月ごとにグループ化
  const monthlyMap = {};

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

  // 月順にソート
  const sortedMonths = Object.keys(monthlyMap).sort();

  // 収支と累積資産を計算
  let runningTotal = settings.initialBalance;

  const result = sortedMonths.map(function(month) {
    const data = monthlyMap[month];
    const profit = data.income - data.expense;
    runningTotal += profit;

    return {
      month: data.month,
      income: data.income,
      expense: data.expense,
      profit: profit,
      totalAssets: runningTotal,
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
    yearData.lastTotalAssets = m.totalAssets; // 年末の資産

    // カテゴリ別支出を合算
    Object.keys(m.categoryExpense).forEach(function(cat) {
      if (!yearData.categoryExpense[cat]) {
        yearData.categoryExpense[cat] = 0;
      }
      yearData.categoryExpense[cat] += m.categoryExpense[cat];
    });
  });

  // 年順にソート
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

  if (input.type !== 'income' && input.type !== 'expense') {
    throw new Error('Type must be "income" or "expense"');
  }

  if (typeof input.amount !== 'number' || input.amount <= 0) {
    throw new Error('Amount must be a positive number');
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

  // P/Lシートに追加
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(PL_SHEET_NAME);

  if (!sheet) {
    // シートが存在しない場合は作成
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

  // 全トランザクションをバリデーション
  inputs.forEach(function(input, index) {
    try {
      validateTransaction(input);
    } catch (e) {
      throw new Error('Transaction ' + index + ': ' + e.message);
    }
  });

  // P/Lシートに追加
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(PL_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(PL_SHEET_NAME);
    sheet.appendRow(['month', 'category', 'type', 'amount']);
  }

  // バッチで行を追加
  const rows = inputs.map(function(input) {
    return [input.month, input.category, input.type, input.amount];
  });

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, 4).setValues(rows);
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
