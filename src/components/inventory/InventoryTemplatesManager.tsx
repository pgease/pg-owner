import { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Bed,
  CheckCircle2,
  Building,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  type CatalogItem,
  type InventoryTemplate,
  type TemplateItem,
  type InventoryCondition,
  createInventoryTemplate,
  updateInventoryTemplate,
  deleteInventoryTemplate,
} from '@/api/inventoryApi';
import { toast } from '@/components/ui/use-toast';

interface InventoryTemplatesManagerProps {
  pgId: string;
  catalog: CatalogItem[];
  templates: InventoryTemplate[];
  onRefresh: () => void;
  onOpenBulkAssign: (template: InventoryTemplate) => void;
}

export const InventoryTemplatesManager = ({
  pgId,
  catalog,
  templates,
  onRefresh,
  onOpenBulkAssign,
}: InventoryTemplatesManagerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InventoryTemplate | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    Array<{
      catalogItemId: string;
      qtyPerRoom: number;
      qtyPerBed: number;
      defaultCondition: InventoryCondition;
    }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  const activeCatalog = catalog.filter((c) => c.isActive);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setName('');
    setNotes('');
    // Prefill with essential items
    const defaultSelected = activeCatalog.slice(0, 5).map((c) => ({
      catalogItemId: c.id,
      qtyPerRoom: c.level === 'room' ? 1 : 0,
      qtyPerBed: c.level === 'bed' ? 1 : 0,
      defaultCondition: 'good' as InventoryCondition,
    }));
    setItems(defaultSelected);
    setIsModalOpen(true);
  };

  const openEditModal = (tpl: InventoryTemplate) => {
    setEditingTemplate(tpl);
    setName(tpl.name);
    setNotes(tpl.notes || '');
    setItems(
      tpl.items.map((i) => ({
        catalogItemId: i.catalogItemId,
        qtyPerRoom: i.qtyPerRoom,
        qtyPerBed: i.qtyPerBed,
        defaultCondition: i.defaultCondition,
      }))
    );
    setIsModalOpen(true);
  };

  const handleAddItem = (catalogItemId: string) => {
    const catItem = activeCatalog.find((c) => c.id === catalogItemId);
    if (!catItem) return;
    if (items.some((i) => i.catalogItemId === catalogItemId)) {
      toast({ title: 'Item already in template' });
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        catalogItemId,
        qtyPerRoom: catItem.level === 'room' ? 1 : 0,
        qtyPerBed: catItem.level === 'bed' ? 1 : 0,
        defaultCondition: 'good',
      },
    ]);
  };

  const handleRemoveItem = (catalogItemId: string) => {
    setItems((prev) => prev.filter((i) => i.catalogItemId !== catalogItemId));
  };

  const handleUpdateItem = (
    catalogItemId: string,
    field: 'qtyPerRoom' | 'qtyPerBed' | 'defaultCondition',
    value: any
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.catalogItemId === catalogItemId ? { ...i, [field]: value } : i))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const formattedItems = items.map((i) => {
        const cat = catalog.find((c) => c.id === i.catalogItemId);
        return {
          catalogItemId: i.catalogItemId,
          catalogItemName: cat?.name || 'Item',
          category: cat?.category,
          level: cat?.level,
          qtyPerRoom: Number(i.qtyPerRoom) || 0,
          qtyPerBed: Number(i.qtyPerBed) || 0,
          defaultCondition: i.defaultCondition,
          defaultValueInr: cat?.defaultValueInr,
        };
      });

      if (editingTemplate) {
        await updateInventoryTemplate(pgId, editingTemplate.id, {
          name: name.trim(),
          notes: notes.trim(),
          items: formattedItems as any,
        });
        toast({ title: 'Template updated successfully' });
      } else {
        await createInventoryTemplate(pgId, {
          name: name.trim(),
          notes: notes.trim(),
          items: formattedItems,
        });
        toast({ title: 'Template created successfully' });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({
        title: 'Failed to save template',
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tpl: InventoryTemplate) => {
    if (!confirm(`Are you sure you want to delete template "${tpl.name}"?`)) return;
    try {
      await deleteInventoryTemplate(pgId, tpl.id);
      toast({ title: 'Template deleted' });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Failed to delete template', description: err?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Room Inventory Templates</h3>
          <p className="text-xs text-muted-foreground">
            Standard package profiles assigned to multiple rooms in 1-click (e.g. Standard Double AC, Premium Single).
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => {
          const roomCount = tpl.assignedRoomCount || 0;
          return (
            <Card key={tpl.id} className="border border-border/80 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3 bg-slate-50/50 border-b border-border/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" /> {tpl.name}
                    </CardTitle>
                    {tpl.notes && (
                      <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                        {tpl.notes}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold shrink-0">
                    {roomCount} {roomCount === 1 ? 'Room' : 'Rooms'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-3.5 space-y-3 flex-1 text-xs">
                {/* Items Summary */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Included Items ({tpl.items?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {tpl.items?.map((item) => (
                      <Badge
                        key={item.id}
                        variant="secondary"
                        className="text-[11px] font-medium bg-slate-100 text-slate-800 border-slate-200"
                      >
                        {item.catalogItemName || 'Item'}{' '}
                        {item.level === 'bed'
                          ? `(${item.qtyPerBed}/bed)`
                          : `(${item.qtyPerRoom}/room)`}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Example 2-Sharing Preview */}
                <div className="rounded-lg bg-teal-50/80 p-2.5 border border-teal-100 text-teal-900 text-[11px] space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-teal-600" />
                    For a 2-Bed Room:
                  </span>
                  <p className="text-[11px] text-teal-800 line-clamp-2">
                    {tpl.items
                      ?.map((i) => {
                        const total = i.level === 'bed' ? i.qtyPerBed * 2 : i.qtyPerRoom;
                        return `${total}x ${i.catalogItemName || 'Item'}`;
                      })
                      .join(', ')}
                  </p>
                </div>
              </CardContent>

              <div className="p-3 border-t border-border/40 bg-slate-50/30 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  onClick={() => onOpenBulkAssign(tpl)}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-8 flex-1"
                >
                  <Building className="h-3.5 w-3.5 mr-1" /> Bulk Assign
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(tpl)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title="Edit Template"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tpl)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Delete Template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit Template Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingTemplate ? 'Edit Inventory Template' : 'Create Room Inventory Template'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Template Name *</Label>
                <Input
                  placeholder="e.g. Standard Double AC, Premium Single"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description / Notes</Label>
                <Input
                  placeholder="e.g. Attached washroom, balcony room package"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Items Selection & Quantities */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <Label className="text-xs font-bold text-foreground">
                  Template Items ({items.length})
                </Label>
                <div className="flex items-center gap-2">
                  <Select onValueChange={handleAddItem}>
                    <SelectTrigger className="w-[180px] h-8 text-xs font-medium">
                      <SelectValue placeholder="+ Add from Catalog" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCatalog.map((c) => (
                        <SelectItem key={c.id} value={c.id} disabled={items.some((i) => i.catalogItemId === c.id)}>
                          {c.name} ({c.level === 'bed' ? 'Bed' : 'Room'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  No items added yet. Click "+ Add from Catalog" to choose furniture or appliances.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {items.map((i) => {
                    const cat = catalog.find((c) => c.id === i.catalogItemId);
                    const isBed = cat?.level === 'bed';
                    return (
                      <div
                        key={i.catalogItemId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border/70 bg-slate-50/70"
                      >
                        <div className="space-y-0.5 min-w-[160px]">
                          <span className="font-bold text-foreground block">{cat?.name || 'Item'}</span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] py-0 px-1">
                              {cat?.category}
                            </Badge>
                            {isBed ? 'Per Bed (Personal)' : 'Per Room (Shared)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {isBed ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-muted-foreground">Qty / Bed:</span>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={i.qtyPerBed}
                                onChange={(e) =>
                                  handleUpdateItem(i.catalogItemId, 'qtyPerBed', Number(e.target.value) || 1)
                                }
                                className="w-16 h-8 text-xs text-center font-mono"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-muted-foreground">Qty / Room:</span>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={i.qtyPerRoom}
                                onChange={(e) =>
                                  handleUpdateItem(i.catalogItemId, 'qtyPerRoom', Number(e.target.value) || 1)
                                }
                                className="w-16 h-8 text-xs text-center font-mono"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground">Condition:</span>
                            <Select
                              value={i.defaultCondition}
                              onValueChange={(v: InventoryCondition) =>
                                handleUpdateItem(i.catalogItemId, 'defaultCondition', v)
                              }
                            >
                              <SelectTrigger className="w-[90px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="fair">Fair</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(i.catalogItemId)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving || items.length === 0} className="font-bold text-xs h-9">
                {isSaving ? 'Saving...' : editingTemplate ? 'Save Template' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

