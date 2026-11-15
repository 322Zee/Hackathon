/**
 * INTERSTELLAR CONTINUUM - Authoritative Campaign Chapters Definition
 * 8 sequential exploration phases progressing from Earth orbit to the outer frontier.
 */

import { CampaignChapter, CampaignChapterId } from '../CampaignTypes';
import { DestinationId } from '../../destinations/DestinationTypes';

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  {
    number: 1,
    id: CampaignChapterId.CHAPTER_1_PROJECT_GENESIS,
    codename: 'PROJECT GENESIS',
    title: 'Origins & Orbital Foothold',
    subtitle: 'Chapter 1: Establishing Independent Aerospace Operations',
    synopsis:
      'Commission the Astra Continuum headquarters campus, master vehicle assembly protocols, conduct foundational suborbital atmospheric tests, and place the organisation’s inaugural satellite into stable Low Earth Orbit.',
    briefingDirectives: [
      'Complete initial orientation across all primary campus facilities.',
      'Assemble a flight-certified vehicle in the Vehicle Assembly Building.',
      'Complete suborbital trajectory burns and telemetry verification.',
      'Deploy the Project Pioneer orbital telemetry satellite.',
    ],
    keyDestinations: [DestinationId.EARTH, DestinationId.EARTH_ORBIT_LEO],
    primaryMissions: ['EARTH_LEO_DEPLOYMENT_01', 'EARTH_ORBIT_DELIVERY_01'],
    unlocked: true, // Initial chapter unlocked by default
    completed: false,
    unlockedTimestamp: Date.now(),
  },
  {
    number: 2,
    id: CampaignChapterId.CHAPTER_2_LUNAR_INITIATIVE,
    codename: 'LUNAR INITIATIVE',
    title: 'Cislunar Exploration & Touchdown',
    subtitle: 'Chapter 2: Trans-Lunar Injection and Robotic Touchdown',
    synopsis:
      'Break free from low Earth orbit, master trans-lunar trajectory mechanics, establish lunar orbit reconnaissance, execute soft landings, and deploy autonomous surface exploration rovers across lunar mare basins.',
    briefingDirectives: [
      'Execute high-precision trans-lunar orbital injection maneuvers.',
      'Map lunar polar ice concentrations and surface topography.',
      'Deliver automated science landers to the lunar regolith.',
      'Traverse crater rims with robotic rover science payloads.',
    ],
    keyDestinations: [DestinationId.MOON],
    primaryMissions: ['MOON_ORBIT_SURVEY_01', 'MOON_LANDER_DELIVERY_01', 'MOON_ROVER_EXPLORATION_01'],
    unlocked: false,
    completed: false,
    requiredPrecedingChapter: 1,
  },
  {
    number: 3,
    id: CampaignChapterId.CHAPTER_3_EXPANDING_ORGANISATION,
    codename: 'EXPANDING THE ORGANISATION',
    title: 'Infrastructure & Deep Space Telecom',
    subtitle: 'Chapter 3: Upgrading Facilities and Global Spacecraft Networks',
    synopsis:
      'Strengthen organisational resilience by modernizing R&D centers, expanding launchpads, establishing high-bandwidth geosynchronous satellite relays, and diversifying commercial payload contracts.',
    briefingDirectives: [
      'Upgrade Communications Centre and Ground Station dish arrays.',
      'Deploy geostationary telecom relays to eradicate carrier blackouts.',
      'Expand manufacturing throughput and advanced engine research.',
      'Deploy initial cislunar operational logistics outposts.',
    ],
    keyDestinations: [DestinationId.EARTH_ORBIT_MEO, DestinationId.EARTH_ORBIT_GEO, DestinationId.MOON],
    primaryMissions: ['EARTH_MEO_COMM_TEST_01', 'EARTH_GEO_RELAY_01', 'MOON_STATION_DEPLOYMENT_01'],
    unlocked: false,
    completed: false,
    requiredPrecedingChapter: 2,
  },
  {
    number: 4,
    id: CampaignChapterId.CHAPTER_4_MARS_EXPEDITION,
    codename: 'MARS EXPEDITION',
    title: 'The Red Planet Horizon',
    subtitle: 'Chapter 4: Interplanetary Cruise, Atmospheric Entry, and Martian Science',
    synopsis:
      'Cross the interplanetary gulf to Mars. Master aerocapture and atmospheric entry profiles, deploy climate observation orbiters, and conduct core drill sample acquisitions with automated rovers in ancient lakebeds.',
    briefingDirectives: [
      'Calculate trans-Mars injection launch windows and mid-course burns.',
      'Deploy Mars climate surveyors into stable areostationary orbits.',
      'Survive hypersonic Entry, Descent, and Landing (EDL) sequence.',
      'Extract subsurface core samples with autonomous Martian rovers.',
    ],
    keyDestinations: [DestinationId.MARS, DestinationId.PHOBOS, DestinationId.DEIMOS],
    primaryMissions: ['MARS_ORBITER_01', 'MARS_ROVER_EXPLORATION_01'],
    unlocked: false,
    completed: false,
    requiredPrecedingChapter: 3,
  },
  {
    number: 5,
    id: CampaignChapterId.CHAPTER_5_INNER_SOLAR_SYSTEM,
    codename: 'INNER SOLAR SYSTEM',
    title: 'Infernal Skies & Solar Proximity',
    subtitle: 'Chapter 5: Exploring Venus and Mercury under Extreme Environments',
    synopsis:
      'Design hardened spacecraft capable of withstanding the crushing atmospheric pressure and corrosive clouds of Venus, and the searing thermal radiation and orbital gravity wells of Mercury.',
    briefingDirectives: [
      'Deploy synthetic aperture radar orbiters to map Venusian volcanic plains.',
      'Drop hardened atmospheric entry probes into supercritical carbon dioxide skies.',
      'Execute complex gravity-assist decelerations toward Mercury.',
      'Study magnetospheric interactions under intense solar irradiance.',
    ],
    keyDestinations: [DestinationId.VENUS, DestinationId.MERCURY],
    primaryMissions: ['VENUS_ORBITAL_RADAR_01', 'VENUS_SURFACE_LANDER_01'],
    unlocked: false,
    completed: false,
    requiredPrecedingChapter: 4,
  },
  {
    number: 6,
    id: CampaignChapterId.CHAPTER_6_ASTEROID_EXPLORATION,
    codename: 'ASTEROID EXPLORATION',
    title: 'Treasures of the Main Belt',
    subtitle: 'Chapter 6: Microgravity Proximity Operations and Sample Returns',
    synopsis:
      'Navigate the Asteroid Belt to rendezvous with carbonaceous and metal-rich planetesimals, conduct touch-and-go sampling operations, and deliver pristine extraterrestrial material capsules safely back to Earth.',
    briefingDirectives: [
      'Intercept and orbit dwarf planet Ceres and protoplanet Vesta.',
      'Conduct 3D laser altimetry and mineralogical composition surveys.',
      'Execute microgravity tag-and-collect sample acquisitions.',
      'Recover high-speed atmospheric sample return capsules.',
    ],
    keyDestinations: [DestinationId.ASTEROID_BELT, DestinationId.CERES, DestinationId.VESTA],
    primaryMissions: ['ASTEROID_PROXIMITY_SURVEY_01', 'ASTEROID_SAMPLE_RETURN_01'],
    unlocked: false,
    completed: false,
    requiredPrecedingChapter: 5,
  },
  {
    number: 7,
    id: CampaignChapterId.CHAPTER_7_OUTER_SOLAR_SYSTEM,
    codename: 'OUTER SOLAR SYSTEM',
    title: 'Realm of the Gas Giants',
    subtitle: 'Chapter 7: Ocean Worlds and Atmospheric Probing at Jupiter & Saturn',
    synopsis:
      'Deploy deep-space flagship orbiters through the radiation belts of Jupiter and ring systems of Saturn. Fly through the cryovolcanic water plumes of Europa and drop aerial drone explorers into the dense methane atmosphere of Titan.',
    briefingDirectives: [
      'Perform Jovian orbital capture using multi-body gravity assists.',
      'Sample water vapor plumes erupting from Europa’s subsurface ocean.',
      'Map the fine structure and composition of Saturn’s ring system.',
      'Fly an autonomous aerial sampling drone through Titan’s atmosphere.',
    ],
    keyDestinations: [
      DestinationId.JUPITER,
      DestinationId.EUROPA,
      DestinationId.SATURN,
      DestinationId.TITAN,
      DestinationId.ENCELADUS,
    ],
    primaryMissions: [
      'JUPITER_ORBITAL_OBSERVATION_01',
      'EUROPA_PLUME_SURVEY_01',
      'SATURN_RING_SURVEY_01',
      'TITAN_AERIAL_EXPLORATION_01',
    ],
    unlocked: false,
    completed: false,
    requiredPrecedingChapter: 6,
  },
  {
    number: 8,
    id: CampaignChapterId.CHAPTER_8_OUTER_FRONTIER,
    codename: 'OUTER FRONTIER',
    title: 'The Edge of Interstellar Space',
    subtitle: 'Chapter 8: Ice Giants Uranus, Neptune, and the Kuiper Boundary',
    synopsis:
      'Journey to the outer limits of the planetary system. Explore the tilted magnetosphere of Uranus, probe the supersonic storms of Neptune, map retrograde moon Triton, and crown the organisation’s legacy as Solar System Cartographer.',
    briefingDirectives: [
      'Execute multi-decade trajectory cruises powered by radioisotope generators.',
      'Conduct orbital reconnaissance of the ice giant Uranus.',
      'Deploy high-velocity entry probes into Neptune’s dynamic atmosphere.',
      'Verify planetary science milestones across all major celestial bodies.',
    ],
    keyDestinations: [DestinationId.URANUS, DestinationId.NEPTUNE, DestinationId.TRITON],
    primaryMissions: ['URANUS_ORBITAL_RECON_01', 'NEPTUNE_ATMOSPHERIC_PROBE_01'],
    unlocked: false,
    completed: false,
    requiredPrecedingChapter: 7,
  },
];
