import { httpRequest } from './http';

export type InventoryCategory = 'furniture' | 'appliance' | 'electrical' | 'bedding' | 'other';
export type InventoryLevel = 'room' | 'bed';
export type InventoryCondition = 'new' | 'good' | 'fair';
export type OverrideAction = 'add' | 'remove' | 'change_qty' | 'change_condition';
export type CheckoutItemStatus = 'ok' | 'damaged' | 'missing' | 'not_applicable';

export interface CatalogItem {
  id: string;
  pgId: string;
  name: string;
  category: InventoryCategory;
  level: InventoryLevel;
  defaultValueInr: number;
  isActive: boolean;
  isMaster?: boolean;
  createdAt?: string;
}

export interface TemplateItem {
  id: string;
  templateId: string;
  catalogItemId: string;
  catalogItemName?: string;
  category?: InventoryCategory;
  level?: InventoryLevel;
  qtyPerRoom: number;
  qtyPerBed: number;
  defaultCondition: InventoryCondition;
  defaultValueInr?: number;
}

export interface InventoryTemplate {
  id: string;
  pgId: string;
  name: string;
  notes?: string;
  items: TemplateItem[];
  createdAt?: string;
  assignedRoomCount?: number;
}

export interface ResolvedInventoryItem {
  catalogItemId: string;
  name: string;
  category: InventoryCategory;
  level: InventoryLevel;
  qty: number;
  condition: InventoryCondition;
  serialOrTag?: string;
  photoUrls?: string[];
  defaultValueInr?: number;
  shared: boolean;
  bedId?: string;
  bedLabel?: string;
  isOverridden?: boolean;
}

export interface RoomInventoryResponse {
  roomId: string;
  templateId?: string | null;
  templateName?: string | null;
  roomItems: ResolvedInventoryItem[];
  bedItems: Record<string, ResolvedInventoryItem[]>; // bedId -> items
  allResolved: ResolvedInventoryItem[];
}

export interface InventoryOverridePayload {
  catalogItemId: string;
  bedId?: string | null;
  action: OverrideAction;
  qty: number;
  condition?: InventoryCondition;
  serialOrTag?: string;
  photoUrls?: string[];
  note?: string;
}

export interface CheckoutInventoryLine {
  snapshotItemRef: string;
  name: string;
  category?: InventoryCategory;
  level: InventoryLevel;
  shared: boolean;
  conditionAtMoveIn?: InventoryCondition;
  status: CheckoutItemStatus;
  qtyReturned: number;
  totalQtyExpected: number;
  defaultValueInr: number;
  deductionInr: number;
  photoUrls: string[];
  note?: string;
}

export interface CheckoutInventoryCheckData {
  checkoutId: string;
  snapshotId?: string;
  lines: CheckoutInventoryLine[];
  totalDeductionInr: number;
  securityDeposit: number;
  pendingRentDues: number;
  netSettlementAmount: number;
  isBalanceDue: boolean;
  balanceDueInr: number;
}

// 1. Catalog APIs
export async function getInventoryCatalog(pgId: string): Promise<CatalogItem[]> {
  if (!pgId) return [];
  try {
    const res = await httpRequest<CatalogItem[]>(`/pg/${pgId}/inventory/catalog`, {
      auth: true,
      skipForceLogout: true,
    });
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.warn(`Failed to fetch inventory catalog for PG ${pgId}:`, err);
    return [];
  }
}

export async function createCatalogItem(
  pgId: string,
  data: Omit<CatalogItem, 'id' | 'pgId' | 'createdAt'>
): Promise<CatalogItem> {
  return await httpRequest<CatalogItem>(`/pg/${pgId}/inventory/catalog`, {
    method: 'POST',
    body: data,
    auth: true,
  });
}

export async function updateCatalogItem(
  pgId: string,
  itemId: string,
  data: Partial<CatalogItem>
): Promise<CatalogItem> {
  return await httpRequest<CatalogItem>(`/pg/${pgId}/inventory/catalog/${itemId}`, {
    method: 'PATCH',
    body: data,
    auth: true,
  });
}

export async function syncMasterInventory(
  pgId: string
): Promise<{ success: boolean; syncedCount: number }> {
  return await httpRequest<{ success: boolean; syncedCount: number }>(
    `/pg/${pgId}/inventory/catalog/sync-master`,
    {
      method: 'POST',
      auth: true,
    }
  );
}

