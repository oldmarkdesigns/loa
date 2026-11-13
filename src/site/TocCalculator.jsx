import { useMemo, useState } from "react";
import { calculateTotalOccupancyCost } from "../lib/tocCalculator";
import { Field } from "./SiteChrome";
import { sek } from "./siteUtils";

// Total Occupancy Cost, live: the fields on the left, the sum on the dark plate
// beside them, updating as you type. A pure function of what is typed in, no
// listing or login needed (see lib/tocCalculator.js).
const FIELDS = [
  { key: "baseRentPerYear", label: "Bashyra", unit: "kr/år", placeholder: "450 000" },
  { key: "sizeSqm", label: "Yta", unit: "kvm", placeholder: "300" },
  { key: "operatingCostPerYear", label: "Drift", unit: "kr/år", placeholder: "70 000" },
  { key: "propertyTaxPerYear", label: "Fastighetsskatt", unit: "kr/år", placeholder: "35 000" },
  { key: "oneTimeFitOutCost", label: "Anpassning, engångs", unit: "kr", placeholder: "250 000" },
  { key: "depositAmount", label: "Deposition", unit: "kr", placeholder: "150 000" },
  { key: "termYears", label: "Avtalslängd", unit: "år", placeholder: "5" }
];

const EXAMPLE = {
  baseRentPerYear: "450000",
  sizeSqm: "300",
  operatingCostPerYear: "70000",
  propertyTaxPerYear: "35000",
  oneTimeFitOutCost: "250000",
  depositAmount: "150000",
  termYears: "5"
};

const digits = (value) => String(value || "").replace(/[^\d]/g, "");
const pretty = (value) => (value ? Number(value).toLocaleString("sv-SE") : "");

export default function TocCalculator() {
  const [values, setValues] = useState(EXAMPLE);

  const result = useMemo(
    () => calculateTotalOccupancyCost(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value) || 0]))),
    [values]
  );

  return (
    <div className="lo-calc">
      <div className="lo-calc-fields">
        {FIELDS.map((field) => (
          <Field key={field.key} label={`${field.label} (${field.unit})`}>
            <input
              inputMode="numeric"
              value={pretty(values[field.key])}
              placeholder={field.placeholder}
              onChange={(event) => setValues((previous) => ({ ...previous, [field.key]: digits(event.target.value).slice(0, 10) }))}
            />
          </Field>
        ))}
        <div className="lo-field" style={{ alignSelf: "end", justifyItems: "start", paddingBottom: 12 }}>
          <button type="button" className="lo-text-btn" onClick={() => setValues(Object.fromEntries(FIELDS.map((f) => [f.key, ""])))}>
            Töm fälten
          </button>
        </div>
      </div>

      <div className="lo-calc-result" aria-live="polite">
        <p className="lo-label">Totalt över {result.termYears} år</p>
        <p className="lo-calc-total">{sek(result.totalTermCost)}</p>
        <dl className="lo-facts">
          <div>
            <dt>Per år</dt>
            <dd>{sek(result.annualCost)}</dd>
          </div>
          <div>
            <dt>Per månad</dt>
            <dd>{sek(result.annualCost / 12)}</dd>
          </div>
          <div>
            <dt>Per kvm och år</dt>
            <dd>{result.costPerSqmPerYear ? sek(result.costPerSqmPerYear) : "–"}</dd>
          </div>
          <div>
            <dt>Snitt per år inkl. anpassning</dt>
            <dd>{sek(result.averageAnnualCost)}</dd>
          </div>
        </dl>
        <p className="lo-calc-note">
          Depositionen, {sek(result.deposit)}, betalas tillbaka och räknas inte in i kostnaden.
        </p>
      </div>
    </div>
  );
}
