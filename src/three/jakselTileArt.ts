import {
  BoardTile,
  DISTRICT_PALETTE,
  JAKSEL_TILES,
  PropertyState,
} from '../shared/jakselBoard';

export const ATLAS_COLS = 7;
export const ATLAS_ROWS = 4;
export const CELL_W = 280;
export const CELL_H = 420;
export const ATLAS_W = ATLAS_COLS * CELL_W; // 1960
export const ATLAS_H = ATLAS_ROWS * CELL_H; // 1680

export const TILE_LANDMARK_CAPTION: Record<number, string> = {
  0: 'Patung Pemuda Membangun · Bundaran Senayan',
  1: 'Pasar Buah & Kios Tradisional Pasar Minggu',
  2: 'Peti Dana Komunitas Jakarta Selatan',
  3: 'Situ Babakan & Perkampungan Asri Jagakarsa',
  4: 'Depo & Stasiun Layang MRT Lebak Bulus',
  5: 'Jembatan Infinity Link · Tebet Eco Park',
  6: 'Monumen Patung Dirgantara Pancoran',
  7: 'Simpang Padat Rasuna Said · Zona Macet',
  8: 'Kedai Kopi Artisan & Kuliner Cipete Raya',
  9: 'Gardu Induk & Jaringan Listrik Jaksel',
  10: 'Lampu Jalan & Galeri Malam Kemang Raya',
  11: 'Cakra Selaras Wahana · Halte CSW ASEAN',
  12: 'Bulevar Teduh & Arsitektur Dharmawangsa',
  13: 'Lampion Little Tokyo · Blok M Square',
  14: 'Paviliun Taman Literasi Martha Christina',
  15: 'Sentra Desain & Audio Jalan Radio Dalam',
  16: 'Kartu Kejutan Kopi Jaksel',
  17: 'Jalan Layang Pangeran Antasari',
  18: 'Peron & Kereta MRT Blok M BCA',
  19: 'Menara Lingkar Bisnis Mega Kuningan',
  20: 'Gerbang Skybridge & Kawasan Pondok Indah',
  21: 'Portal Kamera Tilang Elektronik ETLE',
  22: 'Deretan Bistro & Kanopi Hijau Senopati',
  23: 'Butik Modern & Galeri Gunawarman',
  24: 'Instalasi Air Bersih PAM Jaya Jaksel',
  25: 'Pintu Masuk MRT Senayan & Stadion GBK',
  26: 'Kas Pajak Properti Mewah Jakarta Selatan',
  27: 'Cakrawala Pencakar Langit SCBD Sudirman',
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawLandmarkIllustration(
  ctx: CanvasRenderingContext2D,
  tile: BoardTile,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, 10);
  ctx.clip();

  // Sky / scene backdrop
  const isNight = [6, 7, 10, 11, 13, 17, 19, 21, 22, 23, 27].includes(tile.index);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  if (isNight) {
    grad.addColorStop(0, '#0B1D2E');
    grad.addColorStop(0.65, '#153447');
    grad.addColorStop(1, '#1E463A');
  } else {
    grad.addColorStop(0, '#BDE3F2');
    grad.addColorStop(0.65, '#E4F3EC');
    grad.addColorStop(1, '#BBD7C2');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Subtle drifting clouds or stars
  if (isNight) {
    ctx.fillStyle = 'rgba(255, 248, 220, 0.75)';
    for (let s = 0; s < 6; s++) {
      const sx = x + ((s * 43 + 18) % w);
      const sy = y + 14 + ((s * 29) % 44);
      const twinkle = 0.5 + 0.5 * Math.sin(t * 2.5 + s);
      ctx.globalAlpha = 0.35 + twinkle * 0.55;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    const cloudOffset = ((t * 14) % (w + 60)) - 30;
    ctx.beginPath();
    ctx.ellipse(x + cloudOffset, y + 26, 24, 9, 0, 0, Math.PI * 2);
    ctx.ellipse(x + cloudOffset + 14, y + 22, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const cx = x + w / 2;
  const groundY = y + h * 0.76;

  // Ground road / grass base
  ctx.fillStyle = isNight ? '#162825' : '#5F8F6B';
  ctx.fillRect(x, groundY, w, h - (groundY - y));
  ctx.fillStyle = isNight ? '#243038' : '#3C464D';
  ctx.fillRect(x, groundY + 12, w, 24);

  switch (tile.index) {
    case 0: {
      // Bundaran Senayan - Patung Pemuda Membangun + animated water fountain rings
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.ellipse(cx, groundY + 14, 58, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      const pulse = (t * 0.9) % 1;
      ctx.strokeStyle = `rgba(56, 189, 248, ${1 - pulse})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(cx, groundY + 14, 24 + pulse * 30, 5 + pulse * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Pedestal & Statue
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(cx - 10, groundY - 46, 20, 56);
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.arc(cx, groundY - 56, 9, 0, Math.PI * 2);
      ctx.fill();
      // Flame dish held aloft
      ctx.fillStyle = '#F59E0B';
      const flameScale = 1 + Math.sin(t * 6) * 0.16;
      ctx.beginPath();
      ctx.arc(cx + 12, groundY - 72, 7 * flameScale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 1: {
      // Pasar Minggu - Striped market canopy + fruit baskets
      ctx.fillStyle = '#8B5A3C';
      ctx.fillRect(cx - 64, groundY - 44, 128, 48);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#E05A47' : '#FFF8EB';
        const sway = Math.sin(t * 2 + i) * 1.5;
        ctx.fillRect(cx - 68 + i * 22.5, groundY - 56 + sway, 22.5, 22);
      }
      // Oranges & mangoes crates
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(cx - 28, groundY - 10, 9, 0, Math.PI * 2);
      ctx.arc(cx, groundY - 10, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#10B981';
      ctx.arc(cx + 28, groundY - 10, 9, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 2:
    case 16: {
      // Dana Komunitas / Kartu Kesempatan
      const isChance = tile.index === 16;
      const bob = Math.sin(t * 3) * 5;
      ctx.fillStyle = isChance ? '#F59E0B' : '#0284C7';
      drawRoundedRect(ctx, cx - 36, groundY - 74 + bob, 72, 54, 10);
      ctx.fill();
      ctx.strokeStyle = '#FFF8EB';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#FFF8EB';
      ctx.font = 'bold 34px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isChance ? '?' : 'Rp', cx, groundY - 46 + bob);
      break;
    }

    case 3: {
      // Jagakarsa - Setu Babakan lake + Betawi gazebo + swaying trees
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(x, groundY + 4, w, 34);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      const waveX = Math.sin(t * 2) * 10;
      ctx.beginPath();
      ctx.moveTo(cx - 45 + waveX, groundY + 18);
      ctx.lineTo(cx - 10 + waveX, groundY + 18);
      ctx.moveTo(cx + 10 - waveX, groundY + 26);
      ctx.lineTo(cx + 45 - waveX, groundY + 26);
      ctx.stroke();
      // Trees & Pendopo
      for (const tx of [-52, 54]) {
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(cx + tx - 4, groundY - 26, 8, 28);
        ctx.fillStyle = '#15803D';
        ctx.beginPath();
        ctx.arc(cx + tx + Math.sin(t * 2 + tx) * 2, groundY - 36, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#9A3412';
      ctx.beginPath();
      ctx.moveTo(cx - 34, groundY - 32);
      ctx.lineTo(cx, groundY - 58);
      ctx.lineTo(cx + 34, groundY - 32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(cx - 24, groundY - 32, 48, 32);
      break;
    }

    case 4:
    case 18:
    case 25: {
      // MRT Stations (Lebak Bulus, Blok M, Senayan) - Elevated track & moving MRT train
      ctx.fillStyle = '#64748B';
      ctx.fillRect(x, groundY - 34, w, 10);
      ctx.fillRect(cx - 45, groundY - 24, 12, 30);
      ctx.fillRect(cx + 33, groundY - 24, 12, 30);
      const trainX = x - 60 + ((t * 58 + tile.index * 30) % (w + 120));
      ctx.fillStyle = '#F8FAFC';
      drawRoundedRect(ctx, trainX, groundY - 54, 78, 20, 6);
      ctx.fill();
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(trainX + 4, groundY - 42, 70, 5);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(trainX + 10, groundY - 50, 12, 6);
      ctx.fillRect(trainX + 28, groundY - 50, 14, 6);
      ctx.fillRect(trainX + 48, groundY - 50, 14, 6);
      break;
    }

    case 5: {
      // Tebet Eco Park - Iconic Orange Infinity Link Bridge
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(cx - 50, groundY - 14, 24, 0, Math.PI * 2);
      ctx.arc(cx + 50, groundY - 14, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(x + 12, groundY - 12);
      ctx.bezierCurveTo(cx - 30, groundY - 62, cx + 30, groundY - 62, x + w - 12, groundY - 12);
      ctx.stroke();
      const runnerX = x + 20 + ((t * 42) % (w - 40));
      const runnerY = groundY - 34 - Math.sin(((runnerX - x) / w) * Math.PI) * 18;
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(runnerX, runnerY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 6: {
      // Pancoran - Patung Dirgantara sweeping pedestal & statue
      const glow = 0.5 + 0.5 * Math.sin(t * 2.5);
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.3 + glow * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx + 8, groundY - 64, 28 + glow * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(cx - 18, groundY + 4);
      ctx.quadraticCurveTo(cx - 6, groundY - 46, cx + 10, groundY - 68);
      ctx.stroke();
      // Bronze aviator statue pointing forward
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(cx + 12, groundY - 73, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx + 12, groundY - 72);
      ctx.lineTo(cx + 34, groundY - 82);
      ctx.stroke();
      break;
    }

    case 7: {
      // Macet Rasuna Said / Penjara - Traffic jam + blinking red brake lights + bars
      for (let c = 0; c < 3; c++) {
        const bx = x + 24 + c * 58 + Math.sin(t * 4 + c) * 2;
        ctx.fillStyle = c === 1 ? '#E5A93C' : '#94A3B8';
        drawRoundedRect(ctx, bx, groundY - 18, 42, 20, 5);
        ctx.fill();
        ctx.fillStyle = Math.sin(t * 6 + c) > 0 ? '#EF4444' : '#991B1B';
        ctx.beginPath();
        ctx.arc(bx + 6, groundY - 6, 4, 0, Math.PI * 2);
        ctx.arc(bx + 36, groundY - 6, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Subtle jail bar frame on sky
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
      ctx.lineWidth = 4;
      for (let b = -48; b <= 48; b += 24) {
        ctx.beginPath();
        ctx.moveTo(cx + b, y + 10);
        ctx.lineTo(cx + b, groundY - 26);
        ctx.stroke();
      }
      break;
    }

    case 8: {
      // Cipete Raya - Coffee shop + rising steam
      ctx.fillStyle = '#FFF8EB';
      ctx.fillRect(cx - 48, groundY - 56, 96, 58);
      ctx.fillStyle = '#EC4899';
      ctx.fillRect(cx - 52, groundY - 66, 104, 14);
      // Coffee cup sign & steam
      ctx.fillStyle = '#78350F';
      ctx.fillRect(cx - 16, groundY - 34, 32, 22);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2.5;
      for (let s = -8; s <= 8; s += 8) {
        const rise = ((t * 16 + s * 4) % 18);
        ctx.beginPath();
        ctx.arc(cx + s, groundY - 40 - rise, 3, 0, Math.PI);
        ctx.stroke();
      }
      break;
    }

    case 9: {
      // PLN Jaksel - Pylon + animated electric spark
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 22, groundY + 4);
      ctx.lineTo(cx, groundY - 78);
      ctx.lineTo(cx + 22, groundY + 4);
      ctx.moveTo(cx - 32, groundY - 54);
      ctx.lineTo(cx + 32, groundY - 54);
      ctx.stroke();
      if (Math.sin(t * 9) > -0.3) {
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.moveTo(cx + 4, groundY - 78);
        ctx.lineTo(cx - 10, groundY - 48);
        ctx.lineTo(cx + 2, groundY - 48);
        ctx.lineTo(cx - 6, groundY - 24);
        ctx.lineTo(cx + 14, groundY - 54);
        ctx.lineTo(cx + 2, groundY - 54);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 10: {
      // Kemang Raya - Warm twinkling festoon cafe string lights
      ctx.fillStyle = '#312E81';
      ctx.fillRect(cx - 60, groundY - 52, 52, 54);
      ctx.fillStyle = '#831843';
      ctx.fillRect(cx + 8, groundY - 44, 52, 46);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 12, groundY - 72);
      ctx.quadraticCurveTo(cx, groundY - 48, x + w - 12, groundY - 72);
      ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const u = i / 6;
        const lx = x + 18 + u * (w - 36);
        const ly = groundY - 72 + Math.sin(u * Math.PI) * 16;
        const bright = 0.55 + 0.45 * Math.sin(t * 4 + i * 1.4);
        ctx.fillStyle = `rgba(253, 224, 71, ${bright})`;
        ctx.beginPath();
        ctx.arc(lx, ly, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 11: {
      // Halte CSW ASEAN - Iconic glowing circular skybridge disc
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - 8, groundY - 42, 16, 46);
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.ellipse(cx, groundY - 48, 64, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, groundY - 48, 56, 13, 0, t * 2, t * 2 + Math.PI * 1.3);
      ctx.stroke();
      break;
    }

    case 12: {
      // Dharmawangsa - Grand white colonial columns & warm lamp
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(cx - 56, groundY - 56, 112, 58);
      ctx.fillStyle = '#C2410C';
      ctx.beginPath();
      ctx.moveTo(cx - 64, groundY - 56);
      ctx.lineTo(cx, groundY - 82);
      ctx.lineTo(cx + 64, groundY - 56);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#CBD5E1';
      for (let k = -40; k <= 40; k += 20) {
        ctx.fillRect(cx + k - 3, groundY - 56, 6, 56);
      }
      break;
    }

    case 13: {
      // Blok M Square - Little Tokyo swaying lanterns
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(cx - 54, groundY - 48, 108, 50);
      for (let i = -1; i <= 1; i++) {
        const swing = Math.sin(t * 2.4 + i) * 3;
        const lx = cx + i * 34 + swing;
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.ellipse(lx, groundY - 64, 11, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(lx - 6, groundY - 79, 12, 3);
        ctx.fillRect(lx - 6, groundY - 50, 12, 3);
      }
      break;
    }

    case 14: {
      // Taman Literasi - Circular green plaza + open glowing book
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.ellipse(cx, groundY + 2, 66, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      const lift = Math.sin(t * 2.5) * 4;
      ctx.fillStyle = '#FFF8EB';
      ctx.beginPath();
      ctx.moveTo(cx, groundY - 30 + lift);
      ctx.lineTo(cx - 38, groundY - 44 + lift);
      ctx.lineTo(cx - 38, groundY - 16 + lift);
      ctx.lineTo(cx, groundY - 8 + lift);
      ctx.lineTo(cx + 38, groundY - 16 + lift);
      ctx.lineTo(cx + 38, groundY - 44 + lift);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 15: {
      // Radio Dalam - Radio signal waves & storefront
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(cx - 46, groundY - 46, 92, 48);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(cx - 46, groundY - 54, 92, 10);
      for (let r = 1; r <= 3; r++) {
        const alpha = Math.max(0.15, 1 - ((t * 1.4 + r * 0.3) % 1));
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, groundY - 58, r * 12, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
      break;
    }

    case 17: {
      // Antasari Flyover - Highway deck + moving light trails
      ctx.fillStyle = '#475569';
      ctx.fillRect(x, groundY - 40, w, 14);
      ctx.fillRect(cx - 50, groundY - 26, 16, 30);
      ctx.fillRect(cx + 34, groundY - 26, 16, 30);
      const car1 = x + ((t * 95) % (w + 30)) - 15;
      const car2 = x + w - ((t * 80) % (w + 30));
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(car1, groundY - 44, 18, 5);
      ctx.fillStyle = '#F87171';
      ctx.fillRect(car2, groundY - 44, 18, 5);
      break;
    }

    case 19:
    case 27: {
      // Mega Kuningan / SCBD Sudirman - Glass skyscrapers + animated window shimmer
      const isSCBD = tile.index === 27;
      const towers = isSCBD
        ? [
            { dx: -52, w: 30, h: 72, c: '#1D4ED8' },
            { dx: -16, w: 36, h: 98, c: '#2563EB' },
            { dx: 26, w: 30, h: 80, c: '#1E40AF' },
          ]
        : [
            { dx: -50, w: 28, h: 66, c: '#CA8A04' },
            { dx: -14, w: 34, h: 86, c: '#EAB308' },
            { dx: 26, w: 28, h: 62, c: '#A16207' },
          ];
      for (const tw of towers) {
        ctx.fillStyle = tw.c;
        ctx.fillRect(cx + tw.dx, groundY - tw.h, tw.w, tw.h + 4);
        for (let wy = groundY - tw.h + 8; wy < groundY - 8; wy += 10) {
          for (let wx = cx + tw.dx + 5; wx < cx + tw.dx + tw.w - 6; wx += 9) {
            const lit = Math.sin(t * 2 + wx + wy) > -0.2;
            ctx.fillStyle = lit ? '#FEF08A' : 'rgba(255,255,255,0.22)';
            ctx.fillRect(wx, wy, 5, 5);
          }
        }
      }
      // Rooftop aviation beacon
      ctx.fillStyle = Math.sin(t * 5) > 0 ? '#EF4444' : '#7F1D1D';
      ctx.beginPath();
      ctx.arc(cx + 2, groundY - (isSCBD ? 102 : 90), 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 20: {
      // Pondok Indah - Grand arch skybridge & palm trees
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(cx - 58, groundY - 56, 26, 60);
      ctx.fillRect(cx + 32, groundY - 56, 26, 60);
      ctx.fillStyle = '#EAB308';
      ctx.fillRect(cx - 38, groundY - 52, 76, 18);
      // Shimmering skybridge glass
      const sheen = ((t * 40) % 76);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(cx - 38 + sheen, groundY - 52, 8, 18);
      break;
    }

    case 21: {
      // Tilang ETLE - Traffic gantry + periodic camera flash!
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(cx - 56, groundY - 64, 8, 68);
      ctx.fillRect(cx - 56, groundY - 64, 112, 8);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(cx - 12, groundY - 68, 24, 14);
      const flash = Math.pow(Math.max(0, Math.sin(t * 3.5)), 8);
      if (flash > 0.2) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
        ctx.beginPath();
        ctx.arc(cx, groundY - 50, 26 * flash, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 22:
    case 23: {
      // Senopati & Gunawarman - Warm upscale bistro & boutique facade
      ctx.fillStyle = tile.index === 22 ? '#065F46' : '#0F766E';
      ctx.fillRect(cx - 52, groundY - 58, 104, 60);
      const warm = 0.65 + 0.35 * Math.sin(t * 3);
      ctx.fillStyle = `rgba(253, 224, 71, ${warm})`;
      drawRoundedRect(ctx, cx - 40, groundY - 44, 34, 34, 6);
      ctx.fill();
      drawRoundedRect(ctx, cx + 6, groundY - 44, 34, 34, 6);
      ctx.fill();
      break;
    }

    case 24: {
      // PAM Jaya - Water tank + flowing cyan wave
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(cx - 28, groundY - 54, 56, 56);
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(cx, groundY - 54, 28, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let wx = -44; wx <= 44; wx += 4) {
        const wy = groundY + 14 + Math.sin(wx * 0.14 + t * 4) * 4;
        if (wx === -44) ctx.moveTo(cx + wx, wy);
        else ctx.lineTo(cx + wx, wy);
      }
      ctx.stroke();
      break;
    }

    case 26: {
      // Pajak Properti - Floating gold Rupiah coin
      const spin = Math.abs(Math.cos(t * 2.5));
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(cx, groundY - 40, Math.max(6, 26 * spin), 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function drawTileCell(
  ctx: CanvasRenderingContext2D,
  tile: BoardTile,
  timeSec: number,
  propState?: PropertyState,
  ownerColor?: string | null,
  isHovered?: boolean,
  isSelected?: boolean
) {
  const col = tile.index % ATLAS_COLS;
  const row = Math.floor(tile.index / ATLAS_COLS);
  const ox = col * CELL_W;
  const oy = row * CELL_H;

  ctx.save();
  ctx.translate(ox, oy);

  // Card parchment background
  ctx.fillStyle = propState?.mortgaged ? '#CBD5E1' : '#F6F2E9';
  ctx.fillRect(0, 0, CELL_W, CELL_H);

  // Outer card border
  ctx.strokeStyle = isSelected
    ? '#E5A93C'
    : isHovered
    ? '#10B981'
    : '#142923';
  ctx.lineWidth = isSelected || isHovered ? 8 : 5;
  ctx.strokeRect(2.5, 2.5, CELL_W - 5, CELL_H - 5);

  const isCorner = [0, 7, 14, 21].includes(tile.index);

  // Top District Color Bar (for properties/transits/utilities)
  let topOffset = 18;
  if (tile.district && !isCorner) {
    const pal = DISTRICT_PALETTE[tile.district];
    ctx.fillStyle = pal.hex;
    ctx.fillRect(6, 6, CELL_W - 12, 66);
    ctx.fillStyle = '#142923';
    ctx.fillRect(6, 70, CELL_W - 12, 4);
    ctx.fillStyle = pal.textOnBand;
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pal.label.toUpperCase(), CELL_W / 2, 39);
    topOffset = 86;
  } else if (isCorner) {
    const cornerAccent =
      tile.index === 0
        ? '#E5A93C'
        : tile.index === 7
        ? '#E05A47'
        : tile.index === 14
        ? '#10B981'
        : '#DC2626';
    ctx.fillStyle = cornerAccent;
    ctx.fillRect(6, 6, CELL_W - 12, 42);
    ctx.fillStyle = '#08241D';
    ctx.font = 'bold 17px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tile.shortName, CELL_W / 2, 27);
    topOffset = 58;
  }

  // Tile Name
  ctx.fillStyle = '#142923';
  ctx.font = '800 24px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(tile.shortName, CELL_W / 2, topOffset + 4, CELL_W - 24);

  // Animated Landmark Illustration Frame
  const artY = topOffset + 40;
  const artH = isCorner ? 226 : 196;
  drawLandmarkIllustration(ctx, tile, 18, artY, CELL_W - 36, artH, timeSec);

  // Frame border around illustration
  ctx.strokeStyle = 'rgba(20, 41, 35, 0.25)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 18, artY, CELL_W - 36, artH, 10);
  ctx.stroke();

  // Bottom Price / Action Label
  const footerY = CELL_H - 46;
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (tile.price) {
    ctx.fillStyle = '#0F2E27';
    ctx.fillText(`Rp ${tile.price} Jt`, CELL_W / 2, footerY);
  } else if (tile.taxAmount) {
    ctx.fillStyle = '#B91C1C';
    ctx.fillText(`-${tile.taxAmount} Jt`, CELL_W / 2, footerY);
  } else {
    ctx.fillStyle = '#334155';
    ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(tile.sublabel, CELL_W / 2, footerY);
  }

  // Owner ownership stripe at bottom
  if (ownerColor) {
    ctx.fillStyle = ownerColor;
    ctx.fillRect(6, CELL_H - 18, CELL_W - 12, 12);
  }

  ctx.restore();
}

export function drawAllTilesAtlas(
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  properties: Record<number, PropertyState>,
  ownerColorById: Record<string, string>,
  hoveredIndex: number | null,
  selectedIndex: number | null,
  batchIndex?: number
) {
  for (let i = 0; i < JAKSEL_TILES.length; i++) {
    if (batchIndex !== undefined && i % 4 !== batchIndex) continue;
    const tile = JAKSEL_TILES[i];
    const prop = properties[tile.index];
    const ownerColor = prop?.ownerId ? ownerColorById[prop.ownerId] ?? null : null;
    drawTileCell(
      ctx,
      tile,
      timeSec,
      prop,
      ownerColor,
      hoveredIndex === tile.index,
      selectedIndex === tile.index
    );
  }
}

export function createCenterBoardTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Rich classic Monopoly center felt/parchment base
  const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 560);
  grad.addColorStop(0, '#134438');
  grad.addColorStop(0.75, '#0C3128');
  grad.addColorStop(1, '#08231C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle South Jakarta road grid lines
  ctx.strokeStyle = 'rgba(229, 169, 60, 0.14)';
  ctx.lineWidth = 3;
  for (let i = 128; i < 1024; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 40);
    ctx.lineTo(i, 984);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(40, i);
    ctx.lineTo(984, i);
    ctx.stroke();
  }

  // Diagonal Sudirman-Thamrin / Antasari avenue accent
  ctx.strokeStyle = 'rgba(229, 169, 60, 0.22)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(160, 160);
  ctx.lineTo(864, 864);
  ctx.stroke();

  // Inner brass border frame
  ctx.strokeStyle = '#E5A93C';
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, 952, 952);

  // Diagonal Center Title Banner
  ctx.save();
  ctx.translate(512, 512);
  ctx.rotate(-Math.PI / 4);
  drawRoundedRect(ctx, -310, -76, 620, 152, 18);
  ctx.fillStyle = '#E05A47';
  ctx.fill();
  ctx.strokeStyle = '#FFF8EB';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = '#FFF8EB';
  ctx.font = '800 58px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MONOPOLI JAKSEL', 0, -10);

  ctx.fillStyle = '#FDE68A';
  ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('EDISI JAKARTA SELATAN', 0, 40);
  ctx.restore();

  // Chance & Community Chest designated card pads
  ctx.save();
  ctx.translate(240, 240);
  ctx.rotate(-Math.PI / 4);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, -95, -62, 190, 124, 12);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FCD34D';
  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KESEMPATAN', 0, 6);
  ctx.restore();

  ctx.save();
  ctx.translate(784, 784);
  ctx.rotate(-Math.PI / 4);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, -95, -62, 190, 124, 12);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7DD3FC';
  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DANA KOMUNITAS', 0, 6);
  ctx.restore();

  return canvas;
}
