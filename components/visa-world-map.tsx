"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import worldAtlas from "world-atlas/countries-110m.json";
import countriesData from "@/data/countries.json";
import type { CountryProfile } from "@/types/passport";
import type { VisaRule, VisaRules, VisaStatus } from "@/types/visa";
import { smallCountryMarkers } from "@/lib/small-country-markers";
import { getAppCopy, getCountryName } from "@/lib/i18n";

export const visaStatusColors: Record<VisaStatus | "origin", string> = {
  origin: "#353532",
  "visa free": "#55b77a",
  "visa on arrival": "#f2c94c",
  eta: "#4c8fdc",
  "e-visa": "#ee9f45",
  "visa required": "#e46055",
  "no admission": "#27313f",
  "-1": "#353532",
  unknown: "#dfe5eb",
};

export const visaStatusLabels: Record<VisaStatus | "origin" | "all", string> = {
  all: "全部目的地",
  origin: "护照签发地",
  "visa free": "免签",
  "visa on arrival": "落地签",
  eta: "电子旅行许可",
  "e-visa": "电子签",
  "visa required": "需要签证",
  "no admission": "暂不准入",
  "-1": "护照签发地",
  unknown: "暂无数据",
};

type VisaWorldMapProps = {
  origin: CountryProfile;
  visaRules: VisaRules;
  selectedDestination: CountryProfile;
  onDestinationSelect: (country: CountryProfile) => void;
  locale: string;
};

type MapPosition = {
  coordinates: [number, number];
  zoom: number;
};

const countries = countriesData as CountryProfile[];

function normalizeId(value: unknown) {
  return String(value ?? "").padStart(3, "0");
}

export function getRuleForCountry(origin: CountryProfile, destination: CountryProfile, rules: VisaRules): VisaRule {
  if (origin.iso2 === destination.iso2) return { status: "-1" };
  return rules[destination.iso2] ?? { status: "unknown" };
}

export function VisaWorldMap({
  origin,
  visaRules,
  selectedDestination,
  onDestinationSelect,
  locale,
}: VisaWorldMapProps) {
  const copy = getAppCopy(locale);
  const [position, setPosition] = useState<MapPosition>({ coordinates: [4, 8], zoom: 1 });
  const countryByNumericId = useMemo(
    () => new Map(countries.map((country) => [country.numericId, country])),
    [],
  );

  const changeZoom = (delta: number) => {
    setPosition((current) => ({ ...current, zoom: Math.min(4.5, Math.max(1, current.zoom + delta)) }));
  };

  return (
    <div className="visa-world-map" aria-label={`${getCountryName(origin, locale)} ${copy.passportAccessMap}`}>
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 150, center: [6, 8] }}
        width={800}
        height={480}
        className="visa-world-map-svg"
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={1}
          maxZoom={4.5}
          filterZoomEvent={(event) => {
            const zoomEvent = event as unknown as MouseEvent;
            const target = zoomEvent.target as Element | null;
            return !target?.closest(".small-country-marker") && !zoomEvent.ctrlKey && !zoomEvent.button;
          }}
          onMoveEnd={(next) => setPosition(next as MapPosition)}
        >
          <Geographies geography={worldAtlas}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericId = normalizeId(geo.id);
                const country = countryByNumericId.get(numericId);
                const rule = country ? getRuleForCountry(origin, country, visaRules) : { status: "unknown" as const };
                const isOrigin = country?.iso2 === origin.iso2;
                const isSelected = country?.iso2 === selectedDestination.iso2;
                const color = isOrigin ? visaStatusColors.origin : visaStatusColors[rule.status];
                const countryName = country ? getCountryName(country, locale) : String(geo.properties?.name ?? copy.noData);
                const statusLabel = isOrigin ? copy.passportCountry : statusLabelFor(rule.status, copy);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    tabIndex={country ? 0 : -1}
                aria-label={`${countryName}: ${statusLabel}`}
                    onClick={() => country && onDestinationSelect(country)}
                    onKeyDown={(event) => {
                      if (country && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        onDestinationSelect(country);
                      }
                    }}
                    fill={color}
                    stroke={isOrigin || isSelected ? "#242422" : "#f8fafc"}
                    strokeWidth={isOrigin ? 1.8 : isSelected ? 1.25 : 0.55}
                    style={{
                      default: { outline: "none", transition: "fill 150ms ease" },
                      hover: { fill: isOrigin ? visaStatusColors.origin : "#8c8c86", outline: "none" },
                      pressed: { fill: "#242422", outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
          {smallCountryMarkers.map((marker) => {
            const country = countryByNumericId.get(marker.numericId);
            if (!country) return null;
            const rule = getRuleForCountry(origin, country, visaRules);
            const isOrigin = country.iso2 === origin.iso2;
            const isSelected = country.iso2 === selectedDestination.iso2;
            const color = isOrigin ? visaStatusColors.origin : visaStatusColors[rule.status];
            const statusLabel = isOrigin ? copy.passportCountry : statusLabelFor(rule.status, copy);
            const markerRadius = 4.2 / position.zoom;

            return (
              <Marker
                key={marker.numericId}
                coordinates={marker.coordinates}
                suppressHydrationWarning
                className={`small-country-marker${isSelected ? " is-selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`${getCountryName(country, locale)}: ${statusLabel}`}
                onClick={() => onDestinationSelect(country)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onDestinationSelect(country);
                  }
                }}
              >
                <title>{`${getCountryName(country, locale)} · ${statusLabel}`}</title>
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
                    stroke="#242422"
                    strokeWidth={1.2 / position.zoom}
                  />
                )}
                <circle
                  className="small-country-marker-dot"
                  r={markerRadius}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={1.5 / position.zoom}
                />
                <text
                  className="small-country-label"
                  y={-8 / position.zoom}
                  fontSize={7 / position.zoom}
                  textAnchor="middle"
                >
                  {country.iso3}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="visa-map-zoom" aria-label={copy.zoomControls}>
        <button type="button" onClick={() => changeZoom(0.5)} aria-label={copy.zoomIn} title={copy.zoomIn}><Plus size={16} /></button>
        <span />
        <button type="button" onClick={() => changeZoom(-0.5)} aria-label={copy.zoomOut} title={copy.zoomOut}><Minus size={16} /></button>
      </div>
    </div>
  );
}

function statusLabelFor(status: VisaStatus, copy: Record<string, string>) {
  if (status === "visa free") return copy.visaFree;
  if (status === "visa on arrival") return copy.visaOnArrival;
  if (status === "eta") return copy.eta;
  if (status === "e-visa") return copy.eVisa;
  if (status === "visa required") return copy.visaRequired;
  if (status === "no admission") return copy.noAdmission;
  return copy.noData;
}
