"use client";

import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import worldAtlas from "world-atlas/countries-110m.json";

export function WelcomeWorldMap() {
  return (
    <div className="welcome-world-map" aria-hidden="true">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 145, center: [0, 4] }}
        width={800}
        height={410}
      >
        <defs>
          <pattern id="welcome-map-dots" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="2.2" cy="2.2" r="1.55" fill="#c9daf7" />
          </pattern>
        </defs>
        <Geographies geography={worldAtlas}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="url(#welcome-map-dots)"
                stroke="transparent"
                tabIndex={-1}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
