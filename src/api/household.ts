import type { HouseholdData, TransactionInput, ApiResponse } from '../types';

const API_BASE = '/api/';

export async function fetchHouseholdData(): Promise<HouseholdData> {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  }

  const result: ApiResponse<HouseholdData> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Unknown error occurred');
  }

  if (!result.data) {
    throw new Error('No data returned from API');
  }

  return result.data;
}

export async function addTransaction(input: TransactionInput): Promise<void> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to add transaction: ${response.status} ${response.statusText}`);
  }

  const result: ApiResponse<void> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to add transaction');
  }
}
