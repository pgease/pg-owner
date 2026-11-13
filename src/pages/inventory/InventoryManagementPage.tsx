import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Layers,
  Table as TableIcon,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useApp } from '@/context/AppContext';
import {
  type CatalogItem,
  type InventoryTemplate,
  getInventoryCatalog,
  getInventoryTemplates,
  syncMasterInventory,
} from '@/api/inventoryApi';
import { InventoryCatalogTable } from '@/components/inventory/InventoryCatalogTable';
import { InventoryTemplatesManager } from '@/components/inventory/InventoryTemplatesManager';
import { BulkAssignInventoryModal } from '@/components/inventory/BulkAssignInventoryModal';
import { toast } from '@/components/ui/use-toast';

export const InventoryManagementPage = () => {
  const navigate = useNavigate();
  const { selectedPgId, properties } = useApp();
  const currentPropertyId = selectedPgId || properties?.[0]?.id || '';

  const [activeTab, setActiveTab] = useState<'templates' | 'catalog'>('templates');
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [templates, setTemplates] = useState<InventoryTemplate[]>([]);

  // Bulk Assign Modal state
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedTemplateForAssign, setSelectedTemplateForAssign] = useState<InventoryTemplate | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSyncMaster = async () => {
    if (!currentPropertyId) return;
    setSyncing(true);
    try {
      const res = await syncMasterInventory(currentPropertyId);
      toast({
        title: 'Synced from Admin Master',
        description: res.syncedCount
          ? `Successfully synced ${res.syncedCount} standard assets from Admin Panel.`
          : 'Catalog synced with Admin Master library.',
      });
      loadData();
    } catch (err: any) {
      toast({
        title: 'Sync Failed',
        description: err.message || 'Could not sync master items from Admin Panel.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const loadData = async () => {
    if (!currentPropertyId) {
      setCatalog([]);
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [catData, tplData] = await Promise.all([
        getInventoryCatalog(currentPropertyId),
        getInventoryTemplates(currentPropertyId),
      ]);
      setCatalog(catData || []);
      setTemplates(tplData || []);
    } catch (err: any) {
      setCatalog([]);
      setTemplates([]);
      toast({
        title: 'Error loading inventory',
        description: err.message || 'Could not load templates or catalog.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPropertyId]);

  const handleOpenBulkAssign = (template: InventoryTemplate) => {
    setSelectedTemplateForAssign(template);
    setBulkAssignOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="h-9 w-9 p-0 rounded-full border border-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-teal-600" />
              Room & Bed Inventory Management
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Setup inventory templates once, bulk-assign to rooms, and freeze move-in condition into digital rental agreements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncMaster}
            disabled={syncing || loading || !currentPropertyId}
            className="h-8 text-xs border-teal-300 text-teal-800 bg-teal-50/60 hover:bg-teal-100 gap-1.5 font-semibold"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            )}
            Sync from Admin Master
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-8 text-xs border-gray-300 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedTemplateForAssign(templates[0] || null);
              setBulkAssignOpen(true);
            }}
            disabled={templates.length === 0}
            className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            Bulk Assign to Rooms
          </Button>
        </div>
      </div>

      {!currentPropertyId ? (
        <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 p-8 max-w-md mx-auto">
          <Package className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No PG Property Selected</h3>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            Please select a property from the top header PG selector to view and manage its room & bed inventory.
          </p>
        </div>
      ) : loading ? (
        <div className="py-24 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600" />
          <p className="text-xs text-gray-400 mt-2">Loading inventory catalog and templates...</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="bg-gray-100 p-1 rounded-xl">
            <TabsTrigger
              value="templates"
              className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-xs rounded-lg px-4 py-2"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Inventory Templates ({templates.length})
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-xs rounded-lg px-4 py-2"
            >
              <TableIcon className="h-3.5 w-3.5 mr-1.5" />
              Item Catalog & Values ({catalog.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <InventoryTemplatesManager
              pgId={currentPropertyId || ''}
              catalog={catalog}
              templates={templates}
              onRefresh={loadData}
              onOpenBulkAssign={handleOpenBulkAssign}
            />
          </TabsContent>

          <TabsContent value="catalog" className="space-y-4">
            <InventoryCatalogTable
              pgId={currentPropertyId || ''}
              catalog={catalog}
              onRefresh={loadData}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Bulk Assign Modal */}
      <BulkAssignInventoryModal
        open={bulkAssignOpen}
        onOpenChange={setBulkAssignOpen}
        pgId={currentPropertyId || ''}
        template={selectedTemplateForAssign}
        templates={templates}
        onSuccess={loadData}
      />
    </div>
  );
};

