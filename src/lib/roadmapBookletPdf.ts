import { writeSafePrintDocument } from './safePrint';
import { RoadmapTrip, RoadStopObject } from './roadmapTypes';
import { Workspace, UILanguage } from '../types';

export interface BookletPrintOptions {
  theme?: 'archival' | 'minimalist' | 'navy';
  includeContacts?: boolean;
  includeTipping?: boolean;
  includeQrCode?: boolean;
  language?: UILanguage;
}

const esc = (s: string | number | undefined | null): string => {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Generates an SVG vector graphic representing the highway road map
 * for print / PDF output with high vector fidelity.
 */
function generatePrintableHighwaySvg(stops: RoadStopObject[], theme: 'archival' | 'minimalist' | 'navy'): string {
  const width = 740;
  const cardHeight = 90;
  const height = Math.max(480, stops.length * cardHeight + 80);

  const isDark = theme === 'navy';
  const roadColor = isDark ? '#1E293B' : '#334155';
  const shoulderColor = isDark ? '#334155' : '#CBD5E1';
  const markerColor = '#D97706';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const mutedText = isDark ? '#94A3B8' : '#64748B';

  if (stops.length === 0) {
    return `<div style="text-align:center;padding:40px;color:${mutedText};">No road stops scheduled.</div>`;
  }

  // Calculate points
  const points = stops.map((stop, idx) => {
    const isEven = idx % 2 === 0;
    const x = isEven ? 340 : 400;
    const y = 50 + idx * cardHeight;
    return { x, y, stop, idx, isEven };
  });

  // Build road SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midY = (p1.y + p2.y) / 2;
    pathD += ` C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
  }

  let svgContent = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;margin:0 auto;">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>
        </filter>
      </defs>

      <!-- Road Shoulder -->
      <path d="${pathD}" fill="none" stroke="${shoulderColor}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>

      <!-- Asphalt Highway -->
      <path d="${pathD}" fill="none" stroke="${roadColor}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Dashed Centerline -->
      <path d="${pathD}" fill="none" stroke="#FBBF24" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="round"/>
  `;

  // Draw Stop Nodes and Labels
  points.forEach((pt, idx) => {
    const isLeft = pt.isEven;
    const labelX = isLeft ? pt.x - 30 : pt.x + 30;
    const textAnchor = isLeft ? 'end' : 'start';

    svgContent += `
      <!-- Milestone Marker -->
      <g transform="translate(${pt.x}, ${pt.y})">
        <circle r="12" fill="${markerColor}" stroke="#FFFFFF" stroke-width="2" filter="url(#shadow)"/>
        <text y="4" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="10" fill="#0F172A">${idx + 1}</text>
      </g>

      <!-- Connecting tick line -->
      <line x1="${pt.x}" y1="${pt.y}" x2="${labelX}" y2="${pt.y}" stroke="${mutedText}" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- Label block -->
      <g transform="translate(${labelX}, ${pt.y})">
        <text y="-8" text-anchor="${textAnchor}" font-family="sans-serif" font-weight="bold" font-size="12" fill="${textColor}">
          ${esc(pt.stop.name)}
        </text>
        <text y="8" text-anchor="${textAnchor}" font-family="monospace" font-size="10" fill="${mutedText}">
          Day ${pt.stop.dayNumber} · ${esc(pt.stop.time || '10:00 AM')} · ${esc(pt.stop.city)} (~${pt.stop.durationMinutes || 60}m)
        </text>
      </g>
    `;
  });

  svgContent += `</svg>`;
  return svgContent;
}

/**
 * Builds and opens the official luxury print booklet / downloadable PDF document.
 */
export function printRoadmapBooklet(
  trip: RoadmapTrip,
  workspace: Workspace,
  options: BookletPrintOptions = {}
) {
  const {
    theme = 'archival',
    includeContacts = true,
    includeTipping = true,
    includeQrCode = true,
    language = 'en',
  } = options;

  const isAr = language === 'ar';
  const brandPrimary = workspace.brandColors?.primary || '#44200F';
  const brandAccent = workspace.brandColors?.accent || '#795037';

  // Theme palettes - standardized to RIHAL Luxury Travel identity
  const styles = {
    archival: {
      bg: '#FAF7F2',
      paper: '#FFFFFF',
      text: '#44200F',
      muted: '#795037',
      border: '#EDE0CC',
      accent: '#C4A177',
      subtle: '#FAF7F2',
    },
    minimalist: {
      bg: '#FFFFFF',
      paper: '#FFFFFF',
      text: '#44200F',
      muted: '#795037',
      border: '#EDE0CC',
      accent: '#795037',
      subtle: '#FAF7F2',
    },
    navy: {
      bg: '#FAF7F2',
      paper: '#FFFFFF',
      text: '#44200F',
      muted: '#795037',
      border: '#EDE0CC',
      accent: '#C4A177',
      subtle: '#EDE0CC',
    },
  }[theme];

  const days = [...new Set(trip.stops.map(s => s.dayNumber))].sort((a, b) => a - b);
  const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?view=concierge&quoteId=${encodeURIComponent(trip.quoteId || trip.id)}`;

  const highwaySvg = generatePrintableHighwaySvg(trip.stops, theme);

  const html = `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${esc(trip.travelerGroupName)} - Tour Itinerary & Road Map Booklet</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: ${isAr ? "'IBM Plex Sans Arabic', sans-serif" : "'Plus Jakarta Sans', -apple-system, sans-serif"};
      background-color: ${styles.bg};
      color: ${styles.text};
      margin: 0;
      padding: 0;
      line-height: 1.5;
      font-size: 13px;
    }

    .booklet-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .page {
      page-break-after: always;
      break-after: page;
      min-height: 1020px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: ${styles.paper};
      border: 1px solid ${styles.border};
      margin-bottom: 24px;
    }

    @media print {
      body {
        background: transparent !important;
      }
      .page {
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        min-height: auto !important;
        height: 100vh;
      }
      .no-print {
        display: none !important;
      }
    }

    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    h1, h2, h3, h4 {
      margin: 0;
      color: ${styles.text};
    }

    .font-serif-title {
      font-family: 'Cinzel', serif;
      letter-spacing: 0.04em;
    }

    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }

    .card {
      background: ${styles.subtle};
      border: 1px solid ${styles.border};
      border-radius: 12px;
      padding: 16px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
      margin-top: 10px;
    }

    th {
      text-align: left;
      padding: 8px 10px;
      background: ${styles.subtle};
      border-bottom: 2px solid ${styles.border};
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      color: ${styles.muted};
    }

    td {
      padding: 8px 10px;
      border-bottom: 1px solid ${styles.border};
      vertical-align: top;
    }

    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 9.5px;
      font-weight: 700;
      background: ${styles.border};
      color: ${styles.text};
    }

    .header-bar {
      border-bottom: 2px solid ${brandAccent};
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .footer-bar {
      border-top: 1px solid ${styles.border};
      padding-top: 10px;
      margin-top: 24px;
      font-size: 10px;
      color: ${styles.muted};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-print {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      background: #0284C7;
      color: #FFFFFF;
      border: none;
      border-radius: 12px;
      padding: 14px 24px;
      font-size: 14px;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  </style>
</head>
<body>

  <!-- Screen Floating Print Action -->
  <button class="btn-print no-print" onclick="window.print()">
    🖨️ ${isAr ? 'طباعة الكتيب أو حفظ كـ PDF' : 'Print Booklet or Save as PDF'}
  </button>

  <div class="booklet-container">

    <!-- ============================================================= -->
    <!-- PAGE 1: LUXURY EDITORIAL COVER PAGE                           -->
    <!-- ============================================================= -->
    <div class="page" style="text-align: center; justify-content: center; position: relative;">
      
      <div style="margin-top: 40px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: ${styles.accent}; font-weight: 800;">
          ${esc(workspace.name)} · Private Inbound Journeys
        </div>
        <div style="width: 40px; height: 2px; background: ${styles.accent}; margin: 12px auto 36px auto;"></div>

        <h1 class="font-serif-title" style="font-size: 32px; font-weight: 800; line-height: 1.25; margin-bottom: 12px; color: ${styles.text};">
          ${esc(trip.travelerGroupName)}
        </h1>
        <div style="font-size: 14px; color: ${styles.muted}; margin-bottom: 40px; font-weight: 600;">
          Comprehensive Tour Itinerary &amp; Scenic Road Map
        </div>
      </div>

      <!-- Core Tour Details Card -->
      <div class="card" style="max-width: 520px; margin: 0 auto; text-align: left; padding: 24px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px;">
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: ${styles.muted}; font-weight: 700;">Start Date</div>
            <div class="font-mono" style="font-size: 13px; font-weight: 700; margin-top: 2px;">${esc(trip.startDate)}</div>
          </div>
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: ${styles.muted}; font-weight: 700;">Duration</div>
            <div class="font-mono" style="font-size: 13px; font-weight: 700; margin-top: 2px;">${trip.durationDays} Days / ${Math.max(1, trip.durationDays - 1)} Nights</div>
          </div>
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: ${styles.muted}; font-weight: 700;">Guest Party</div>
            <div style="font-size: 13px; font-weight: 700; margin-top: 2px;">${trip.paxCount} Travelers</div>
          </div>
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: ${styles.muted}; font-weight: 700;">DMC File #</div>
            <div class="font-mono" style="font-size: 13px; font-weight: 700; color: ${styles.accent}; margin-top: 2px;">${esc(trip.fileNumber || 'EGY-VIP')}</div>
          </div>
        </div>

        ${includeContacts ? `
        <div style="border-top: 1px solid ${styles.border}; margin-top: 16px; padding-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px;">
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: ${styles.muted}; font-weight: 700;">Tour Egyptologist</div>
            <div style="font-weight: 700; margin-top: 2px;">${esc(trip.leadGuideName || 'Assigned Syndicate Guide')}</div>
            <div class="font-mono" style="font-size: 11px; color: ${styles.muted};">${esc(trip.leadGuidePhone || workspace.contactPhone)}</div>
          </div>
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: ${styles.muted}; font-weight: 700;">Chauffeur & Fleet</div>
            <div style="font-weight: 700; margin-top: 2px;">${esc(trip.driverName || 'Private DMC Chauffeur')}</div>
            <div class="font-mono" style="font-size: 11px; color: ${styles.muted};">${esc(trip.vehicleType || 'VIP Mercedes-Benz Coach')}</div>
          </div>
        </div>
        ` : ''}
      </div>

      <div style="margin-top: 50px;">
        <div style="font-size: 11px; color: ${styles.muted};">
          24/7 Operations Desk: <strong class="font-mono" style="color:${styles.text};">${esc(workspace.contactPhone)}</strong> · ${esc(workspace.contactEmail)}
        </div>
        <div style="font-size: 10px; color: ${styles.muted}; margin-top: 4px;">
          Bespoke Luxury Destination Operations · Verified Dispatch & 24/7 Field Assistance
        </div>
      </div>

      <div class="footer-bar" style="border: none;">
        <span>${esc(workspace.name)}</span>
        <span>Page 1 of ${Math.ceil(days.length / 2) + 2}</span>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- PAGE 2: VISUAL HIGHWAY ROAD MAP SCHEMATIC                    -->
    <!-- ============================================================= -->
    <div class="page">
      <div>
        <div class="header-bar">
          <div>
            <h2 class="font-serif-title" style="font-size: 18px; font-weight: 700;">
              ${isAr ? 'المخطط الجغرافي لمسار الرحلة السريع' : 'Tour Highway Roadmap Schematic'}
            </h2>
            <div style="font-size: 11px; color: ${styles.muted}; margin-top: 2px;">
              ${esc(trip.travelerGroupName)} · Sequential Stops &amp; Transit Waypoints
            </div>
          </div>
          <div class="font-mono" style="font-size: 11px; font-weight: 700; color: ${styles.accent};">
            ${trip.stops.length} Milestones
          </div>
        </div>

        <!-- Rendered Vector Highway SVG -->
        <div style="background: ${styles.subtle}; border: 1px solid ${styles.border}; border-radius: 12px; padding: 18px; margin-bottom: 16px;">
          ${highwaySvg}
        </div>

        <div class="card" style="padding: 12px 16px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
          <span><strong>Legend:</strong> 🟡 Yellow Dashed: Touring Highway · 🟠 Milestone Node · ⏱️ Estimated Ground Transit Included</span>
          <span class="font-mono" style="color:${styles.accent}; font-weight: 700;">Google Distance Matrix Verified</span>
        </div>
      </div>

      <div class="footer-bar">
        <span>${esc(workspace.name)} · ${esc(trip.fileNumber || 'EGY')}</span>
        <span>Page 2 · Road Map</span>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- PAGE 3+: DETAILED DAY-BY-DAY ITINERARY PROGRAM               -->
    <!-- ============================================================= -->
    ${days.map((dayNum, dayIndex) => {
      const dayStops = trip.stops.filter(s => s.dayNumber === dayNum);
      const isFirstDay = dayIndex === 0;
      const isLastDay = dayIndex === days.length - 1;

      return `
      <div class="page">
        <div>
          <div class="header-bar">
            <div>
              <h2 class="font-serif-title" style="font-size: 18px; font-weight: 700;">
                Day ${dayNum} Program Itinerary
              </h2>
              <div style="font-size: 11px; color: ${styles.muted}; margin-top: 2px;">
                ${dayStops[0]?.city || 'Egypt'} · ${dayStops.length} Scheduled Locations
              </div>
            </div>
            <div class="font-mono" style="font-size: 11px; font-weight: 700; color: ${styles.accent};">
              ${isFirstDay ? 'Arrival Day' : isLastDay ? 'Departure Day' : 'Full Touring Day'}
            </div>
          </div>

          <!-- Stops Table -->
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th style="width: 75px;">Time</th>
                <th>Location &amp; Sightseeing Service</th>
                <th style="width: 90px;">Category</th>
                <th style="width: 80px;">City</th>
                <th style="width: 65px;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${dayStops.map((stop, sIdx) => `
                <tr>
                  <td class="font-mono" style="font-weight: 700; color: ${styles.accent};">${sIdx + 1}</td>
                  <td class="font-mono" style="font-weight: 700;">${esc(stop.time || '10:00 AM')}</td>
                  <td>
                    <div style="font-weight: 700; font-size: 12px;">${esc(stop.name)}</div>
                    ${stop.notes ? `<div style="font-size: 10.5px; color: ${styles.muted}; margin-top: 2px;">${esc(stop.notes)}</div>` : ''}
                    ${stop.supplierName ? `<div style="font-size: 9.5px; color: ${styles.muted}; font-style: italic; margin-top: 1px;">Partner: ${esc(stop.supplierName)}</div>` : ''}
                  </td>
                  <td><span class="badge">${esc(stop.category)}</span></td>
                  <td>${esc(stop.city)}</td>
                  <td class="font-mono">${stop.durationMinutes || 60} min</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Day Field Notes Card -->
          <div class="card" style="margin-top: 20px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${styles.muted};">Day ${dayNum} Chauffeur &amp; Guide Instructions</div>
            <p style="font-size: 11.5px; margin: 4px 0 0 0; color: ${styles.text}; line-height: 1.6;">
              Please be ready in the hotel lobby 15 minutes prior to departure. Bottled mineral water is complimentary onboard the Mercedes touring coach. Ensure entry tickets and photography permits are presented by your assigned Egyptologist guide at the gate.
            </p>
          </div>
        </div>

        <div class="footer-bar">
          <span>${esc(workspace.name)} · ${esc(trip.travelerGroupName)}</span>
          <span>Day ${dayNum} of ${trip.durationDays}</span>
        </div>
      </div>
      `;
    }).join('')}

    <!-- ============================================================= -->
    <!-- FINAL PAGE: TRAVELER ESSENTIALS & EMERGENCY DIRECTORY         -->
    <!-- ============================================================= -->
    <div class="page">
      <div>
        <div class="header-bar">
          <div>
            <h2 class="font-serif-title" style="font-size: 18px; font-weight: 700;">
              Traveler Field Directory &amp; Practical Advice
            </h2>
            <div style="font-size: 11px; color: ${styles.muted}; margin-top: 2px;">
              Essential Information for Your Journey in Egypt
            </div>
          </div>
          <div class="font-mono" style="font-size: 11px; font-weight: 700; color: ${styles.accent};">
            24/7 Concierge
          </div>
        </div>

        <!-- Emergency & Contacts Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div class="card">
            <h3 style="font-size: 12px; font-weight: 700; margin-bottom: 8px;">📞 Emergency Contacts</h3>
            <div style="font-size: 11.5px; space-y: 6px;">
              <div><strong>Tour Guide:</strong> ${esc(trip.leadGuideName || 'Assigned')} (${esc(trip.leadGuidePhone || workspace.contactPhone)})</div>
              <div style="margin-top: 4px;"><strong>Private Chauffeur:</strong> ${esc(trip.driverName || 'Assigned')} (${esc(trip.driverPhone || workspace.contactPhone)})</div>
              <div style="margin-top: 4px;"><strong>DMC Operations Desk:</strong> ${esc(workspace.contactPhone)}</div>
              <div style="margin-top: 4px;"><strong>Tourism Police:</strong> 126 (Toll-Free in Egypt)</div>
            </div>
          </div>

          <div class="card">
            <h3 style="font-size: 12px; font-weight: 700; margin-bottom: 8px;">🏛️ Monument Protocol</h3>
            <div style="font-size: 11.5px; line-height: 1.5; color: ${styles.text};">
              Light breathable cotton clothing is recommended. When visiting historic mosques or religious sites, modest dress covering shoulders and knees is mandatory. Comfortable walking shoes are required for stone pathways at Giza and Luxor temples.
            </div>
          </div>
        </div>

        ${includeTipping ? `
        <!-- Cultural Tipping (Baksheesh) Guidelines -->
        <div class="card" style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: 700; margin-bottom: 6px;">💵 Customary Egyptian Tipping Guide (Per Day / Service)</h3>
          <p style="font-size: 11px; color: ${styles.muted}; margin: 0 0 10px 0;">
            Tipping is an authentic part of Egyptian hospitality culture. Recommended guidelines for your party:
          </p>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11px; text-align: center;">
            <div style="background: ${styles.paper}; border: 1px solid ${styles.border}; padding: 10px; border-radius: 8px;">
              <div style="font-weight: 700;">Egyptologist Guide</div>
              <div class="font-mono" style="color: ${styles.accent}; font-weight: 700; margin-top: 2px;">$15 - $25 / day</div>
              <div style="font-size: 9.5px; color: ${styles.muted};">Per group</div>
            </div>
            <div style="background: ${styles.paper}; border: 1px solid ${styles.border}; padding: 10px; border-radius: 8px;">
              <div style="font-weight: 700;">Private Chauffeur</div>
              <div class="font-mono" style="color: ${styles.accent}; font-weight: 700; margin-top: 2px;">$10 - $15 / day</div>
              <div style="font-size: 9.5px; color: ${styles.muted};">Per coach</div>
            </div>
            <div style="background: ${styles.paper}; border: 1px solid ${styles.border}; padding: 10px; border-radius: 8px;">
              <div style="font-weight: 700;">Nile Cruise Crew</div>
              <div class="font-mono" style="color: ${styles.accent}; font-weight: 700; margin-top: 2px;">$10 - $12 / night</div>
              <div style="font-size: 9.5px; color: ${styles.muted};">Enclosed in tip box</div>
            </div>
            <div style="background: ${styles.paper}; border: 1px solid ${styles.border}; padding: 10px; border-radius: 8px;">
              <div style="font-weight: 700;">Luggage Porters</div>
              <div class="font-mono" style="color: ${styles.accent}; font-weight: 700; margin-top: 2px;">50 - 100 EGP</div>
              <div style="font-size: 9.5px; color: ${styles.muted};">Per bag / check-in</div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Live Digital Concierge Portal Card -->
        <div class="card" style="display: flex; align-items: center; justify-content: space-between; gap: 20px;">
          <div>
            <h4 style="font-size: 12px; font-weight: 700; color: ${styles.text};">Live Mobile Web Concierge &amp; Daily Route Updates</h4>
            <p style="font-size: 11px; color: ${styles.muted}; margin: 2px 0 6px 0;">
              Access live real-time hotel maps, GPS waypoints, weather radar, and instant WhatsApp dispatch from any mobile device:
            </p>
            <div class="font-mono" style="font-size: 10px; color: ${styles.accent}; word-break: break-all;">
              ${esc(portalUrl)}
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bar">
        <span>${esc(workspace.name)} · Wishing You an Unforgettable Journey</span>
        <span>Final Page</span>
      </div>
    </div>

  </div>

  <script>
    // Automatically focus and prompt print on window load
    window.onload = function() {
      // Small timeout to allow vector SVG and fonts to stabilize
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    writeSafePrintDocument(printWindow, html);
    printWindow.document.close();
  }
}
