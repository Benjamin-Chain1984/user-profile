/**
 * Body Map Marker - Interactive body diagram for skin check documentation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { X, Plus, MapPin } from 'lucide-react';
import type { BodyMapMarker as BodyMapMarkerType, SkinArea } from '@/types/continence';

interface BodyMapMarkerProps {
  markers: BodyMapMarkerType[];
  onMarkersChange: (markers: BodyMapMarkerType[]) => void;
  selectedAreas: SkinArea[];
  onAreasChange: (areas: SkinArea[]) => void;
  readOnly?: boolean;
}

// Define clickable body regions with their SVG paths and positions
const BODY_REGIONS: {
  id: SkinArea;
  label: string;
  path: string;
  labelPosition: { x: number; y: number };
}[] = [
  {
    id: 'sacrum',
    label: 'Sacrum',
    path: 'M 85,140 Q 100,135 115,140 L 115,160 Q 100,165 85,160 Z',
    labelPosition: { x: 100, y: 150 },
  },
  {
    id: 'buttocks',
    label: 'Buttocks',
    path: 'M 70,160 Q 85,155 100,160 Q 115,155 130,160 L 130,195 Q 115,200 100,195 Q 85,200 70,195 Z',
    labelPosition: { x: 100, y: 178 },
  },
  {
    id: 'groin',
    label: 'Groin',
    path: 'M 85,195 Q 100,190 115,195 L 115,215 Q 100,210 85,215 Z',
    labelPosition: { x: 100, y: 205 },
  },
  {
    id: 'perineum',
    label: 'Perineum',
    path: 'M 90,215 Q 100,212 110,215 L 110,230 Q 100,233 90,230 Z',
    labelPosition: { x: 100, y: 222 },
  },
  {
    id: 'inner_thighs',
    label: 'Inner Thighs',
    path: 'M 70,230 L 85,220 L 85,280 L 70,290 Z M 130,230 L 115,220 L 115,280 L 130,290 Z',
    labelPosition: { x: 100, y: 255 },
  },
  {
    id: 'skin_folds',
    label: 'Skin Folds',
    path: 'M 60,160 Q 70,165 70,175 Q 70,185 60,190 Z M 140,160 Q 130,165 130,175 Q 130,185 140,190 Z',
    labelPosition: { x: 100, y: 120 },
  },
];

export function BodyMapMarker({
  markers,
  onMarkersChange,
  selectedAreas,
  onAreasChange,
  readOnly = false,
}: BodyMapMarkerProps) {
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [markerNotes, setMarkerNotes] = useState('');

  const toggleArea = (area: SkinArea) => {
    if (readOnly) return;
    onAreasChange(
      selectedAreas.includes(area)
        ? selectedAreas.filter((a) => a !== area)
        : [...selectedAreas, area]
    );
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 200;
    const y = ((e.clientY - rect.top) / rect.height) * 350;

    // Check if click is within a body region
    const clickedRegion = BODY_REGIONS.find((region) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', region.path);
      const point = svg.createSVGPoint();
      point.x = x;
      point.y = y;
      return path.isPointInFill?.(point);
    });

    if (clickedRegion && !selectedAreas.includes(clickedRegion.id)) {
      toggleArea(clickedRegion.id);
    }
  };

  const addMarker = (x: number, y: number, notes: string = '') => {
    const newMarker: BodyMapMarkerType = {
      area: 'other',
      x,
      y,
      notes,
    };
    onMarkersChange([...markers, newMarker]);
  };

  const removeMarker = (index: number) => {
    onMarkersChange(markers.filter((_, i) => i !== index));
  };

  const updateMarkerNotes = (index: number, notes: string) => {
    const updated = markers.map((m, i) => (i === index ? { ...m, notes } : m));
    onMarkersChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Body Map</Label>
        <Badge variant="outline" className="gap-1">
          <MapPin className="h-3 w-3" />
          {selectedAreas.length} area(s) selected
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Click on body regions to select areas checked. Use markers for specific issue locations.
      </p>

      <div className="relative bg-muted/30 rounded-lg p-4 flex justify-center">
        <svg
          viewBox="0 0 200 350"
          className="w-full max-w-[280px] h-auto cursor-pointer"
          onClick={handleSvgClick}
        >
          {/* Body outline - posterior view */}
          <g className="stroke-muted-foreground/50 fill-none stroke-[1.5]">
            {/* Head */}
            <ellipse cx="100" cy="30" rx="25" ry="28" />
            
            {/* Neck */}
            <path d="M 90,55 L 90,70 M 110,55 L 110,70" />
            
            {/* Torso */}
            <path d="M 65,70 L 65,140 Q 65,200 80,200 L 80,195" />
            <path d="M 135,70 L 135,140 Q 135,200 120,200 L 120,195" />
            <path d="M 65,70 Q 100,75 135,70" />
            
            {/* Arms */}
            <path d="M 65,75 Q 45,90 35,130 Q 30,150 25,170" />
            <path d="M 135,75 Q 155,90 165,130 Q 170,150 175,170" />
            
            {/* Legs */}
            <path d="M 80,200 L 75,280 L 70,330" />
            <path d="M 120,200 L 125,280 L 130,330" />
            <path d="M 80,200 Q 100,205 120,200" />
          </g>

          {/* Clickable regions */}
          {BODY_REGIONS.map((region) => (
            <g key={region.id}>
              <path
                d={region.path}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedAreas.includes(region.id)
                    ? 'fill-primary/40 stroke-primary stroke-2'
                    : 'fill-transparent stroke-muted-foreground/30 stroke-1 hover:fill-primary/20 hover:stroke-primary/50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleArea(region.id);
                }}
              />
              {selectedAreas.includes(region.id) && (
                <text
                  x={region.labelPosition.x}
                  y={region.labelPosition.y}
                  textAnchor="middle"
                  className="fill-primary text-[8px] font-medium pointer-events-none"
                >
                  ✓
                </text>
              )}
            </g>
          ))}

          {/* Placed markers */}
          {markers.map((marker, index) => (
            <g key={index}>
              <Popover>
                <PopoverTrigger asChild>
                  <g className="cursor-pointer">
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      r="8"
                      className="fill-destructive/80 stroke-white stroke-2"
                    />
                    <text
                      x={marker.x}
                      y={marker.y + 3}
                      textAnchor="middle"
                      className="fill-white text-[8px] font-bold pointer-events-none"
                    >
                      {index + 1}
                    </text>
                  </g>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" side="right">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Marker {index + 1}</span>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeMarker(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Add notes..."
                      value={marker.notes || ''}
                      onChange={(e) => updateMarkerNotes(index, e.target.value)}
                      disabled={readOnly}
                      className="text-sm"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </g>
          ))}

          {/* Legend */}
          <g transform="translate(10, 310)">
            <rect x="0" y="0" width="10" height="10" className="fill-primary/40 stroke-primary" />
            <text x="15" y="9" className="fill-muted-foreground text-[7px]">Selected area</text>
            <circle cx="5" cy="20" r="5" className="fill-destructive/80" />
            <text x="15" y="23" className="fill-muted-foreground text-[7px]">Issue marker</text>
          </g>
        </svg>
      </div>

      {/* Region selection badges */}
      <div className="space-y-2">
        <Label className="text-sm">Quick Select Areas</Label>
        <div className="flex flex-wrap gap-2">
          {BODY_REGIONS.map((region) => (
            <Badge
              key={region.id}
              variant={selectedAreas.includes(region.id) ? 'default' : 'outline'}
              className="cursor-pointer transition-all"
              onClick={() => toggleArea(region.id)}
            >
              {region.label}
            </Badge>
          ))}
          <Badge
            variant={selectedAreas.includes('other') ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleArea('other')}
          >
            Other
          </Badge>
        </div>
      </div>

      {/* Add marker button */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Issue Marker
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Click directly on the body map to place a marker at the specific location of concern.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="markerNotes">Marker Notes</Label>
                  <Input
                    id="markerNotes"
                    placeholder="Describe the issue..."
                    value={markerNotes}
                    onChange={(e) => setMarkerNotes(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // Place marker in center if using button
                    addMarker(100, 175, markerNotes);
                    setMarkerNotes('');
                  }}
                >
                  Place Marker
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          {markers.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {markers.length} marker(s) placed
            </span>
          )}
        </div>
      )}

      {/* Markers list */}
      {markers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Placed Markers</Label>
          <div className="space-y-1">
            {markers.map((marker, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">
                    {marker.notes || 'No notes'}
                  </span>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeMarker(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
