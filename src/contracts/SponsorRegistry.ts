/**
 * INTERSTELLAR CONTINUUM - Canonical Fictional Sponsors Registry
 * Authored institutional partners, private companies, and research foundations.
 *
 * NOTE: All entities are 100% fictional and original.
 */

import { SponsorRecord, SponsorCategory } from './ContractTypes';

export const DEFAULT_SPONSORS: SponsorRecord[] = [
  {
    id: 'SPONSOR_GSC',
    name: 'Global Space Coalition',
    description:
      'Intergovernmental space consortium coordinating civilian space exploration, infrastructure standards, and global science grants across Earth and the inner solar system.',
    category: SponsorCategory.GOVERNMENT_INSTITUTION,
    fundingTier: 5,
    availableBudget: 3500000,
    reputation: 25,
    minDirectorRank: 1,
    activeAgreements: [
      {
        id: 'AGREE_GSC_CORE_STIPEND',
        sponsorId: 'SPONSOR_GSC',
        title: 'Civilian Space Flight Operational Baseline Grant',
        type: 'EXPLORATION_GRANT',
        periodicFunding: 50000,
        intervalGameDays: 14,
        totalIntervals: 26,
        remainingIntervals: 24,
        isActive: true,
        conditions: ['Maintain positive agency prestige', 'Complete at least 1 mission every 60 days'],
        lastDisbursedGameSeconds: 0,
        createdAt: 1714000000000,
      },
    ],
    contractHistory: [],
    logoAssetKey: 'logo_gsc',
  },
  {
    id: 'SPONSOR_HELIOS',
    name: 'Helios Telecommunications Conglomerate',
    description:
      'Leading orbital constellation operator seeking reliable high-bandwidth orbital slots in LEO, GEO, and Lunar relay orbits to expand civilian data routing networks.',
    category: SponsorCategory.COMMERCIAL_TELECOM,
    fundingTier: 4,
    availableBudget: 2200000,
    reputation: 15,
    minDirectorRank: 1,
    activeAgreements: [
      {
        id: 'AGREE_HELIOS_RELAY_SUBSIDY',
        sponsorId: 'SPONSOR_HELIOS',
        title: 'Deep Space Relay Bandwidth Sharing Agreement',
        type: 'INFRASTRUCTURE_SUBSIDY',
        periodicFunding: 35000,
        intervalGameDays: 10,
        totalIntervals: 18,
        remainingIntervals: 18,
        isActive: true,
        conditions: ['Maintain operational relay in Earth orbit'],
        lastDisbursedGameSeconds: 0,
        createdAt: 1714100000000,
      },
    ],
    contractHistory: [],
    logoAssetKey: 'logo_helios',
  },
  {
    id: 'SPONSOR_STELLARIS',
    name: 'Stellar Dynamics Industrial Consortium',
    description:
      'Aerospace propulsion and heavy structures manufacturer funding high-energy launch testing, stage separation verification, and spacecraft endurance evaluations.',
    category: SponsorCategory.AEROSPACE_INDUSTRIAL,
    fundingTier: 4,
    availableBudget: 1800000,
    reputation: 10,
    minDirectorRank: 2,
    activeAgreements: [],
    contractHistory: [],
    logoAssetKey: 'logo_stellaris',
  },
  {
    id: 'SPONSOR_ASTRAEA',
    name: 'Astraea Planetary Science Institute',
    description:
      'Independent non-profit research foundation granting funds for planetary geology, atmospheric spectrometry, and habitability surveys across extreme solar system destinations.',
    category: SponsorCategory.SCIENTIFIC_FOUNDATION,
    fundingTier: 3,
    availableBudget: 1500000,
    reputation: 20,
    minDirectorRank: 1,
    activeAgreements: [
      {
        id: 'AGREE_ASTRAEA_DATA_ROYALTIES',
        sponsorId: 'SPONSOR_ASTRAEA',
        title: 'Planetary Biosignature & Geology Data Rights License',
        type: 'DATA_LICENSE',
        periodicFunding: 25000,
        intervalGameDays: 7,
        totalIntervals: 12,
        remainingIntervals: 12,
        isActive: true,
        conditions: ['Provide peer-reviewed scientific telemetry datasets'],
        lastDisbursedGameSeconds: 0,
        createdAt: 1714200000000,
      },
    ],
    contractHistory: [],
    logoAssetKey: 'logo_astraea',
  },
  {
    id: 'SPONSOR_AEGIS',
    name: 'Aegis Extraterrestrial Mining Syndicate',
    description:
      'Venture consortium focused on prospecting small celestial bodies, identifying near-Earth asteroid volatile deposits, and evaluating lunar regolith minerals for commercial utilization.',
    category: SponsorCategory.MINING_CONSORTIUM,
    fundingTier: 3,
    availableBudget: 1950000,
    reputation: 0,
    minDirectorRank: 2,
    activeAgreements: [],
    contractHistory: [],
    logoAssetKey: 'logo_aegis',
  },
  {
    id: 'SPONSOR_CONTINUUM_MEDIA',
    name: 'Continuum Educational Media Foundation',
    description:
      'Global public broadcasting institution funding high-resolution optical observation missions, educational live feeds, and historic milestone documentaries.',
    category: SponsorCategory.MEDIA_BROADCASTER,
    fundingTier: 2,
    availableBudget: 900000,
    reputation: 30,
    minDirectorRank: 1,
    activeAgreements: [],
    contractHistory: [],
    logoAssetKey: 'logo_continuum_media',
  },
];
