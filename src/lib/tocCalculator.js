/**
 * Total Occupancy Cost — standalone version (no market comparison yet, see avsnitt 8.1/10.2 of
 * LOA_Affarsmodell.pdf). A pure function of what the visitor types in: no listing, no login, no
 * platform data required, so it works as a top-of-funnel tool before anyone has an active search.
 *
 * Deliberately left out of v1 (kept simple on purpose, matching the business doc's own MVP TOC
 * table in avsnitt 4.1): index/CPI-uppräkning and break-optioner. Deposition is shown separately,
 * not summed into the cost — it's a refundable deposit, not a real expense.
 */
export function calculateTotalOccupancyCost({
  baseRentPerYear = 0,
  sizeSqm = 0,
  operatingCostPerYear = 0,
  propertyTaxPerYear = 0,
  oneTimeFitOutCost = 0,
  depositAmount = 0,
  termYears = 5
} = {}) {
  const rent = Math.max(0, Number(baseRentPerYear) || 0);
  const area = Math.max(0, Number(sizeSqm) || 0);
  const operating = Math.max(0, Number(operatingCostPerYear) || 0);
  const propertyTax = Math.max(0, Number(propertyTaxPerYear) || 0);
  const fitOut = Math.max(0, Number(oneTimeFitOutCost) || 0);
  const deposit = Math.max(0, Number(depositAmount) || 0);
  const term = Math.max(1, Number(termYears) || 5);

  const annualCost = rent + operating + propertyTax;
  const totalTermCost = annualCost * term + fitOut;
  const averageAnnualCost = totalTermCost / term;
  const costPerSqmPerYear = area > 0 ? annualCost / area : null;

  return {
    annualCost,
    totalTermCost,
    averageAnnualCost,
    costPerSqmPerYear,
    deposit,
    termYears: term,
    breakdown: [
      { key: "baseRent", label: "Bashyra", perYear: rent, total: rent * term },
      { key: "operatingCost", label: "Drift", perYear: operating, total: operating * term },
      { key: "propertyTax", label: "Fastighetsskatt", perYear: propertyTax, total: propertyTax * term },
      { key: "fitOut", label: "Anpassning (engångs)", perYear: null, total: fitOut }
    ]
  };
}
