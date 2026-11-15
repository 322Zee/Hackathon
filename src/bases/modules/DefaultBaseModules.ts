/**
 * INTERSTELLAR CONTINUUM - Default Planetary Base Module Blueprints
 * Fully authored canonical module blueprints covering all required functional facilities.
 * All statistics are balanced educational gameplay metrics.
 */

import {
  BaseModuleDefinition,
  BaseModuleType,
  BasePowerSourceType,
} from '../BaseTypes';

export const DEFAULT_BASE_MODULES: BaseModuleDefinition[] = [
  // =========================================================================
  // 1. HABITATION CORE (Base Starter Core)
  // =========================================================================
  {
    id: 'mod_habitation_core_mk1',
    name: 'Command & Habitation Core Mk I',
    type: BaseModuleType.HABITATION_CORE,
    description: 'Central pressurized command dome providing environmental control, life support, and agency telemetry.',
    tier: 1,
    powerRequirementRating: 30, // Consumes 30 PWR
    powerOutputRating: 0,
    massRating: 150,
    storageRequirementSlots: 1,
    buildCostCredits: 45000,
    buildCostMaterials: 80,
    buildTimeTicks: 15,
    constructionPayloadRequirement: 'payload_station_biolab_node',
    storageCapacityBoost: 200,
    visualAssetKey: 'base_hab_core',
  },

  // =========================================================================
  // 2. RESEARCH STATIONS
  // =========================================================================
  {
    id: 'mod_research_station_mk1',
    name: 'Planetary Laboratory Node Mk I',
    type: BaseModuleType.RESEARCH_STATION,
    description: 'Pressurized analytical laboratory equipped for geological spectrometry and environmental sample assays.',
    tier: 1,
    powerRequirementRating: 50,
    powerOutputRating: 0,
    massRating: 180,
    storageRequirementSlots: 1,
    buildCostCredits: 60000,
    buildCostMaterials: 100,
    buildTimeTicks: 25,
    constructionPayloadRequirement: 'payload_station_biolab_node',
    baseResearchOutput: 15, // Science points per cycle
    visualAssetKey: 'base_research_lab',
  },
  {
    id: 'mod_research_station_mk2',
    name: 'Advanced Science Complex Mk II',
    type: BaseModuleType.RESEARCH_STATION,
    description: 'High-throughput automated laboratory suite with deep-core isotope analyzer and atmospheric mass spectrometer.',
    tier: 2,
    powerRequirementRating: 90,
    powerOutputRating: 0,
    massRating: 260,
    storageRequirementSlots: 1,
    buildCostCredits: 120000,
    buildCostMaterials: 190,
    buildTimeTicks: 45,
    constructionPayloadRequirement: 'payload_station_crystallography',
    baseResearchOutput: 40,
    visualAssetKey: 'base_research_complex',
  },

  // =========================================================================
  // 3. RESOURCE PROCESSING FACILITIES
  // =========================================================================
  {
    id: 'mod_resource_processing_mk1',
    name: 'In-Situ Mineral Refinery Mk I',
    type: BaseModuleType.RESOURCE_PROCESSING,
    description: 'Thermal beneficiation and chemical separation plant processing raw regolith into refined construction materials.',
    tier: 1,
    powerRequirementRating: 75,
    powerOutputRating: 0,
    massRating: 220,
    storageRequirementSlots: 1,
    buildCostCredits: 50000,
    buildCostMaterials: 120,
    buildTimeTicks: 30,
    constructionPayloadRequirement: 'payload_mfg_regolith_sinterer',
    processingCapacity: 25, // Refines up to 25 units per cycle
    storageCapacityBoost: 300,
    visualAssetKey: 'base_refinery_plant',
  },
  {
    id: 'mod_resource_processing_mk2',
    name: 'Chemical & Volatiles Synthesizer Mk II',
    type: BaseModuleType.RESOURCE_PROCESSING,
    description: 'Advanced cryogenic distillation and Sabatier reactor array extracting purified water, oxygen, and liquid fuels.',
    tier: 2,
    powerRequirementRating: 110,
    powerOutputRating: 0,
    massRating: 310,
    storageRequirementSlots: 1,
    buildCostCredits: 115000,
    buildCostMaterials: 220,
    buildTimeTicks: 50,
    constructionPayloadRequirement: 'payload_mfg_sabatier_plant',
    processingCapacity: 60,
    storageCapacityBoost: 600,
    visualAssetKey: 'base_volatiles_plant',
  },

  // =========================================================================
  // 4. COMMUNICATIONS RELAYS
  // =========================================================================
  {
    id: 'mod_comms_relay_mk1',
    name: 'Surface Telemetry Relay Mk I',
    type: BaseModuleType.COMMUNICATIONS_RELAY,
    description: 'High-gain steerable parabolic dish providing reliable telemetry connection to orbital satellites and Earth.',
    tier: 1,
    powerRequirementRating: 40,
    powerOutputRating: 0,
    massRating: 90,
    storageRequirementSlots: 1,
    buildCostCredits: 35000,
    buildCostMaterials: 60,
    buildTimeTicks: 20,
    constructionPayloadRequirement: 'payload_sat_pioneer_transponder',
    commsGainDb: 18,
    visualAssetKey: 'base_comms_dish',
  },
  {
    id: 'mod_comms_relay_mk2',
    name: 'Optical Deep-Space Transceiver Mk II',
    type: BaseModuleType.COMMUNICATIONS_RELAY,
    description: 'Precision near-infrared optical terminal transmitting ultra-high bandwidth data across interplanetary distances.',
    tier: 2,
    powerRequirementRating: 65,
    powerOutputRating: 0,
    massRating: 140,
    storageRequirementSlots: 1,
    buildCostCredits: 85000,
    buildCostMaterials: 110,
    buildTimeTicks: 35,
    constructionPayloadRequirement: 'payload_relay_optical_laser',
    commsGainDb: 32,
    visualAssetKey: 'base_comms_laser',
  },

  // =========================================================================
  // 5. POWER FACILITIES
  // =========================================================================
  {
    id: 'mod_power_solar_array_mk1',
    name: 'Photovoltaic Array Mk I',
    type: BaseModuleType.POWER_FACILITY,
    description: 'High-efficiency dual-axis tracking solar collector array with integrated dust-repellent coatings.',
    tier: 1,
    powerRequirementRating: 0,
    powerOutputRating: 120, // Net 120 PWR generation
    powerSourceType: BasePowerSourceType.SOLAR_ARRAY,
    massRating: 80,
    storageRequirementSlots: 1,
    buildCostCredits: 30000,
    buildCostMaterials: 70,
    buildTimeTicks: 15,
    constructionPayloadRequirement: 'payload_pwr_solar_wing',
    visualAssetKey: 'base_power_solar',
  },
  {
    id: 'mod_power_fission_reactor_mk1',
    name: 'Compact Fission Reactor Mk I',
    type: BaseModuleType.POWER_FACILITY,
    description: 'Shielded enriched solid-core nuclear reactor with closed Stirling generators providing continuous day/night power.',
    tier: 1,
    powerRequirementRating: 0,
    powerOutputRating: 250, // Net 250 PWR generation
    powerSourceType: BasePowerSourceType.FISSION_REACTOR,
    massRating: 230,
    storageRequirementSlots: 1,
    buildCostCredits: 95000,
    buildCostMaterials: 180,
    buildTimeTicks: 40,
    constructionPayloadRequirement: 'payload_pwr_fission_reactor',
    visualAssetKey: 'base_power_fission',
  },
  {
    id: 'mod_power_fuel_cell_mk1',
    name: 'Regenerative Fuel Cell Bank Mk I',
    type: BaseModuleType.POWER_FACILITY,
    description: 'Electrochemical hydrogen-oxygen energy buffer smoothing peak power loads and providing emergency reserves.',
    tier: 1,
    powerRequirementRating: 0,
    powerOutputRating: 80,
    powerSourceType: BasePowerSourceType.FUEL_CELL,
    massRating: 110,
    storageRequirementSlots: 1,
    buildCostCredits: 25000,
    buildCostMaterials: 50,
    buildTimeTicks: 15,
    constructionPayloadRequirement: 'payload_pwr_fuel_cell',
    visualAssetKey: 'base_power_cell',
  },

  // =========================================================================
  // 6. MANUFACTURING FACILITIES
  // =========================================================================
  {
    id: 'mod_manufacturing_mk1',
    name: 'Fabrication Gantry Mk I',
    type: BaseModuleType.MANUFACTURING_FACILITY,
    description: 'Automated laser-sintering 3D printing gantry fabricating replacement structural struts and equipment shells.',
    tier: 1,
    powerRequirementRating: 80,
    powerOutputRating: 0,
    massRating: 250,
    storageRequirementSlots: 1,
    buildCostCredits: 70000,
    buildCostMaterials: 160,
    buildTimeTicks: 35,
    constructionPayloadRequirement: 'payload_mfg_regolith_sinterer',
    visualAssetKey: 'base_manufacturing_gantry',
  },

  // =========================================================================
  // 7. MAINTENANCE FACILITIES
  // =========================================================================
  {
    id: 'mod_maintenance_mk1',
    name: 'Surface Equipment Bay Mk I',
    type: BaseModuleType.MAINTENANCE_FACILITY,
    description: 'Pressurized vehicle servicing hangar providing diagnostic testing, part refurbishment, and automated base repairs.',
    tier: 1,
    powerRequirementRating: 50,
    powerOutputRating: 0,
    massRating: 200,
    storageRequirementSlots: 1,
    buildCostCredits: 55000,
    buildCostMaterials: 130,
    buildTimeTicks: 25,
    constructionPayloadRequirement: 'payload_sup_rcs_valves',
    maintenanceWearReduction: 0.20, // 20% wear reduction to entire base
    visualAssetKey: 'base_maintenance_hangar',
  },

  // =========================================================================
  // 8. STORAGE FACILITIES
  // =========================================================================
  {
    id: 'mod_storage_mk1',
    name: 'Logistics Vault Mk I',
    type: BaseModuleType.STORAGE_FACILITY,
    description: 'Reinforced modular warehouse increasing local storage volume for refined cargo, ores, and critical reserves.',
    tier: 1,
    powerRequirementRating: 15,
    powerOutputRating: 0,
    massRating: 120,
    storageRequirementSlots: 1,
    buildCostCredits: 25000,
    buildCostMaterials: 90,
    buildTimeTicks: 15,
    constructionPayloadRequirement: 'payload_cargo_titanium_truss',
    storageCapacityBoost: 800, // +800 units storage
    visualAssetKey: 'base_storage_vault',
  },
  {
    id: 'mod_storage_mk2',
    name: 'Logistics Vault Mk II',
    type: BaseModuleType.STORAGE_FACILITY,
    description: 'Expanded pressurized logistical depot featuring automated container routing and cryogenic storage bays.',
    tier: 2,
    powerRequirementRating: 25,
    powerOutputRating: 0,
    massRating: 220,
    storageRequirementSlots: 1,
    buildCostCredits: 55000,
    buildCostMaterials: 170,
    buildTimeTicks: 30,
    constructionPayloadRequirement: 'payload_cargo_titanium_truss',
    storageCapacityBoost: 2000,
    visualAssetKey: 'base_storage_depot',
  },
];
