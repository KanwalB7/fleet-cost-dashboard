/* Browser-only interactive dashboard. Uses FleetModel (model.js). */
(function () {
  'use strict';
  const {PUBLIC_DEFAULTS, calculate, normalized} = window.FleetModel;
  const $ = id => document.getElementById(id);
  const CAD = new Intl.NumberFormat('en-CA', {style:'currency',currency:'CAD',maximumFractionDigits:0});
  const CAD2 = new Intl.NumberFormat('en-CA', {style:'currency',currency:'CAD',minimumFractionDigits:2,maximumFractionDigits:2});
  const NUM = new Intl.NumberFormat('en-CA', {maximumFractionDigits:1});
  const PCT = new Intl.NumberFormat('en-CA', {maximumFractionDigits:1});
  let scenario = {...PUBLIC_DEFAULTS};
  let importedWorkingScenario = false;

  const groups = [
    {title:'01  ·  Vehicles & resale',open:true,fields:[
      {key:'clientName',label:'Client / business name',type:'text'},
      {key:'providerName',label:'Rental provider',type:'text'},
      {key:'fleetSize',label:'Owned loaners in current fleet',min:1,max:300,step:1,slider:true,unit:'cars'},
      {key:'acquisitionPrice',label:'Vehicle purchase price',min:0,max:90000,step:500,unit:'CAD / car',slider:true},
      {key:'holdingYears',label:'Selected ownership holding period',min:1,max:10,step:1,unit:'years',help:'The active model; the comparison also shows years 2, 3 and 4.'},
      {key:'monthlyDepreciationPercent',label:'Monthly compounded depreciation',min:0,max:5,step:0.05,unit:'% / month',slider:true},
      {key:'resalePenaltyPercent',label:'Resale penalty from damage / wear',min:0,max:50,step:0.5,unit:'% of residual',help:'Reduces resale value. Do not also count the same value loss as repair costs.'}
    ]},
    {title:'02  ·  Taxes, plates & maintenance',open:true,fields:[
      {key:'taxesMode',label:'Taxes and licensing method',type:'select',options:[['proxy','Monthly proxy cost'],['itemized','Manitoba itemized scenario']],help:'Use one method at a time to avoid double counting.'},
      {key:'licenseProxyMonthly',label:'Monthly licence/tax proxy',min:0,max:500,step:.1,unit:'CAD / car',showIf:{key:'taxesMode',value:'proxy'},help:'An illustrative expense proxy; not verified all-in Manitoba coverage.'},
      {key:'registrationAnnual',label:'Annual registration',min:0,max:600,step:1,unit:'CAD / car',showIf:{key:'taxesMode',value:'itemized'}},
      {key:'plateOneTime',label:'One-time plate expense',min:0,max:300,step:1,unit:'CAD / car',showIf:{key:'taxesMode',value:'itemized'}},
      {key:'dealerUseTaxMonthly',label:'Qualifying dealer-use tax',min:0,max:500,step:1,unit:'CAD / car/month',showIf:{key:'taxesMode',value:'itemized'},help:'Only use if tax treatment is applicable and confirmed.'},
      {key:'purchaseTaxPercent',label:'Non-recoverable purchase tax',min:0,max:20,step:.5,unit:'%',showIf:{key:'taxesMode',value:'itemized'},help:'Amortized over selected hold. Keep 0 if dealer-use tax applies instead.'},
      {key:'otherTaxAnnual',label:'Other annual registration/tax',min:0,max:3000,step:10,unit:'CAD / car',showIf:{key:'taxesMode',value:'itemized'}},
      {key:'maintenanceMode',label:'Maintenance combining method',type:'select',options:[['average','Average external + internal (÷2)'],['sum','Sum external + internal'],['custom','Custom monthly estimate']],help:'Original working model deliberately averages the two expense lines rather than summing.'},
      {key:'externalMaintenanceMonthly',label:'External maintenance benchmark',min:0,max:1000,step:.01,unit:'CAD / car/month'},
      {key:'internalMaintenanceMonthly',label:'Internal maintenance benchmark',min:0,max:1000,step:.01,unit:'CAD / car/month'},
      {key:'customMaintenanceMonthly',label:'Custom maintenance amount',min:0,max:1000,step:1,unit:'CAD / car/month',showIf:{key:'maintenanceMode',value:'custom'}}
    ]},
    {title:'03  ·  Miscellaneous & risk',open:false,fields:[
      {key:'liabilityMonthly',label:'Liability / coverage expense proxy',min:0,max:500,step:.01,unit:'CAD / car/month'},
      {key:'miscellaneousMonthly',label:'Keys, towing & general miscellaneous',min:0,max:200,step:.01,unit:'CAD / car/month'},
      {key:'fuelMonthly',label:'Unrecovered fuel allowance',min:0,max:100,step:.5,unit:'CAD / car/month'},
      {key:'additionalInsuranceMonthly',label:'Additional vehicle insurance (if not above)',min:0,max:500,step:5,unit:'CAD / car/month',help:'Include only if not already covered by liability proxy; avoid double counting.'},
      {key:'damageAnnualPerCar',label:'Expected uninsured damage expense',min:0,max:5000,step:50,unit:'CAD / car/year',help:'Repairs and deductibles only. Resale penalty is entered separately.'},
      {key:'interestMonthly',label:'Financing interest proxy (optional)',min:0,max:500,step:1,unit:'CAD / car/month'},
      {key:'includeInterest',label:'Include financing interest in comparison',type:'checkbox',help:'Off by default, matching the supplied cost analysis.'},
      {key:'damageReserveMonthly',label:'Physical damage reserve (optional)',min:0,max:500,step:1,unit:'CAD / car/month'},
      {key:'includeDamageReserve',label:'Include damage reserve in comparison',type:'checkbox',help:'Off by default. A reserve is not necessarily an incurred cash expense.'}
    ]},
    {title:'04  ·  Employee time',open:false,fields:[
      {key:'annualSalary',label:'Full-time reference salary',min:0,max:200000,step:500,unit:'CAD / year'},
      {key:'personnelHoursWeekly',label:'Time managing loaners',min:0,max:100,step:1,unit:'hours / week'},
      {key:'fullTimeHoursWeekly',label:'Full-time reference workweek',min:1,max:80,step:1,unit:'hours / week'},
      {key:'additionalAnnualPersonnelCost',label:'Extra annual fleet staffing expense',min:0,max:200000,step:100,unit:'CAD / year',help:'Opportunity cost only unless actual hours are avoided or reallocated.'}
    ]},
    {title:'05  ·  Rental partner / deal',open:true,fields:[
      {key:'vehiclesReplaced',label:'Loaners replaced with rentals',min:0,max:300,step:1,unit:'vehicles',slider:true,help:'Can compare full replacement or a mixed fleet. Staffing costs assumed to scale proportionally.'},
      {key:'utilizationPercent',label:'Utilization of replacement rentals',min:0,max:100,step:1,unit:'%',slider:true},
      {key:'averageRentalDays',label:'Average rental contract duration',min:.25,max:90,step:.25,unit:'days'},
      {key:'daysPerMonth',label:'Commercial days per month',min:1,max:31,step:1,unit:'days'},
      {key:'dailyRentalRate',label:'Shop-paid internal daily rental rate',min:0,max:150,step:1,unit:'CAD / day',slider:true},
      {key:'targetEffectiveRate',label:'Target effective rental rate',min:0,max:150,step:1,unit:'CAD / day',help:'Shows the reciprocal contribution needed to bridge paper rate to target, not a discount already approved.'},
      {key:'internalRentalPercent',label:'Shop-paid internal rental share',min:0,max:100,step:1,unit:'% of replacement rental days',slider:true,help:'Base case: 30% shop-paid at the internal daily rate. Remaining 70% is assumed eligible for direct insurance reimbursement by the rental provider. The existing rentals handled by the current rental provider are excluded.'},
      {key:'shopInsuranceReimbursementPerDay',label:'Insurer reimbursement earned on OWN loaners',min:0,max:150,step:1,unit:'CAD / insurer-covered day',help:'Base case $0: the shop does not claim insurance reimbursement for its free owned loaners. Any amount entered reduces the original owned-fleet cost and applies to the owned vehicles it retains; it is NOT insurer reimbursement received by the shop after the rental provider takes over.'},
      {key:'onSiteMonthlyFee',label:'On-site counter cost to body shop',min:0,max:30000,step:50,unit:'CAD / month'},
      {key:'oneTimeTransitionCost',label:'One-time changeover cost',min:0,max:100000,step:500,unit:'CAD'},
      {key:'transitionYears',label:'Spread transition expense across',min:.1,max:10,step:.1,unit:'years'},
      {key:'annualRepairReferralProfit',label:'Verified repair-referral contribution profit',min:0,max:500000,step:500,unit:'CAD / year',help:'Enter incremental profit, NOT gross repair sales revenue. No assumed conversion margin is applied.'},
      {key:'annualBuybackContribution',label:'Vehicle buyback contribution profit',min:0,max:500000,step:500,unit:'CAD / year',help:'Incremental profit from buybacks; not the gross vehicle sales amount.'},
      {key:'annualOtherReciprocalContribution',label:'Other reciprocal contribution profit',min:0,max:500000,step:500,unit:'CAD / year'},
      {key:'confirmedAnnualReciprocalProfit',label:'Other verified manual contribution profit',min:0,max:500000,step:500,unit:'CAD / year',help:'Additional profit not included in repair referrals, buybacks or other reciprocal category. Avoid double counting.'}
    ]}
  ];

  function safe(s) {return String(s).replace(/[&<>"']/g, a => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[a]));}
  function money(n) {return CAD.format(n || 0);}
  function money2(n) {return CAD2.format(n || 0);}
  function signedMoney(n) {return n > 0.004 ? '+'+money(n) : n < -0.004 ? '−'+money(-n) : money(0);}
  function num(n) {return NUM.format(n || 0);}
  function pct(n) {return PCT.format(n || 0) + '%';}
  function stateInputValue(key) {return scenario[key] == null ? '' : scenario[key];}
  function fieldMarkup(f) {
    const id='input-'+f.key;
    const cond = f.showIf ? `data-show-key="${safe(f.showIf.key)}" data-show-value="${safe(f.showIf.value)}"` : '';
    let input = '';
    if(f.type==='select') {
      input=`<select id="${id}" data-key="${safe(f.key)}">${f.options.map(o=>`<option value="${safe(o[0])}" ${o[0]===scenario[f.key]?'selected':''}>${safe(o[1])}</option>`).join('')}</select>`;
    } else if(f.type==='checkbox') {
      input=`<label class="field-check"><input type="checkbox" id="${id}" data-key="${safe(f.key)}" ${scenario[f.key]?'checked':''}><span>${safe(f.label)}</span></label>`;
      return `<div class="field" ${cond}>${input}${f.help?`<div class="field-help">${safe(f.help)}</div>`:''}</div>`;
    } else if(f.type==='text') {
      input=`<input id="${id}" data-key="${safe(f.key)}" type="text" maxlength="90" value="${safe(stateInputValue(f.key))}">`;
    } else {
      input=`<input id="${id}" data-key="${safe(f.key)}" type="number" min="${f.min ?? 0}" max="${f.max ?? 100000000}" step="${f.step ?? 1}" value="${safe(stateInputValue(f.key))}">`;
      if(f.slider) input+=`<input type="range" aria-label="${safe(f.label)} slider" data-slider="${safe(f.key)}" min="${f.min}" max="${f.max}" step="${f.step}" value="${safe(Math.max(f.min, Math.min(f.max, Number(stateInputValue(f.key)))))}">`;
    }
    return `<div class="field" ${cond}><div class="field-main"><label class="field-label" for="${id}">${safe(f.label)}</label>${f.unit?`<span class="field-unit">${safe(f.unit)}</span>`:''}</div><div class="field-input">${input}</div>${f.help?`<div class="field-help">${safe(f.help)}</div>`:''}</div>`;
  }
  function renderControls() {
    const oldOpen = [...$('controlGroups').querySelectorAll('details')].map(d => d.open);
    $('controlGroups').innerHTML = groups.map((g,i)=>`<details ${oldOpen.length ? (oldOpen[i]?'open':'') : (g.open?'open':'')}><summary>${safe(g.title)}</summary><div class="controls-grid">${g.fields.map(fieldMarkup).join('')}</div></details>`).join('');
    $('controlGroups').querySelectorAll('[data-key]').forEach(node=>{
      node.addEventListener(node.type==='checkbox' || node.tagName==='SELECT'?'change':'input',()=>{
        const key=node.dataset.key;
        if(node.type==='checkbox') scenario[key] = node.checked;
        else if(node.type==='number') {if(node.value.trim()!=='' && Number.isFinite(Number(node.value))) scenario[key]=Number(node.value);}
        else scenario[key]=node.value;
        const sibling=$('controlGroups').querySelector(`[data-slider="${key}"]`);
        if(sibling && node.value!=='') sibling.value=node.value;
        updateConditionals();renderDashboard();
      });
    });
    $('controlGroups').querySelectorAll('[data-slider]').forEach(node=>node.addEventListener('input',()=>{
      const key=node.dataset.slider; scenario[key]=Number(node.value);
      const numberField=$('input-'+key);if(numberField)numberField.value=node.value;
      renderDashboard();
    }));
    updateConditionals();
  }
  function updateConditionals() {
    $('controlGroups').querySelectorAll('[data-show-key]').forEach(el => {
      el.classList.toggle('conditional-hidden',String(scenario[el.dataset.showKey]) !== el.dataset.showValue);
    });
    [...document.querySelectorAll('.year-preset button')].forEach(b=>b.classList.toggle('active', Number(b.dataset.year)===Number(scenario.holdingYears)));
    const maxReplaced=Math.max(0, Number(scenario.fleetSize));
    const inp=$('input-vehiclesReplaced'); if(inp) inp.max=maxReplaced;
    const slider=document.querySelector('[data-slider="vehiclesReplaced"]'); if(slider)slider.max=maxReplaced;
  }
  function donutSVG(result) {
    const total=result.ownershipAnnual;
    const r=105, circumference=2*Math.PI*r;
    let offset=0;
    const pieces=[`<circle cx="140" cy="140" r="105" stroke="#263737" stroke-width="22" fill="none"/>`];
    result.categories.forEach(c=>{
      const fraction=total>0 ? c.annualPerCar*result.input.fleetSize / total : 0;
      if (fraction>0) {
        const length=Math.max(0, fraction*circumference-2.1);
        pieces.push(`<circle cx="140" cy="140" r="105" stroke="${c.color}" stroke-width="22" fill="none" stroke-linecap="butt" stroke-dasharray="${length} ${circumference-length}" stroke-dashoffset="${-offset}"/>`);
        offset+=fraction*circumference;
      }
    });
    $('donutChart').innerHTML=pieces.join('');
    $('ownershipLegend').innerHTML=result.categories.map(c=>`<div class="legend-row"><span class="legend-label"><i class="swatch" style="background:${c.color}"></i>${safe(c.label)}</span><span class="legend-amount">${money(c.annualPerCar*result.input.fleetSize)}</span></div>`).join('');
  }
  function renderCompare(result) {
    const max=Math.max(1,result.ownershipNetAnnual,result.outsourcingAnnual);
    const rows=[{label:'Own all loaners (net of insurance receipts)',value:result.ownershipNetAnnual,kind:'owned'}, {label:`Rental plan + ${result.carsKept} retained`,value:result.outsourcingAnnual,kind:'rental'}];
    $('compareBars').innerHTML=rows.map(row=>`<div class="comp-row"><div class="comp-row-header"><span>${safe(row.label)}</span><strong>${money(row.value)}</strong></div><div class="comp-track"><div class="comp-fill ${row.kind}" style="width:${100*row.value/max}%"></div></div></div>`).join('');
    let narrative;
    if(result.savingsBeforeReciprocal >= 0){narrative=`<strong>${money(result.savingsBeforeReciprocal)} lower annual modeled cost</strong> for the rental arrangement before reciprocal business.`;}
    else narrative=`<strong>${money(-result.savingsBeforeReciprocal)} additional annual cost</strong> for the rental arrangement before reciprocal business. This gap must be addressed, not described as savings.`;
    $('compareInsight').innerHTML=narrative;
  }
  function renderHolding(result) {
    const years=[2,3,4], arr=years.map(y=>calculate(scenario,y));
    const max=Math.max(1,...arr.map(x=>x.ownershipNetAnnual));
    $('holdingChart').innerHTML=arr.map(x=>`<div class="hold-row ${x.years===result.years?'active':''}"><span class="hold-label">${x.years} YEARS</span><div class="hold-track"><div class="hold-fill" style="width:${x.ownershipNetAnnual/max*100}%"></div></div><strong class="hold-value">${money(x.ownershipNetAnnual)}</strong></div>`).join('');
    const note=`All holding periods use ${pct(result.input.monthlyDepreciationPercent)} compounded monthly depreciation over the applicable months. Other assumptions remain constant.`;
    document.querySelector('.small-note').textContent=note;
  }
  function renderTable(result) {
    const n=result.input.fleetSize;
    $('costTableBody').innerHTML=result.categories.map(c=>`<tr><td><span class="line-name"><span class="swatch" style="background:${c.color}"></span>${safe(c.label)}</span></td><td>${money2(c.annualPerCar/12)}</td><td>${money2(c.annualPerCar)}</td><td>${money(c.annualPerCar*n)}</td></tr>`).join('');
    $('costTableFoot').innerHTML=`<tr><td>GROSS OWNERSHIP COST</td><td>${money2(result.ownershipPerCarMonth)}</td><td>${money2(result.ownershipPerCarYear)}</td><td>${money(result.ownershipAnnual)}</td></tr><tr><td>Less: insurer payments on owned loaners</td><td>−${money2(result.ownedFleetInsuranceReceiptsAnnual / result.input.fleetSize / 12)}</td><td>−${money2(result.ownedFleetInsuranceReceiptsAnnual / result.input.fleetSize)}</td><td>−${money(result.ownedFleetInsuranceReceiptsAnnual)}</td></tr><tr><td>NET OWNERSHIP COST</td><td>${money2(result.ownershipNetAnnual/result.input.fleetSize/12)}</td><td>${money2(result.ownershipNetAnnual/result.input.fleetSize)}</td><td>${money(result.ownershipNetAnnual)}</td></tr>`;
    const d=result.input;
    $('taxesFineprint').textContent=d.taxesMode==='proxy'
      ? `Taxes & licensing are modeled at ${money2(d.licenseProxyMonthly)}/car/month. This proxy is not a verified, all-inclusive Manitoba insurance and registration quote.`
      : `Itemized Manitoba registration/tax assumptions are conditional on eligibility. Check actual insurance, purchase tax treatment and dealership status before presenting as factual costs.`;
  }
  function renderOperating(result) {
    const d=result.input;
    const stats=[
      ['REPLACED LOANERS',num(result.carsReplaced)],
      ['AVG. RENTALS ACTIVE',num(result.avgActiveRentals)],
      ['RENTAL DAYS / MONTH',num(result.monthlyRentalDays)],
      ['SHOP-PAID RENTAL DAYS / MONTH',num(result.internalRentalDaysMonthly)],
      ['INSURANCE-REIMBURSED DAYS / MONTH',num(result.insuranceRentalDaysMonthly)],
      ['INSURANCE RECEIPTS ON OWNED LOANERS',money(result.ownedFleetInsuranceReceiptsAnnual)],
      ['CONTRACTS / MONTH',num(result.monthlyContracts)],
      ['INITIAL VEHICLE CAPITAL',money(result.acquisitionTotal)],
      ['RESALE PROCEEDS / FLEET',money(result.resaleTotal)],
      ['AVG. CONTRACT VALUE',money(result.costPerTenDayContract)],
      ['EST. EMPLOYEE TIME / YEAR',money(result.personnelFleetAnnual)]
    ];
    $('operatingStats').innerHTML=stats.map(([label,val])=>`<div class="operating-stat"><span>${safe(label)}</span><strong>${safe(val)}</strong></div>`).join('');
    let t=`For ${num(d.fleetSize)} free loaners held ${result.years} years, net ownership costs ${money(result.ownershipNetAnnual)}/year. `;
    if(result.savingsAfterReciprocal < 0) t+=`The proposed rental arrangement needs ${money(-result.savingsAfterReciprocal)} more annual contribution or pricing relief to match ownership after the entered confirmed reciprocal profit.`;
    else t+=`The proposed rental arrangement is ${money(result.savingsAfterReciprocal)} below the modeled ownership cost after entered reciprocal profit.`;
    $('decisionSentence').textContent=t;
  }
  function renderDashboard(){
    const r=calculate(scenario), d=r.input;
    $('clientHeading').textContent=d.clientName || 'Fleet ownership';
    $('dashboardSubtitle').textContent=`${d.providerName || 'Rental partner'} · ${num(d.fleetSize)} free shop loaners: ${pct(d.internalRentalPercent)} shop-paid at ${money2(d.dailyRentalRate)}/day, ${pct(100-d.internalRentalPercent)} routed to insurance. Existing current-provider rentals excluded. CAD.`;
    $('holdBadge').textContent=`${r.years} YEAR${r.years===1?'':'S'}`;
    $('modeBadge').textContent=importedWorkingScenario?'Loaded local working case':'Illustrative public demo';
    $('kpiOwned').textContent=money(r.ownershipNetAnnual);
    $('kpiPerCar').textContent=money(r.ownershipNetAnnual / d.fleetSize);
    $('kpiResale').textContent=money(r.resalePerCar);
    $('kpiRetention').textContent=pct(100*r.resalePerCar/Math.max(1,d.acquisitionPrice));
    $('kpiRental').textContent=money(r.outsourcingAnnual);
    $('kpiRentalFoot').textContent=`${num(r.internalRentalDaysAnnual)} shop-paid days · ${num(r.insuranceRentalDaysAnnual)} insurer-reimbursed days`;
    // Show signed annual savings: positive is green, negative means added cost and is red.
    $('kpiGap').textContent=signedMoney(r.savingsBeforeReciprocal);
    $('kpiGapFoot').textContent=r.savingsBeforeReciprocal>0?'Savings vs. ownership':r.savingsBeforeReciprocal<0?'Additional cost vs. ownership':'Break-even before referrals';
    document.querySelector('.kpi-gap').dataset.trend=r.savingsBeforeReciprocal>0?'positive':r.savingsBeforeReciprocal<0?'negative':'neutral';
    $('costPerMonth').textContent=money2(r.ownershipPerCarMonth);
    $('donutTotal').textContent=money(r.ownershipAnnual);
    $('donutVehicleCount').textContent=`${num(d.fleetSize)} vehicles`;
    $('breakEvenRate').textContent=r.breakEvenRate==null?'N/A':money2(r.breakEvenRate);
    $('requiredProfit').textContent=money(r.requiredReciprocalProfit);
    $('requiredSales').textContent=signedMoney(r.savingsAfterReciprocal);
    $('confirmedProfitLabel').textContent=`Entered reciprocal profit: ${money(r.verifiedReciprocalProfit)}`;
    $('gapLabel').textContent=`Before referrals: ${signedMoney(r.savingsBeforeReciprocal)}`;
    const coverage=r.preReciprocalGap>0? Math.min(100,r.verifiedReciprocalProfit/r.preReciprocalGap*100):100;
    $('reciprocalProgress').firstElementChild.style.width=coverage+'%';
    $('dealInsight').textContent= r.requiredReciprocalProfit > 0
      ? `Still requires ${money(r.requiredReciprocalProfit)} in additional verified contribution profit—not gross sales—to close the modeled gap. Bridging the ${money2(d.dailyRentalRate)} paper rate to a ${money2(d.targetEffectiveRate)} effective target alone would require ${money(r.targetEffectiveRateGap)} of annual incremental value, which may not fully close the ownership gap.`
      : `No remaining contribution shortfall under the entered assumptions. A ${money2(d.targetEffectiveRate)} effective-rate target still requires contractual review; check operational risk separately.`;
    donutSVG(r);renderCompare(r);renderHolding(r);renderTable(r);renderOperating(r);
    updateConditionals();
  }
  function exportBlob(name,body,type){
    const blob=new Blob([body],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function status(msg){$('statusText').textContent=msg;}
  function csvEscape(v){const s=String(v??'');return '"'+s.replace(/"/g,'""')+'"';}
  function downloadCSV(){
    const r=calculate(scenario);const rows=[['Metric','Value','Units'],
      ['Client',r.input.clientName,''],['Provider',r.input.providerName,''],
      ['Fleet size',r.input.fleetSize,'cars'],['Vehicle acquisition cost',r.input.acquisitionPrice,'CAD/car'],
      ['Holding years',r.years,'years'],['Residual value per car',r.resalePerCar,'CAD/car'],
      ['Resale proceeds',r.resaleTotal,'CAD fleet'],['Capital depreciation / car / year',r.categories[0].annualPerCar,'CAD/car/year']];
    r.categories.forEach(c=>rows.push([c.label,c.annualPerCar,'CAD/car/year']));
    rows.push(['Owned fleet annual',r.ownershipAnnual,'CAD/year'],
      ['Owned cost per car annual',r.ownershipPerCarYear,'CAD/car/year'],
      ['Replaced loaners',r.carsReplaced,'cars'],
      ['Average active rentals',r.avgActiveRentals,'cars'],['Rental days per month',r.monthlyRentalDays,'days'],
      ['Rental contracts per month',r.monthlyContracts,'contracts'],
      ['All replacement days at shop internal rate (hypothetical)',r.grossEnterpriseAnnual,'CAD/year'],
      ['Shop invoice on internal rental days',r.bodyShopRentalAnnual,'CAD/year'],
      ['Annual contribution to bridge paper rate vs target',r.targetEffectiveRateGap,'CAD/year'],
      ['Rental arrangement annual shop cost',r.outsourcingAnnual,'CAD/year'],
      ['Pre-referral annual gap',r.preReciprocalGap,'CAD/year'],
      ['Verified repair-referral contribution profit',r.calculatedRepairContribution,'CAD/year'],
      ['Buyback profit',r.input.annualBuybackContribution,'CAD/year'],
      ['Verified annual reciprocal profit',r.verifiedReciprocalProfit,'CAD/year'],
      ['Remaining reciprocal contribution',r.requiredReciprocalProfit,'CAD/year'],
      ['Net benefit after reciprocal contribution',r.savingsAfterReciprocal,'CAD/year'],
      ['Break-even daily rate',r.breakEvenRate ?? 'N/A','CAD/day']);
    const txt='\ufeff'+rows.map(row=>row.map(csvEscape).join(',')).join('\r\n');
    exportBlob('fleet-cost-analysis.csv',txt,'text/csv;charset=utf-8');status('CSV exported');
  }
  function exportJSON(){
    exportBlob('fleet-working-scenario.json',JSON.stringify(scenario,null,2)+'\n','application/json');status('Scenario saved locally');
  }
  async function importJSON(file){
    if (!file)return;
    try {
      const raw=JSON.parse(await file.text());
      if (!raw || typeof raw!=='object'||Array.isArray(raw)) throw new Error('Expected a JSON object');
      const cfg=raw.scenario && typeof raw.scenario==='object' ? raw.scenario:raw;
      if(!Object.keys(PUBLIC_DEFAULTS).some(key=>Object.prototype.hasOwnProperty.call(cfg,key))) throw new Error('No recognized model assumptions found');
      scenario=normalized({...PUBLIC_DEFAULTS,...cfg});importedWorkingScenario=true;
      renderControls();renderDashboard();status('Working scenario loaded locally');
    } catch(e){alert('Could not load scenario JSON: '+e.message);status('Scenario import failed');}
    $('importScenario').value='';
  }
  function copySummary(){
    const r=calculate(scenario),d=r.input;
    const txt=[`${d.clientName} — ${r.years}-year fleet versus rental model`,
      `Fleet: ${d.fleetSize} × ${money(d.acquisitionPrice)}; resale ${money(r.resalePerCar)}/car`,
      `Owned fleet: gross ${money(r.ownershipAnnual)}/year; shop insurance receipts ${money(r.ownedFleetInsuranceReceiptsAnnual)}/year; net ${money(r.ownershipNetAnnual)}/year`,
      `Rental program shop cost: ${money(r.outsourcingAnnual)}/year; ${pct(d.internalRentalPercent)} internal at ${money2(d.dailyRentalRate)}/day; insurance-funded share ${pct(100-d.internalRentalPercent)}; utilization ${pct(d.utilizationPercent)}`,
      `Net financial benefit before referrals (positive = savings): ${signedMoney(r.savingsBeforeReciprocal)}/year`,
      `Already entered reciprocal contribution: ${money(r.verifiedReciprocalProfit)}/year`,
      `Still-required reciprocal contribution: ${money(r.requiredReciprocalProfit)}/year`,
      `Effective rate to break even: ${r.breakEvenRate==null?'N/A':money2(r.breakEvenRate)}/day`,
      `Note: direct insurance reimbursement of the non-internal share requires coverage approval; 20 preexisting current rental provider insurance rentals are excluded. Indicative costs, not audited actuals.`].join('\n');
    if(navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(()=>status('Summary copied')).catch(()=>fallbackCopy(txt));
    else fallbackCopy(txt);
  }
  function fallbackCopy(txt){ const area=document.createElement('textarea');area.value=txt;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();status('Summary copied'); }

  document.querySelectorAll('.year-preset button').forEach(b=>b.addEventListener('click',()=>{
    scenario.holdingYears=Number(b.dataset.year);
    const inp=$('input-holdingYears');if(inp)inp.value=scenario.holdingYears;
    renderDashboard();
  }));
  $('resetButton').addEventListener('click',()=>{if(!confirm('Reset to the public illustrative demo assumptions?'))return;
    scenario={...PUBLIC_DEFAULTS};importedWorkingScenario=false;renderControls();renderDashboard();status('Demo reset');});
  $('downloadCSV').addEventListener('click',downloadCSV);
  $('exportScenario').addEventListener('click',exportJSON);
  $('importScenario').addEventListener('change',e=>importJSON(e.target.files?.[0]));
  $('printButton').addEventListener('click',()=>window.print());
  $('copySummary').addEventListener('click',copySummary);
  $('presentationButton').addEventListener('click',()=>{
    document.querySelector('.app-shell').classList.toggle('presentation');
    $('presentationButton').title='Toggle controls (keyboard: P when not editing)';
    if(innerWidth>780)status(document.querySelector('.app-shell').classList.contains('presentation')?'Presentation view on':'Controls visible');
  });
  $('showControlsMobile').addEventListener('click',()=>$('sidebar').classList.add('mobile-open'));
  $('closeSidebar').addEventListener('click',()=>$('sidebar').classList.remove('mobile-open'));
  document.addEventListener('keydown',e=>{
    if(e.key.toLowerCase()==='p' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) $('presentationButton').click();
    if(e.key==='Escape') $('sidebar').classList.remove('mobile-open');
  });
  renderControls();renderDashboard();
})();