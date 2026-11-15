/**
 * INTERSTELLAR CONTINUUM - Educational Content Provider
 * Synthesizes concise, scientifically responsible educational telemetry,
 * physical characteristics, notable moons, major scientific interests,
 * and key engineering exploration challenges across the Solar System.
 */

import { DestinationRecord, DestinationId, DestinationCategory } from '../DestinationTypes';
import { DestinationRegistry } from '../DestinationRegistry';
import { EducationalDestinationSummary } from './NavigationTypes';

export class EducationalContentProvider {
  private static instance: EducationalContentProvider | null = null;

  public static getInstance(): EducationalContentProvider {
    if (!EducationalContentProvider.instance) {
      EducationalContentProvider.instance = new EducationalContentProvider();
    }
    return EducationalContentProvider.instance;
  }

  public static resetInstance(): void {
    EducationalContentProvider.instance = null;
  }

  public getSummary(destOrId: string | DestinationRecord): EducationalDestinationSummary {
    return EducationalContentProvider.getSummary(destOrId);
  }

  /**
   * Generates a concise educational telemetry summary for any registered celestial destination.
   */
  public static getSummary(destOrId: string | DestinationRecord): EducationalDestinationSummary {
    let dest: DestinationRecord;
    if (typeof destOrId === 'string') {
      const found = DestinationRegistry.getInstance().getDestination(destOrId);
      if (found) {
        dest = found;
      } else {
        return {
          destinationId: destOrId,
          classification: 'Unclassified Celestial Target',
          planetaryRadiusKm: 1000,
          surfaceGravityG: 1.0,
          atmosphericPressureSummary: 'Unknown',
          atmosphericComposition: 'Spectrometry pending',
          surfaceTemperatureRange: 'Pending telemetry',
          dayLengthSummary: 'Undetermined',
          notableMoons: [],
          majorScientificInterests: ['Orbital survey', 'Spectroscopic imaging'],
          explorationChallenges: ['Communications latency', 'Autonomous navigation'],
          funFact: 'Deep space exploration probe telemetry under calibration.',
        };
      }
    } else {
      dest = destOrId;
    }

    const id = dest.id;

    // Tailored educational insights by destination ID
    switch (id) {
      case DestinationId.SUN:
        return {
          destinationId: id,
          classification: 'Yellow Dwarf Main-Sequence Star (Spectral Type G2V)',
          planetaryRadiusKm: 696340,
          surfaceGravityG: 27.9,
          atmosphericPressureSummary: 'Coronal gas envelope; plasma density varies',
          atmosphericComposition: '73.4% Hydrogen, 25.0% Helium, 1.6% heavier ions',
          surfaceTemperatureRange: '5,500°C (Photosphere) to 15,000,000°C (Core)',
          dayLengthSummary: 'Differential rotation (~25 days equator, ~35 days poles)',
          notableMoons: [],
          majorScientificInterests: [
            'Coronal heating mechanisms and solar magnetic dynamo generation.',
            'Coronal mass ejections (CMEs) and solar wind space weather impacts.',
            'Thermonuclear fusion boundary dynamics and helioseismology.',
          ],
          explorationChallenges: [
            'Extreme thermal radiation flux requiring multi-layer carbon-composite heat shields.',
            'Relativistic solar energetic particles and coronal plasma bombardment.',
            'Immense gravitational well demanding enormous delta-V for close perihelion insertion.',
          ],
          funFact: 'The Sun accounts for approximately 99.86% of the total mass of the entire Solar System.',
        };

      case DestinationId.MERCURY:
        return {
          destinationId: id,
          classification: 'Terrestrial Rocky Planet (Airless Desert World)',
          planetaryRadiusKm: 2439.7,
          surfaceGravityG: 0.38,
          atmosphericPressureSummary: 'Surface-bounded exosphere (~10⁻¹⁴ bar)',
          atmosphericComposition: 'Trace Sodium, Magnesium, Oxygen, and Hydrogen ions',
          surfaceTemperatureRange: '-180°C (Night) to +430°C (Day)',
          dayLengthSummary: '58.6 Earth days (3:2 spin-orbit resonance)',
          notableMoons: [],
          majorScientificInterests: [
            'Disproportionately massive metallic iron-nickel core occupying ~85% of planetary radius.',
            'Global tectonic contraction scarps (Discovery Rupes) exceeding 1 km in height.',
            'Permanently shadowed polar craters harboring water ice deposits.',
          ],
          explorationChallenges: [
            'Unfiltered solar radiation requiring ceramic sunshields and optical solar reflectors.',
            'Extreme diurnal temperature delta of over 600°C stressing vehicle metallurgy.',
            'High orbital insertion delta-V due to deep solar gravitational well.',
          ],
          funFact: 'Mercury experiences a phenomenon where the Sun appears to rise, stop, reverse direction, and set again.',
        };

      case DestinationId.VENUS:
        return {
          destinationId: id,
          classification: 'Terrestrial Rocky Planet (Supercritical Greenhouse Furnace)',
          planetaryRadiusKm: 6051.8,
          surfaceGravityG: 0.904,
          atmosphericPressureSummary: '92.0 bar (Supercritical fluid regime at surface)',
          atmosphericComposition: '96.5% Carbon Dioxide, 3.5% Nitrogen, trace SO₂ and H₂SO₄',
          surfaceTemperatureRange: '+462°C to +467°C (Uniform globally)',
          dayLengthSummary: '243 Earth days (Retrograde rotation; day longer than year)',
          notableMoons: [],
          majorScientificInterests: [
            'Runaway greenhouse climate catastrophe evolution and early hydrosphere loss.',
            'Active basaltic volcanism, volcanic coronae, and pancake lava domes.',
            'Super-rotating upper cloud decks potentially harboring aerial astrobiological niches.',
          ],
          explorationChallenges: [
            'Ocean-depth pressures (92 bar) requiring spherical titanium pressure hulls.',
            'Furnace temperatures reflowing conventional solder within hours.',
            'Corrosive concentrated sulfuric acid droplets encountered during atmospheric descent.',
          ],
          funFact: 'Venus rotates backward compared to most planets, with the Sun rising in the west and setting in the east.',
        };

      case DestinationId.EARTH:
        return {
          destinationId: id,
          classification: 'Terrestrial Ocean World (Active Biosphere & Technosphere)',
          planetaryRadiusKm: 6371.0,
          surfaceGravityG: 1.0,
          atmosphericPressureSummary: '1.013 bar (1.0 atm at sea level)',
          atmosphericComposition: '78.08% Nitrogen, 20.95% Oxygen, 0.93% Argon, trace CO₂/H₂O',
          surfaceTemperatureRange: '-89°C (Antarctica) to +58°C (Deserts)',
          dayLengthSummary: '23 hours, 56 minutes, 4 seconds (1 Sidereal Day)',
          notableMoons: ['The Moon (Luna)'],
          majorScientificInterests: [
            'Dynamic plate tectonics maintaining biogeochemical carbon-silicate cycles.',
            'Global protective magnetosphere deflecting ionizing cosmic and solar radiation.',
            'Aerospace headquarters base of operations and terrestrial departure port.',
          ],
          explorationChallenges: [
            'High surface gravity requiring multi-stage chemical propulsion for orbital launch.',
            'Dense lower tropospheric weather and aerodynamic drag regimes.',
            'Orbital debris accumulation management across low-Earth orbital regimes.',
          ],
          funFact: 'Earth is the only planetary body known to sustain surface liquid water, plate tectonics, and organic life.',
        };

      case DestinationId.MOON:
        return {
          destinationId: id,
          classification: 'Major Natural Satellite (Airless Silicate World)',
          planetaryRadiusKm: 1737.4,
          surfaceGravityG: 0.165,
          atmosphericPressureSummary: 'Hard vacuum (<10⁻¹² bar exosphere)',
          atmosphericComposition: 'Trace Helium, Neon, Hydrogen, and Argon',
          surfaceTemperatureRange: '-130°C (Night) to +120°C (Day); -246°C in polar traps',
          dayLengthSummary: '27.3 Earth days (Synchronously tidal-locked to Earth)',
          notableMoons: [],
          majorScientificInterests: [
            'Pristine early Solar System impact bombardment record preserved in ancient crust.',
            'Cryogenic volatile and water-ice deposits trapped within permanently shadowed polar craters.',
            'In-situ resource utilization (ISRU) feasibility via ilmenite regolith reduction for oxygen.',
          ],
          explorationChallenges: [
            'Extremely abrasive, razor-sharp electrostatic regolith particles adhering to spacesuits.',
            'Hard vacuum requiring self-contained pressurized life support and thermal management.',
            'High-contrast, pitch-black shadow boundaries causing severe visual disorientation.',
          ],
          funFact: 'The Moon is in synchronous rotation with Earth, meaning the exact same hemisphere always faces our planet.',
        };

      case DestinationId.MARS:
        return {
          destinationId: id,
          classification: 'Terrestrial Rocky Planet (Cold Ferric Desert World)',
          planetaryRadiusKm: 3389.5,
          surfaceGravityG: 0.379,
          atmosphericPressureSummary: '0.006 bar (610 Pa average; varies with polar CO₂ cycles)',
          atmosphericComposition: '95.3% Carbon Dioxide, 2.6% Nitrogen, 1.9% Argon, trace O₂/H₂O',
          surfaceTemperatureRange: '-125°C (Polar winter) to +20°C (Equatorial summer)',
          dayLengthSummary: '24 hours, 37 minutes, 22 seconds (1 Sol)',
          notableMoons: ['Phobos', 'Deimos'],
          majorScientificInterests: [
            'Ancient paleolake deltas, fluvial valley networks, and biosignature preservation potential.',
            'Vast volcanic edifices (Olympus Mons) and monumental tectonic canyons (Valles Marineris).',
            'Sub-surface permafrost ice reserves and seasonal methane atmospheric spikes.',
          ],
          explorationChallenges: [
            'Global dust storms capable of obscuring solar irradiance for months.',
            'Toxic perchlorate salts pervading the surface regolith posing biological hazards.',
            'Thin atmosphere providing insufficient aerodynamic braking while preventing simple vacuum landings.',
          ],
          funFact: 'Olympus Mons on Mars is the tallest known planetary volcano, towering over 21 kilometers above datum.',
        };

      case DestinationId.ASTEROID_BELT:
      case DestinationId.CERES:
      case DestinationId.VESTA:
        return {
          destinationId: id,
          classification: 'Circumsolar Debris Belt / Protoplanetary Embryos',
          planetaryRadiusKm: dest.physicalCharacteristics.radiusKm || 473,
          surfaceGravityG: dest.physicalCharacteristics.surfaceGravityG || 0.029,
          atmosphericPressureSummary: 'Absolute vacuum',
          atmosphericComposition: 'None (Sublimated water vapor transient exosphere on Ceres)',
          surfaceTemperatureRange: '-106°C to -73°C',
          dayLengthSummary: 'Varies by body (4.6 to 9.1 hours rotation)',
          notableMoons: [],
          majorScientificInterests: [
            'Pristine refractory and volatile building blocks preserved from Solar System formation.',
            'Sub-surface muddy brine ocean and sodium carbonate bright faculae on dwarf planet Ceres.',
            'Differentiated basaltic crust and metal-rich core remnants on asteroid Vesta.',
          ],
          explorationChallenges: [
            'Microgravity regimes where escape velocity is lower than a human sprint (<5 m/s).',
            'Rubble-pile structural instability risking localized collapse during drilling operations.',
            'Irregular non-spherical gravitational fields complicating close orbital proximity navigation.',
          ],
          funFact: 'Ceres contains an estimated 25% water ice by mass—holding more freshwater than Earth.',
        };

      case DestinationId.JUPITER:
        return {
          destinationId: id,
          classification: 'Jovian Gas Giant (Massive Hydrogen-Helium World)',
          planetaryRadiusKm: 69911,
          surfaceGravityG: 2.528,
          atmosphericPressureSummary: 'Endless depth gradient (>1000 bar deep within envelope)',
          atmosphericComposition: '89.8% Hydrogen, 10.2% Helium, trace CH₄, NH₃, H₂O',
          surfaceTemperatureRange: '-108°C (1 bar level) to +24,000°C (Metallic hydrogen mantle)',
          dayLengthSummary: '9 hours, 55 minutes, 30 seconds (Fastest planetary rotation)',
          notableMoons: ['Io', 'Europa', 'Ganymede', 'Callisto'],
          majorScientificInterests: [
            'Interior transition from molecular hydrogen to liquid metallic hydrogen.',
            'Century-scale atmospheric vortex storms including the Great Red Spot.',
            'Immense magnetosphere and trapped relativistic radiation belt interactions.',
          ],
          explorationChallenges: [
            'Strictly non-walkable: descending spacecraft face crushing pressures and thermal vaporization.',
            'Lethal ionizing radiation belt flux requiring deep lead-tantalum vault hardening.',
            'Supersonic atmospheric jet streams and megawatt electrical superbolts.',
          ],
          funFact: 'Jupiter is 2.5 times more massive than all the other planets in the Solar System combined.',
        };

      case DestinationId.EUROPA:
        return {
          destinationId: id,
          classification: 'Galilean Natural Satellite (Sub-Surface Cryogenic Ocean World)',
          planetaryRadiusKm: 1560.8,
          surfaceGravityG: 0.134,
          atmosphericPressureSummary: 'Trace radiolytic oxygen exosphere (~10⁻¹¹ bar)',
          atmosphericComposition: 'Molecular Oxygen (O₂) produced by water radiolysis',
          surfaceTemperatureRange: '-220°C to -160°C',
          dayLengthSummary: '3.55 Earth days (Tidally locked to Jupiter)',
          notableMoons: [],
          majorScientificInterests: [
            'Global sub-surface liquid water ocean holding twice the water of all Earth oceans combined.',
            'Tidal heating from orbital resonance driving hydrothermal vents at the ocean floor.',
            'Astrobiological potential for chemotrophic life beneath the ice crust.',
          ],
          explorationChallenges: [
            'Severe trapped Jovian ionizing radiation dosage lethal to unshielded electronics.',
            'Chaotic ice terrain with deep tectonic double-ridges and crevasse fields.',
            'Thick ice shell (15–25 km) requiring advanced thermal melt probes for interior access.',
          ],
          funFact: 'Europa is one of the smoothest solid bodies in the Solar System, lacking major impact craters.',
        };

      case DestinationId.SATURN:
        return {
          destinationId: id,
          classification: 'Ringed Gas Giant (Low-Density Hydrogen Giant)',
          planetaryRadiusKm: 58232,
          surfaceGravityG: 1.065,
          atmosphericPressureSummary: 'Continuous gas envelope (>1000 bar at depth)',
          atmosphericComposition: '96.3% Hydrogen, 3.25% Helium, trace methane and ammonia',
          surfaceTemperatureRange: '-139°C (1 bar level)',
          dayLengthSummary: '10 hours, 33 minutes, 38 seconds',
          notableMoons: ['Titan', 'Enceladus', 'Mimas', 'Rhea', 'Iapetus'],
          majorScientificInterests: [
            'Spectacular water-ice ring disc spanning 282,000 km yet only ~10 meters thick.',
            'North polar atmospheric hexagonal jet stream wave system.',
            'Diverse satellite zoo spanning prebiotic atmospheres to cryogenic geysers.',
          ],
          explorationChallenges: [
            'Non-walkable gas envelope: orbital observation or destructive atmospheric probes only.',
            'Ring plane micrometeoroid hazard during high-inclination orbital transitions.',
            'Low solar irradiance (1% of terrestrial flux) requiring RTG electrical power.',
          ],
          funFact: 'Saturn has a lower density than water—if you had a bathtub large enough, it would float.',
        };

      case DestinationId.TITAN:
        return {
          destinationId: id,
          classification: 'Major Natural Satellite (Dense Nitrogen-Hydrocarbon World)',
          planetaryRadiusKm: 2574.7,
          surfaceGravityG: 0.138,
          atmosphericPressureSummary: '1.45 bar (45% denser than Earth sea level)',
          atmosphericComposition: '95.0% Nitrogen, 4.9% Methane, 0.1% Hydrogen and complex tholins',
          surfaceTemperatureRange: '-179°C (Liquid methane stability regime)',
          dayLengthSummary: '15.9 Earth days (Tidally locked to Saturn)',
          notableMoons: [],
          majorScientificInterests: [
            'Complete active hydrologic cycle substituting liquid methane and ethane for water.',
            'Prebiotic atmospheric photochemical synthesis of complex organic macromolecules.',
            'Deep sub-surface ammonia-water ocean beneath frozen bedrock.',
          ],
          explorationChallenges: [
            'Extreme photochemical orange haze drastically reducing surface solar visibility.',
            'Cryogenic hydrocarbon drowning risk requiring amphibious or buoyant landing craft.',
            'Deep cold (-179°C) requiring vacuum thermal insulation and radioisotope heating.',
          ],
          funFact: 'Titan is the only moon in the Solar System with a dense, substantial atmosphere and surface liquid lakes.',
        };

      case DestinationId.ENCELADUS:
        return {
          destinationId: id,
          classification: 'Major Natural Satellite (Cryovolcanic Ocean World)',
          planetaryRadiusKm: 252.1,
          surfaceGravityG: 0.011,
          atmosphericPressureSummary: 'Transient water-vapor plumes in vacuum',
          atmosphericComposition: 'Water vapor, Molecular Nitrogen, Carbon Dioxide, and Methane',
          surfaceTemperatureRange: '-198°C (Equator) to -133°C (Tiger stripe vents)',
          dayLengthSummary: '1.37 Earth days (Tidally locked to Saturn)',
          notableMoons: [],
          majorScientificInterests: [
            'Active hydrothermal ocean venting water, salts, and complex organics directly into space.',
            'Cryovolcanic plume flyby sampling without needing to drill through the ice crust.',
            'E-ring generation mechanism driven by supersonic south polar cryo-geysers.',
          ],
          explorationChallenges: [
            'Highest albedo body in the Solar System (0.99) causing blinding optical reflection.',
            'Extremely low surface gravity (0.011 g) requiring micro-thruster or harpoon anchoring.',
            'Cryogenic temperatures requiring heated propellant manifolds and mechanism enclosures.',
          ],
          funFact: 'The fresh, pure water ice covering Enceladus makes it the most reflective celestial body in our Solar System.',
        };

      case DestinationId.URANUS:
      case DestinationId.NEPTUNE:
        return {
          destinationId: id,
          classification: id === DestinationId.URANUS ? 'Tilted Ice Giant (Pale Cyan World)' : 'Dynamic Ice Giant (Deep Azure Storm World)',
          planetaryRadiusKm: dest.physicalCharacteristics.radiusKm || 25362,
          surfaceGravityG: dest.physicalCharacteristics.surfaceGravityG || 0.886,
          atmosphericPressureSummary: 'Supercritical supercritical gas envelope',
          atmosphericComposition: '83% Hydrogen, 15% Helium, 2% Methane (absorbing red light)',
          surfaceTemperatureRange: '-214°C to -224°C',
          dayLengthSummary: id === DestinationId.URANUS ? '17.2 hours (97.8° extreme axial tilt)' : '16.1 hours',
          notableMoons: id === DestinationId.URANUS ? ['Titania', 'Oberon', 'Miranda'] : ['Triton'],
          majorScientificInterests: [
            'Deep mantle composition: high-pressure supercritical water-ammonia-methane "ice" slurry.',
            'Supersonic wind speeds exceeding 2,100 km/h in Neptune\'s dynamic atmosphere.',
            'Triton retrograde orbit capturing Kuiper Belt origin and active nitrogen cryo-geysers.',
          ],
          explorationChallenges: [
            'Extreme transit distance (19 to 30 AU) resulting in round-trip radio delays up to 8 hours.',
            'Non-walkable fluid envelope requiring aerodynamic probes with ablative heat shields.',
            'Minimal solar energy necessitating high-power radioisotope power sources.',
          ],
          funFact: id === DestinationId.URANUS ? 'Uranus rotates on its side with an axial tilt of 98 degrees, effectively rolling along its orbit.' : 'Neptune possesses the fastest planetary winds in the Solar System, blowing at over five times the speed of sound.',
        };

      default:
        return {
          destinationId: id,
          classification: `${dest.category} // ${dest.environment}`,
          planetaryRadiusKm: dest.physicalCharacteristics.radiusKm || 1000,
          surfaceGravityG: dest.physicalCharacteristics.surfaceGravityG || 1.0,
          atmosphericPressureSummary: dest.atmosphericDetails ? `${dest.atmosphericDetails.surfacePressureAtm} atm` : 'Vacuum',
          atmosphericComposition: dest.atmosphericDetails?.compositionSummary || 'No significant atmosphere',
          surfaceTemperatureRange: dest.physicalCharacteristics.surfaceTemperatureRangeKelvin
            ? `${dest.physicalCharacteristics.surfaceTemperatureRangeKelvin.min} K to ${dest.physicalCharacteristics.surfaceTemperatureRangeKelvin.max} K`
            : 'Uncalibrated',
          dayLengthSummary: `${dest.physicalCharacteristics.rotationPeriodHours || 24} hours`,
          notableMoons: dest.subDestinationIds.map(String),
          majorScientificInterests: ['Geological mapping and regional composition survey.'],
          explorationChallenges: ['Spacecraft autonomous guidance and radio communications latency.'],
          funFact: dest.description.substring(0, 120) + '...',
        };
    }
  }
}
