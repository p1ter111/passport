"use client";

import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { MeshPhongMaterial } from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import worldAtlas from "world-atlas/countries-110m.json";
import type { CountryProfile } from "@/types/passport";
import countriesData from "@/data/countries.json";
import { getAppCopy, getCountryName } from "@/lib/i18n";
import { smallCountryMarkers, type SmallCountryMarker } from "@/lib/small-country-markers";

type GlobeMapProps = {
  selectedId: string;
  colorForCountry: (numericId: string) => string;
  onCountrySelect: (name: string, numericId: string) => void;
  locale?: string;
};

type GlobeFeature = {
  id?: string | number;
  properties?: { name?: string };
};

function normalizeId(value: unknown) {
  return String(value ?? "").padStart(3, "0");
}

export function GlobeMap({ selectedId, colorForCountry, onCountrySelect, locale = "en" }: GlobeMapProps) {
  const copy = getAppCopy(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const hasUserInteractedRef = useRef(false);
  const [size, setSize] = useState({ width: 720, height: 540 });

  const countries = useMemo(() => {
    const topology = worldAtlas as unknown as Topology<{
      countries: GeometryCollection;
    }>;
    const collection = feature(topology, topology.objects.countries);
    return collection.features as unknown as GlobeFeature[];
  }, []);

  const globeMaterial = useMemo(
    () => new MeshPhongMaterial({ color: "#e8f1fb", shininess: 6 }),
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: Math.max(320, Math.round(entry.contentRect.width)),
        height: Math.max(420, Math.round(entry.contentRect.height)),
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = !hasUserInteractedRef.current;
    controls.autoRotateSpeed = 0.35;
    controls.enablePan = false;

    // A manual globe interaction takes control away from the idle animation.
    // Keep the globe still afterwards so the user's chosen viewpoint remains stable.
    const stopAutoRotate = () => {
      hasUserInteractedRef.current = true;
      controls.autoRotate = false;
    };

    controls.addEventListener("start", stopAutoRotate);
    return () => {
      controls.removeEventListener("start", stopAutoRotate);
    };
  }, [size.width]);

  return (
    <div ref={containerRef} className="globe-shell" aria-label={copy.globalFreedomMap}>
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={globeMaterial}
        showAtmosphere
        atmosphereColor="#7bb3ef"
        atmosphereAltitude={0.13}
        polygonsData={countries}
        polygonAltitude={(item) =>
          normalizeId((item as GlobeFeature).id) === selectedId ? 0.03 : 0.008
        }
        polygonCapColor={(item) => {
          const numericId = normalizeId((item as GlobeFeature).id);
          return numericId === selectedId ? "#2d2d2b" : colorForCountry(numericId);
        }}
        polygonSideColor={() => "rgba(56, 90, 122, 0.16)"}
        polygonStrokeColor={() => "rgba(255,255,255,0.85)"}
        polygonsTransitionDuration={250}
        polygonLabel={(item) => {
          const country = item as GlobeFeature;
          const profile = (countriesData as CountryProfile[]).find((item) => item.numericId === normalizeId(country.id));
          return `<div class="globe-label">${profile ? getCountryName(profile, locale) : country.properties?.name ?? copy.noData}</div>`;
        }}
        onPolygonClick={(item) => {
          const country = item as GlobeFeature;
          onCountrySelect(
            String(country.properties?.name ?? "Unknown"),
            normalizeId(country.id),
          );
        }}
        pointsData={smallCountryMarkers}
        pointLat={(item) => (item as SmallCountryMarker).coordinates[1]}
        pointLng={(item) => (item as SmallCountryMarker).coordinates[0]}
        pointAltitude={(item) => (item as SmallCountryMarker).numericId === selectedId ? 0.05 : 0.032}
        pointRadius={(item) => (item as SmallCountryMarker).numericId === selectedId ? 1.15 : 0.78}
        pointResolution={12}
        pointColor={(item) => {
          const marker = item as SmallCountryMarker;
          return marker.numericId === selectedId ? "#2d2d2b" : colorForCountry(marker.numericId);
        }}
        pointLabel={(item) => {
          const marker = item as SmallCountryMarker;
          const profile = (countriesData as CountryProfile[]).find((country) => country.iso3 === marker.iso3);
          return `<div class="globe-label">${profile ? `${profile.flag} ${getCountryName(profile, locale)}` : marker.name}</div>`;
        }}
        onPointClick={(item) => {
          const marker = item as SmallCountryMarker;
          onCountrySelect(marker.name, marker.numericId);
        }}
        labelsData={smallCountryMarkers}
        labelLat={(item) => (item as SmallCountryMarker).coordinates[1]}
        labelLng={(item) => (item as SmallCountryMarker).coordinates[0]}
        labelText={(item) => (item as SmallCountryMarker).iso3}
        labelSize={(item) => (item as SmallCountryMarker).numericId === selectedId ? 0.96 : 0.82}
        labelAltitude={0.055}
        labelColor={(item) => (item as SmallCountryMarker).numericId === selectedId ? "#171716" : "#3f4541"}
        labelResolution={3}
        labelIncludeDot={false}
        onLabelClick={(item) => {
          const marker = item as SmallCountryMarker;
          onCountrySelect(marker.name, marker.numericId);
        }}
      />
    </div>
  );
}
