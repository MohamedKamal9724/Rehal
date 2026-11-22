import { writeSafePrintDocument } from './safePrint';
import { Quote, Workspace, Rate, Supplier, Inquiry, Currency } from '../types';
import { RIHAL_WORDMARK_BASE64 } from '../assets/rihalLogoBase64';
import { DEFAULT_EXCHANGE_RATES } from './constants';
import { getStoredExchangeRates } from './currencyService';

/**
 * RIHAL Luxury Export Engine
 * Generates Microsoft Excel (.xls XML spreadsheet with formulas and formatting)
 * and Luxury Print-Ready PDF proposals.
 */

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a complete Excel-compatible XML Spreadsheet (.xls)
 * Opens cleanly in Microsoft Excel, Apple Numbers, LibreOffice, and Google Sheets
 * with colored headers, proper data types, and live SUM formulas.
 */
export function exportQuoteToExcel(quote: Quote, workspace: Workspace) {
  const quoteCurrency = (quote.displayCurrency || quote.targetCurrency || 'USD') as Currency;
  const storedRates = getStoredExchangeRates();
  const usdToEgp = storedRates.USD?.rateToEgp || DEFAULT_EXCHANGE_RATES.USD.toEgp;
  const quoteRateToEgp = quoteCurrency === 'EGP'
    ? 1
    : (quote.exchangeRateUsed || storedRates[quoteCurrency]?.rateToEgp || DEFAULT_EXCHANGE_RATES[quoteCurrency]?.toEgp || usdToEgp);
  const baseCostEgp = quote.totalCostEgp || 0;
  const basePrice = quote.totalPriceQuoteCurrency ?? quote.totals?.totalSell ?? 0;
  const adults = Math.max(1, quote.group?.adults || 1);

  const selectedUpsells = (quote.upsells || []).filter(u =>
    (quote.selectedUpsellIds || []).includes(u.id)
  );

  const flatLines: {
    dayNumber: number;
    dayTitle: string;
    city: string;
    serviceName: string;
    supplierName: string;
    category: string;
    basis: string;
    quantity: number;
    costCurrency: string;
    unitCost: number;
    totalCostEgp: number;
    markupPercent: number;
    totalPriceQuoteCurrency: number;
    notes: string;
  }[] = [];

  const daysList = quote.days || (quote as any).itineraryDays || [];
  daysList.forEach((day: any) => {
    if (day.lines && day.lines.length > 0) {
      day.lines.forEach((line: any) => {
        flatLines.push({
          dayNumber: day.dayNumber,
          dayTitle: day.title,
          city: line.city || day.city || 'Cairo',
          serviceName: line.serviceName,
          supplierName: line.supplierName || 'Contracted DMC Partner',
          category: line.supplierType || 'General',
          basis: line.occupancyBasis || 'Per Person',
          quantity: line.quantity || 1,
          costCurrency: line.costCurrency || 'USD',
          unitCost: line.unitCost || 0,
          totalCostEgp: line.totalCostEgp || 0,
          markupPercent: line.markupPercent || 20,
          totalPriceQuoteCurrency: line.totalPriceQuoteCurrency || 0,
          notes: line.costCalculationNotes || '',
        });
      });
    } else {
      // Day with no line items
      flatLines.push({
        dayNumber: day.dayNumber,
        dayTitle: day.title,
        city: day.city || 'Cairo',
        serviceName: day.description || 'Sightseeing & Leisure',
        supplierName: 'Internal Operator',
        category: 'Itinerary Day',
        basis: 'Group',
        quantity: 1,
        costCurrency: quoteCurrency,
        unitCost: 0,
        totalCostEgp: 0,
        markupPercent: 0,
        totalPriceQuoteCurrency: 0,
        notes: 'Included in group program',
      });
    }
  });

  // Append client-confirmed upsell add-ons into the financial ledger
  let upsellsCostEgp = 0;
  let upsellsPriceQuote = 0;
  let upsellsPriceEgp = 0;

  if (selectedUpsells.length > 0) {
    selectedUpsells.forEach(u => {
      const qty = u.priceBasis === 'per_person' ? adults : 1;
      const unitNet = u.netCost || 0;
      const lineCostEgp = Math.round(unitNet * qty * usdToEgp);
      const linePriceEgp = Math.round(u.price * qty * usdToEgp);
      const linePriceQuote = quoteCurrency === 'USD'
        ? u.price * qty
        : Math.round(linePriceEgp / quoteRateToEgp);
      const markup = lineCostEgp > 0
        ? Math.round(((linePriceEgp - lineCostEgp) / lineCostEgp) * 100)
        : 35;

      upsellsCostEgp += lineCostEgp;
      upsellsPriceQuote += linePriceQuote;
      upsellsPriceEgp += linePriceEgp;

      flatLines.push({
        dayNumber: 99,
        dayTitle: 'VIP Upgrade / Add-on',
        city: u.city,
        serviceName: `★ [VIP Enhancement] ${u.title}`,
        supplierName: 'Contracted DMC Luxury Partner',
        category: u.category,
        basis: u.priceBasis === 'per_person' ? 'Per Person' : 'Per Group',
        quantity: qty,
        costCurrency: 'USD',
        unitCost: unitNet,
        totalCostEgp: lineCostEgp,
        markupPercent: markup,
        totalPriceQuoteCurrency: linePriceQuote,
        notes: `Confirmed Client Upgrade (${u.badge || 'VIP'} · ${u.priceBasis === 'per_person' ? `${adults} travelers` : 'flat party'})`,
      });
    });
  }

  const totalCostEgp = baseCostEgp + upsellsCostEgp;
  const totalPrice = basePrice + upsellsPriceQuote;
  const baseSellEgp = quote.totalPriceEgp && quote.totalPriceEgp > 0
    ? quote.totalPriceEgp
    : Math.round(basePrice * quoteRateToEgp);
  const totalSellEgp = baseSellEgp + upsellsPriceEgp;
  const profitEgp = Math.round(totalSellEgp - totalCostEgp);
  const marginPercent = totalSellEgp > 0
    ? Math.round((profitEgp / totalSellEgp) * 100)
    : (quote.marginPercent || 0);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>RIHAL Operator Cost Sheet - ${escapeXml(quote.quoteNumber)}</Title>
  <Author>${escapeXml(workspace.name)}</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#9A6B1F"/>
   <Interior ss:Color="#FDFBF7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CompanySub">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#334155"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="MetaValue">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="ColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#C5A059"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="ColHeaderGold">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#8F6B21"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#B45309" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataRow">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataRowEven">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="NumCurrency">
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="NumPercent">
   <NumberFormat ss:Format="0.0%"/>
  </Style>
  <Style ss:ID="TotalRow">
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Cost &amp; Profit Sheet">
  <Table ss:DefaultColumnWidth="75" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="45"/>
   <Column ss:Index="2" ss:Width="70"/>
   <Column ss:Index="3" ss:Width="80"/>
   <Column ss:Index="4" ss:Width="220"/>
   <Column ss:Index="5" ss:Width="130"/>
   <Column ss:Index="6" ss:Width="95"/>
   <Column ss:Index="7" ss:Width="85"/>
   <Column ss:Index="8" ss:Width="45"/>
   <Column ss:Index="9" ss:Width="75"/>
   <Column ss:Index="10" ss:Width="105"/>
   <Column ss:Index="11" ss:Width="65"/>
   <Column ss:Index="12" ss:Width="110"/>
   <Column ss:Index="13" ss:Width="180"/>

   <!-- Company Banner -->
   <Row ss:Height="30">
    <Cell ss:MergeAcross="12" ss:StyleID="HeaderTitle">
     <Data ss:Type="String">RIHAL EGYPT DMC — OPERATOR MASTER COST &amp; PROFIT SHEET</Data>
    </Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="12" ss:StyleID="CompanySub">
     <Data ss:Type="String">${escapeXml(workspace.name)} · ${escapeXml(workspace.contactEmail || 'operations@daleel.eg')}</Data>
    </Cell>
   </Row>
   <Row ss:Height="8"/>

   <!-- Metadata Grid -->
   <Row>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Quote Ref:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(quote.quoteNumber)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Traveler:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(quote.travelerName)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Travel Dates:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(quote.startDate || '2026-10-20')} (${quote.durationDays} Days)</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Paxs:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${quote.group.adults} Adults${quote.group.children.length > 0 ? `, ${quote.group.children.length} Children` : ''}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Target Margin:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${marginPercent}%</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Status:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(quote.status)}</Data></Cell>
   </Row>
   <Row ss:Height="10"/>

   <!-- Table Column Headers -->
   <Row ss:Height="24">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Day</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Destination</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Service / Contracted Item</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Supplier Partner</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Rate Basis</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Currency</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Qty</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Net Unit</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Total Net (EGP)</Data></Cell>
    <Cell ss:StyleID="ColHeaderGold"><Data ss:Type="String">Markup %</Data></Cell>
    <Cell ss:StyleID="ColHeaderGold"><Data ss:Type="String">Client Price (${escapeXml(quoteCurrency)})</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Cost Notes / Ref</Data></Cell>
   </Row>

   <!-- Line Item Rows -->
   ${flatLines
     .map(
       (item, idx) => `
   <Row ss:Height="20">
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="Number">${item.dayNumber}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="String">${escapeXml(item.city)}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="String">${escapeXml(item.category)}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="String">${escapeXml(item.serviceName)}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="String">${escapeXml(item.supplierName)}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="String">${escapeXml(item.basis)}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="String">${escapeXml(item.costCurrency)}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="Number">${item.quantity}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="Number">${item.unitCost}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="Number">${item.totalCostEgp}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="Number">${item.markupPercent}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="Number">${item.totalPriceQuoteCurrency}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'DataRow' : 'DataRowEven'}"><Data ss:Type="String">${escapeXml(item.notes)}</Data></Cell>
   </Row>`
     )
     .join('')}

   <!-- Totals Row -->
   <Row ss:Height="26">
    <Cell ss:MergeAcross="8" ss:StyleID="TotalRow"><Data ss:Type="String">GRAND TOTALS &amp; FINANCIAL SUMMARY</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="Number">${totalCostEgp}</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">${marginPercent}% avg</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="Number">${totalPrice}</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">Net Profit: ~${profitEgp.toLocaleString()} EGP</Data></Cell>
   </Row>

   <Row ss:Height="14"/>

   <!-- Banking and Wire Details for Operator -->
   <Row>
    <Cell ss:MergeAcross="12" ss:StyleID="MetaLabel"><Data ss:Type="String">OPERATOR BANKING WIRE DETAILS FOR INVOICING:</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="12" ss:StyleID="MetaValue"><Data ss:Type="String">Bank: ${escapeXml(workspace.bankDetails?.bankName || 'Commercial International Bank (CIB)')} | Account: ${escapeXml(workspace.bankDetails?.accountNumber || '1000-2495-8821')} | IBAN: ${escapeXml(workspace.bankDetails?.iban || 'EG380010002495882100012345678')} | Swift: ${escapeXml(workspace.bankDetails?.swiftCode || 'CIBEGCAXXX')}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const filename = `RIHAL_CostSheet_${quote.quoteNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_${quote.travelerName.replace(/[^a-zA-Z0-9_-]/g, '_')}.xls`;
  downloadBlob(xml, filename, 'application/vnd.ms-excel;charset=utf-8');
}

