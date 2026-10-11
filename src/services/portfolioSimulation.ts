import { PortfolioAllocation, RiskLevel } from '../types';

export const MODEL_PORTFOLIOS: Record<RiskLevel, PortfolioAllocation> = {
  Low: {
    equities: 20,
    bonds: 60,
    cash: 20,
  },
  Medium: {
    equities: 60,
    bonds: 30,
    cash: 10,
  },
  High: {
    equities: 85,
    bonds: 10,
    cash: 5,
  },
};

export interface SimulatedWeeklyPerformance {
  previousValue: number;
  currentValue: number;
  changeAmount: number;
  changePercentage: number;
  sparklinePoints: number[];
  rebalancedAsset: string;
}

export class PortfolioSimulationService {
  /**
   * Returns deterministic model allocation for a chosen risk level
   */
  static getModelAllocation(risk: RiskLevel): PortfolioAllocation {
    return MODEL_PORTFOLIOS[risk] || MODEL_PORTFOLIOS.Medium;
  }

  /**
   * Generates reproducible weekly simulation update.
   * For the demo pitch, an investable paper amount of $40 yields
   * exactly $41.18 (+$1.18 / +2.95%).
   */
  static simulateOneWeekPerformance(
    initialPaperValue: number,
    risk: RiskLevel = 'Medium'
  ): SimulatedWeeklyPerformance {
    // Exact seeded values for $40 base as specified in hackathon brief
    if (Math.abs(initialPaperValue - 40) < 0.01) {
      return {
        previousValue: 40.0,
        currentValue: 41.18,
        changeAmount: 1.18,
        changePercentage: 2.95,
        sparklinePoints: [40.0, 40.22, 40.15, 40.48, 40.75, 40.9, 41.18],
        rebalancedAsset: 'Trimmed outperforming equities, reallocated to bond buffer',
      };
    }

    // Proportional seeded calculation for any other paper amount
    const growthFactor = risk === 'High' ? 0.038 : risk === 'Medium' ? 0.0295 : 0.014;
    const changeAmount = Math.round(initialPaperValue * growthFactor * 100) / 100;
    const currentValue = Math.round((initialPaperValue + changeAmount) * 100) / 100;
    const changePercentage = Math.round(((currentValue - initialPaperValue) / initialPaperValue) * 10000) / 100;

    return {
      previousValue: initialPaperValue,
      currentValue,
      changeAmount,
      changePercentage,
      sparklinePoints: [
        initialPaperValue,
        initialPaperValue + changeAmount * 0.2,
        initialPaperValue + changeAmount * 0.15,
        initialPaperValue + changeAmount * 0.5,
        initialPaperValue + changeAmount * 0.7,
        currentValue,
      ],
      rebalancedAsset: 'Routine asset class drift realigned to target allocation',
    };
  }
}
