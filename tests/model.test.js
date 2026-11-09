'use strict';
const assert = require('node:assert/strict');
const { calculate, PUBLIC_DEFAULTS } = require('./model.js');
const approx=(actual,expected,tol=.01)=>assert.ok(Math.abs(actual-expected)<=tol,`Expected ${expected}±${tol}, got ${actual}`);
const test=(label,fn)=>{fn();console.log('PASS',label);};

test('public scenario: 40 cars and 80% utilization gives 11,520 annual rental days',()=>{
 const r=calculate(PUBLIC_DEFAULTS);approx(r.annualRentalDays,11520);approx(r.monthlyContracts,96);
 approx(r.internalRentalDaysAnnual,3456);approx(r.mpiRentalDaysAnnual,8064);
 approx(r.bodyShopRentalAnnual,86400);approx(r.ownedFleetMPIRevenueAnnual,0);
});
test('3-year compounded depreciation on $25k matches resale',()=>{
 const r=calculate(PUBLIC_DEFAULTS,3);approx(r.resalePerCar,25000*Math.pow(.99,36));
});
test('maintenance mode uses the midpoint rather than sum',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,externalMaintenanceMonthly:60,internalMaintenanceMonthly:40});
 approx(r.categories[2].annualPerCar,600);
});
test('personnel opportunity cost 20 of 40 hours at $45k',()=>{
 const r=calculate(PUBLIC_DEFAULTS);approx(r.personnelFleetAnnual,22500);approx(r.personnelPerCarYear,562.5);
});
test('changing internal share from 30% to 50% increases shop-paid days',()=>{
 const a=calculate({...PUBLIC_DEFAULTS,internalRentalPercent:30});
 const b=calculate({...PUBLIC_DEFAULTS,internalRentalPercent:50});
 approx(b.bodyShopRentalAnnual,a.grossEnterpriseAnnual*.5);
 approx(b.mpiRentalDaysAnnual,b.annualRentalDays*.5);
});
test('owned MPI receipts offset net owned cost, not the provider rental bill',()=>{
 const a=calculate({...PUBLIC_DEFAULTS,shopMPIRevenuePerDay:0});
 const b=calculate({...PUBLIC_DEFAULTS,shopMPIRevenuePerDay:10});
 approx(b.ownedFleetMPIRevenueAnnual,b.mpiRentalDaysAnnual*10);
 approx(b.ownershipNetAnnual,a.ownershipAnnual-b.ownedFleetMPIRevenueAnnual);
 approx(b.bodyShopRentalAnnual,a.bodyShopRentalAnnual);
});
test('contract length changes number of bookings not billable days',()=>{
 const a=calculate({...PUBLIC_DEFAULTS,averageRentalDays:10});
 const b=calculate({...PUBLIC_DEFAULTS,averageRentalDays:5});
 approx(b.monthlyContracts,2*a.monthlyContracts);approx(b.annualRentalDays,a.annualRentalDays);
});
test('zero vehicle replacement means zero rental bills',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,vehiclesReplaced:0});
 approx(r.annualRentalDays,0);approx(r.outsourcingAnnual,r.ownershipNetAnnual);
});
test('half fleet replaced means half fleet retained and retains MPI receipts',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,vehiclesReplaced:20,shopMPIRevenuePerDay:10});
 approx(r.retainedOwnedAnnual,r.ownershipAnnual/2);
 approx(r.retainedOwnedMPIRevenueAnnual,r.ownedFleetMPIRevenueAnnual/2);
});
test('itemized tax does not double-count monthly proxy',()=>{
 const r=calculate({...PUBLIC_DEFAULTS,taxesMode:'itemized',registrationAnnual:119,plateOneTime:7,dealerUseTaxMonthly:40,purchaseTaxPercent:0},3);
 approx(r.categories[1].annualPerCar,119+7/3+40*12);
});
test('scenario-mode retention is 70% after two years and 57% after four',()=>{
 approx(calculate(PUBLIC_DEFAULTS,2).resalePerCar,17500);
 approx(calculate(PUBLIC_DEFAULTS,4).resalePerCar,14250);
});
test('reciprocal contribution reduces remaining shortfall, not baseline rental days',()=>{
 const costly={...PUBLIC_DEFAULTS,internalRentalPercent:100,dailyRentalRate:60};
 const a=calculate(costly);const b=calculate({...costly,confirmedAnnualReciprocalProfit:10000});
 approx(b.netGap,a.netGap-10000);approx(b.requiredReciprocalRevenue,b.requiredReciprocalProfit/.25);
});
test('consistent monthly rate works across all holding periods',()=>{
 const d={...PUBLIC_DEFAULTS,depreciationMode:'monthly',monthlyDepreciationPercent:1};
 for(const y of [2,3,4])approx(calculate(d,y).resalePerCar,25000*Math.pow(.99,y*12));
});
console.log('All model tests passed.');