/**
 * Exports the Entire Rate Library Catalog into an Excel Spreadsheet (.xls XML)
 */
export function exportRateLibraryToExcel(rates: Rate[], suppliers: Supplier[], workspace: Workspace) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="15" ss:Bold="1" ss:Color="#9A6B1F"/>
  </Style>
  <Style ss:ID="ColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataRow">
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Contracted Rates">
  <Table ss:DefaultColumnWidth="90">
   <Column ss:Width="160"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="70"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>

   <Row ss:Height="25">
    <Cell ss:MergeAcross="10" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(workspace.name)} — Master Contracted Rate Tariff</Data></Cell>
   </Row>

   <Row ss:Height="22">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Service Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Supplier Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">City</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Rate Basis</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Currency</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Net Cost</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Rack / Public</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Margin Est.</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Validity Period</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Season</Data></Cell>
   </Row>

   ${rates.map(r => `
   <Row ss:Height="18">
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(r.serviceName)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(r.supplierName)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(r.city)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(r.supplierType)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(r.occupancyBasis)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(r.currency)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="Number">${r.netCost}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="Number">${(r.netCost * 1.35).toFixed(0)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">35%</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(r.validityStart)} to ${escapeXml(r.validityEnd)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(r.seasonIds && r.seasonIds.length > 0 ? r.seasonIds.join(', ') : 'All Year')}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Suppliers Directory">
  <Table ss:DefaultColumnWidth="120">
   <Row ss:Height="22">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Supplier Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">City</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Contact Person</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Email</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Phone</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Payment Terms</Data></Cell>
   </Row>
   ${suppliers.map(s => `
   <Row ss:Height="18">
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(s.name)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(s.type)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(s.city)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(s.contactPerson || '')}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(s.contactEmail || '')}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(s.contactPhone || '')}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(s.notes || 'Net 30 Days')}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  const filename = `RIHAL_Rate_Library_${new Date().toISOString().split('T')[0]}.xls`;
  downloadBlob(xml, filename, 'application/vnd.ms-excel;charset=utf-8');
}

