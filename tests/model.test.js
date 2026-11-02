'use strict';
const assert = require('node:assert/strict');
const { calculate, PUBLIC_DEFAULTS } = require('../model.js');
const approx=(actual,expected,tol=.01)=>assert.ok(Math.abs(actual-expected)<=tol,`Expected ${expected}±${tol}, got ${actual}`);
const test=(label,fn)=>{fn();console.log('PASS',label);};

test('public scenario: 40 cars, 80% at $35/day produces 11,520 days and $403,200/year',()=>{
 const r=calculate(PUBLIC_DEFAULTS);approx(r.annualRentalDays,11520);approx(r.bodyShopRentalAnnual,403200);approx(r.monthlyContracts,96);
});
test('3-year 1% compounding on 25k gives expected resale',()=>{
 const r=calculate(PUBLIC_DEFAULTS,3);approx(r.resalePerCar,25000*Math.pow(.99,36));
});
test('maintenance average is midpoint rather than sum',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,externalMaintenanceMonthly:60,internalMaintenanceMonthly:40});
 approx(r.categories[2].annualPerCar,600);
});
test('personnel opportunity cost based on 20 of 40 hours at 45k salary',()=>{
 const r=calculate(PUBLIC_DEFAULTS);approx(r.personnelFleetAnnual,22500);approx(r.personnelPerCarYear,562.5);
});
test('third-party payments reduce shop costs (but not gross invoice)',()=>{
 const a=calculate({...PUBLIC_DEFAULTS,thirdPartyPaidPercent:0});
 const b=calculate({...PUBLIC_DEFAULTS,thirdPartyPaidPercent:50});
 approx(b.grossEnterpriseAnnual,a.grossEnterpriseAnnual);
 approx(b.bodyShopRentalAnnual,a.bodyShopRentalAnnual/2);
});
test('contract length changes turnover, not billable days',()=>{
 const a=calculate({...PUBLIC_DEFAULTS,averageRentalDays:10});
 const b=calculate({...PUBLIC_DEFAULTS,averageRentalDays:5});
 approx(b.monthlyContracts,2*a.monthlyContracts);approx(b.annualRentalDays,a.annualRentalDays);
});
test('zero vehicle replacement means zero rental bills',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,vehiclesReplaced:0});
 approx(r.annualRentalDays,0);approx(r.outsourcingAnnual,r.ownershipAnnual);
});
test('half fleet replaced: other half ownership is retained',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,vehiclesReplaced:20});
 approx(r.retainedOwnedAnnual,r.ownershipAnnual/2);
});
test('annual itemized tax not double-counted against proxy',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,taxesMode:'itemized',registrationAnnual:119,plateOneTime:7,dealerUseTaxMonthly:40,purchaseTaxPercent:0},3);
 approx(r.categories[1].annualPerCar,119+7/3+40*12);
});
test('scenario-mode retention 2-year 70%, 4-year 57%',()=>{
 approx(calculate(PUBLIC_DEFAULTS,2).resalePerCar,17500);
 approx(calculate(PUBLIC_DEFAULTS,4).resalePerCar,14250);
});
test('reciprocal contribution applied as profit rather than revenue',()=>{
 const a=calculate(PUBLIC_DEFAULTS);const b=calculate({...PUBLIC_DEFAULTS,confirmedAnnualReciprocalProfit:10000});
 approx(b.netGap,a.netGap-10000);approx(b.requiredReciprocalRevenue,(b.requiredReciprocalProfit/.25));
});
test('all hold periods can use a consistent monthly depreciation rate',()=>{
 const d={...PUBLIC_DEFAULTS,depreciationMode:'monthly',monthlyDepreciationPercent:1};
 for(const y of [2,3,4])approx(calculate(d,y).resalePerCar,25000*Math.pow(.99,y*12));
});
console.log('All model tests passed.');
