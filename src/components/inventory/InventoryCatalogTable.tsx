import { useState } from 'react';
import { Plus, Edit2, CheckCircle2, XCircle, Search, Tag, DollarSign, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  type InventoryCategory,
  type InventoryLevel,
  createCatalogItem,
  updateCatalogItem,
} from '@/api/inventoryApi';
import { toast } from '@/components/ui/use-toast';

interface InventoryCatalogTableProps {
  pgId: string;
  catalog: CatalogItem[];
  onRefresh: () => void;
}

export const InventoryCatalogTable = ({ pgId, catalog, onRefresh }: InventoryCatalogTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('furniture');
  const [level, setLevel] = useState<InventoryLevel>('room');
  const [defaultValue, setDefaultValue] = useState<string>('1000');
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('furniture');
    setLevel('room');
    setDefaultValue('1000');
    setIsModalOpen(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setLevel(item.level);
    setDefaultValue(String(item.defaultValueInr || '0'));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      if (editingItem) {
        await updateCatalogItem(pgId, editingItem.id, {
          name: name.trim(),
          category,
          level,
          defaultValueInr: Number(defaultValue) || 0,
        });
        toast({ title: 'Item updated successfully' });
      } else {
        await createCatalogItem(pgId, {
          name: name.trim(),
          category,
          level,
          defaultValueInr: Number(defaultValue) || 0,
          isActive: true,
        });
        toast({ title: 'Item added to catalog' });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({
        title: 'Failed to save item',
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item: CatalogItem) => {
    try {
      await updateCatalogItem(pgId, item.id, { isActive: !item.isActive });
      toast({
        title: item.isActive ? 'Item deactivated' : 'Item activated',
        description: item.isActive ? 'Will not be selectable for new templates' : 'Ready for use in templates',
      });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err?.message, variant: 'destructive' });
    }
  };

  const filteredItems = catalog.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="appliance">Appliance</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="bedding">Bedding</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={openAddModal}
          className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Catalog Item
        </Button>
      </div>

      {/* Catalog Items Table */}
      <div className="rounded-xl border border-border/80 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-border/70 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4 text-right">Replacement Value (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No items found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tag className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                        <span>{item.name}</span>
                        {item.isMaster && (
                          <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0 font-medium">
                            Admin Master
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {item.level === 'room' ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <Layers className="h-3 w-3 text-blue-600" /> Room (Shared)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-teal-800 font-medium">
                          <Layers className="h-3 w-3 text-teal-600" /> Bed (Personal)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      ₹{item.defaultValueInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit Item"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(item)}
                          className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          {item.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingItem ? 'Edit Catalog Item' : 'Add New Inventory Item'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Item Name *</Label>
              <Input
                placeholder="e.g. Split AC 1.5 Ton, Single Bed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={category} onValueChange={(v: InventoryCategory) => setCategory(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="appliance">Appliance</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="bedding">Bedding</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Assignment Level</Label>
                <Select value={level} onValueChange={(v: InventoryLevel) => setLevel(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">Room (Shared)</SelectItem>
                    <SelectItem value="bed">Bed (Personal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Default Replacement Value (₹)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="e.g. 2500"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  min={0}
                  className="pl-9 h-9 text-xs font-mono"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Used to suggest deduction amount if an item is damaged or missing at tenant checkout.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving} className="font-bold text-xs h-9">
                {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

