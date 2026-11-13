import { useState, useMemo } from 'react';
import {
  Layers,
  Building,
  Check,
  AlertTriangle,
  Loader2,
  Filter,
  CheckSquare,
  Square,
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type InventoryTemplate, bulkAssignInventoryTemplate } from '@/api/inventoryApi';
import { toast } from '@/components/ui/use-toast';
import { useRoomsList, useBlocks, useFloors } from '@/hooks/usePropertyOwnerQueries';

interface BulkAssignInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pgId: string;
  template: InventoryTemplate | null;
  templates: InventoryTemplate[];
  onSuccess: () => void;
}

export const BulkAssignInventoryModal = ({
  open,
  onOpenChange,
  pgId,
  template,
  templates,
  onSuccess,
}: BulkAssignInventoryModalProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(template?.id || '');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [blockFilter, setBlockFilter] = useState<string>('all');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');
  const [isAssigning, setIsAssigning] = useState(false);

  // Sync selected template when prop changes
  useMemo(() => {
    if (template?.id) {
      setSelectedTemplateId(template.id);
    } else if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [template, templates]);

  const { data: rooms = [], isLoading: isLoadingRooms } = useRoomsList(pgId);
  const { data: blocks = [] } = useBlocks(pgId);
  const { data: floors = [] } = useFloors(pgId);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r: any) => {
      if (floorFilter !== 'all' && String(r.floorId || r.floorNumber) !== floorFilter) {
        return false;
      }
      if (blockFilter !== 'all' && String(r.blockId || r.block) !== blockFilter) {
        return false;
      }
      if (capacityFilter !== 'all') {
        const cap = Number(r.capacity || r.numberOfBeds || 1);
        if (capacityFilter === '1' && cap !== 1) return false;
        if (capacityFilter === '2' && cap !== 2) return false;
        if (capacityFilter === '3+' && cap < 3) return false;
      }
      return true;
    });
  }, [rooms, floorFilter, blockFilter, capacityFilter]);

  const allFilteredSelected =
    filteredRooms.length > 0 &&
    filteredRooms.every((r: any) => selectedRoomIds.includes(r.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedRoomIds((prev) =>
        prev.filter((id) => !filteredRooms.some((r: any) => r.id === id))
      );
    } else {
      const newIds = Array.from(
        new Set([...selectedRoomIds, ...filteredRooms.map((r: any) => r.id)])
      );
      setSelectedRoomIds(newIds);
    }
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || template;

  const handleApply = async () => {
    if (!selectedTemplateId) {
      toast({ title: 'Please select a template to apply', variant: 'destructive' });
      return;
    }
    if (selectedRoomIds.length === 0) {
      toast({ title: 'Please select at least one room', variant: 'destructive' });
      return;
    }

    setIsAssigning(true);
    try {
      const res = await bulkAssignInventoryTemplate(pgId, selectedTemplateId, selectedRoomIds);
      toast({
        title: 'Template Assigned',
        description: `Successfully applied "${activeTemplate?.name}" to ${res.assignedCount || selectedRoomIds.length} rooms.`,
      });
      setSelectedRoomIds([]);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Assignment Failed',
        description: err.message || 'Could not assign template to selected rooms.',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Layers className="h-5 w-5 text-teal-600" />
            Bulk Assign Inventory Template to Rooms
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Apply a predefined set of furniture and appliances to multiple rooms in one go.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          {/* Template Selection */}
          <div className="space-y-1.5 bg-teal-50/60 border border-teal-200/80 p-3.5 rounded-xl">
            <Label className="text-xs font-semibold text-teal-900">
              Select Inventory Template to Apply *
            </Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="bg-white h-9 text-xs">
                <SelectValue placeholder="Choose template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.items.length} items configured)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTemplate && (
              <p className="text-[11px] text-teal-700 mt-1">
                Contains: {activeTemplate.items.map((i) => i.catalogItemName || 'Item').join(', ')}
              </p>
            )}
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-3 gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
            <div>
              <Label className="text-[10px] font-semibold text-gray-500 uppercase">Floor</Label>
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="All Floors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  {floors.map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id || f.floorNumber)}>
                      Floor {f.floorNumber ?? f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-gray-500 uppercase">Block / Wing</Label>
              <Select value={blockFilter} onValueChange={setBlockFilter}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="All Blocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Blocks</SelectItem>
                  {blocks.map((b: any) => (
                    <SelectItem key={b.id} value={String(b.id || b.name)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-gray-500 uppercase">Room Sharing</Label>
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="All Capacities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Capacities</SelectItem>
                  <SelectItem value="1">Single Bed (1)</SelectItem>
                  <SelectItem value="2">Double Bed (2)</SelectItem>
                  <SelectItem value="3+">3+ Beds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rooms Multi-Select Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="flex items-center gap-1.5 font-semibold text-teal-700 hover:text-teal-800"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
                <span>Select All Filtered ({filteredRooms.length})</span>
              </button>

              <span className="text-gray-500 font-medium">
                {selectedRoomIds.length} of {rooms.length} rooms selected
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-gray-100 bg-white">
              {isLoadingRooms ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                  <p className="text-xs text-gray-400 mt-2">Loading rooms...</p>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No rooms match the selected filters.
                </div>
              ) : (
                filteredRooms.map((r: any) => {
                  const isChecked = selectedRoomIds.includes(r.id);
                  const cap = Number(r.capacity || r.numberOfBeds || 1);
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleRoomSelection(r.id)}
                      className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-teal-50/70 hover:bg-teal-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900">Room {r.roomNumber}</span>
                          <span className="text-gray-500 text-[11px] ml-2">
                            ({cap} {cap === 1 ? 'bed' : 'beds'} • Floor {r.floorNumber ?? 1})
                          </span>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px] font-normal border-gray-200">
                        {r.block || 'Main Wing'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Overwrite Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Applying this template will update the inventory baseline for
              all selected rooms. Any previously customized room-level overrides will be preserved,
              while baseline template items will be refreshed.
            </span>
          </div>
        </div>

        <DialogFooter className="border-t border-gray-100 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={isAssigning || selectedRoomIds.length === 0}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
          >
            {isAssigning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Apply Template to {selectedRoomIds.length} {selectedRoomIds.length === 1 ? 'Room' : 'Rooms'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