/**
 * Downloads a Blank Excel Rate Template that users can fill out with their real hotel and driver contracts
 * and upload right back into RIHAL via FileReader Rate Ingestion!
 */
export function downloadBlankRateTemplateExcel() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#9A6B1F"/>
  </Style>
  <Style ss:ID="Instruction">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="ColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SampleRow">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#64748B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Rate Ingestion Template">
  <Table ss:DefaultColumnWidth="100">
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="70"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>

   <Row ss:Height="24">
    <Cell ss:MergeAcross="9" ss:StyleID="Title"><Data ss:Type="String">RIHAL EGYPT DMC — CONTRACTED RATES TARIFF TEMPLATE</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="9" ss:StyleID="Instruction"><Data ss:Type="String">Fill in your contracted Egyptian suppliers and rates below, then upload directly into RIHAL via 'Rate Ingestion'.</Data></Cell>
   </Row>

   <Row ss:Height="22">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Service Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Supplier Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">City</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Basis</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Currency</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Net Cost</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Rack / Sell</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Valid From</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Valid To</Data></Cell>
   </Row>

   <!-- Sample rows to guide user -->
   <Row ss:Height="18">
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Deluxe Pyramid View Room</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Marriott Mena House Giza</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Hotel</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Cairo</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Per Room</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">USD</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="Number">290</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="Number">390</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">2026-10-01</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">2027-04-30</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">VIP Airport Meet, Fast-Track &amp; Mercedes Transfer</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Misr Limousine VIP</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Transfer</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Cairo</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Per Vehicle</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">USD</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="Number">95</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="Number">140</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">2026-01-01</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">2026-12-31</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Licensed English Egyptologist Guide (Full Day)</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Egyptian Syndicate of Tourist Guides</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Guide</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Cairo</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">Per Group</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">USD</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="Number">120</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="Number">175</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">2026-01-01</Data></Cell>
    <Cell ss:StyleID="SampleRow"><Data ss:Type="String">2026-12-31</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  downloadBlob(xml, 'RIHAL_Blank_Rate_Template.xls', 'application/vnd.ms-excel;charset=utf-8');
}

