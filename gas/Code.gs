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
    return createJsonResponse({ success: false, error: error.message });
  }
}

/**
 * POST リクエストハンドラ - レコード追加（単一/バッチ対応）、残高更新
 */
function doPost(e) {
  try {
    const input = JSON.parse(e.postData.contents);

    if (input.balance) {
      updateBalance(input.balance);
      return createJsonResponse({ success: true });
    }

    if (input.transactions && Array.isArray(input.transactions)) {
      addTransactions(input.transactions);
    } else {
      addTransaction(input);
    }

    return createJsonResponse({ success: true });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message });
  }
}

function createJsonResponse(data) {
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

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const monthValue = row[0];
    const balanceValue = row[1];

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
    
    let totalAssets;
    if (balances[month] !== undefined) {
      totalAssets = balances[month];
    } else {
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

function validateMonth(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Invalid month format. Expected YYYY-MM');
  }
}

function validateAmount(amount, fieldName) {
  if (typeof amount !== 'number' || amount < 0) {
    throw new Error(fieldName + ' must be a non-negative number');
  }
  if (amount > 1000000000) {
    throw new Error(fieldName + ' exceeds maximum allowed value');
  }
}

function validateTransaction(input) {
  validateMonth(input.month);

  if (!input.category || typeof input.category !== 'string') {
    throw new Error('Category is required');
  }

  if (input.category.length < 1 || input.category.length > 50) {
    throw new Error('Category name must be between 1 and 50 characters');
  }

  if (input.type !== 'income' && input.type !== 'expense') {
    throw new Error('Type must be "income" or "expense"');
  }

  validateAmount(input.amount, 'Amount');
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

function updateBalance(input) {
  validateMonth(input.month);
  validateAmount(input.balance, 'Balance');

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(BS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(BS_SHEET_NAME);
  }

  const data = sheet.getDataRange().getValues();
  let found = false;
  const month = formatMonth(input.month);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const monthValue = row[0];
    
    if (monthValue && typeof monthValue === 'string' && /^\d{4}-\d{2}$/.test(monthValue)) {
      const existingMonth = formatMonth(monthValue);
      if (existingMonth === month) {
        sheet.getRange(i + 1, 2).setValue(input.balance);
        found = true;
        break;
      }
    }
  }

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
