import { httpRequest } from "@/api/http";

const BASE = "/property-owners";

export interface OpsRecord {
  id: string;
  kind?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export async function listOps(propertyId: string, kind: string) {
  const data = await httpRequest<{ items: OpsRecord[] }>(
    `${BASE}/properties/${propertyId}/ops/${kind}`,
    { auth: true },
  );
  return data?.items || [];
}

export async function createOps(propertyId: string, kind: string, payload: Record<string, unknown>) {
  return httpRequest<OpsRecord>(`${BASE}/properties/${propertyId}/ops/${kind}`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function updateOps(propertyId: string, kind: string, id: string, payload: Record<string, unknown>) {
  return httpRequest<OpsRecord>(`${BASE}/properties/${propertyId}/ops/${kind}/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function deleteOps(propertyId: string, kind: string, id: string) {
  return httpRequest<{ success: boolean }>(`${BASE}/properties/${propertyId}/ops/${kind}/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function importOps(propertyId: string, kind: string, items: Record<string, unknown>[]) {
  return httpRequest<{ imported: number }>(`${BASE}/properties/${propertyId}/ops/${kind}/import`, {
    method: "POST",
    auth: true,
    body: { items },
  });
}
