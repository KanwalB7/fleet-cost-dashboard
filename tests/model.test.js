'use strict';
const assert=require('node:assert/strict');
const {calculate,PUBLIC_DEFAULTS,normalized}=require('../model.js');
const approx=(a,b,tol=.01)=>assert.ok(Math.abs(a-b)<=tol,`Expected ${b} +/- ${tol}; got ${a}`);
const test=(name,fn)=>{fn();console.log('PASS',name);};
test('proposed $35 rate with 70% insurer-reimbursed and 30% shop-paid days',()=>{
 const r=calculate(PUBLIC_DEFAULTS);
 approx(PUBLIC_DEFAULTS.dailyRentalRate,35);approx(r.annualRentalDays,11520);
 approx(r.internalRentalDaysAnnual,3456);approx(r.insuranceRentalDaysAnnual,8064);
 approx(r.bodyShopRentalAnnual,120960);approx(r.monthlyContracts,96);
});
test('resale uses compounded monthly rate for every holding period',()=>{
 for(const y of [2,3,4,6])approx(calculate(PUBLIC_DEFAULTS,y).resalePerCar,25000*Math.pow(.99,y*12));
});
test('legacy retention and margin inputs are ignored on import',()=>{
 const legacy={...PUBLIC_DEFAULTS,depreciationMode:'reported',retention2Percent:70,retention4Percent:57,reciprocalMarginPercent:90,annualRepairReferralRevenue:999999};
 const v=normalized(legacy);
 for(const k of ['depreciationMode','retention2Percent','retention4Percent','reciprocalMarginPercent','annualRepairReferralRevenue']) assert.equal(k in v,false);
 approx(calculate(legacy,2).resalePerCar,25000*Math.pow(.99,24));
});
test('maintenance averages external and internal',()=>{
 approx(calculate({...PUBLIC_DEFAULTS,externalMaintenanceMonthly:56.98,internalMaintenanceMonthly:36.28}).categories[2].annualPerCar,559.56);
});
test('personnel allocation based on 20 hours of a 40-hour week',()=>{
 const r=calculate(PUBLIC_DEFAULTS);approx(r.personnelFleetAnnual,22500);approx(r.personnelPerCarYear,562.5);
});
test('insurer receipts on shop-owned loaners reduce net ownership cost',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,shopInsuranceReimbursementPerDay:10});
 approx(r.ownedFleetInsuranceReceiptsAnnual,r.insuranceRentalDaysAnnual*10);
 approx(r.ownershipNetAnnual,r.ownershipAnnual-r.ownedFleetInsuranceReceiptsAnnual);
});
test('internal rental mix changes shop cost proportionally',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,internalRentalPercent:50});
 approx(r.bodyShopRentalAnnual,11520*.5*35);
 approx(r.insuranceRentalDaysAnnual,11520*.5);
});
test('referral input is direct incremental profit, without sales margin',()=>{
 const a=calculate({...PUBLIC_DEFAULTS,annualRepairReferralProfit:0});
 const b=calculate({...PUBLIC_DEFAULTS,annualRepairReferralProfit:12000});
 approx(b.calculatedRepairContribution,12000);approx(b.netGap,a.netGap-12000);
 assert.equal('requiredReciprocalRevenue' in b,false);
});
test('annual benefit can be positive or negative',()=>{
 assert.ok(calculate(PUBLIC_DEFAULTS).savingsBeforeReciprocal>0);
 assert.ok(calculate({...PUBLIC_DEFAULTS,internalRentalPercent:100,dailyRentalRate:80}).savingsBeforeReciprocal<0);
});
test('contract duration changes bookings, not rental days',()=>{
 const a=calculate({...PUBLIC_DEFAULTS,averageRentalDays:10});
 const b=calculate({...PUBLIC_DEFAULTS,averageRentalDays:5});
 approx(b.monthlyContracts,2*a.monthlyContracts);approx(b.annualRentalDays,a.annualRentalDays);
});
test('zero vehicles converted means no new rental days',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,vehiclesReplaced:0});
 approx(r.outsourcingAnnual,r.ownershipNetAnnual);approx(r.annualRentalDays,0);
});
test('partial conversion keeps its remaining owned-fleet expenses',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,vehiclesReplaced:20});
 approx(r.retainedOwnedAnnual,r.ownershipAnnual/2);
});
test('itemized Manitoba scenario includes registration, plates and dealer-use tax',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,taxesMode:'itemized',registrationAnnual:119,plateOneTime:7,dealerUseTaxMonthly:40,purchaseTaxPercent:0},3);
 approx(r.categories[1].annualPerCar,119+7/3+480);
});
console.log('All financial model tests passed.');
