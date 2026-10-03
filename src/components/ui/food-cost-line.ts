import { ItemType } from '../../contract';
import { formatRupees } from '../../pages/event-detail/format-amount';
import { computeFoodItemTotalCost } from '../../pages/quotation-preview/quotation-calculations';

export interface FoodCostInput {
  pax: number;
  limitedSeating: boolean;
  costPerPlate: number;
}

export interface FoodCostLine {
  calculation: string;
  total: string;
}

// R3 (UI Redesign 5C.3): "500 pax × ₹ 450 =" + "₹ 2,25,000", or for limited
// seating "L.S. (500 pax) × ₹ 450 =" + "₹ 450" — L.S. bills 1, exactly as the
// quotation does (computeFoodItemTotalCost).
export const formatFoodCostLine = ({ pax, limitedSeating, costPerPlate }: FoodCostInput): FoodCostLine => {
  const paxLabel = limitedSeating ? `L.S. (${pax} pax)` : `${pax} pax`;
  const total = computeFoodItemTotalCost({ type: ItemType.Meal, pax, limitedSeating, costPerPlate });
  return {
    calculation: `${paxLabel} × ${formatRupees(costPerPlate)} =`,
    total: formatRupees(total),
  };
};
