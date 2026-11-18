import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ExternalLink,
  Lock,
  Phone,
  Printer,
  RotateCw,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {
  getEffectiveDimensions,
  type FitCheckResult,
  type FurnitureProduct,
  type PlacedFurnitureItem,
} from '@hausco/shared';
import { PortalShell } from '../../components/ui/PortalShell';
import {
  Badge,
  Button,
  DisclaimerBanner,
  Input,
  LockedFeatureBanner,
  Modal,
  SampleDataPill,
  Select,
  SurfaceCard,
} from '../../components/ui/Primitives';
import { apiFetch, formatLkr } from '../../services/api';
import { useAuth } from '../../stores/authContext';
import { useProjects } from '../../stores/projectContext';

interface ShoppingListItem {
  placementId: string;
  productId: string;
  productName: string;
  dimensions: string;
  roomId: string;
  shopName: string;
  shopAddress: string;
  shopPhone?: string;
  inStock: boolean;
  priceLkr: number | null;
}

interface ExternalLinkItem {
  retailer: string;
  url: string;
  sourceLabel: string;
  disclaimer: string;
}

export const InteriorDesignerPage: React.FC = () => {
  const { activeProject } = useProjects();
  const { refreshMe } = useAuth();
  const activePlan = activeProject?.planVersions.find((v) => v.id === activeProject.activePlanVersionId);

  const [products, setProducts] = useState<FurnitureProduct[]>([]);
  const [pricesUnlocked, setPricesUnlocked] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [placements, setPlacements] = useState<PlacedFurnitureItem[]>([]);
  const [fitChecks, setFitChecks] = useState<FitCheckResult[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [totalBudgetLkr, setTotalBudgetLkr] = useState<number | null>(null);

  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [compareItems, setCompareItems] = useState<(FurnitureProduct & { isLowestPrice?: boolean })[] | null>(null);
  const [externalLinks, setExternalLinks] = useState<{ productName: string; links: ExternalLinkItem[] } | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!activeProject) return;
    const q = new URLSearchParams({ projectId: activeProject.id, kind: 'FURNITURE' });
    if (categoryFilter) q.set('category', categoryFilter);
    if (search.trim()) q.set('q', search.trim());

    const [prodRes, placeRes] = await Promise.all([
      apiFetch<{ pricesUnlocked: boolean; products: FurnitureProduct[] }>(`/marketplace/products?${q.toString()}`),
      apiFetch<{
        pricesUnlocked: boolean;
        placements: PlacedFurnitureItem[];
        fitChecks: FitCheckResult[];
        shoppingList: ShoppingListItem[];
        totalBudgetLkr: number | null;
      }>(`/projects/${activeProject.id}/furniture/placements`),
    ]);
    setProducts(prodRes.products);
    setPricesUnlocked(prodRes.pricesUnlocked || placeRes.pricesUnlocked);
    setPlacements(placeRes.placements);
    setFitChecks(placeRes.fitChecks);
    setShoppingList(placeRes.shoppingList);
    setTotalBudgetLkr(placeRes.totalBudgetLkr);
  }, [activeProject, categoryFilter, search]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (activePlan?.snapshot.rooms[0] && !selectedRoomId) {
      setSelectedRoomId(activePlan.snapshot.rooms[0].id);
    }
  }, [activePlan, selectedRoomId]);

  const placeProductInRoom = async (product: FurnitureProduct, roomId: string) => {
    if (!activeProject || !activePlan) return;
    const room = activePlan.snapshot.rooms.find((r) => r.id === roomId) ?? activePlan.snapshot.rooms[0];
    if (!room) return;
    await apiFetch(`/projects/${activeProject.id}/furniture/placements`, {
      method: 'POST',
      body: JSON.stringify({
        productId: product.id,
        roomId: room.id,
        x: Number((room.x + 0.15).toFixed(2)),
        y: Number((room.y + 0.15).toFixed(2)),
        rotationDeg: 0,
      }),
    });
    await loadWorkspace();
  };

  const nudgeOrRotatePlacement = async (
    pl: PlacedFurnitureItem,
    dx: number,
    dy: number,
    rotate = false,
    snapToWall = false
  ) => {
    if (!activeProject || !activePlan) return;
    const room = activePlan.snapshot.rooms.find((r) => r.id === pl.roomId);
    if (!room) return;
    const nextRot = rotate ? (((pl.rotationDeg + 90) % 360) as 0 | 90 | 180 | 270) : pl.rotationDeg;
    const nextX = snapToWall ? room.x + 0.05 : Number((pl.x + dx).toFixed(2));
    const nextY = snapToWall ? room.y + 0.05 : Number((pl.y + dy).toFixed(2));

    await apiFetch(`/projects/${activeProject.id}/furniture/placements/${pl.id}`, { method: 'DELETE' });
    const res = await apiFetch<{ placement: PlacedFurnitureItem }>(`/projects/${activeProject.id}/furniture/placements`, {
      method: 'POST',
      body: JSON.stringify({
        productId: pl.productId,
        roomId: pl.roomId,
        x: nextX,
        y: nextY,
        rotationDeg: nextRot,
      }),
    });
    setSelectedPlacementId(res.placement.id);
    await loadWorkspace();
  };

  const removePlacement = async (placementId: string) => {
    if (!activeProject) return;
    await apiFetch(`/projects/${activeProject.id}/furniture/placements/${placementId}`, { method: 'DELETE' });
    if (selectedPlacementId === placementId) setSelectedPlacementId(null);
    await loadWorkspace();
  };

  const handleUnlockPremium = async () => {
    if (!activeProject) return;
    setUnlocking(true);
    try {
      const checkout = await apiFetch<{ payment: { externalOrderId: string } }>('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ entitlementType: 'FURNITURE_PREMIUM_PLAN', resourceId: activeProject.id }),
      });
      await apiFetch('/payments/payhere/notify', {
        method: 'POST',
        body: JSON.stringify({ orderId: checkout.payment.externalOrderId, statusCode: '2' }),
      });
      await refreshMe();
      await loadWorkspace();
      setStatusMsg('Furniture Premium unlocked for this plan. Supplier prices, comparisons, store phone numbers & booking requests are now active.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleCompare = async (productId: string) => {
    if (!activeProject) return;
    const res = await apiFetch<{ comparisons: (FurnitureProduct & { isLowestPrice: boolean })[] }>(
      `/marketplace/products/${productId}/compare?projectId=${activeProject.id}`
    );
    setCompareItems(res.comparisons);
  };

  const handleBookWithStore = async (item: ShoppingListItem) => {
    if (!activeProject) return;
    const roomName = activePlan?.snapshot.rooms.find((r) => r.id === item.roomId)?.name ?? 'Room';
    await apiFetch('/marketplace/bookings', {
      method: 'POST',
      body: JSON.stringify({
        projectId: activeProject.id,
        productId: item.productId,
        roomName,
        leadType: 'BOOKING_REQUEST',
      }),
    });
    setStatusMsg(`Booking / reservation request sent to ${item.shopName} for ${item.productName} (${roomName}).`);
  };

  const handleExternalFallback = async (productName: string) => {
    const res = await apiFetch<{ links: ExternalLinkItem[] }>('/marketplace/external-fallback', {
      method: 'POST',
      body: JSON.stringify({ productName }),
    });
    setExternalLinks({ productName, links: res.links });
  };

  const snap = activePlan?.snapshot;
  const scale = 28;
  const pad = 24;
  const selectedPlacement = placements.find((p) => p.id === selectedPlacementId) ?? placements[0] ?? null;

  // Room floor usage summary
  const roomSummaries = (snap?.rooms ?? []).map((room) => {
    const itemsInRoom = placements.filter((p) => p.roomId === room.id);
    const usedArea = itemsInRoom.reduce((sum, p) => {
      const dim = getEffectiveDimensions(p);
      return sum + dim.w * dim.d;
    }, 0);
    return {
      room,
      count: itemsInRoom.length,
      usedSqm: Number(usedArea.toFixed(2)),
      pct: Math.min(100, Math.round((usedArea / Math.max(1, room.areaSqm)) * 100)),
    };
  });

  return (
    <PortalShell
      title="6. Interior Designer, Furniture Placement & Where to Buy"
      subtitle="To-scale furniture placement · Door-swing & collision fit checks · Local Sri Lankan suppliers"
      activeStage="FURNISH_SPACE"
    >
      <div className="space-y-6">
        {!pricesUnlocked ? (
          <LockedFeatureBanner
            title="Free Mode Active: Dimensions & Fit Checks Open · Prices & Booking Locked"
            description="Browse exact dimensions, place items to scale, and run collision checks for free. Unlock Furniture Premium to view store prices, compare stores, see total budget, tap-to-call, reserve items, and export a priced PDF shopping list."
            priceLabel="LKR 1,900 / plan"
            onUnlock={handleUnlockPremium}
            unlocking={unlocking}
          />
        ) : (
          <DisclaimerBanner
            title="Furniture Premium Unlocked"
            body="Supplier prices, cross-store comparison, store contact numbers, reservation requests, and printable priced shopping list are enabled for this plan."
          />
        )}

        {statusMsg ? <DisclaimerBanner title="Store Action Recorded" body={statusMsg} /> : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Supplier Catalogue */}
          <SurfaceCard tone="pale" className="lg:col-span-4 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base">Supplier Catalogue</h2>
              <SampleDataPill label="Sample stores" />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-3 text-[#1C1C1A]/50" />
                <Input
                  aria-label="Search furniture"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sofa, bed, teak..."
                  className="pl-8 text-xs"
                />
              </div>
              <Select
                aria-label="Filter category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-32 text-xs"
              >
                <option value="">All</option>
                <option value="SOFA">Sofas</option>
                <option value="BED">Beds</option>
                <option value="DINING_SET">Dining</option>
                <option value="WARDROBE">Wardrobes</option>
                <option value="LIGHT_FIXTURE">Lighting</option>
              </Select>
            </div>

            {snap ? (
              <div>
                <label htmlFor="target-room-sel" className="text-[11px] font-semibold uppercase text-[#1C1C1A]/70">
                  Place into Room:
                </label>
                <Select
                  id="target-room-sel"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="mt-1 text-xs"
                >
                  {snap.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.width}m × {r.depth}m)
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {products.map((prod) => (
                <div key={prod.id} className="rounded-lg border border-[#1C1C1A]/12 bg-[#FAF7EE] p-3 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm">{prod.name}</p>
                      <p className="font-mono-num text-[11px] text-[#D9940A]">
                        {prod.widthM}m × {prod.depthM}m × {prod.heightM}m
                      </p>
                    </div>
                    <Badge tone={prod.inStock ? 'ok' : 'warning'}>
                      {prod.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>

                  <p className="text-[#1C1C1A]/75">{prod.material} · {prod.colour}</p>
                  <p className="font-medium">{prod.shopName} ({prod.shopDistrict})</p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#1C1C1A]/10">
                    {prod.priceLkr !== null ? (
                      <span className="font-mono-num font-bold text-[#D9940A]">{formatLkr(prod.priceLkr)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#1C1C1A]/65 font-semibold">
                        <Lock className="h-3 w-3" /> Price Locked
                      </span>
                    )}

                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => void placeProductInRoom(prod, selectedRoomId)}
                      >
                        Place
                      </Button>
                      {pricesUnlocked ? (
                        <Button size="sm" variant="outline" onClick={() => void handleCompare(prod.id)}>
                          Compare
                        </Button>
                      ) : null}
                      {!prod.inStock ? (
                        <Button size="sm" variant="secondary" onClick={() => void handleExternalFallback(prod.name)}>
                          External Search
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          {/* 2D To-Scale Furniture Fit Canvas */}
          <SurfaceCard tone="canvas" className="lg:col-span-8 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-bold text-base">2D Room Placement & Fit Check Canvas</h2>
              {selectedPlacement ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button size="sm" variant="outline" aria-label="Move left" onClick={() => void nudgeOrRotatePlacement(selectedPlacement, -0.25, 0)}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" aria-label="Move up" onClick={() => void nudgeOrRotatePlacement(selectedPlacement, 0, -0.25)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" aria-label="Move down" onClick={() => void nudgeOrRotatePlacement(selectedPlacement, 0, 0.25)}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" aria-label="Move right" onClick={() => void nudgeOrRotatePlacement(selectedPlacement, 0.25, 0)}>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void nudgeOrRotatePlacement(selectedPlacement, 0, 0, true)}>
                    <RotateCw className="h-3.5 w-3.5" /> Rotate 90°
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void nudgeOrRotatePlacement(selectedPlacement, 0, 0, false, true)}>
                    Snap Wall
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void removePlacement(selectedPlacement.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>

            {snap ? (
              <div className="rounded-lg border border-[#1C1C1A]/15 bg-[#FAF7EE] arch-grid-fine p-3 overflow-x-auto" data-arch-cursor="true">
                <svg
                  viewBox={`0 0 ${snap.footprintWidthM * scale + pad * 2} ${snap.footprintDepthM * scale + pad * 2}`}
                  className="w-full max-h-[380px] mx-auto"
                  role="img"
                  aria-label="To-scale 2D room furniture fit canvas"
                >
                  {snap.rooms.map((room) => (
                    <g key={room.id}>
                      <rect
                        x={pad + room.x * scale}
                        y={pad + room.y * scale}
                        width={room.width * scale}
                        height={room.depth * scale}
                        fill="#FDE8A5"
                        fillOpacity="0.25"
                        stroke="#D9940A"
                        strokeWidth="2"
                      />
                      <text
                        x={pad + (room.x + 0.25) * scale}
                        y={pad + (room.y + 0.45) * scale}
                        fontSize="9"
                        fontWeight="700"
                        fill="#57534A"
                      >
                        {room.name}
                      </text>
                    </g>
                  ))}

                  {/* Door swing exclusion zones */}
                  {snap.openings
                    .filter((o) => o.kind === 'DOOR')
                    .map((op) => {
                      const r = (op.swingRadiusM ?? op.widthM) * scale;
                      return (
                        <circle
                          key={op.id}
                          cx={pad + op.x * scale}
                          cy={pad + op.y * scale}
                          r={r}
                          fill="#F4B41A"
                          fillOpacity="0.12"
                          stroke="#1C1C1A"
                          strokeOpacity="0.3"
                          strokeDasharray="3 2"
                        />
                      );
                    })}

                  {/* Placed Furniture Footprints */}
                  {placements.map((pl) => {
                    const dim = getEffectiveDimensions(pl);
                    const fit = fitChecks.find((f) => f.placementId === pl.id);
                    const fill =
                      fit?.status === 'DOES_NOT_FIT'
                        ? '#FCA5A5'
                        : fit?.status === 'TIGHT'
                          ? '#FCD34D'
                          : '#86EFAC';
                    const isSel = selectedPlacement?.id === pl.id;
                    return (
                      <g
                        key={pl.id}
                        onClick={() => setSelectedPlacementId(pl.id)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={pad + pl.x * scale}
                          y={pad + pl.y * scale}
                          width={dim.w * scale}
                          height={dim.d * scale}
                          fill={fill}
                          fillOpacity="0.75"
                          stroke={isSel ? '#1C1C1A' : '#D9940A'}
                          strokeWidth={isSel ? '2.5' : '1.4'}
                        />
                        <text
                          x={pad + (pl.x + dim.w / 2) * scale}
                          y={pad + (pl.y + dim.d / 2) * scale + 3}
                          textAnchor="middle"
                          fontSize="8"
                          fontWeight="700"
                          fill="#1C1C1A"
                        >
                          {pl.name.slice(0, 14)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : null}

            {/* Fit Check Status & Room Floor Space Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-display font-bold text-sm">Fit Check Results</h3>
                {placements.length === 0 ? (
                  <p className="text-xs text-[#1C1C1A]/70">Click "Place" on any catalogue item to test fit.</p>
                ) : (
                  placements.map((pl) => {
                    const fit = fitChecks.find((f) => f.placementId === pl.id);
                    const tone = fit?.status === 'DOES_NOT_FIT' ? 'critical' : fit?.status === 'TIGHT' ? 'warning' : 'ok';
                    return (
                      <div
                        key={pl.id}
                        onClick={() => setSelectedPlacementId(pl.id)}
                        className={`rounded border p-2.5 text-xs cursor-pointer ${
                          selectedPlacement?.id === pl.id ? 'border-[#D9940A] bg-[#FDE8A5]/50' : 'border-[#1C1C1A]/12 bg-[#FAF7EE]'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{pl.name} ({pl.rotationDeg}°)</span>
                          <Badge tone={tone}>{fit?.status.replace(/_/g, ' ') ?? 'FITS'}</Badge>
                        </div>
                        <p className="text-[#1C1C1A]/75 mt-1">{fit?.reasons.join(' ')}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-bold text-sm">Room Floor Area Usage</h3>
                <div className="space-y-1.5">
                  {roomSummaries.map((rs) => (
                    <div key={rs.room.id} className="text-xs">
                      <div className="flex justify-between">
                        <span>{rs.room.name} ({rs.count} items)</span>
                        <span className="font-mono-num">{rs.usedSqm} / {rs.room.areaSqm} m² ({rs.pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded bg-[#FDE8A5] mt-0.5">
                        <div className="h-1.5 rounded bg-[#D9940A]" style={{ width: `${rs.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>

        {/* Aggregated "Where to Buy" Shopping List */}
        <SurfaceCard tone="pale" className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#D9940A]" />
                Aggregated “Where to Buy” Shopping List
              </h2>
              <p className="text-xs text-[#1C1C1A]/75">
                {pricesUnlocked
                  ? `Total Room/House Furnishing Budget: ${formatLkr(totalBudgetLkr)}`
                  : 'Total furnishing budget, unit prices, store phone numbers & PDF export unlock with Furniture Premium.'}
              </p>
            </div>
            {pricesUnlocked ? (
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" />
                Print / Save Priced PDF
              </Button>
            ) : null}
          </div>

          {shoppingList.length === 0 ? (
            <p className="text-xs text-[#1C1C1A]/70">No items placed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#D9940A] text-white">
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">Dimensions</th>
                    <th className="p-2.5">Verified Shop</th>
                    <th className="p-2.5">Stock</th>
                    <th className="p-2.5">Price</th>
                    <th className="p-2.5 text-right">Store Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1A]/10 bg-[#FAF7EE]">
                  {shoppingList.map((item) => (
                    <tr key={item.placementId}>
                      <td className="p-2.5 font-semibold">{item.productName}</td>
                      <td className="p-2.5 font-mono-num">{item.dimensions}</td>
                      <td className="p-2.5">
                        <p className="font-medium">{item.shopName}</p>
                        <p className="text-[#1C1C1A]/70">{item.shopAddress}</p>
                        {item.shopPhone ? <p className="font-mono-num text-[#D9940A]">{item.shopPhone}</p> : null}
                      </td>
                      <td className="p-2.5">
                        <Badge tone={item.inStock ? 'ok' : 'warning'}>{item.inStock ? 'In Stock' : 'Out of Stock'}</Badge>
                      </td>
                      <td className="p-2.5 font-mono-num font-semibold">
                        {item.priceLkr !== null ? formatLkr(item.priceLkr) : 'Locked'}
                      </td>
                      <td className="p-2.5 text-right space-x-1.5">
                        {pricesUnlocked ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => void handleBookWithStore(item)}>
                              Reserve / Book
                            </Button>
                            {item.shopPhone ? (
                              <a href={`tel:${item.shopPhone}`} className="inline-flex items-center gap-1 text-[#D9940A] font-semibold hover:underline">
                                <Phone className="h-3 w-3" /> Call
                              </a>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-[#1C1C1A]/60">Unlock Premium</span>
                        )}
                        {!item.inStock ? (
                          <Button size="sm" variant="secondary" onClick={() => void handleExternalFallback(item.productName)}>
                            Find External
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      </div>

      {/* Cross-Store Price Comparison Modal */}
      <Modal
        open={Boolean(compareItems)}
        onClose={() => setCompareItems(null)}
        title="Cross-Store Price Comparison (Lowest Highlighted)"
      >
        <div className="space-y-3">
          {compareItems?.map((c) => (
            <div
              key={c.id}
              className={`rounded border p-3 text-xs flex justify-between items-center ${
                c.isLowestPrice ? 'border-[#D9940A] bg-[#FDE8A5]' : 'border-[#1C1C1A]/15 bg-[#FAF7EE]'
              }`}
            >
              <div>
                <p className="font-bold">{c.shopName}</p>
                <p className="text-[#1C1C1A]/75">{c.name} · {c.material}</p>
                {c.isLowestPrice ? <Badge tone="amber" className="mt-1">Lowest Price</Badge> : null}
              </div>
              <span className="font-mono-num text-sm font-bold text-[#D9940A]">{formatLkr(c.priceLkr)}</span>
            </div>
          ))}
        </div>
      </Modal>

      {/* External Retailer Fallback Modal */}
      <Modal
        open={Boolean(externalLinks)}
        onClose={() => setExternalLinks(null)}
        title={`External Retailer Search · ${externalLinks?.productName ?? ''}`}
      >
        <div className="space-y-3">
          <DisclaimerBanner
            title="External Non-Partner Retailer Links"
            body="Because this item is out of stock in verified platform stores, these links query major Sri Lankan furniture retailers externally. Availability and pricing must be confirmed on their websites."
          />
          {externalLinks?.links.map((link) => (
            <a
              key={link.retailer}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded border border-[#1C1C1A]/15 bg-[#FAF7EE] p-3 text-xs hover:bg-[#FDE8A5]"
            >
              <div>
                <p className="font-bold">{link.sourceLabel}</p>
                <p className="text-[#1C1C1A]/70">{link.url}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-[#D9940A]" />
            </a>
          ))}
        </div>
      </Modal>
    </PortalShell>
  );
};