// 2. Template APIs
export async function getInventoryTemplates(pgId: string): Promise<InventoryTemplate[]> {
  if (!pgId) return [];
  try {
    const res = await httpRequest<InventoryTemplate[]>(`/pg/${pgId}/inventory/templates`, {
      auth: true,
      skipForceLogout: true,
    });
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.warn(`Failed to fetch inventory templates for PG ${pgId}:`, err);
    return [];
  }
}

export async function createInventoryTemplate(
  pgId: string,
  data: { name: string; notes?: string; items: Omit<TemplateItem, 'id' | 'templateId'>[] }
): Promise<InventoryTemplate> {
  return await httpRequest<InventoryTemplate>(`/pg/${pgId}/inventory/templates`, {
    method: 'POST',
    body: data,
    auth: true,
  });
}

export async function updateInventoryTemplate(
  pgId: string,
  templateId: string,
  data: Partial<InventoryTemplate>
): Promise<InventoryTemplate> {
  return await httpRequest<InventoryTemplate>(`/pg/${pgId}/inventory/templates/${templateId}`, {
    method: 'PATCH',
    body: data,
    auth: true,
  });
}

export async function deleteInventoryTemplate(
  pgId: string,
  templateId: string
): Promise<{ success: boolean }> {
  return await httpRequest(`/pg/${pgId}/inventory/templates/${templateId}`, {
    method: 'DELETE',
    auth: true,
  });
}

// 3. Bulk Assignment
export async function bulkAssignInventoryTemplate(
  pgId: string,
  templateId: string,
  roomIds: string[]
): Promise<{ success: boolean; assignedCount: number; overriddenRooms: string[] }> {
  return await httpRequest(`/pg/${pgId}/inventory/templates/${templateId}/assign`, {
    method: 'POST',
    body: { roomIds },
    auth: true,
  });
}

// 4. Room Inventory & Overrides
export async function getRoomInventory(pgId: string, roomId: string): Promise<RoomInventoryResponse> {
  if (!pgId || !roomId) {
    return {
      roomId: roomId || '',
      templateId: null,
      templateName: null,
      roomItems: [],
      bedItems: {},
      allResolved: [],
    };
  }
  try {
    const res = await httpRequest<RoomInventoryResponse>(`/pg/${pgId}/rooms/${roomId}/inventory`, {
      auth: true,
      skipForceLogout: true,
    });
    return res || {
      roomId,
      templateId: null,
      templateName: null,
      roomItems: [],
      bedItems: {},
      allResolved: [],
    };
  } catch (err) {
    console.warn(`Failed to fetch room inventory for room ${roomId}:`, err);
    return {
      roomId,
      templateId: null,
      templateName: null,
      roomItems: [],
      bedItems: {},
      allResolved: [],
    };
  }
}

export async function saveRoomInventoryOverride(
  pgId: string,
  roomId: string,
  override: InventoryOverridePayload
): Promise<{ success: boolean }> {
  return await httpRequest(`/pg/${pgId}/rooms/${roomId}/inventory/overrides`, {
    method: 'POST',
    body: override,
    auth: true,
  });
}

export async function copyRoomInventory(
  pgId: string,
  fromRoomId: string,
  toRoomIds: string[]
): Promise<{ success: boolean; copiedCount: number }> {
  return await httpRequest(`/pg/${pgId}/rooms/inventory/copy`, {
    method: 'POST',
    body: { fromRoomId, toRoomIds },
    auth: true,
  });
}

// 5. Checkout Inventory Check
export async function getCheckoutInventoryCheck(
  pgId: string,
  checkoutId: string,
  roomId?: string
): Promise<CheckoutInventoryCheckData> {
  const query = roomId ? `?roomId=${encodeURIComponent(roomId)}` : '';
  try {
    const res = await httpRequest<CheckoutInventoryCheckData>(
      `/pg/${pgId}/checkouts/${checkoutId}/inventory-check${query}`,
      { auth: true, skipForceLogout: true }
    );
    return res;
  } catch (err) {
    console.warn(`Failed to fetch checkout inventory check for checkout ${checkoutId}:`, err);
    return {
      checkoutId,
      lines: [],
      totalDeductionInr: 0,
      securityDeposit: 0,
      pendingRentDues: 0,
      netSettlementAmount: 0,
      isBalanceDue: false,
      balanceDueInr: 0,
    };
  }
}

export async function saveCheckoutInventoryCheck(
  pgId: string,
  checkoutId: string,
  lines: CheckoutInventoryLine[]
): Promise<{ success: boolean; totalDeductionInr: number; netSettlementAmount: number }> {
  return await httpRequest(`/pg/${pgId}/checkouts/${checkoutId}/inventory-check`, {
    method: 'PUT',
    body: { lines },
    auth: true,
  });
}
