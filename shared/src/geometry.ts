import type {
  FitCheckResult,
  FitStatus,
  OpeningSpec,
  PlacedFurnitureItem,
  PlanGeometrySnapshot,
  PlanRequirements,
  PlanVariantCode,
  PlotMetrics,
  Point2D,
  RoofType,
  RoomSpec,
  SetbackRuleSet,
  WallSegment,
} from './types.js';

export const PERCH_SQM = 25.29;

export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function sqmToPerches(areaSqm: number): number {
  return roundTo(areaSqm / PERCH_SQM, 2);
}

/**
 * Shoelace formula for polygon area in square metres.
 */
export function computePolygonAreaSqm(vertices: Point2D[]): number {
  if (vertices.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % vertices.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function computePolygonPerimeterM(vertices: Point2D[]): number {
  if (vertices.length < 2) return 0;
  let perim = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % vertices.length]!;
    perim += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return perim;
}

function ccw(a: Point2D, b: Point2D, c: Point2D): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function segmentsIntersect(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D): boolean {
  const d1 = ccw(a1, a2, b1);
  const d2 = ccw(a1, a2, b2);
  const d3 = ccw(b1, b2, a1);
  const d4 = ccw(b1, b2, a2);
  return ((d1 > 1e-9 && d2 < -1e-9) || (d1 < -1e-9 && d2 > 1e-9)) &&
    ((d3 > 1e-9 && d4 < -1e-9) || (d3 < -1e-9 && d4 > 1e-9));
}

export function hasSelfIntersection(vertices: Point2D[]): boolean {
  const n = vertices.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    const a1 = vertices[i]!;
    const a2 = vertices[(i + 1) % n]!;
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // adjacent closing edge
      const b1 = vertices[j]!;
      const b2 = vertices[(j + 1) % n]!;
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

function signedArea(vertices: Point2D[]): number {
  let sum = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % vertices.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function ensureCounterClockwise(vertices: Point2D[]): Point2D[] {
  return signedArea(vertices) < 0 ? [...vertices].reverse() : vertices;
}

function lineIntersection(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D | null {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 1e-9) return null;
  const det1 = p1.x * p2.y - p1.y * p2.x;
  const det2 = p3.x * p4.y - p3.y * p4.x;
  return {
    x: (det1 * (p3.x - p4.x) - (p1.x - p2.x) * det2) / denom,
    y: (det1 * (p3.y - p4.y) - (p1.y - p2.y) * det2) / denom,
  };
}

/**
 * Offsets polygon edges inward according to directional setback buffers.
 * Edge 0 (or bottom-most edge) is treated as road frontage if facing south (max y in screen coords)
 * or uses directional normal classification:
 * - Bottom edge (ny > 0.5): frontSetbackM
 * - Top edge (ny < -0.5): rearSetbackM
 * - Left edge (nx < -0.5): leftSetbackM
 * - Right edge (nx > 0.5): rightSetbackM
 * Note: screen/plot coordinates use x right, y down (y=0 rear, y=max road frontage).
 */
export function computeBuildablePolygon(
  rawVertices: Point2D[],
  rule: Pick<SetbackRuleSet, 'frontSetbackM' | 'rearSetbackM' | 'leftSetbackM' | 'rightSetbackM'>
): Point2D[] {
  if (rawVertices.length < 3) return [];
  const vertices = ensureCounterClockwise(rawVertices);
  const n = vertices.length;

  const offsetLines: { p1: Point2D; p2: Point2D }[] = [];
  for (let i = 0; i < n; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % n]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    // For CCW in standard math coords (y up), inward normal is (-dy/len, dx/len)
    const nx = -dy / len;
    const ny = dx / len;

    // Outward normal is (-nx, -ny)
    const outX = -nx;
    const outY = -ny;

    let setback = rule.leftSetbackM;
    if (Math.abs(outY) >= Math.abs(outX)) {
      // Top vs Bottom edge (y=0 is rear, y=max is front road boundary)
      setback = outY > 0 ? rule.frontSetbackM : rule.rearSetbackM;
    } else {
      setback = outX < 0 ? rule.leftSetbackM : rule.rightSetbackM;
    }

    offsetLines.push({
      p1: { x: a.x + nx * setback, y: a.y + ny * setback },
      p2: { x: b.x + nx * setback, y: b.y + ny * setback },
    });
  }

  if (offsetLines.length < 3) return [];
  const result: Point2D[] = [];
  for (let i = 0; i < offsetLines.length; i++) {
    const l1 = offsetLines[i]!;
    const l2 = offsetLines[(i + 1) % offsetLines.length]!;
    const pt = lineIntersection(l1.p1, l1.p2, l2.p1, l2.p2);
    if (pt) {
      result.push({ x: roundTo(pt.x, 3), y: roundTo(pt.y, 3) });
    }
  }

  // Validate buildable polygon isn't inverted or larger than original
  const origArea = computePolygonAreaSqm(vertices);
  const buildArea = computePolygonAreaSqm(result);
  if (result.length < 3 || buildArea <= 0.5 || buildArea >= origArea) {
    return [];
  }
  return result;
}

export function getBoundingBox(vertices: Point2D[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; depth: number } {
  if (vertices.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, depth: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: roundTo(maxX - minX, 2),
    depth: roundTo(maxY - minY, 2),
  };
}

export function evaluatePlotMetrics(
  vertices: Point2D[],
  setbackRule: Pick<SetbackRuleSet, 'frontSetbackM' | 'rearSetbackM' | 'leftSetbackM' | 'rightSetbackM'>
): PlotMetrics {
  const validationErrors: string[] = [];
  if (vertices.length < 3) {
    validationErrors.push('A plot requires at least 3 boundary vertices.');
  }
  if (hasSelfIntersection(vertices)) {
    validationErrors.push('Plot boundary lines cross each other. Drag vertices to form a non-intersecting polygon.');
  }
  const areaSqm = roundTo(computePolygonAreaSqm(vertices), 2);
  if (areaSqm < 25) {
    validationErrors.push('Plot area must be at least 25 m² (~1 perch) to lay out a residential structure.');
  }
  const perimeterM = roundTo(computePolygonPerimeterM(vertices), 2);
  const buildablePolygon = validationErrors.length === 0 ? computeBuildablePolygon(vertices, setbackRule) : [];
  const buildableAreaSqm = roundTo(computePolygonAreaSqm(buildablePolygon), 2);
  if (validationErrors.length === 0 && buildableAreaSqm < 18) {
    validationErrors.push('After applying setback buffers, the remaining buildable zone is too small (< 18 m²).');
  }

  return {
    vertices,
    areaSqm,
    areaPerches: sqmToPerches(areaSqm),
    perimeterM,
    buildablePolygon,
    buildableAreaSqm,
    buildableAreaPerches: sqmToPerches(buildableAreaSqm),
    isValid: validationErrors.length === 0,
    validationErrors,
  };
}

function buildWallsAndOpenings(rooms: RoomSpec[], footprintW: number, footprintD: number): {
  walls: WallSegment[];
  openings: OpeningSpec[];
  totalWallLengthM: number;
} {
  const walls: WallSegment[] = [
    { id: 'ext-n', x1: 0, y1: 0, x2: footprintW, y2: 0, thicknessM: 0.225, isExterior: true },
    { id: 'ext-e', x1: footprintW, y1: 0, x2: footprintW, y2: footprintD, thicknessM: 0.225, isExterior: true },
    { id: 'ext-s', x1: footprintW, y1: footprintD, x2: 0, y2: footprintD, thicknessM: 0.225, isExterior: true },
    { id: 'ext-w', x1: 0, y1: footprintD, x2: 0, y2: 0, thicknessM: 0.225, isExterior: true },
  ];

  const openings: OpeningSpec[] = [];
  const seenWallKeys = new Set<string>();

  rooms.forEach((room, idx) => {
    // Interior partition edges where room does not sit on outer boundary
    const edges: Array<{ x1: number; y1: number; x2: number; y2: number; side: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' }> = [
      { x1: room.x, y1: room.y, x2: room.x + room.width, y2: room.y, side: 'NORTH' },
      { x1: room.x, y1: room.y + room.depth, x2: room.x + room.width, y2: room.y + room.depth, side: 'SOUTH' },
      { x1: room.x, y1: room.y, x2: room.x, y2: room.y + room.depth, side: 'WEST' },
      { x1: room.x + room.width, y1: room.y, x2: room.x + room.width, y2: room.y + room.depth, side: 'EAST' },
    ];

    for (const edge of edges) {
      const isOuter =
        (Math.abs(edge.y1) < 0.01 && Math.abs(edge.y2) < 0.01) ||
        (Math.abs(edge.y1 - footprintD) < 0.01 && Math.abs(edge.y2 - footprintD) < 0.01) ||
        (Math.abs(edge.x1) < 0.01 && Math.abs(edge.x2) < 0.01) ||
        (Math.abs(edge.x1 - footprintW) < 0.01 && Math.abs(edge.x2 - footprintW) < 0.01);

      if (!isOuter) {
        const key = `${roundTo(edge.x1, 2)},${roundTo(edge.y1, 2)}-${roundTo(edge.x2, 2)},${roundTo(edge.y2, 2)}`;
        if (!seenWallKeys.has(key)) {
          seenWallKeys.add(key);
          walls.push({
            id: `int-${idx}-${edge.side}`,
            x1: roundTo(edge.x1, 2),
            y1: roundTo(edge.y1, 2),
            x2: roundTo(edge.x2, 2),
            y2: roundTo(edge.y2, 2),
            thicknessM: 0.125,
            isExterior: false,
          });
        }
      }
    }

    // Add a door opening for every room
    if (room.category === 'LIVING' || room.category === 'VERANDAH') {
      openings.push({
        id: `door-${room.id}`,
        kind: 'DOOR',
        roomId: room.id,
        wallSide: 'SOUTH',
        x: roundTo(room.x + room.width * 0.45, 2),
        y: roundTo(room.y + room.depth, 2),
        widthM: 1.0,
        swingRadiusM: 1.0,
        swingDirection: 'INWARD',
      });
    } else if (room.category !== 'CORRIDOR') {
      openings.push({
        id: `door-${room.id}`,
        kind: 'DOOR',
        roomId: room.id,
        wallSide: 'WEST',
        x: roundTo(room.x, 2),
        y: roundTo(room.y + Math.min(0.9, room.depth * 0.4), 2),
        widthM: room.category === 'BATHROOM' ? 0.75 : 0.9,
        swingRadiusM: room.category === 'BATHROOM' ? 0.75 : 0.9,
        swingDirection: 'INWARD',
      });
    }

    // Add an exterior window if touching outer perimeter
    if (Math.abs(room.y) < 0.01 && room.width >= 1.8) {
      openings.push({
        id: `win-n-${room.id}`,
        kind: 'WINDOW',
        roomId: room.id,
        wallSide: 'NORTH',
        x: roundTo(room.x + room.width * 0.5 - 0.6, 2),
        y: 0,
        widthM: 1.2,
      });
    } else if (Math.abs(room.x + room.width - footprintW) < 0.01 && room.depth >= 1.8) {
      openings.push({
        id: `win-e-${room.id}`,
        kind: 'WINDOW',
        roomId: room.id,
        wallSide: 'EAST',
        x: footprintW,
        y: roundTo(room.y + room.depth * 0.5 - 0.6, 2),
        widthM: 1.2,
      });
    } else if (Math.abs(room.x) < 0.01 && room.depth >= 1.8) {
      openings.push({
        id: `win-w-${room.id}`,
        kind: 'WINDOW',
        roomId: room.id,
        wallSide: 'WEST',
        x: 0,
        y: roundTo(room.y + room.depth * 0.5 - 0.6, 2),
        widthM: 1.2,
      });
    }
  });

  const totalWallLengthM = roundTo(
    walls.reduce((acc, w) => acc + Math.hypot(w.x2 - w.x1, w.y2 - w.y1), 0),
    2
  );

  return { walls, openings, totalWallLengthM };
}

function makeVariantSnapshot(
  variantCode: PlanVariantCode,
  buildableWidthM: number,
  buildableDepthM: number,
  requirements: PlanRequirements
): PlanGeometrySnapshot {
  const isCompact = variantCode === 'VARIANT_A_COMPACT';
  const scaleFactor = isCompact ? 0.84 : 0.96;
  const footprintW = roundTo(Math.max(7.2, Math.min(buildableWidthM, buildableWidthM * scaleFactor)), 2);
  const footprintD = roundTo(Math.max(8.0, Math.min(buildableDepthM, buildableDepthM * scaleFactor)), 2);

  const leftColW = roundTo(footprintW * (isCompact ? 0.54 : 0.50), 2);
  const rightColW = roundTo(footprintW - leftColW, 2);

  const frontZoneD = roundTo(footprintD * (isCompact ? 0.44 : 0.42), 2);
  const rearZoneD = roundTo(footprintD - frontZoneD, 2);

  const rooms: RoomSpec[] = [];

  if (isCompact) {
    // Open-plan Living + Dining combined in front-left, Kitchen front-right
    const livingD = roundTo(frontZoneD, 2);
    rooms.push({
      id: 'room-living',
      name: 'Open Living & Dining',
      category: 'LIVING',
      x: 0,
      y: rearZoneD,
      width: leftColW,
      depth: livingD,
      areaSqm: roundTo(leftColW * livingD, 2),
    });
    const kitchenD = roundTo(frontZoneD * 0.62, 2);
    const bathD = roundTo(frontZoneD - kitchenD, 2);
    rooms.push({
      id: 'room-kitchen',
      name: 'Kitchen',
      category: 'KITCHEN',
      x: leftColW,
      y: rearZoneD + bathD,
      width: rightColW,
      depth: kitchenD,
      areaSqm: roundTo(rightColW * kitchenD, 2),
    });
    rooms.push({
      id: 'room-bath-1',
      name: 'Common Bath',
      category: 'BATHROOM',
      x: leftColW,
      y: rearZoneD,
      width: rightColW,
      depth: bathD,
      areaSqm: roundTo(rightColW * bathD, 2),
    });
  } else {
    // Traditional separated Living, Dining, Verandah & Kitchen
    const verandahD = requirements.includeVerandah === false ? 0 : roundTo(Math.min(2.0, frontZoneD * 0.35), 2);
    const livingD = roundTo(frontZoneD - verandahD, 2);
    if (verandahD > 0) {
      rooms.push({
        id: 'room-verandah',
        name: 'Front Verandah',
        category: 'VERANDAH',
        x: 0,
        y: footprintD - verandahD,
        width: leftColW,
        depth: verandahD,
        areaSqm: roundTo(leftColW * verandahD, 2),
      });
    }
    rooms.push({
      id: 'room-living',
      name: 'Living Room',
      category: 'LIVING',
      x: 0,
      y: rearZoneD,
      width: leftColW,
      depth: livingD,
      areaSqm: roundTo(leftColW * livingD, 2),
    });
    const diningD = roundTo(frontZoneD * 0.5, 2);
    const kitchenD = roundTo(frontZoneD - diningD, 2);
    rooms.push({
      id: 'room-dining',
      name: 'Dining Room',
      category: 'DINING',
      x: leftColW,
      y: rearZoneD + kitchenD,
      width: rightColW,
      depth: diningD,
      areaSqm: roundTo(rightColW * diningD, 2),
    });
    rooms.push({
      id: 'room-kitchen',
      name: 'Pantry & Kitchen',
      category: 'KITCHEN',
      x: leftColW,
      y: rearZoneD,
      width: rightColW,
      depth: kitchenD,
      areaSqm: roundTo(rightColW * kitchenD, 2),
    });
  }

  // Distribute bedrooms across rear zone (ground floor)
  const groundBedrooms = requirements.storeys === 2 ? Math.max(1, Math.ceil(requirements.bedrooms / 2)) : Math.max(1, Math.min(4, requirements.bedrooms));
  const bedDepth = roundTo(rearZoneD / groundBedrooms, 2);

  // Master bedroom on rear-left
  rooms.push({
    id: 'room-master',
    name: 'Master Bedroom',
    category: 'MASTER_BEDROOM',
    x: 0,
    y: 0,
    width: leftColW,
    depth: roundTo(rearZoneD * (groundBedrooms === 1 ? 1 : 0.55), 2),
    areaSqm: roundTo(leftColW * rearZoneD * (groundBedrooms === 1 ? 1 : 0.55), 2),
  });

  if (groundBedrooms >= 2) {
    const remD = roundTo(rearZoneD - rooms[rooms.length - 1]!.depth, 2);
    rooms.push({
      id: 'room-bed-2',
      name: 'Bedroom 2',
      category: 'BEDROOM',
      x: 0,
      y: rooms[rooms.length - 1]!.depth,
      width: leftColW,
      depth: remD,
      areaSqm: roundTo(leftColW * remD, 2),
    });
  }

  // Right rear column: additional bedroom(s) / study / ensuite bathroom
  const ensuiteD = roundTo(Math.min(2.2, rearZoneD * 0.32), 2);
  rooms.push({
    id: 'room-bath-2',
    name: 'Attached / Guest Bath',
    category: 'BATHROOM',
    x: leftColW,
    y: 0,
    width: rightColW,
    depth: ensuiteD,
    areaSqm: roundTo(rightColW * ensuiteD, 2),
  });

  const remRightD = roundTo(rearZoneD - ensuiteD, 2);
  if (groundBedrooms >= 3) {
    rooms.push({
      id: 'room-bed-3',
      name: 'Bedroom 3',
      category: 'BEDROOM',
      x: leftColW,
      y: ensuiteD,
      width: rightColW,
      depth: remRightD,
      areaSqm: roundTo(rightColW * remRightD, 2),
    });
  } else {
    rooms.push({
      id: 'room-study',
      name: requirements.includeStudy ? 'Home Study' : 'Family Lounge / Utility',
      category: requirements.includeStudy ? 'STUDY' : 'UTILITY',
      x: leftColW,
      y: ensuiteD,
      width: rightColW,
      depth: remRightD,
      areaSqm: roundTo(rightColW * remRightD, 2),
    });
  }

  const { walls, openings, totalWallLengthM } = buildWallsAndOpenings(rooms, footprintW, footprintD);
  const groundArea = roundTo(rooms.reduce((sum, r) => sum + r.areaSqm, 0), 2);
  const upperFloorFactor = requirements.storeys === 2 ? 1.68 : 1.0;
  const totalRoomAreaSqm = roundTo(groundArea * upperFloorFactor, 2);
  const slabAreaSqm = roundTo(footprintW * footprintD * (requirements.storeys === 2 ? 1.85 : 1.0), 2);
  const roofPitchFactor = requirements.roofType === 'FLAT_SLAB' ? 1.05 : 1.22;
  const roofAreaSqm = roundTo(footprintW * footprintD * roofPitchFactor, 2);

  // Unused variable guard
  void bedDepth;

  return {
    variantCode,
    title: isCompact ? 'Variant A: Compact / Open-Plan' : 'Variant B: Spacious / Traditional',
    storeys: requirements.storeys,
    roofType: requirements.roofType,
    footprintWidthM: footprintW,
    footprintDepthM: footprintD,
    rooms,
    walls,
    openings,
    totalRoomAreaSqm,
    totalWallLengthM: roundTo(totalWallLengthM * (requirements.storeys === 2 ? 1.7 : 1.0), 2),
    slabAreaSqm,
    roofAreaSqm,
  };
}

export function generateConceptPlanVariants(
  buildableWidthM: number,
  buildableDepthM: number,
  requirements: PlanRequirements
): { ok: true; variants: [PlanGeometrySnapshot, PlanGeometrySnapshot] } | { ok: false; error: string } {
  if (buildableWidthM < 6 || buildableDepthM < 7) {
    return {
      ok: false,
      error: `Buildable zone (${buildableWidthM}m × ${buildableDepthM}m) is below the minimum 6.0m × 7.0m footprint required for a concept house plan.`,
    };
  }
  return {
    ok: true,
    variants: [
      makeVariantSnapshot('VARIANT_A_COMPACT', buildableWidthM, buildableDepthM, requirements),
      makeVariantSnapshot('VARIANT_B_SPACIOUS', buildableWidthM, buildableDepthM, requirements),
    ],
  };
}

export type PlanEditToolCall =
  | { tool: 'resize_room'; roomId: string; deltaWidthM?: number; deltaDepthM?: number }
  | { tool: 'add_bedroom'; name?: string }
  | { tool: 'change_style'; variantCode: 'VARIANT_A_COMPACT' | 'VARIANT_B_SPACIOUS' }
  | { tool: 'set_storeys'; storeys: 1 | 2 }
  | { tool: 'set_roof_type'; roofType: RoofType };

export function applyControlledPlanEdit(
  current: PlanGeometrySnapshot,
  toolCall: PlanEditToolCall,
  buildableWidthM: number,
  buildableDepthM: number
): { ok: true; next: PlanGeometrySnapshot; summary: string } | { ok: false; error: string } {
  if (toolCall.tool === 'resize_room') {
    const idx = current.rooms.findIndex((r) => r.id === toolCall.roomId);
    if (idx === -1) {
      return { ok: false, error: `Room '${toolCall.roomId}' was not found in the active plan.` };
    }
    const room = current.rooms[idx]!;
    const newW = roundTo(room.width + (toolCall.deltaWidthM ?? 0), 2);
    const newD = roundTo(room.depth + (toolCall.deltaDepthM ?? 0), 2);
    if (newW < 1.5 || newD < 1.5) {
      return { ok: false, error: `${room.name} cannot be smaller than 1.5m in width or depth.` };
    }
    const neededFootprintW = Math.max(current.footprintWidthM, room.x + newW);
    const neededFootprintD = Math.max(current.footprintDepthM, room.y + newD);
    if (neededFootprintW > buildableWidthM + 0.01 || neededFootprintD > buildableDepthM + 0.01) {
      return {
        ok: false,
        error: `Resizing ${room.name} to ${newW}m × ${newD}m exceeds the municipal setback buildable boundary (${buildableWidthM}m × ${buildableDepthM}m).`,
      };
    }

    const updatedRooms = current.rooms.map((r, i) =>
      i === idx ? { ...r, width: newW, depth: newD, areaSqm: roundTo(newW * newD, 2) } : r
    );
    const { walls, openings, totalWallLengthM } = buildWallsAndOpenings(updatedRooms, neededFootprintW, neededFootprintD);
    const groundArea = roundTo(updatedRooms.reduce((s, r) => s + r.areaSqm, 0), 2);
    const upperFactor = current.storeys === 2 ? 1.68 : 1.0;

    return {
      ok: true,
      summary: `Resized ${room.name} to ${newW}m × ${newD}m (${roundTo(newW * newD, 2)} m²) within setback bounds.`,
      next: {
        ...current,
        footprintWidthM: neededFootprintW,
        footprintDepthM: neededFootprintD,
        rooms: updatedRooms,
        walls,
        openings,
        totalRoomAreaSqm: roundTo(groundArea * upperFactor, 2),
        totalWallLengthM: roundTo(totalWallLengthM * (current.storeys === 2 ? 1.7 : 1.0), 2),
        slabAreaSqm: roundTo(neededFootprintW * neededFootprintD * (current.storeys === 2 ? 1.85 : 1.0), 2),
        roofAreaSqm: roundTo(neededFootprintW * neededFootprintD * (current.roofType === 'FLAT_SLAB' ? 1.05 : 1.22), 2),
      },
    };
  }

  if (toolCall.tool === 'add_bedroom') {
    const studyIdx = current.rooms.findIndex((r) => r.category === 'STUDY' || r.category === 'UTILITY');
    if (studyIdx !== -1) {
      const target = current.rooms[studyIdx]!;
      if (target.areaSqm < 7.5) {
        return {
          ok: false,
          error: `Converting ${target.name} (${target.areaSqm} m²) fails minimum bedroom area check (7.5 m²). Increase storeys or plot footprint.`,
        };
      }
      const bedCount = current.rooms.filter((r) => r.category === 'BEDROOM' || r.category === 'MASTER_BEDROOM').length;
      const updatedRooms = current.rooms.map((r, i) =>
        i === studyIdx ? { ...r, name: toolCall.name ?? `Bedroom ${bedCount + 1}`, category: 'BEDROOM' as const } : r
      );
      return {
        ok: true,
        summary: `Converted ${target.name} into ${toolCall.name ?? `Bedroom ${bedCount + 1}`}.`,
        next: { ...current, rooms: updatedRooms },
      };
    }
    return {
      ok: false,
      error: 'Ground floor is at full bedroom capacity within current setbacks. Switch to 2 storeys to add another bedroom.',
    };
  }

  if (toolCall.tool === 'change_style') {
    const bedCount = current.rooms.filter((r) => r.category === 'BEDROOM' || r.category === 'MASTER_BEDROOM').length;
    const bathCount = current.rooms.filter((r) => r.category === 'BATHROOM').length;
    const next = makeVariantSnapshot(toolCall.variantCode, buildableWidthM, buildableDepthM, {
      bedrooms: Math.max(2, bedCount),
      bathrooms: Math.max(1, bathCount),
      storeys: current.storeys,
      roofType: current.roofType,
    });
    return {
      ok: true,
      summary: `Switched concept layout to ${next.title}.`,
      next,
    };
  }

  if (toolCall.tool === 'set_storeys') {
    const bedCount = current.rooms.filter((r) => r.category === 'BEDROOM' || r.category === 'MASTER_BEDROOM').length;
    const bathCount = current.rooms.filter((r) => r.category === 'BATHROOM').length;
    const next = makeVariantSnapshot(current.variantCode, buildableWidthM, buildableDepthM, {
      bedrooms: Math.max(2, bedCount),
      bathrooms: Math.max(1, bathCount),
      storeys: toolCall.storeys,
      roofType: current.roofType,
    });
    return {
      ok: true,
      summary: `Updated plan to ${toolCall.storeys}-storey structure.`,
      next,
    };
  }

  const roofPitchFactor = toolCall.roofType === 'FLAT_SLAB' ? 1.05 : 1.22;
  return {
    ok: true,
    summary: `Updated roof style to ${toolCall.roofType.replace('_', ' ')}.`,
    next: {
      ...current,
      roofType: toolCall.roofType,
      roofAreaSqm: roundTo(current.footprintWidthM * current.footprintDepthM * roofPitchFactor, 2),
    },
  };
}

interface Box2D {
  x: number;
  y: number;
  w: number;
  d: number;
}

export function getEffectiveDimensions(item: Pick<PlacedFurnitureItem, 'widthM' | 'depthM' | 'rotationDeg'>): { w: number; d: number } {
  return item.rotationDeg === 90 || item.rotationDeg === 270
    ? { w: item.depthM, d: item.widthM }
    : { w: item.widthM, d: item.depthM };
}

function boxesOverlap(a: Box2D, b: Box2D, padding = 0): boolean {
  return (
    a.x < b.x + b.w + padding &&
    a.x + a.w + padding > b.x &&
    a.y < b.y + b.d + padding &&
    a.y + a.d + padding > b.y
  );
}

/**
 * Evaluates a placed furniture item against room walls, door swings, windows, and other placed items.
 * Returns Fits, Tight (< 0.45m clearance or window overlap), or Does not fit (out of bounds / collision / blocks door swing).
 */
export function evaluateFurnitureFit(
  item: PlacedFurnitureItem,
  room: RoomSpec,
  openings: OpeningSpec[],
  otherItems: PlacedFurnitureItem[]
): FitCheckResult {
  const { w, d } = getEffectiveDimensions(item);
  const box: Box2D = { x: item.x, y: item.y, w, d };
  const reasons: string[] = [];
  let status: FitStatus = 'FITS';

  const leftGap = item.x - room.x;
  const rightGap = room.x + room.width - (item.x + w);
  const topGap = item.y - room.y;
  const bottomGap = room.y + room.depth - (item.y + d);
  const minWallGap = Math.min(leftGap, rightGap, topGap, bottomGap);

  if (minWallGap < -0.02) {
    status = 'DOES_NOT_FIT';
    reasons.push(`Extends ${roundTo(Math.abs(minWallGap), 2)}m beyond ${room.name} walls.`);
  }

  // Check collisions with other furniture in the same room
  for (const other of otherItems) {
    if (other.id === item.id || other.roomId !== item.roomId) continue;
    const oDim = getEffectiveDimensions(other);
    const oBox: Box2D = { x: other.x, y: other.y, w: oDim.w, d: oDim.d };
    if (boxesOverlap(box, oBox, -0.01)) {
      status = 'DOES_NOT_FIT';
      reasons.push(`Overlaps ${other.name}.`);
    } else if (boxesOverlap(box, oBox, 0.35) && status === 'FITS') {
      status = 'TIGHT';
      reasons.push(`Walkway clearance to ${other.name} is under 0.35m.`);
    }
  }

  // Check door swings & window obstructions belonging to this room
  for (const op of openings) {
    if (op.roomId !== room.id) continue;
    if (op.kind === 'DOOR') {
      const r = op.swingRadiusM ?? op.widthM;
      let doorZone: Box2D;
      if (op.wallSide === 'SOUTH') {
        doorZone = { x: op.x, y: op.y - r, w: op.widthM, d: r };
      } else if (op.wallSide === 'NORTH') {
        doorZone = { x: op.x, y: op.y, w: op.widthM, d: r };
      } else if (op.wallSide === 'WEST') {
        doorZone = { x: op.x, y: op.y, w: r, d: op.widthM };
      } else {
        doorZone = { x: op.x - r, y: op.y, w: r, d: op.widthM };
      }
      if (boxesOverlap(box, doorZone, -0.02)) {
        status = 'DOES_NOT_FIT';
        reasons.push('Blocks door swing arc.');
      } else if (boxesOverlap(box, doorZone, 0.25) && status === 'FITS') {
        status = 'TIGHT';
        reasons.push('Close to door swing clearance (< 0.25m).');
      }
    } else if (op.kind === 'WINDOW') {
      const winZone: Box2D =
        op.wallSide === 'NORTH' || op.wallSide === 'SOUTH'
          ? { x: op.x, y: op.y - 0.15, w: op.widthM, d: 0.3 }
          : { x: op.x - 0.15, y: op.y, w: 0.3, d: op.widthM };
      if (boxesOverlap(box, winZone, 0) && status === 'FITS') {
        status = 'TIGHT';
        reasons.push('Sits directly against exterior window span.');
      }
    }
  }

  if (reasons.length === 0) {
    reasons.push('Clear of walls, door swing arcs, and adjacent furniture.');
  }

  return {
    placementId: item.id,
    status,
    reasons,
    clearanceMinM: roundTo(Math.max(0, minWallGap), 2),
  };
}
