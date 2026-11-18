import React, { useEffect, useState } from 'react';
import { Megaphone, PackagePlus, Store } from 'lucide-react';
import { JOURNEY_STAGES, type FurnitureProduct, type JourneyStage } from '@hausco/shared';
import { PortalShell } from '../../components/ui/PortalShell';
import {
  Badge,
  Button,
  DisclaimerBanner,
  FieldLabel,
  Input,
  Select,
  SurfaceCard,
} from '../../components/ui/Primitives';
import { apiFetch, formatLkr } from '../../services/api';

interface ShopRecord {
  id: string;
  storeName: string;
  district: string;
  address: string;
  branches: string[];
  operatingHours: string;
  contactPhone: string;
  subscriptionTier: string;
}

interface LeadRecord {
  id: string;
  builderName: string;
  roomName: string;
  productName: string;
  leadType: string;
  status: string;
  createdAt: string;
}

interface CampaignRecord {
  id: string;
  title: string;
  targetStage: JourneyStage;
  billingModel: 'CPM' | 'CPC';
  budgetLkr: number;
  impressions: number;
  clicks: number;
  status: string;
}

export const ShopDashboardPage: React.FC = () => {
  const [shops, setShops] = useState<ShopRecord[]>([]);
  const [products, setProducts] = useState<FurnitureProduct[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('SOFA');
  const [widthM, setWidthM] = useState(2.0);
  const [depthM, setDepthM] = useState(0.9);
  const [heightM, setHeightM] = useState(0.85);
  const [material, setMaterial] = useState('Kiln-dried Teak');
  const [colour, setColour] = useState('Amber Oak');
  const [priceLkr, setPriceLkr] = useState(145000);

  const [campTitle, setCampTitle] = useState('');
  const [campStage, setCampStage] = useState<JourneyStage>('FURNISH_SPACE');
  const [campModel, setCampModel] = useState<'CPM' | 'CPC'>('CPC');
  const [campBudget, setCampBudget] = useState(15000);
  const [msg, setMsg] = useState<string | null>(null);

  const loadShop = async () => {
    const res = await apiFetch<{
      shops: ShopRecord[];
      products: FurnitureProduct[];
      leads: LeadRecord[];
      campaigns: CampaignRecord[];
    }>('/shop/dashboard');
    setShops(res.shops);
    setProducts(res.products);
    setLeads(res.leads);
    setCampaigns(res.campaigns);
  };

  useEffect(() => {
    void loadShop();
  }, []);

  const primaryShop = shops[0];

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryShop) return;
    await apiFetch('/shop/products', {
      method: 'POST',
      body: JSON.stringify({
        shopId: primaryShop.id,
        name,
        sku,
        productKind: 'FURNITURE',
        category,
        widthM,
        depthM,
        heightM,
        material,
        colour,
        priceLkr,
        inStock: true,
        footprintShape: 'RECTANGLE',
      }),
    });
    setName('');
    setSku('');
    setMsg('Dimensioned product added to verified store catalogue.');
    await loadShop();
  };

  const toggleStock = async (prod: FurnitureProduct) => {
    await apiFetch(`/shop/products/${prod.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ inStock: !prod.inStock }),
    });
    await loadShop();
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryShop) return;
    await apiFetch('/shop/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        shopId: primaryShop.id,
        title: campTitle,
        targetStage: campStage,
        billingModel: campModel,
        budgetLkr: campBudget,
      }),
    });
    setCampTitle('');
    setMsg('Stage-timed campaign submitted for admin approval.');
    await loadShop();
  };

  return (
    <PortalShell
      title="Hardware & Furniture Shop Owner Portal"
      subtitle={primaryShop ? `${primaryShop.storeName} · ${primaryShop.subscriptionTier} Tier` : 'Storefront & Inventory'}
    >
      <div className="space-y-6">
        {msg ? <DisclaimerBanner title="Storefront Updated" body={msg} /> : null}

        {primaryShop ? (
          <SurfaceCard tone="pale" className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-[#D9940A]" />
                <h2 className="font-display font-bold text-lg">{primaryShop.storeName}</h2>
                <Badge tone="amber">{primaryShop.subscriptionTier}</Badge>
              </div>
              <p className="text-xs text-[#1C1C1A]/80">
                {primaryShop.address} · Branches: {primaryShop.branches.join(', ')} · Hours: {primaryShop.operatingHours}
              </p>
            </div>
            <div className="text-xs font-mono-num">
              <p>Active Listings: <strong>{products.length}</strong></p>
              <p>Qualified Leads: <strong>{leads.length}</strong></p>
            </div>
          </SurfaceCard>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Furniture Listing Form */}
          <SurfaceCard tone="canvas" className="lg:col-span-5 p-5">
            <h3 className="font-display font-bold text-base flex items-center gap-2 mb-4">
              <PackagePlus className="h-4 w-4 text-[#D9940A]" />
              Add Dimensioned Product
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel htmlFor="sp-name">Product Name</FieldLabel>
                  <Input id="sp-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Galle 2-Seater Sofa" />
                </div>
                <div>
                  <FieldLabel htmlFor="sp-sku">SKU</FieldLabel>
                  <Input id="sp-sku" required value={sku} onChange={(e) => setSku(e.target.value)} placeholder="LL-SF-02" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <FieldLabel htmlFor="sp-w">Width (m)</FieldLabel>
                  <Input id="sp-w" type="number" step="0.05" value={widthM} onChange={(e) => setWidthM(Number(e.target.value))} />
                </div>
                <div>
                  <FieldLabel htmlFor="sp-d">Depth (m)</FieldLabel>
                  <Input id="sp-d" type="number" step="0.05" value={depthM} onChange={(e) => setDepthM(Number(e.target.value))} />
                </div>
                <div>
                  <FieldLabel htmlFor="sp-h">Height (m)</FieldLabel>
                  <Input id="sp-h" type="number" step="0.05" value={heightM} onChange={(e) => setHeightM(Number(e.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel htmlFor="sp-cat">Category</FieldLabel>
                  <Select id="sp-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="SOFA">Sofa</option>
                    <option value="BED">Bed</option>
                    <option value="DINING_SET">Dining Set</option>
                    <option value="WARDROBE">Wardrobe</option>
                    <option value="LIGHT_FIXTURE">Light Fixture</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="sp-price">Price (LKR)</FieldLabel>
                  <Input id="sp-price" type="number" required value={priceLkr} onChange={(e) => setPriceLkr(Number(e.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel htmlFor="sp-mat">Material</FieldLabel>
                  <Input id="sp-mat" value={material} onChange={(e) => setMaterial(e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="sp-col">Colour</FieldLabel>
                  <Input id="sp-col" value={colour} onChange={(e) => setColour(e.target.value)} />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full">Publish to Placement Canvas</Button>
            </form>
          </SurfaceCard>

          {/* Inventory & Live Stock Toggles */}
          <SurfaceCard tone="canvas" className="lg:col-span-7 p-5 space-y-3">
            <h3 className="font-display font-bold text-base">Product & Stock Manager</h3>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {products.map((p) => (
                <div key={p.id} className="rounded border border-[#1C1C1A]/12 bg-[#FAF7EE] p-3 text-xs flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{p.name} ({p.sku})</p>
                    <p className="font-mono-num text-[#1C1C1A]/75">
                      {p.widthM}m × {p.depthM}m × {p.heightM}m · {formatLkr(p.priceLkr)}
                    </p>
                    <p className="text-[11px] text-[#1C1C1A]/60">Updated: {new Date(p.priceUpdatedAt).toLocaleString()}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={p.inStock ? 'secondary' : 'outline'}
                    onClick={() => void toggleStock(p)}
                  >
                    {p.inStock ? 'In Stock (Toggle)' : 'Out of Stock'}
                  </Button>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        {/* Stage-Timed Sponsored Ad Manager & Booking Leads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SurfaceCard tone="pale" className="p-5 space-y-4">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#D9940A]" />
              Stage-Timed Sponsored Ad Manager
            </h3>
            <form onSubmit={handleLaunchCampaign} className="space-y-3 text-xs">
              <div>
                <FieldLabel htmlFor="ad-title">Campaign Headline</FieldLabel>
                <Input id="ad-title" required value={campTitle} onChange={(e) => setCampTitle(e.target.value)} placeholder="e.g., Foundation Cement Bulk Offer" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <FieldLabel htmlFor="ad-stage">Target Stage</FieldLabel>
                  <Select id="ad-stage" value={campStage} onChange={(e) => setCampStage(e.target.value as JourneyStage)}>
                    {JOURNEY_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="ad-model">Model</FieldLabel>
                  <Select id="ad-model" value={campModel} onChange={(e) => setCampModel(e.target.value as 'CPM' | 'CPC')}>
                    <option value="CPC">CPC</option>
                    <option value="CPM">CPM</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="ad-budget">Budget (LKR)</FieldLabel>
                  <Input id="ad-budget" type="number" min={2000} value={campBudget} onChange={(e) => setCampBudget(Number(e.target.value))} />
                </div>
              </div>
              <Button size="sm" type="submit">Submit Campaign for Approval</Button>
            </form>

            <div className="space-y-2 pt-2 border-t border-[#1C1C1A]/12">
              {campaigns.map((c) => (
                <div key={c.id} className="rounded bg-[#FAF7EE] p-2.5 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold">{c.title}</p>
                    <p className="text-[#1C1C1A]/70">{c.targetStage} · {c.billingModel} · {c.impressions} views / {c.clicks} clicks</p>
                  </div>
                  <Badge tone={c.status === 'ACTIVE' ? 'ok' : 'warning'}>{c.status}</Badge>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard tone="canvas" className="p-5 space-y-3">
            <h3 className="font-display font-bold text-base">Customer Booking & Call Leads ({leads.length})</h3>
            {leads.length === 0 ? (
              <p className="text-xs text-[#1C1C1A]/70">No booking leads received yet.</p>
            ) : (
              leads.map((l) => (
                <div key={l.id} className="rounded border border-[#1C1C1A]/12 bg-[#FAF7EE] p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold">{l.builderName}</span>
                    <Badge tone="yellow">{l.leadType}</Badge>
                  </div>
                  <p className="mt-1">Product: <strong>{l.productName}</strong> · Target Room: {l.roomName}</p>
                </div>
              ))
            )}
          </SurfaceCard>
        </div>
      </div>
    </PortalShell>
  );
};