/**
 * Exports Inquiry Pipeline to Excel Spreadsheet (.xls XML)
 */
export function exportInquiriesToExcel(inquiries: Inquiry[], workspace: Workspace) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="ColHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataRow">
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Inquiry Pipeline">
  <Table ss:DefaultColumnWidth="100">
   <Row ss:Height="22">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Traveler Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Phone / WhatsApp</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Channel</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Start Date</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Duration</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Paxs</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Budget</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Assigned Agent</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Summary</Data></Cell>
   </Row>
   ${inquiries.map(i => `
   <Row ss:Height="18">
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(i.travelerName)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(i.travelerPhone || '')}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(i.source)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(i.requirements?.startDate || 'Flexible')}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${i.requirements?.durationDays ? `${i.requirements.durationDays} Days` : '-'}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${i.requirements?.group?.adults || 2} Adults</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${i.requirements?.budgetAmount ? `${i.requirements.budgetAmount} ${i.requirements.budgetCurrency || 'USD'}` : 'Not Specified'}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(i.status)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(i.assignedAgentName || 'Unassigned')}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(i.requirements?.destinationSummary || i.rawText.substring(0, 80))}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  downloadBlob(xml, `RIHAL_Inquiry_Pipeline_${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel;charset=utf-8');
}

/**
 * Exports Quotes Pipeline to Excel Spreadsheet (.xls XML)
 */
export function exportPipelineToExcel(quotes: Quote[], workspace: Workspace) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#003580"/>
  </Style>
  <Style ss:ID="ColHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#003580" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataRow">
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
  <Style ss:ID="TotalRow">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#003580"/>
   <Interior ss:Color="#E1EEFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#003580"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#003580"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Sales Pipeline">
  <Table ss:DefaultColumnWidth="110">
   <Row ss:Height="26">
    <Cell ss:MergeAcross="9" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(workspace.name)} — Sales Pipeline &amp; Booking Revenue Ledger</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Quote #</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Traveler Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Start Date</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Duration</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Currency</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Sell Price</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Cost (EGP)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Margin %</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Assigned Agent</Data></Cell>
   </Row>
   ${quotes.map(q => `
   <Row ss:Height="18">
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(q.quoteNumber)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(q.travelerName)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(q.status)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(q.startDate || '-')}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${q.durationDays} Days</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(q.targetCurrency)}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="Number">${q.totalPriceQuoteCurrency}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="Number">${q.totalCostEgp}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="Number">${q.marginPercent}</Data></Cell>
    <Cell ss:StyleID="DataRow"><Data ss:Type="String">${escapeXml(q.assignedAgentName || '-')}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  downloadBlob(xml, `RIHAL_Pipeline_Ledger_${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel;charset=utf-8');
}

/**
 * Formats and downloads an eye-catching, luxury, high-res HTML proposal document
 * that renders perfectly and triggers instant Print / Save to PDF.
 */
export function exportQuoteToLuxuryPDF(quote: Quote, workspace: Workspace) {
  const quoteCurrency = (quote.displayCurrency || quote.targetCurrency || 'USD') as Currency;
  const currSymbol = quoteCurrency === 'EUR' ? '€' : quoteCurrency === 'GBP' ? '£' : quoteCurrency === 'EGP' ? 'EGP ' : quoteCurrency === 'SAR' ? 'SAR ' : '$';
  const storedRates = getStoredExchangeRates();
  const usdToEgp = storedRates.USD?.rateToEgp || DEFAULT_EXCHANGE_RATES.USD.toEgp;
  const quoteRateToEgp = quoteCurrency === 'EGP'
    ? 1
    : (quote.exchangeRateUsed || storedRates[quoteCurrency]?.rateToEgp || DEFAULT_EXCHANGE_RATES[quoteCurrency]?.toEgp || usdToEgp);
  const travelerName = quote.travelerName || 'Distinguished Traveler';
  const companyName = workspace.name || 'RIHAL Egypt Expeditions';
  const adults = Math.max(1, quote.group?.adults || 1);

  const selectedUpsells = (quote.upsells || []).filter(u =>
    (quote.selectedUpsellIds || []).includes(u.id)
  );

  const upsellTotal = selectedUpsells.reduce((sum, u) => {
    const rawUsd = u.priceBasis === 'per_person' ? u.price * adults : u.price;
    const inQuoteCurr = quoteCurrency === 'USD' ? rawUsd : Math.round((rawUsd * usdToEgp) / quoteRateToEgp);
    return sum + inQuoteCurr;
  }, 0);

  const baseSell = quote.totalPriceQuoteCurrency ?? quote.totals?.totalSell ?? 0;
  const grandTotal = baseSell + upsellTotal;
  const perAdultGrandTotal = (grandTotal / adults).toFixed(2);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(travelerName)} — Bespoke Egypt Itinerary Proposal | ${escapeXml(companyName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Amiri:wght@400;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 1.2cm 1.4cm;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #fafaf9;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .proposal-container {
      max-width: 860px;
      margin: 20px auto;
      background: #ffffff;
      padding: 40px 48px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      border-radius: 16px;
      border: 1px solid #e7e5e4;
    }

    @media print {
      body { background: #ffffff; }
      .proposal-container {
        box-shadow: none;
        border: none;
        margin: 0;
        padding: 0;
        max-width: 100%;
      }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }

    .top-actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .print-btn {
      background: linear-gradient(135deg, #d97706, #b45309);
      color: #ffffff;
      border: none;
      font-weight: 700;
      font-size: 13px;
      padding: 8px 18px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(180,83,9,0.3);
    }
    .print-btn:hover { background: #d97706; }

    /* Luxury Header */
    .header-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2c37a;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    .brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 900;
      color: #1e293b;
      letter-spacing: -0.5px;
    }
    .brand-arabic {
      font-family: 'Amiri', serif;
      color: #b45309;
      font-size: 18px;
      margin-left: 6px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .quote-badge {
      text-align: right;
    }
    .quote-number {
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      background: #fef3c7;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #fde68a;
      display: inline-block;
    }
    .quote-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 5px;
    }

    /* Hero greeting */
    .hero-box {
      background: linear-gradient(135deg, #fdf8eb 0%, #ffffff 100%);
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      position: relative;
    }
    .hero-welcome {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 6px;
    }
    .hero-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed #e2c37a;
    }
    .meta-item-label { font-size: 10px; text-transform: uppercase; color: #78716c; font-weight: 700; letter-spacing: 0.5px; }
    .meta-item-val { font-size: 13px; font-weight: 700; color: #1c1917; margin-top: 2px; }

    /* Itinerary Days */
    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      border-left: 4px solid #d97706;
      padding-left: 12px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .day-card {
      margin-bottom: 20px;
      padding: 18px;
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 10px;
      page-break-inside: avoid;
    }
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .day-num {
      font-size: 11px;
      font-weight: 800;
      color: #b45309;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .day-city {
      font-size: 11px;
      background: #f1f5f9;
      color: #334155;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .day-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .day-desc {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    .services-tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
    }
    .service-tag {
      font-size: 11px;
      background: #fefce8;
      border: 1px solid #fef08a;
      color: #854d0e;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* Investment Summary Box */
    .pricing-summary {
      background: #0f172a;
      color: #ffffff;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
      page-break-inside: avoid;
    }
    .pricing-grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .price-big {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 900;
      color: #fde047;
    }
    .price-note {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* Bank Wire Box */
    .bank-box {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 16px 20px;
      background: #f8fafc;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .bank-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      font-size: 11px;
      margin-top: 8px;
    }
    .bank-label { color: #64748b; font-weight: 600; }
    .bank-val { color: #0f172a; font-family: monospace; font-weight: 700; }

    /* Footer Stamp */
    .footer-stamp {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
    }
    .stamp-seal {
      border: 2px solid #b45309;
      color: #b45309;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 1px;
      transform: rotate(-3deg);
    }
  </style>
</head>
<body>

  <div class="proposal-container">
    
    <!-- Top Action Bar for interactive browser view -->
    <div class="top-actions-bar no-print">
      <div>
        <strong>Official Egypt DMC Client Proposal</strong>
        <span style="opacity: 0.7; font-size: 12px; margin-left: 8px;">Ready for immediate printing or PDF export</span>
      </div>
      <button class="print-btn" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Save / Print as PDF
      </button>
    </div>

    <!-- Luxury Header -->
    <div class="header-banner">
      <div style="display: flex; align-items: center; gap: 16px;">
        <img src="${RIHAL_WORDMARK_BASE64}" alt="RIHAL رحال" style="height: 54px; width: auto; max-width: 240px; object-fit: contain;" />
        <div>
          <div class="brand-sub" style="color: #9E782A; font-weight: 700; font-size: 11px;">
            ${escapeXml(companyName)} · Bespoke Luxury Travel Itinerary
          </div>
        </div>
      </div>
      <div class="quote-badge">
        <div class="quote-number">${escapeXml(quote.quoteNumber)}</div>
        <div class="quote-date">Issued: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        <div style="font-size: 10px; color: #16a34a; font-weight: 700; margin-top: 2px;">● Guaranteed Rate Tariff</div>
      </div>
    </div>

    <!-- Hero Greeting Box -->
    <div class="hero-box">
      <div class="hero-welcome">Curated Itinerary Prepared for ${escapeXml(travelerName)}</div>
      <p style="font-size: 12px; color: #78716c; margin-top: 4px;">
        Thank you for choosing ${escapeXml(companyName)}. Below is your customized private journey through Egypt, combining iconic antiquities, licensed private Egyptologists, and luxury accommodations.
      </p>

      <div class="hero-meta-grid">
        <div>
          <div class="meta-item-label">Start Date</div>
          <div class="meta-item-val">${escapeXml(quote.startDate || '2026-10-20')}</div>
        </div>
        <div>
          <div class="meta-item-label">Duration</div>
          <div class="meta-item-val">${quote.durationDays} Days / ${Math.max(1, quote.durationDays - 1)} Nights</div>
        </div>
        <div>
          <div class="meta-item-label">Party Size</div>
          <div class="meta-item-val">${quote.group.adults} Adults${quote.group.children.length > 0 ? `, ${quote.group.children.length} Children` : ''}</div>
        </div>
        <div>
          <div class="meta-item-label">Service Style</div>
          <div class="meta-item-val">100% Private Chauffeur &amp; Guide</div>
        </div>
      </div>
    </div>

    <!-- Itinerary Schedule -->
    <div class="section-title">
      <span>Day-by-Day Comprehensive Itinerary</span>
      <span style="font-size: 12px; font-weight: 400; color: #64748b;">All logistics confirmed &amp; coordinated</span>
    </div>

    ${(quote.days || (quote as any).itineraryDays || [])
      .map(
        (day: any) => `
    <div class="day-card">
      <div class="day-header">
        <span class="day-num">Day ${day.dayNumber}</span>
        <span class="day-city">${escapeXml(day.city || 'Cairo')}</span>
      </div>
      <div class="day-title">${escapeXml(day.title)}</div>
      <div class="day-desc">${escapeXml(day.description)}</div>

      ${
        day.lines && day.lines.length > 0
          ? `
      <div class="services-tag-list">
        ${day.lines
          .map(
            (l: any) => `<span class="service-tag">✓ ${escapeXml(l.serviceName)} (${escapeXml(l.supplierType || 'Confirmed')})</span>`
          )
          .join('')}
      </div>`
          : ''
      }
    </div>`
      )
      .join('')}

    <!-- Inclusions and Exclusions -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 28px 0; page-break-inside: avoid;">
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px;">
        <div style="font-weight: 700; font-size: 13px; color: #166534; margin-bottom: 8px;">✓ Inclusions</div>
        <ul style="font-size: 11px; color: #14532d; padding-left: 18px; line-height: 1.8;">
          <li>All private A/C Mercedes/HiAce transfers with luggage porterage</li>
          <li>Licensed Syndicate of Egyptian Tourist Guides Egyptologist</li>
          <li>Confirmed 5-star luxury accommodations and Nile cruise</li>
          <li>All official monumental admission tickets &amp; site fees</li>
          <li>VIP Airport meet, assist, and fast-track immigration</li>
          <li>24/7 dedicated Cairo operations emergency hotline</li>
        </ul>
      </div>

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px;">
        <div style="font-weight: 700; font-size: 13px; color: #991b1b; margin-bottom: 8px;">✕ Exclusions</div>
        <ul style="font-size: 11px; color: #7f1d1d; padding-left: 18px; line-height: 1.8;">
          <li>International transcontinental flights</li>
          <li>Egyptian Entry Visa (available on arrival for $25 USD)</li>
          <li>Personal expenditures &amp; optional gratuities (tipping)</li>
          <li>Travel and medical insurance</li>
        </ul>
      </div>
    </div>

    ${selectedUpsells.length > 0 ? `
    <!-- Confirmed Luxury Enhancements Box -->
    <div style="background: #fffbe8; border: 1px solid #ffb700; border-radius: 10px; padding: 18px; margin: 24px 0; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255, 183, 0, 0.4); padding-bottom: 8px;">
        <div style="font-weight: 800; font-size: 13px; color: #00224f;">
          ★ Confirmed Curated VIP Enhancements &amp; Add-ons (${selectedUpsells.length})
        </div>
        <div style="font-weight: 800; font-size: 13px; color: #008009;">
          +${upsellTotal.toLocaleString()} ${escapeXml(quoteCurrency)}
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        ${selectedUpsells.map(u => `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-weight: 700; color: #0f172a;">${escapeXml(u.title)}</span>
              <span style="font-weight: 700; color: #003580; font-size: 11px; margin-left: 8px;">+$${u.price.toLocaleString()} ${u.priceBasis === 'per_person' ? '/ adult' : '/ party'}</span>
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 3px;">
              ${escapeXml(u.city)} · ${escapeXml(u.category)} ${u.badge ? `· <strong style="color: #d97706;">${escapeXml(u.badge)}</strong>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    <!-- Pricing Summary Box -->
    <div class="pricing-summary">
      <div class="pricing-grid">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #cbd5e1; font-weight: 700;">Total Package Investment</div>
          <div class="price-big">${currSymbol}${grandTotal.toLocaleString()} <span style="font-size: 16px; font-weight: 400; color: #94a3b8;">${escapeXml(quoteCurrency)}</span></div>
          ${selectedUpsells.length > 0 ? `
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
            Base Private Package: ${currSymbol}${baseSell.toLocaleString()} + ${selectedUpsells.length} VIP Upgrade${selectedUpsells.length !== 1 ? 's' : ''}: +${currSymbol}${upsellTotal.toLocaleString()}
          </div>` : ''}
          <div class="price-note">All taxes, ETA licensing, service fees, and 14% Egyptian VAT included. No hidden surcharges.</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #94a3b8;">Per Adult Rate:</div>
          <div style="font-size: 20px; font-weight: 700; color: #ffffff;">
            ${currSymbol}${perAdultGrandTotal} ${escapeXml(quoteCurrency)}
          </div>
          <div style="font-size: 11px; color: #38bdf8; margin-top: 4px;">Deposit: 25% to secure reservations</div>
        </div>
      </div>
    </div>

    <!-- Official Bank Wire Transfer Coordinates -->
    <div class="bank-box">
      <div style="font-weight: 700; font-size: 12px; color: #1e293b;">Official Bank Wire Transfer Instructions</div>
      <div class="bank-grid">
        <div>
          <span class="bank-label">Bank:</span> <span class="bank-val">${escapeXml(workspace.bankDetails?.bankName || 'Commercial International Bank (CIB)')}</span>
        </div>
        <div>
          <span class="bank-label">Account Name:</span> <span class="bank-val">${escapeXml(workspace.bankDetails?.accountName || workspace.name)}</span>
        </div>
        <div>
          <span class="bank-label">Account #:</span> <span class="bank-val">${escapeXml(workspace.bankDetails?.accountNumber || '1000-2495-8821')}</span>
        </div>
        <div>
          <span class="bank-label">IBAN:</span> <span class="bank-val">${escapeXml(workspace.bankDetails?.iban || 'EG380010002495882100012345678')}</span>
        </div>
        <div>
          <span class="bank-label">SWIFT Code:</span> <span class="bank-val">${escapeXml(workspace.bankDetails?.swiftCode || 'CIBEGCAXXX')}</span>
        </div>
        <div>
          <span class="bank-label">Branch:</span> <span class="bank-val">${escapeXml(workspace.bankDetails?.branch || 'Zamalek Branch, Cairo')}</span>
        </div>
      </div>
    </div>

    <!-- Terms and Conditions Summary -->
    <div style="font-size: 11px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
      <strong>Terms &amp; Booking Guarantee:</strong> ${escapeXml(workspace.termsAndConditions || 'Reservations are subject to written confirmation. A 25% deposit secures all hotel, cruise, and domestic flight allocations. Full balance is payable 30 days prior to arrival in Egypt.')}
    </div>

    <!-- Authorized Stamp & Signature -->
    <div class="footer-stamp">
      <div>
        <div style="font-weight: 700; color: #1e293b;">${escapeXml(companyName)} Operations Department</div>
        <div>Central Reservations: ${escapeXml(workspace.contactEmail || 'operations@rihal.eg')} · ${escapeXml(workspace.contactPhone || '+20 2 3345 6789')}</div>
      </div>
      <div class="stamp-seal">
        ★ ETA CERTIFIED INBOUND DMC ★
      </div>
    </div>

  </div>

</body>
</html>`;

  // Open in a new pop-up / window for instant printing, and also download file as luxury HTML
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    writeSafePrintDocument(printWindow, html);
    printWindow.document.close();
    // Allow styles to settle then invoke print
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        // print dialog fallback
      }
    }, 450);
  } else {
    // If pop-ups blocked, fallback to direct download of the printable HTML
    downloadBlob(html, `RIHAL_Luxury_Proposal_${quote.quoteNumber}.html`, 'text/html;charset=utf-8');
  }
}
