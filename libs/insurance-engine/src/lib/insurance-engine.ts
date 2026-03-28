import { InsurancePolicy, LineItem, RuleExecutionTrace, ExplanationOfBenefits, EOBLineItem, LineItemSchema, InsurancePolicySchema } from './types';
import Dinero from 'dinero.js';

export class InsuranceEngine {
  public evaluate(items: LineItem[], policies: InsurancePolicy[]): ExplanationOfBenefits {
    // Validate inputs
    items.forEach(i => LineItemSchema.parse(i));
    policies.forEach(p => InsurancePolicySchema.parse(p));

    // Initialize EOB
    const eob: ExplanationOfBenefits = {
      totalOriginalCents: 0,
      totalCoveredCents: 0,
      totalPatientResponsibilityCents: 0,
      lines: [],
    };

    let totalOriginal = Dinero({ amount: 0, currency: 'USD' });
    let totalCovered = Dinero({ amount: 0, currency: 'USD' });
    let totalPatientResponsibility = Dinero({ amount: 0, currency: 'USD' });

    // State object to keep track of annual caps and deductibles per policy across all items
    const policyState: Record<string, {
      remainingDeductible: ReturnType<typeof Dinero>;
      accumulatedAnnualCovered: ReturnType<typeof Dinero>;
    }> = {};

    policies.forEach(policy => {
      policyState[policy.id] = {
        remainingDeductible: Dinero({ amount: policy.rules.deductibleCents, currency: 'USD' }),
        accumulatedAnnualCovered: Dinero({ amount: 0, currency: 'USD' })
      };
    });


    for (const item of items) {
      const itemTotal = Dinero({ amount: item.unitPriceCents, currency: 'USD' }).multiply(item.quantity);
      totalOriginal = totalOriginal.add(itemTotal);

      let currentPatientResponsibility = itemTotal;
      let itemTotalCovered = Dinero({ amount: 0, currency: 'USD' });
      const itemTraces: RuleExecutionTrace[] = [];

      for (let i = 0; i < policies.length; i++) {
        const policy = policies[i];
        
        if (currentPatientResponsibility.getAmount() <= 0) {
          break; // Nothing left to cover
        }

        const initialAmountForPolicy = currentPatientResponsibility;
        let amountToCover = initialAmountForPolicy;
        const traces: RuleExecutionTrace[] = [];

        // 1. Exclusions
        if (policy.rules.exclusions.includes(item.diagnosisCode)) {
          traces.push({
            rule: 'exclusion',
            applied: true,
            amountCoveredCents: 0,
            amountPatientCents: amountToCover.getAmount(),
            description: `Diagnosis ${item.diagnosisCode} is excluded by policy ${policy.name}`,
          });
          amountToCover = Dinero({ amount: 0, currency: 'USD' });
          itemTraces.push(...traces);
          continue; // Skip rest of rules for this policy
        }

        // 2. Deductible
        const state = policyState[policy.id];
        if (state.remainingDeductible.getAmount() > 0) {
          const deductibleToApply = Dinero.minimum([amountToCover, state.remainingDeductible]);
          state.remainingDeductible = state.remainingDeductible.subtract(deductibleToApply);
          amountToCover = amountToCover.subtract(deductibleToApply);

          traces.push({
            rule: 'deductible',
            applied: true,
            amountCoveredCents: 0,
            amountPatientCents: deductibleToApply.getAmount(),
            description: `Applied deductible of ${deductibleToApply.getAmount()} cents. Remaining deductible: ${state.remainingDeductible.getAmount()} cents`,
          });
        }

        if (amountToCover.getAmount() <= 0) {
            itemTraces.push(...traces);
            continue;
        }

        // 3. Copay
        if (policy.rules.copayCents > 0) {
           const copay = Dinero({ amount: policy.rules.copayCents, currency: 'USD' });
           const copayToApply = Dinero.minimum([amountToCover, copay]);
           amountToCover = amountToCover.subtract(copayToApply);

           traces.push({
             rule: 'copay',
             applied: true,
             amountCoveredCents: 0,
             amountPatientCents: copayToApply.getAmount(),
             description: `Applied copay of ${copayToApply.getAmount()} cents`,
           });
        }

        if (amountToCover.getAmount() <= 0) {
            itemTraces.push(...traces);
            continue;
        }

        // 4. Coinsurance
        if (policy.rules.coinsurance < 100) {
          // Calculate what insurance covers
          const coinsuranceCovered = amountToCover.percentage(policy.rules.coinsurance);
          const coinsurancePatient = amountToCover.subtract(coinsuranceCovered);
          
          amountToCover = coinsuranceCovered;

          traces.push({
            rule: 'coinsurance',
            applied: true,
            amountCoveredCents: coinsuranceCovered.getAmount(),
            amountPatientCents: coinsurancePatient.getAmount(),
            description: `Applied coinsurance of ${policy.rules.coinsurance}%`,
          });
        }

        // 5. Caps
        if (policy.rules.capsCents?.perItem !== undefined) {
           const capItem = Dinero({ amount: policy.rules.capsCents.perItem, currency: 'USD' });
           if (amountToCover.greaterThan(capItem)) {
             const difference = amountToCover.subtract(capItem);
             amountToCover = capItem;
             traces.push({
               rule: 'cap',
               applied: true,
               amountCoveredCents: amountToCover.getAmount(),
               amountPatientCents: difference.getAmount(),
               description: `Per item cap of ${capItem.getAmount()} reached. Patient pays difference.`,
             });
           }
        }

        if (policy.rules.capsCents?.annual !== undefined) {
          const capAnnual = Dinero({ amount: policy.rules.capsCents.annual, currency: 'USD' });
          const spaceLeft = capAnnual.subtract(state.accumulatedAnnualCovered);

          if (spaceLeft.getAmount() <= 0) {
             const difference = amountToCover;
             amountToCover = Dinero({ amount: 0, currency: 'USD' });
             traces.push({
               rule: 'cap',
               applied: true,
               amountCoveredCents: 0,
               amountPatientCents: difference.getAmount(),
               description: `Annual cap reached.`,
             });
          } else if (amountToCover.greaterThan(spaceLeft)) {
             const difference = amountToCover.subtract(spaceLeft);
             amountToCover = spaceLeft;
             traces.push({
               rule: 'cap',
               applied: true,
               amountCoveredCents: amountToCover.getAmount(),
               amountPatientCents: difference.getAmount(),
               description: `Annual cap of ${capAnnual.getAmount()} reached. Patient pays difference.`,
             });
          }
        }

        // Apply final coverage
        state.accumulatedAnnualCovered = state.accumulatedAnnualCovered.add(amountToCover);
        itemTotalCovered = itemTotalCovered.add(amountToCover);
        currentPatientResponsibility = currentPatientResponsibility.subtract(amountToCover);
        
        // cascade info
        if (i < policies.length - 1 && currentPatientResponsibility.getAmount() > 0) {
           traces.push({
              rule: 'cascade',
              applied: true,
              amountCoveredCents: amountToCover.getAmount(),
              amountPatientCents: currentPatientResponsibility.getAmount(),
              description: `Policy ${policy.name} covered ${amountToCover.getAmount()}. Cascading remaining ${currentPatientResponsibility.getAmount()} to next policy.`,
           });
        }

        itemTraces.push(...traces);
      }

      const eobLine: EOBLineItem = {
        lineItemId: item.id,
        originalTotalCents: itemTotal.getAmount(),
        coveredCents: itemTotalCovered.getAmount(),
        patientResponsibilityCents: currentPatientResponsibility.getAmount(),
        traces: itemTraces,
      };

      eob.lines.push(eobLine);
      totalCovered = totalCovered.add(itemTotalCovered);
      totalPatientResponsibility = totalPatientResponsibility.add(currentPatientResponsibility);
    }

    eob.totalOriginalCents = totalOriginal.getAmount();
    eob.totalCoveredCents = totalCovered.getAmount();
    eob.totalPatientResponsibilityCents = totalPatientResponsibility.getAmount();

    return eob;
  }
}
