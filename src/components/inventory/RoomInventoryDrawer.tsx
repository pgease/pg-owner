import { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Bed,
  Tv,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Tag,
  Check,
  AlertCircle,
  Loader2,
  Camera,
  X,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type CatalogItem,
  type ResolvedInventoryItem,
  type RoomInventoryResponse,
  type InventoryCondition,
  type OverrideAction,
  getRoomInventory,
  getInventoryCatalog,
  saveRoomInventoryOverride,
  copyRoomInventory,
} from '@/api/inventoryApi';
import { toast } from '@/components/ui/use-toast';
import { useRoomsList } from '@/hooks/usePropertyOwnerQueries';

interface RoomInventoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pgId: string;
  room: {
    id: string;
    roomNumber: string | number;
    capacity?: number;
    numberOfBeds?: number;
    floorNumber?: number;
  } | null;
  onUpdated?: () => void;
}

export const RoomInventoryDrawer = ({
  open,
  onOpenChange,
  pgId,
  room,
  onUpdated,
}: RoomInventoryDrawerProps) => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<RoomInventoryResponse | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  // Override / Add item modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [targetLevel, setTargetLevel] = useState<'room' | 'bed'>('room');
  const [selectedBedId, setSelectedBedId] = useState<string>('bed_1');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [overrideQty, setOverrideQty] = useState<number>(1);
  const [overrideCondition, setOverrideCondition] = useState<InventoryCondition>('good');
  const [overrideSerial, setOverrideSerial] = useState<string>('');
  const [overridePhotoUrl, setOverridePhotoUrl] = useState<string>('');
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  // Copy inventory modal
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [targetRoomIds, setTargetRoomIds] = useState<string[]>([]);
  const [isCopying, setIsCopying] = useState(false);

  const { data: allRooms = [] } = useRoomsList(pgId);

  const loadData = async () => {
    if (!room?.id) return;
    setLoading(true);
    try {
      const [invData, catData] = await Promise.all([
        getRoomInventory(pgId, room.id),
        getInventoryCatalog(pgId),
      ]);
      setInventory(invData);
      setCatalog(catData);
    } catch (err: any) {
      toast({
        title: 'Error loading room inventory',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && room?.id) {
      loadData();
    }
  }, [open, room?.id]);

  const openAddOverrideModal = (level: 'room' | 'bed', bedId?: string) => {
    setTargetLevel(level);
    if (bedId) setSelectedBedId(bedId);
    setSelectedCatalogId(catalog.find((c) => c.level === level)?.id || catalog[0]?.id || '');
    setOverrideQty(1);
    setOverrideCondition('good');
    setOverrideSerial('');
    setOverridePhotoUrl('');
    setOverrideModalOpen(true);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room?.id || !selectedCatalogId) return;

    setIsSavingOverride(true);
    try {
      await saveRoomInventoryOverride(pgId, room.id, {
        catalogItemId: selectedCatalogId,
        bedId: targetLevel === 'bed' ? selectedBedId : null,
        action: 'add',
        qty: Number(overrideQty) || 1,
        condition: overrideCondition,
        serialOrTag: overrideSerial.trim() || undefined,
        photoUrls: overridePhotoUrl ? [overridePhotoUrl] : [],
      });
      toast({ title: 'Room item updated successfully' });
      setOverrideModalOpen(false);
      loadData();
      onUpdated?.();
    } catch (err: any) {
      toast({
        title: 'Failed to update item',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleRemoveOverride = async (item: ResolvedInventoryItem) => {
    if (!room?.id) return;
    if (!confirm(`Are you sure you want to remove ${item.name}?`)) return;

    try {
      await saveRoomInventoryOverride(pgId, room.id, {
        catalogItemId: item.catalogItemId,
        bedId: item.bedId || null,
        action: 'remove',
        qty: 0,
      });
      toast({ title: 'Item removed from room' });
      loadData();
      onUpdated?.();
    } catch (err: any) {
      toast({
        title: 'Failed to remove item',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleExecuteCopy = async () => {
    if (!room?.id || targetRoomIds.length === 0) {
      toast({ title: 'Please select at least one target room', variant: 'destructive' });
      return;
    }

    setIsCopying(true);
    try {
      await copyRoomInventory(pgId, room.id, targetRoomIds);
      toast({
        title: 'Inventory Copied',
        description: `Successfully copied Room ${room.roomNumber}'s inventory setup to ${targetRoomIds.length} rooms.`,
      });
      setCopyModalOpen(false);
      setTargetRoomIds([]);
    } catch (err: any) {
      toast({
        title: 'Copy failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsCopying(false);
    }
  };

  const toggleCopyTargetRoom = (rId: string) => {
    setTargetRoomIds((prev) =>
      prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-6">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Package className="h-5 w-5 text-teal-600" />
              Room {room?.roomNumber} Inventory
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCopyModalOpen(true)}
                className="h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy to Other Rooms
              </Button>
            </div>
          </div>
          <DialogDescription className="text-xs text-gray-500 flex items-center gap-2 mt-1">
            <span>
              Template:{' '}
              <strong className="text-gray-700">
                {inventory?.templateName || 'Custom / Baseline'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Capacity: {room?.capacity || room?.numberOfBeds || 2} Beds (Floor{' '}
              {room?.floorNumber ?? 1})
            </span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-600" />
            <p className="text-xs text-gray-400 mt-2">Loading room inventory items...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 py-3 pr-1 text-xs">
            {/* 1. ROOM-LEVEL ITEMS (SHARED) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-teal-50/80 px-3 py-2 rounded-xl border border-teal-200/60">
                <div className="flex items-center gap-2">
                  <Tv className="h-4 w-4 text-teal-700" />
                  <span className="font-bold text-teal-900 text-xs">
                    Room Items (Shared by all occupants)
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-white border-teal-300 text-teal-800">
                    {inventory?.roomItems.length || 0} items
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openAddOverrideModal('room')}
                  className="h-7 text-xs text-teal-700 hover:bg-teal-100 gap-1 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Room Item
                </Button>
              </div>

              {inventory?.roomItems.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-xs">
                  No shared room items configured. Click above to add TV, AC, Fridge, Geyser, etc.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white overflow-hidden shadow-xs">
                  {inventory?.roomItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-xs">{item.name}</span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal uppercase tracking-wider"
                          >
                            Qty: {item.qty}
                          </Badge>
                          <Badge
                            className={`text-[10px] font-medium capitalize ${
                              item.condition === 'new'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : item.condition === 'fair'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            {item.condition}
                          </Badge>
                          {item.isOverridden && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[9px]">
                              Overridden
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                          {item.serialOrTag && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" /> Tag: {item.serialOrTag}
                            </span>
                          )}
                          <span>Value: ₹{item.defaultValueInr?.toLocaleString('en-IN') || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveOverride(item)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. BED-LEVEL ITEMS (PERSONAL PER BED) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-brandText" />
                  <span className="font-bold text-gray-900 text-xs">
                    Bed Items (Allocated individually per tenant)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(inventory?.bedItems || {}).map(([bedId, items], bIdx) => (
                  <div
                    key={bedId}
                    className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs"
                  >
                    <div className="bg-gray-50/90 px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bed className="h-3.5 w-3.5 text-gray-500" />
                        <span className="font-bold text-gray-800 text-xs">
                          Bed {String.fromCharCode(65 + bIdx)} (Bed {bIdx + 1})
                        </span>
                        <span className="text-gray-400 text-[11px]">({items.length} items)</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openAddOverrideModal('bed', bedId)}
                        className="h-6 text-[11px] text-teal-700 hover:bg-teal-50 gap-1 font-semibold"
                      >
                        <Plus className="h-3 w-3" /> Add Bed Item
                      </Button>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {items.map((item, iIdx) => (
                        <div
                          key={iIdx}
                          className="p-2.5 px-3 flex items-center justify-between hover:bg-gray-50/50"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 text-xs">
                                {item.name}
                              </span>
                              <Badge variant="outline" className="text-[10px] h-5">
                                Qty: {item.qty}
                              </Badge>
                              <span className="text-[10px] text-gray-500 capitalize">
                                • {item.condition}
                              </span>
                              {item.isOverridden && (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[9px] h-4">
                                  Overridden
                                </Badge>
                              )}
                            </div>
                            {item.serialOrTag && (
                              <p className="text-[10px] text-gray-400">
                                Serial/Tag: {item.serialOrTag}
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveOverride(item)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-gray-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* OVERRIDE / ADD ITEM MODAL */}
      <Dialog open={overrideModalOpen} onOpenChange={setOverrideModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Add Item to Room {room?.roomNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {targetLevel === 'room'
                ? 'Adding a shared room-level appliance or amenity.'
                : `Adding an individual item allocated to ${selectedBedId}.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveOverride} className="space-y-3.5 py-1 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Catalog Item *</Label>
              <Select value={selectedCatalogId} onValueChange={setSelectedCatalogId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose item" />
                </SelectTrigger>
                <SelectContent>
                  {catalog
                    .filter((c) => c.level === targetLevel)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} (₹{cat.defaultValueInr})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={overrideQty}
                  onChange={(e) => setOverrideQty(parseInt(e.target.value, 10) || 1)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Condition</Label>
                <Select
                  value={overrideCondition}
                  onValueChange={(v) => setOverrideCondition(v as InventoryCondition)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Serial Number or Asset Tag (Optional)</Label>
              <Input
                placeholder="e.g. SN-AC-2026-8891"
                value={overrideSerial}
                onChange={(e) => setOverrideSerial(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Photo URL / Proof (Optional)</Label>
              <Input
                placeholder="https://..."
                value={overridePhotoUrl}
                onChange={(e) => setOverridePhotoUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOverrideModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingOverride || !selectedCatalogId}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
              >
                {isSavingOverride ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* COPY TO OTHER ROOMS MODAL */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Copy Room {room?.roomNumber} Inventory
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Replicate this room's exact inventory baseline and overrides to other rooms.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <Label className="font-semibold text-gray-700">Select Target Rooms</Label>
            <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-gray-100 bg-white">
              {allRooms
                .filter((r: any) => r.id !== room?.id)
                .map((r: any) => {
                  const isChecked = targetRoomIds.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleCopyTargetRoom(r.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? 'bg-teal-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center border ${
                            isChecked
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="font-bold text-gray-900">Room {r.roomNumber}</span>
                      </div>
                      <span className="text-gray-400 text-[11px]">Floor {r.floorNumber ?? 1}</span>
                    </div>
                  );
                })}
            </div>
            <p className="text-[11px] text-gray-500">
              {targetRoomIds.length} target rooms selected
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCopyModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteCopy}
              disabled={isCopying || targetRoomIds.length === 0}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
            >
              {isCopying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Copy to {targetRoomIds.length} Rooms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
