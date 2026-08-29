import React from 'react';
import { Flag, Coins, Plane, Lock, Zap, Droplet, Siren } from 'lucide-react';
import type { MonopolySpace } from './types';

// Real 48-space board layout, mirrored from server/src/engine/monopoly.ts
// (MONOPOLY_BOARD) plus the client-only `flag` image paths that App.tsx's
// copy of this data carries for property spaces.
export const MONOPOLY_BOARD: MonopolySpace[] = [
  { name: 'START', type: 'go' }, // 0
  { name: 'Salvador', type: 'property', group: 'brazil', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgageValue: 30, flag: '/flags/brazil.svg' }, // 1
  { name: 'Treasure', type: 'community_chest' }, // 2
  { name: 'Rio', type: 'property', group: 'brazil', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgageValue: 30, flag: '/flags/brazil.svg' }, // 3
  { name: 'Earnings Tax', type: 'tax', price: 200 }, // 4
  { name: 'Tel Aviv', type: 'property', group: 'israel', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50, flag: '/flags/israel.svg' }, // 5
  { name: 'TLV Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 6
  { name: 'Haifa', type: 'property', group: 'israel', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50, flag: '/flags/israel.svg' }, // 7
  { name: 'Jerusalem', type: 'property', group: 'israel', price: 110, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgageValue: 55, flag: '/flags/israel.svg' }, // 8
  { name: 'Surprise', type: 'chance' }, // 9
  { name: 'Mumbai', type: 'property', group: 'india', price: 120, rent: [8, 45, 120, 350, 500, 650], houseCost: 100, mortgageValue: 60, flag: '/flags/india.svg' }, // 10
  { name: 'New Delhi', type: 'property', group: 'india', price: 130, rent: [10, 45, 130, 400, 575, 700], houseCost: 100, mortgageValue: 65, flag: '/flags/india.svg' }, // 11
  { name: 'In Prison / Passing by', type: 'jail' }, // 12
  { name: 'Venice', type: 'property', group: 'italy', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70, flag: '/flags/italy.svg' }, // 13
  { name: 'Bologna', type: 'property', group: 'italy', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70, flag: '/flags/italy.svg' }, // 14
  { name: 'Power Company', type: 'utility', price: 150, mortgageValue: 75 }, // 15
  { name: 'Milan', type: 'property', group: 'italy', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80, flag: '/flags/italy.svg' }, // 16
  { name: 'Rome', type: 'property', group: 'italy', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80, flag: '/flags/italy.svg' }, // 17
  { name: 'MUC Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 18
  { name: 'Frankfurt', type: 'property', group: 'germany', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90, flag: '/flags/germany.svg' }, // 19
  { name: 'Treasure', type: 'community_chest' }, // 20
  { name: 'Munich', type: 'property', group: 'germany', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90, flag: '/flags/germany.svg' }, // 21
  { name: 'Gas Company', type: 'utility', price: 150, mortgageValue: 75 }, // 22
  { name: 'Berlin', type: 'property', group: 'germany', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgageValue: 100, flag: '/flags/germany.svg' }, // 23
  { name: 'Vacation', type: 'free_parking' }, // 24
  { name: 'Shenzhen', type: 'property', group: 'china', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110, flag: '/flags/china.svg' }, // 25
  { name: 'Surprise', type: 'chance' }, // 26
  { name: 'Beijing', type: 'property', group: 'china', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110, flag: '/flags/china.svg' }, // 27
  { name: 'Treasure', type: 'community_chest' }, // 28
  { name: 'Shanghai', type: 'property', group: 'china', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120, flag: '/flags/china.svg' }, // 29
  { name: 'CDG Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 30
  { name: 'Toulouse', type: 'property', group: 'france', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130, flag: '/flags/france.svg' }, // 31
  { name: 'Paris', type: 'property', group: 'france', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130, flag: '/flags/france.svg' }, // 32
  { name: 'Water Company', type: 'utility', price: 150, mortgageValue: 75 }, // 33
  { name: 'Yokohama', type: 'property', group: 'japan', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140, flag: '/flags/japan.svg' }, // 34
  { name: 'Tokyo', type: 'property', group: 'japan', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140, flag: '/flags/japan.svg' }, // 35
  { name: 'Go to prison', type: 'go_to_jail' }, // 36
  { name: 'Liverpool', type: 'property', group: 'united-kingdom', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150, flag: '/flags/united_kingdom.svg' }, // 37
  { name: 'Manchester', type: 'property', group: 'united-kingdom', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150, flag: '/flags/united_kingdom.svg' }, // 38
  { name: 'Treasure', type: 'community_chest' }, // 39
  { name: 'Birmingham', type: 'property', group: 'united-kingdom', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160, flag: '/flags/united_kingdom.svg' }, // 40
  { name: 'London', type: 'property', group: 'united-kingdom', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160, flag: '/flags/united_kingdom.svg' }, // 41
  { name: 'JFK Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 42
  { name: 'Los Angeles', type: 'property', group: 'united-states-of-america', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175, flag: '/flags/united_states.svg' }, // 43
  { name: 'Surprise', type: 'chance' }, // 44
  { name: 'San Francisco', type: 'property', group: 'united-states-of-america', price: 360, rent: [40, 180, 540, 1200, 1450, 1675], houseCost: 200, mortgageValue: 180, flag: '/flags/united_states.svg' }, // 45
  { name: 'Premium Tax', type: 'tax', price: 75 }, // 46
  { name: 'New York', type: 'property', group: 'united-states-of-america', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200, flag: '/flags/united_states.svg' } // 47
];

export const colorGroupMap: Record<string, string> = {
  'brazil': '#8E6F56',
  'israel': '#A1C8E7',
  'india': '#DB8CB9',
  'italy': '#DE9265',
  'germany': '#D85465',
  'china': '#E5C067',
  'france': '#67B88C',
  'japan': '#58887F',
  'united-kingdom': '#416B98',
  'united-states-of-america': '#384CA2'
};

// Non-property space icon, rendered with lucide-react instead of emoji.
// Chest/Surprise/Vacation keep the existing PNG assets from assets/images
// (served from client/public/images/*.png), matching the original renderer.
export const getMonopolySpaceIcon = (type: string, name: string): React.ReactNode => {
  switch (type) {
    case 'go':
      return React.createElement(Flag, { size: 20, color: '#38b000' });
    case 'community_chest':
      return React.createElement('img', { src: '/images/chest.png', alt: 'Chest', style: { width: 28, height: 28, objectFit: 'contain' } });
    case 'tax':
      return React.createElement(Coins, { size: 20, color: 'var(--accent-gold)' });
    case 'railroad':
      return React.createElement(Plane, { size: 20 });
    case 'chance':
      return React.createElement('img', { src: '/images/surprise.png', alt: 'Surprise', style: { width: 28, height: 28, objectFit: 'contain' } });
    case 'jail':
      return React.createElement(Lock, { size: 20 });
    case 'utility':
      return name.includes('Power') || name.includes('Gas')
        ? React.createElement(Zap, { size: 20, color: 'var(--accent-gold)' })
        : React.createElement(Droplet, { size: 20, color: 'var(--accent-blue)' });
    case 'free_parking':
      return React.createElement('img', { src: '/images/vacation.png', alt: 'Vacation', style: { width: 28, height: 28, objectFit: 'contain' } });
    case 'go_to_jail':
      return React.createElement(Siren, { size: 20, color: 'var(--accent-pink)' });
    default:
      return null;
  }
};

// Grid row/col (1..13, edge cells 1/13 pinned) for the classic ring layout.
export const getMonopolySpaceGridCoords = (spaceIndex: number): { row: number; col: number } => {
  if (spaceIndex >= 0 && spaceIndex <= 12) {
    return { row: 1, col: spaceIndex + 1 };
  } else if (spaceIndex >= 13 && spaceIndex <= 24) {
    return { row: spaceIndex - 11, col: 13 };
  } else if (spaceIndex >= 25 && spaceIndex <= 36) {
    return { row: 13, col: 37 - spaceIndex };
  } else {
    return { row: 49 - spaceIndex, col: 1 };
  }
};

// Pixel-ish coordinates (on a 1000x1000 virtual canvas) used to place player tokens.
export const getMonopolyCoords = (spaceIndex: number): { x: number; y: number } => {
  const { row, col } = getMonopolySpaceGridCoords(spaceIndex);
  const U = 1000 / 13.5;
  const W = 1.25 * U;

  const getPos = (idx: number) => {
    if (idx === 1) return W / 2;
    if (idx === 13) return 1000 - W / 2;
    return W + (idx - 2) * U + U / 2;
  };

  return { x: getPos(col), y: getPos(row) };
};

export const getSpaceSide = (i: number): 'top' | 'right' | 'bottom' | 'left' => {
  if (i >= 0 && i <= 12) return 'top';
  if (i >= 13 && i <= 24) return 'right';
  if (i >= 25 && i <= 36) return 'bottom';
  return 'left';
};

export const AVATAR_COLORS = [
  'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)',
  'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
  'linear-gradient(135deg, #38b000 0%, #70e000 100%)',
  'linear-gradient(135deg, #ffb703 0%, #ffea00 100%)'
];
