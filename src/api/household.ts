import type {
  HouseholdData,
  TransactionInput,
  BatchTransactionInput,
  BalanceInput,
  ApiResponse,
} from '../types';

const API_BASE = '/api/';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit,
  errorMessage: string,
  requireData = false
): Promise<T> {
  const response = await fetch(endpoint, options);

  if (!response.ok) {
    throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error || errorMessage);
  }

  if (requireData && result.data === undefined) {
    throw new Error('No data returned from API');
  }

  return result.data as T;
}

export async function fetchHouseholdData(): Promise<HouseholdData> {
  return apiRequest<HouseholdData>(
    API_BASE,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
    'Failed to fetch data',
    true
  );
}

export async function addTransaction(input: TransactionInput): Promise<void> {
  return apiRequest<void>(
    API_BASE,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    'Failed to add transaction'
  );
}

export async function addTransactions(inputs: TransactionInput[]): Promise<void> {
  const batchInput: BatchTransactionInput = { transactions: inputs };
  return apiRequest<void>(
    API_BASE,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchInput),
    },
    'Failed to add transactions'
  );
}

export async function updateBalance(input: BalanceInput): Promise<void> {
  return apiRequest<void>(
    API_BASE,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance: input }),
    },
    'Failed to update balance'
  );
}
