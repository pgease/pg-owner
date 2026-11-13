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

// Default Seed Catalog used for local initialization / fallback
export const DEFAULT_CATALOG_SEEDS: Omit<CatalogItem, 'id' | 'pgId' | 'createdAt'>[] = [
  { name: 'Single bed', category: 'furniture', level: 'bed', defaultValueInr: 4500, isActive: true },
  { name: 'Mattress', category: 'bedding', level: 'bed', defaultValueInr: 2500, isActive: true },
  { name: 'Pillow', category: 'bedding', level: 'bed', defaultValueInr: 350, isActive: true },
  { name: 'Almirah / Wardrobe', category: 'furniture', level: 'bed', defaultValueInr: 5000, isActive: true },
  { name: 'Study table', category: 'furniture', level: 'bed', defaultValueInr: 1800, isActive: true },
  { name: 'Chair', category: 'furniture', level: 'bed', defaultValueInr: 800, isActive: true },
  { name: 'Room key', category: 'other', level: 'room', defaultValueInr: 150, isActive: true },
  { name: 'Almirah key', category: 'other', level: 'bed', defaultValueInr: 100, isActive: true },
  { name: 'Ceiling fan', category: 'electrical', level: 'room', defaultValueInr: 1800, isActive: true },
  { name: 'Tube light / LED batten', category: 'electrical', level: 'room', defaultValueInr: 350, isActive: true },
  { name: 'Split AC 1.5 Ton', category: 'appliance', level: 'room', defaultValueInr: 32000, isActive: true },
  { name: 'Geyser / Water heater', category: 'appliance', level: 'room', defaultValueInr: 6000, isActive: true },
  { name: 'LED Smart TV', category: 'appliance', level: 'room', defaultValueInr: 14000, isActive: true },
  { name: 'Mini Refrigerator', category: 'appliance', level: 'room', defaultValueInr: 9500, isActive: true },
  { name: 'Air Cooler', category: 'appliance', level: 'room', defaultValueInr: 5500, isActive: true },
  { name: 'Window Curtains', category: 'furniture', level: 'room', defaultValueInr: 600, isActive: true },
  { name: 'Dustbin', category: 'other', level: 'room', defaultValueInr: 200, isActive: true },
];

const LOCAL_STORAGE_PREFIX = 'pgease_inv_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal(key: string, data: any) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

// 1. Catalog APIs
export async function getInventoryCatalog(pgId: string): Promise<CatalogItem[]> {
  try {
    return await httpRequest<CatalogItem[]>(`/pg/${pgId}/inventory/catalog`, { auth: true });
  } catch {
    const local = getLocal<CatalogItem[]>(`catalog_${pgId}`, []);
    if (!local.length) {
      const seeded = DEFAULT_CATALOG_SEEDS.map((s, idx) => ({
        ...s,
        id: `seed_${idx + 1}`,
        pgId,
        createdAt: new Date().toISOString(),
      }));
      setLocal(`catalog_${pgId}`, seeded);
      return seeded;
    }
    return local;
  }
}

export async function createCatalogItem(
  pgId: string,
  data: Omit<CatalogItem, 'id' | 'pgId' | 'createdAt'>
): Promise<CatalogItem> {
  try {
    return await httpRequest<CatalogItem>(`/pg/${pgId}/inventory/catalog`, {
      method: 'POST',
      body: data,
      auth: true,
    });
  } catch {
    const catalog = await getInventoryCatalog(pgId);
    const newItem: CatalogItem = {
      ...data,
      id: `cat_${Date.now()}`,
      pgId,
      createdAt: new Date().toISOString(),
    };
    catalog.push(newItem);
    setLocal(`catalog_${pgId}`, catalog);
    return newItem;
  }
}

export async function updateCatalogItem(
  pgId: string,
  itemId: string,
  data: Partial<CatalogItem>
): Promise<CatalogItem> {
  try {
    return await httpRequest<CatalogItem>(`/pg/${pgId}/inventory/catalog/${itemId}`, {
      method: 'PATCH',
      body: data,
      auth: true,
    });
  } catch {
    const catalog = await getInventoryCatalog(pgId);
    const idx = catalog.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      catalog[idx] = { ...catalog[idx], ...data };
      setLocal(`catalog_${pgId}`, catalog);
      return catalog[idx];
    }
    throw new Error('Item not found');
  }
}

