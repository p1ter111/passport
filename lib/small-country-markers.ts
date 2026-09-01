export type SmallCountryMarker = {
  numericId: string;
  iso3: string;
  name: string;
  coordinates: [number, number];
};

// Countries omitted from world-atlas 110m are restored as geographic point markers.
export const smallCountryMarkers: SmallCountryMarker[] = [
  { numericId: "702", iso3: "SGP", name: "Singapore", coordinates: [103.8198, 1.3521] },
  { numericId: "470", iso3: "MLT", name: "Malta", coordinates: [14.3754, 35.9375] },
  { numericId: "438", iso3: "LIE", name: "Liechtenstein", coordinates: [9.5554, 47.166] },
  { numericId: "492", iso3: "MCO", name: "Monaco", coordinates: [7.4246, 43.7384] },
  { numericId: "344", iso3: "HKG", name: "Hong Kong", coordinates: [114.1694, 22.3193] },
  { numericId: "020", iso3: "AND", name: "Andorra", coordinates: [1.5218, 42.5063] },
  { numericId: "674", iso3: "SMR", name: "San Marino", coordinates: [12.4578, 43.9424] },
  { numericId: "052", iso3: "BRB", name: "Barbados", coordinates: [-59.5432, 13.1939] },
  { numericId: "659", iso3: "KNA", name: "Saint Kitts and Nevis", coordinates: [-62.783, 17.3578] },
  { numericId: "670", iso3: "VCT", name: "Saint Vincent and the Grenadines", coordinates: [-61.2872, 12.9843] },
  { numericId: "690", iso3: "SYC", name: "Seychelles", coordinates: [55.492, -4.6796] },
  { numericId: "028", iso3: "ATG", name: "Antigua and Barbuda", coordinates: [-61.7964, 17.0608] },
  { numericId: "336", iso3: "VAT", name: "Vatican City", coordinates: [12.4534, 41.9029] },
  { numericId: "308", iso3: "GRD", name: "Grenada", coordinates: [-61.679, 12.1165] },
  { numericId: "480", iso3: "MUS", name: "Mauritius", coordinates: [57.5522, -20.3484] },
  { numericId: "212", iso3: "DMA", name: "Dominica", coordinates: [-61.371, 15.415] },
  { numericId: "662", iso3: "LCA", name: "Saint Lucia", coordinates: [-60.9789, 13.9094] },
  { numericId: "446", iso3: "MAC", name: "Macao", coordinates: [113.5439, 22.1987] },
  { numericId: "584", iso3: "MHL", name: "Marshall Islands", coordinates: [171.1845, 7.1315] },
  { numericId: "882", iso3: "WSM", name: "Samoa", coordinates: [-172.1046, -13.759] },
  { numericId: "776", iso3: "TON", name: "Tonga", coordinates: [-175.1982, -21.179] },
  { numericId: "798", iso3: "TUV", name: "Tuvalu", coordinates: [177.6493, -7.1095] },
  { numericId: "296", iso3: "KIR", name: "Kiribati", coordinates: [-168.734, 1.8709] },
  { numericId: "583", iso3: "FSM", name: "Micronesia", coordinates: [158.215, 6.8875] },
  { numericId: "585", iso3: "PLW", name: "Palau", coordinates: [134.5825, 7.515] },
  { numericId: "462", iso3: "MDV", name: "Maldives", coordinates: [73.2207, 3.2028] },
  { numericId: "048", iso3: "BHR", name: "Bahrain", coordinates: [50.5577, 26.0667] },
  { numericId: "520", iso3: "NRU", name: "Nauru", coordinates: [166.9315, -0.5228] },
  { numericId: "383", iso3: "XKX", name: "Kosovo", coordinates: [20.903, 42.6026] },
  { numericId: "132", iso3: "CPV", name: "Cape Verde", coordinates: [-23.6052, 15.1201] },
  { numericId: "678", iso3: "STP", name: "Sao Tome and Principe", coordinates: [6.6131, 0.1864] },
  { numericId: "174", iso3: "COM", name: "Comoros", coordinates: [43.8722, -11.6455] },
];
