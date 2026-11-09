/* Fleet-versus-rental financial model. No external dependencies.
   Working-case values are intentionally NOT embedded in public website source.
   Amounts in CAD, with a 12 x daysPerMonth commercial-year assumption. */
(function (root) {
  'use strict';

  const PUBLIC_DEFAULTS = Object.freeze({
    title: 'Fleet ownership vs. rental',
    clientName: 'Example body shop',
    providerName: 'Rental partner',
    fleetSize: 40,
    acquisitionPrice: 25000,
    holdingYears: 3,
    monthlyDepreciationPercent: 1,
    resalePenaltyPercent: 0,
    taxesMode: 'proxy',
    licenseProxyMonthly: 6,
    registrationAnnual: 119,
    plateOneTime: 7,
    dealerUseTaxMonthly: 40,
    purchaseTaxPercent: 0,
    otherTaxAnnual: 0,
    externalMaintenanceMonthly: 55,
    internalMaintenanceMonthly: 35,
    maintenanceMode: 'average',
    customMaintenanceMonthly: 45,
    liabilityMonthly: 70,
    miscellaneousMonthly: 7,
    fuelMonthly: 3,
    additionalInsuranceMonthly: 0,
    damageAnnualPerCar: 0,
    interestMonthly: 0,
    includeInterest: false,
    damageReserveMonthly: 0,
    includeDamageReserve: false,
    annualSalary: 45000,
    personnelHoursWeekly: 20,
    fullTimeHoursWeekly: 40,
    additionalAnnualPersonnelCost: 0,
    vehiclesReplaced: 40,
    utilizationPercent: 80,
    averageRentalDays: 10,
    daysPerMonth: 30,
    dailyRentalRate: 35,
    targetEffectiveRate: 25,
    internalRentalPercent: 30,
    shopInsuranceReimbursementPerDay: 0,
    onSiteMonthlyFee: 0,
    oneTimeTransitionCost: 0,
    transitionYears: 1,
    annualRepairReferralProfit: 0,
    annualBuybackContribution: 0,
    annualOtherReciprocalContribution: 0,
    confirmedAnnualReciprocalProfit: 0
  });

  function number(x, fallback = 0) {
    const y = Number(x);
    return Number.isFinite(y) ? y : fallback;
  }
  function bound(x, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, number(x, minimum)));
  }
  const nonneg = x => Math.max(0, number(x));

  function normalized(data) {
    // Whitelist supported inputs, dropping removed legacy scenario settings.
    const d = {...PUBLIC_DEFAULTS};
    if (data && typeof data === 'object') {
      for (const key of Object.keys(PUBLIC_DEFAULTS)) {
        if (Object.prototype.hasOwnProperty.call(data, key)) d[key] = data[key];
      }
    }
    d.fleetSize = Math.max(1, Math.round(number(d.fleetSize, 40)));
    d.acquisitionPrice = nonneg(d.acquisitionPrice);
    d.holdingYears = bound(Math.round(number(d.holdingYears, 3)), 1, 10);
    d.monthlyDepreciationPercent = bound(d.monthlyDepreciationPercent, 0, 100);
    d.resalePenaltyPercent = bound(d.resalePenaltyPercent, 0, 100);
    d.vehiclesReplaced = bound(Math.round(number(d.vehiclesReplaced, 40)), 0, d.fleetSize);
    d.utilizationPercent = bound(d.utilizationPercent, 0, 100);
    d.internalRentalPercent = bound(d.internalRentalPercent, 0, 100);
    d.purchaseTaxPercent = bound(d.purchaseTaxPercent, 0, 100);
    d.daysPerMonth = bound(d.daysPerMonth, 1, 31);
    d.averageRentalDays = Math.max(0.25, number(d.averageRentalDays, 10));
    d.fullTimeHoursWeekly = Math.max(1, number(d.fullTimeHoursWeekly, 40));
    d.transitionYears = Math.max(0.1, number(d.transitionYears, 1));
    for (const key of [
      'licenseProxyMonthly','registrationAnnual','plateOneTime','dealerUseTaxMonthly',
      'otherTaxAnnual','externalMaintenanceMonthly','internalMaintenanceMonthly','customMaintenanceMonthly',
      'liabilityMonthly','miscellaneousMonthly','fuelMonthly','additionalInsuranceMonthly','damageAnnualPerCar',
      'interestMonthly','damageReserveMonthly','annualSalary','personnelHoursWeekly',
      'additionalAnnualPersonnelCost','dailyRentalRate','targetEffectiveRate','onSiteMonthlyFee','oneTimeTransitionCost',
      'confirmedAnnualReciprocalProfit','annualRepairReferralProfit','annualBuybackContribution','annualOtherReciprocalContribution',
      'shopInsuranceReimbursementPerDay'
    ]) d[key] = nonneg(d[key]);
    d.taxesMode = d.taxesMode === 'itemized' ? 'itemized' : 'proxy';
    if (!['average', 'sum', 'custom'].includes(d.maintenanceMode)) d.maintenanceMode = 'average';
    d.includeInterest = d.includeInterest === true;
    d.includeDamageReserve = d.includeDamageReserve === true;
    return d;
  }

  function retention(d, years) {
    return Math.pow(1 - d.monthlyDepreciationPercent / 100, years * 12);
  }

  function calculate(data, holdOverride) {
    const d = normalized(data);
    const years = holdOverride == null ? d.holdingYears : bound(Math.round(holdOverride), 1, 10);
    const residualBeforeDamage = d.acquisitionPrice * retention(d, years);
    const resalePerCar = residualBeforeDamage * (1 - d.resalePenaltyPercent / 100);
    const lifetimeDepreciationPerCar = Math.max(0, d.acquisitionPrice - resalePerCar);
    const depreciationPerCarYear = lifetimeDepreciationPerCar / years;
    const licensePerCarYear = d.taxesMode === 'proxy'
      ? d.licenseProxyMonthly * 12
      : (d.registrationAnnual + d.plateOneTime / years + d.dealerUseTaxMonthly * 12
          + (d.acquisitionPrice * d.purchaseTaxPercent / 100) / years + d.otherTaxAnnual);
    const maintenancePerCarMonth = d.maintenanceMode === 'average'
      ? (d.externalMaintenanceMonthly + d.internalMaintenanceMonthly) / 2
      : d.maintenanceMode === 'sum'
        ? d.externalMaintenanceMonthly + d.internalMaintenanceMonthly
        : d.customMaintenanceMonthly;
    const maintenancePerCarYear = maintenancePerCarMonth * 12;
    const miscellaneousPerCarYear = (
      d.liabilityMonthly + d.miscellaneousMonthly + d.fuelMonthly + d.additionalInsuranceMonthly
      + (d.includeInterest ? d.interestMonthly : 0)
      + (d.includeDamageReserve ? d.damageReserveMonthly : 0)
    ) * 12 + d.damageAnnualPerCar;
    const personnelFleetAnnual = d.annualSalary * d.personnelHoursWeekly / d.fullTimeHoursWeekly
      + d.additionalAnnualPersonnelCost;
    const personnelPerCarYear = personnelFleetAnnual / d.fleetSize;
    const categories = [
      {key:'depreciation', label:'Depreciation', annualPerCar:depreciationPerCarYear, color:'#78e3aa'},
      {key:'license', label:'Taxes & licence', annualPerCar:licensePerCarYear, color:'#90b5ee'},
      {key:'maintenance', label:'Maintenance', annualPerCar:maintenancePerCarYear, color:'#f4c77d'},
      {key:'misc', label:'Misc. + liability', annualPerCar:miscellaneousPerCarYear, color:'#dca6ec'},
      {key:'personnel', label:'Personnel', annualPerCar:personnelPerCarYear, color:'#f28d88'}
    ];
    const ownershipPerCarYear = categories.reduce((sum, x) => sum + x.annualPerCar, 0);
    const ownershipAnnual = ownershipPerCarYear * d.fleetSize;
    const carsReplaced = d.vehiclesReplaced;
    const carsKept = d.fleetSize - carsReplaced;
    const monthlyRentalDays = carsReplaced * d.utilizationPercent / 100 * d.daysPerMonth;
    const annualRentalDays = monthlyRentalDays * 12;
    const monthlyContracts = monthlyRentalDays / d.averageRentalDays;
    // Converted loaner days are split between insurer-reimbursed rentals\n    // and internal shop-paid rentals. Existing rentals from the current\n    // rental provider are outside this loaner replacement comparison.\n    // Insurer reimbursement entered for shop-owned vehicles applies only\n    // to the owned-fleet baseline and any retained owned vehicles.\n    const internalFraction = d.internalRentalPercent / 100;
    const insuranceFraction = 1 - internalFraction;
    const internalRentalDaysAnnual = annualRentalDays * internalFraction;
    const insuranceRentalDaysAnnual = annualRentalDays * insuranceFraction;
    const bodyShopRentalAnnual = internalRentalDaysAnnual * d.dailyRentalRate;
    // All-days equivalent is a reference calculation only, NOT actual\n    // provider invoicing: insurers may reimburse at a different rate.
    const allDaysRateEquivalentAnnual = annualRentalDays * d.dailyRentalRate;
    const ownedFleetInsuranceReceiptsAnnual = d.fleetSize * d.utilizationPercent / 100
      * d.daysPerMonth * 12 * insuranceFraction * d.shopInsuranceReimbursementPerDay;
    const retainedOwnedInsuranceReceiptsAnnual = carsKept * d.utilizationPercent / 100
      * d.daysPerMonth * 12 * insuranceFraction * d.shopInsuranceReimbursementPerDay;
    const ownershipNetAnnual = ownershipAnnual - ownedFleetInsuranceReceiptsAnnual;
    const onSiteAndTransitionAnnual = d.onSiteMonthlyFee * 12 + d.oneTimeTransitionCost / d.transitionYears;
    const retainedOwnedAnnual = ownershipPerCarYear * carsKept;
    const outsourcingAnnual = retainedOwnedAnnual - retainedOwnedInsuranceReceiptsAnnual
      + bodyShopRentalAnnual + onSiteAndTransitionAnnual;
    const preReciprocalGap = outsourcingAnnual - ownershipNetAnnual;
    // Repair referral input is verified incremental contribution profit, never gross sales.
    const calculatedRepairContribution = d.annualRepairReferralProfit;
    const verifiedReciprocalProfit = d.confirmedAnnualReciprocalProfit + calculatedRepairContribution
      + d.annualBuybackContribution + d.annualOtherReciprocalContribution;
    const netGap = preReciprocalGap - verifiedReciprocalProfit;
    const requiredReciprocalProfit = Math.max(0, netGap);
    const denominator = internalRentalDaysAnnual;
    const breakEvenRate = denominator > 0
      ? Math.max(0, (ownershipNetAnnual - retainedOwnedAnnual + retainedOwnedInsuranceReceiptsAnnual
          - onSiteAndTransitionAnnual + verifiedReciprocalProfit) / denominator)
      : null;
    const savingsBeforeReciprocal = ownershipNetAnnual - outsourcingAnnual;
    const savingsAfterReciprocal = -netGap;

    return {
      input:d, years,
      retentionPercent: retention(d, years) * 100,
      acquisitionTotal:d.acquisitionPrice * d.fleetSize,
      resalePerCar, resaleTotal:resalePerCar * d.fleetSize,
      lifetimeDepreciationPerCar, lifetimeDepreciationFleet:lifetimeDepreciationPerCar * d.fleetSize,
      categories, maintenancePerCarMonth,
      personnelFleetAnnual, personnelPerCarYear,
      ownershipPerCarYear, ownershipPerCarMonth:ownershipPerCarYear / 12,
      ownershipAnnual, ownershipMonthly:ownershipAnnual / 12,
      ownershipNetAnnual, ownedFleetInsuranceReceiptsAnnual, retainedOwnedInsuranceReceiptsAnnual,
      internalRentalPercent:d.internalRentalPercent, insuranceRentalPercent:100-d.internalRentalPercent,
      internalRentalDaysAnnual, insuranceRentalDaysAnnual,
      internalRentalDaysMonthly:internalRentalDaysAnnual / 12,
      insuranceRentalDaysMonthly:insuranceRentalDaysAnnual / 12,
      annualRentalDays, monthlyRentalDays, monthlyContracts, carsReplaced, carsKept,
      avgActiveRentals: carsReplaced * d.utilizationPercent / 100,
      allDaysRateEquivalentAnnual, bodyShopRentalAnnual,
      onSiteAndTransitionAnnual, retainedOwnedAnnual, outsourcingAnnual,
      preReciprocalGap, netGap, requiredReciprocalProfit,
      calculatedRepairContribution, verifiedReciprocalProfit,
      targetEffectiveRateGap: Math.max(0, d.dailyRentalRate - d.targetEffectiveRate) * internalRentalDaysAnnual,
      breakEvenRate, savingsBeforeReciprocal, savingsAfterReciprocal,
      costPerTenDayContract: d.dailyRentalRate * d.averageRentalDays,
      annualEquivalentRentals: monthlyContracts * 12
    };
  }

  const api = { PUBLIC_DEFAULTS, normalized, calculate, retention };
  root.FleetModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);