// 2. Template APIs
export async function getInventoryTemplates(pgId: string): Promise<InventoryTemplate[]> {
  try {
    return await httpRequest<InventoryTemplate[]>(`/pg/${pgId}/inventory/templates`, { auth: true });
  } catch {
    return getLocal<InventoryTemplate[]>(`templates_${pgId}`, [
      {
        id: 'tpl_std_double_ac',
        pgId,
        name: 'Standard Double AC',
        notes: '2 beds, 2 wardrobes, 1 AC, 1 Geyser',
        assignedRoomCount: 6,
        items: [
          { id: 'ti_1', templateId: 'tpl_std_double_ac', catalogItemId: 'seed_1', catalogItemName: 'Single bed', level: 'bed', qtyPerRoom: 0, qtyPerBed: 1, defaultCondition: 'good', defaultValueInr: 4500 },
          { id: 'ti_2', templateId: 'tpl_std_double_ac', catalogItemId: 'seed_2', catalogItemName: 'Mattress', level: 'bed', qtyPerRoom: 0, qtyPerBed: 1, defaultCondition: 'good', defaultValueInr: 2500 },
          { id: 'ti_3', templateId: 'tpl_std_double_ac', catalogItemId: 'seed_4', catalogItemName: 'Almirah / Wardrobe', level: 'bed', qtyPerRoom: 0, qtyPerBed: 1, defaultCondition: 'good', defaultValueInr: 5000 },
          { id: 'ti_4', templateId: 'tpl_std_double_ac', catalogItemId: 'seed_11', catalogItemName: 'Split AC 1.5 Ton', level: 'room', qtyPerRoom: 1, qtyPerBed: 0, defaultCondition: 'new', defaultValueInr: 32000 },
          { id: 'ti_5', templateId: 'tpl_std_double_ac', catalogItemId: 'seed_12', catalogItemName: 'Geyser / Water heater', level: 'room', qtyPerRoom: 1, qtyPerBed: 0, defaultCondition: 'good', defaultValueInr: 6000 },
          { id: 'ti_6', templateId: 'tpl_std_double_ac', catalogItemId: 'seed_9', catalogItemName: 'Ceiling fan', level: 'room', qtyPerRoom: 1, qtyPerBed: 0, defaultCondition: 'good', defaultValueInr: 1800 },
        ],
      },
    ]);
  }
}

export async function createInventoryTemplate(
  pgId: string,
  data: { name: string; notes?: string; items: Omit<TemplateItem, 'id' | 'templateId'>[] }
): Promise<InventoryTemplate> {
  try {
    return await httpRequest<InventoryTemplate>(`/pg/${pgId}/inventory/templates`, {
      method: 'POST',
      body: data,
      auth: true,
    });
  } catch {
    const list = await getInventoryTemplates(pgId);
    const newId = `tpl_${Date.now()}`;
    const newTemplate: InventoryTemplate = {
      id: newId,
      pgId,
      name: data.name,
      notes: data.notes,
      assignedRoomCount: 0,
      items: data.items.map((i, idx) => ({ ...i, id: `ti_${newId}_${idx}`, templateId: newId })),
    };
    list.push(newTemplate);
    setLocal(`templates_${pgId}`, list);
    return newTemplate;
  }
}

export async function updateInventoryTemplate(
  pgId: string,
  templateId: string,
  data: Partial<InventoryTemplate>
): Promise<InventoryTemplate> {
  try {
    return await httpRequest<InventoryTemplate>(`/pg/${pgId}/inventory/templates/${templateId}`, {
      method: 'PATCH',
      body: data,
      auth: true,
    });
  } catch {
    const list = await getInventoryTemplates(pgId);
    const idx = list.findIndex((t) => t.id === templateId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setLocal(`templates_${pgId}`, list);
      return list[idx];
    }
    throw new Error('Template not found');
  }
}

export async function deleteInventoryTemplate(pgId: string, templateId: string): Promise<{ success: boolean }> {
  try {
    return await httpRequest(`/pg/${pgId}/inventory/templates/${templateId}`, {
      method: 'DELETE',
      auth: true,
    });
  } catch {
    const list = await getInventoryTemplates(pgId);
    const filtered = list.filter((t) => t.id !== templateId);
    setLocal(`templates_${pgId}`, filtered);
    return { success: true };
  }
}

// 3. Bulk Assignment
export async function bulkAssignInventoryTemplate(
  pgId: string,
  templateId: string,
  roomIds: string[]
): Promise<{ success: boolean; assignedCount: number; overriddenRooms: string[] }> {
  try {
    return await httpRequest(`/pg/${pgId}/inventory/templates/${templateId}/assign`, {
      method: 'POST',
      body: { roomIds },
      auth: true,
    });
  } catch {
    const roomMap = getLocal<Record<string, string>>(`room_tpl_map_${pgId}`, {});
    roomIds.forEach((rId) => {
      roomMap[rId] = templateId;
    });
    setLocal(`room_tpl_map_${pgId}`, roomMap);
    return { success: true, assignedCount: roomIds.length, overriddenRooms: [] };
  }
}

