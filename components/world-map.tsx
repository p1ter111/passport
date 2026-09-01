"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geography,
  Marker,
  ZoomableGroup,
  useMapContext,
} from "react-simple-maps";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-110m.json";
import type { CountryProfile } from "@/types/passport";
import { smallCountryMarkers } from "@/lib/small-country-markers";
import countriesData from "@/data/countries.json";
import { getAppCopy, getCountryName } from "@/lib/i18n";

type WorldMapProps = {
  selectedId: string;
  colorForCountry: (numericId: string) => string;
  onCountrySelect: (name: string, numericId: string) => void;
  locale?: string;
  onCountryHover?: (
    name: string,
    numericId: string,
    point: { x: number; y: number } | null,
  ) => void;
};

type MapPosition = {
  coordinates: [number, number];
  zoom: number;
};

type CountryFeature = {
  id?: string | number;
  properties?: { name?: string };
};

const worldTopology = worldAtlas as unknown as Topology<{
  countries: GeometryCollection;
}>;
const countryFeatures = feature(
  worldTopology,
  worldTopology.objects.countries,
).features as unknown as CountryFeature[];
const countryProfiles = countriesData as CountryProfile[];

function normalizeId(value: unknown) {
  return String(value ?? "").padStart(3, "0");
}

export function WorldMap({ selectedId, colorForCountry, onCountrySelect, onCountryHover, locale = "en" }: WorldMapProps) {
  const [position, setPosition] = useStateWithMapPosition();

  const changeZoom = (delta: number) => {
    setPosition((current) => ({
      ...current,
      zoom: Math.min(4, Math.max(1, current.zoom + delta)),
    }));
  };

  return (
    <div className="world-map-shell" aria-label={getAppCopy(locale).globalFreedomMap}>
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 150, center: [6, 8] }}
        width={800}
        height={480}
        className="world-map-svg"
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={1}
          maxZoom={4}
          filterZoomEvent={(event) => {
            const zoomEvent = event as unknown as MouseEvent;
            const target = zoomEvent.target as Element | null;
            return !target?.closest(".small-country-marker") && !zoomEvent.ctrlKey && !zoomEvent.button;
          }}
          onMoveEnd={(next) => setPosition(next as MapPosition)}
        >
          <CountryLayer
            selectedId={selectedId}
            colorForCountry={colorForCountry}
            onCountrySelect={onCountrySelect}
            onCountryHover={onCountryHover}
            locale={locale}
          />
          {smallCountryMarkers.map((marker) => {
            const isSelected = marker.numericId === selectedId;
            const markerRadius = 4.2 / position.zoom;

            return (
              <Marker
                key={marker.numericId}
                coordinates={marker.coordinates}
                suppressHydrationWarning
                className={`small-country-marker${isSelected ? " is-selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={getMarkerName(marker.name, marker.iso3, locale)}
                onClick={() => onCountrySelect(marker.name, marker.numericId)}
                onMouseEnter={(event) => {
                  const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  if (!bounds) return;
                  onCountryHover?.(marker.name, marker.numericId, {
                    x: ((event.clientX - bounds.left) / bounds.width) * 100,
                    y: ((event.clientY - bounds.top) / bounds.height) * 100,
                  });
                }}
                onMouseMove={(event) => {
                  const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  if (!bounds) return;
                  onCountryHover?.(marker.name, marker.numericId, {
                    x: ((event.clientX - bounds.left) / bounds.width) * 100,
                    y: ((event.clientY - bounds.top) / bounds.height) * 100,
                  });
                }}
                onMouseLeave={() => onCountryHover?.(marker.name, marker.numericId, null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onCountrySelect(marker.name, marker.numericId);
                  }
                }}
              >
                <title>{getMarkerName(marker.name, marker.iso3, locale)}</title>
                <circle
                  className="small-country-marker-hit-area"
                  r={9 / position.zoom}
                  fill="transparent"
                />
                {isSelected && (
                  <circle
                    className="small-country-marker-ring"
                    r={6.5 / position.zoom}
                    fill="none"
                    stroke="#171716"
                    strokeWidth={1.2 / position.zoom}
                  />
                )}
                <circle
                  className="small-country-marker-dot"
                  r={markerRadius}
                  fill={isSelected ? "#2d2d2b" : colorForCountry(marker.numericId)}
                  stroke="#ffffff"
                  strokeWidth={1.5 / position.zoom}
                />
                <text
                  className="small-country-label"
                  y={-8 / position.zoom}
                  fontSize={7 / position.zoom}
                  textAnchor="middle"
                >
                  {marker.iso3}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="map-zoom-controls" aria-label={getAppCopy(locale).zoomControls}>
        <button type="button" onClick={() => changeZoom(0.5)} aria-label={getAppCopy(locale).zoomIn} title={getAppCopy(locale).zoomIn}>
          <Plus size={16} />
        </button>
        <span />
        <button type="button" onClick={() => changeZoom(-0.5)} aria-label={getAppCopy(locale).zoomOut} title={getAppCopy(locale).zoomOut}>
          <Minus size={16} />
        </button>
      </div>
    </div>
  );
}

function CountryLayer({ selectedId, colorForCountry, onCountrySelect, onCountryHover, locale = "en" }: WorldMapProps) {
  const { path } = useMapContext();
  const geographies = useMemo(
    () => countryFeatures.map((country, index) => ({
      ...country,
      rsmKey: `geo-${index}`,
      svgPath: path(country as never),
    })),
    [path],
  );

  return geographies.map((geo) => {
    const numericId = normalizeId(geo.id);
    const isSelected = numericId === selectedId;
    const name = String(geo.properties?.name ?? "Unknown");
    return (
      <Geography
        key={geo.rsmKey}
        geography={geo}
        tabIndex={0}
        aria-label={name}
        onClick={() => onCountrySelect(name, numericId)}
        onMouseEnter={(event) => {
          const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
          if (!bounds) return;
          onCountryHover?.(name, numericId, {
            x: ((event.clientX - bounds.left) / bounds.width) * 100,
            y: ((event.clientY - bounds.top) / bounds.height) * 100,
          });
        }}
        onMouseMove={(event) => {
          const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
          if (!bounds) return;
          onCountryHover?.(name, numericId, {
            x: ((event.clientX - bounds.left) / bounds.width) * 100,
            y: ((event.clientY - bounds.top) / bounds.height) * 100,
          });
        }}
        onMouseLeave={() => onCountryHover?.(name, numericId, null)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onCountrySelect(name, numericId);
          }
        }}
        fill={isSelected ? "#2d2d2b" : colorForCountry(numericId)}
        stroke={isSelected ? "#171716" : "rgba(255, 255, 255, 0.9)"}
        strokeWidth={isSelected ? 1.2 : 0.42}
        style={{
          default: { outline: "none", transition: "fill 180ms ease, opacity 180ms ease" },
          hover: { fill: isSelected ? "#2d2d2b" : "#8d8d87", outline: "none" },
          pressed: { fill: "#171716", outline: "none" },
        }}
      />
    );
  });
}

function useStateWithMapPosition() {
  return useState<MapPosition>({ coordinates: [4, 8], zoom: 1 });
}

function getMarkerName(name: string, iso3: string, locale: string) {
  const country = countryProfiles.find((item) => item.iso3 === iso3);
  return country ? getCountryName(country, locale) : name;
}