// 4. Room Inventory & Overrides
export async function getRoomInventory(pgId: string, roomId: string): Promise<RoomInventoryResponse> {
  try {
    return await httpRequest<RoomInventoryResponse>(`/pg/${pgId}/rooms/${roomId}/inventory`, { auth: true });
  } catch {
    const roomMap = getLocal<Record<string, string>>(`room_tpl_map_${pgId}`, {});
    const templateId = roomMap[roomId] || 'tpl_std_double_ac';
    const templates = await getInventoryTemplates(pgId);
    const tpl = templates.find((t) => t.id === templateId) || templates[0];

    const roomItems: ResolvedInventoryItem[] = [];
    const bedItems: Record<string, ResolvedInventoryItem[]> = {
      bed_1: [],
      bed_2: [],
    };

    tpl?.items.forEach((item) => {
      if (item.level === 'room') {
        roomItems.push({
          catalogItemId: item.catalogItemId,
          name: item.catalogItemName || 'Room Item',
          category: item.category || 'appliance',
          level: 'room',
          qty: item.qtyPerRoom || 1,
          condition: item.defaultCondition || 'good',
          defaultValueInr: item.defaultValueInr || 1000,
          shared: true,
        });
      } else {
        ['bed_1', 'bed_2'].forEach((bId, bIdx) => {
          bedItems[bId].push({
            catalogItemId: item.catalogItemId,
            name: item.catalogItemName || 'Bed Item',
            category: item.category || 'furniture',
            level: 'bed',
            qty: item.qtyPerBed || 1,
            condition: item.defaultCondition || 'good',
            defaultValueInr: item.defaultValueInr || 2000,
            shared: false,
            bedId: bId,
            bedLabel: `Bed ${String.fromCharCode(65 + bIdx)}`,
          });
        });
      }
    });

    const allResolved = [...roomItems, ...Object.values(bedItems).flat()];

    return {
      roomId,
      templateId: tpl?.id || null,
      templateName: tpl?.name || 'Standard Double AC',
      roomItems,
      bedItems,
      allResolved,
    };
  }
}

export async function saveRoomInventoryOverride(
  pgId: string,
  roomId: string,
  override: InventoryOverridePayload
): Promise<{ success: boolean }> {
  try {
    return await httpRequest(`/pg/${pgId}/rooms/${roomId}/inventory/overrides`, {
      method: 'POST',
      body: override,
      auth: true,
    });
  } catch {
    const key = `overrides_${roomId}`;
    const overrides = getLocal<InventoryOverridePayload[]>(key, []);
    overrides.push(override);
    setLocal(key, overrides);
    return { success: true };
  }
}

export async function copyRoomInventory(
  pgId: string,
  fromRoomId: string,
  toRoomIds: string[]
): Promise<{ success: boolean; copiedCount: number }> {
  try {
    return await httpRequest(`/pg/${pgId}/rooms/inventory/copy`, {
      method: 'POST',
      body: { fromRoomId, toRoomIds },
      auth: true,
    });
  } catch {
    const roomMap = getLocal<Record<string, string>>(`room_tpl_map_${pgId}`, {});
    const srcTpl = roomMap[fromRoomId];
    if (srcTpl) {
      toRoomIds.forEach((tId) => {
        roomMap[tId] = srcTpl;
      });
      setLocal(`room_tpl_map_${pgId}`, roomMap);
    }
    return { success: true, copiedCount: toRoomIds.length };
  }
}

// 5. Checkout Inventory Check
export async function getCheckoutInventoryCheck(
  pgId: string,
  checkoutId: string,
  roomId?: string
): Promise<CheckoutInventoryCheckData> {
  try {
    return await httpRequest<CheckoutInventoryCheckData>(`/pg/${pgId}/checkouts/${checkoutId}/inventory-check`, { auth: true });
  } catch {
    const roomInv = await getRoomInventory(pgId, roomId || 'default');
    const lines: CheckoutInventoryLine[] = roomInv.allResolved.map((item) => ({
      snapshotItemRef: item.catalogItemId,
      name: item.name,
      category: item.category,
      level: item.level,
      shared: item.shared,
      conditionAtMoveIn: item.condition,
      status: item.shared ? 'not_applicable' : 'ok',
      qtyReturned: item.qty,
      totalQtyExpected: item.qty,
      defaultValueInr: item.defaultValueInr || 1500,
      deductionInr: 0,
      photoUrls: [],
    }));

    return {
      checkoutId,
      lines,
      totalDeductionInr: 0,
      securityDeposit: 10000,
      pendingRentDues: 1200,
      netSettlementAmount: 8800,
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
  try {
    return await httpRequest(`/pg/${pgId}/checkouts/${checkoutId}/inventory-check`, {
      method: 'PUT',
      body: { lines },
      auth: true,
    });
  } catch {
    const totalDeductionInr = lines
      .filter((l) => l.status === 'damaged' || l.status === 'missing')
      .reduce((sum, l) => sum + Number(l.deductionInr || 0), 0);
    return {
      success: true,
      totalDeductionInr,
      netSettlementAmount: Math.max(0, 10000 - 1200 - totalDeductionInr),
    };
  }
}

