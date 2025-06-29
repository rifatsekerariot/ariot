const militaryConfig = {
  // Güvenlik seviyeleri
  securityClassification: {
    level: 'SECRET', // UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET
    compartments: ['NOFORN', 'EYES_ONLY'],
    caveat: 'REL_TO_USA_NATO'
  },

  // Askeri standartlar
  militaryStandards: {
    encryption: 'FIPS-140-2-Level-3',
    keyManagement: 'NSA-Suite-B',
    authentication: 'PKI-CAC',
    integrity: 'HMAC-SHA-256',
    availability: '99.999%'
  },

  // TEMPEST koruması
  tempestProtection: {
    enabled: true,
    emissionSuppression: 80, // dB
    shieldingClass: 'ZONE-1',
    redBlackSeparation: true
  },

  // Anti-jamming
  antiJamming: {
    frequencyHopping: {
      enabled: true,
      hopRate: 1000, // hops/second
      channels: 79,
      syncWord: 'CLASSIFIED'
    },
    spreadSpectrum: {
      enabled: true,
      chippingRate: 11e6, // 11 Mcps
      processingGain: 10.4 // dB
    },
    powerControl: {
      enabled: true,
      minPower: -20, // dBm
      maxPower: 30, // dBm
      adaptiveControl: true
    }
  },

  // Covert operations
  covertOperations: {
    lowProbabilityDetection: true,
    emissionControl: 'STRICT',
    timingObfuscation: true,
    trafficAnalysisResistance: true
  },

  // Uzay sanayi konfigürasyonu
  spaceGrade: {
    radiationHardening: {
      enabled: true,
      totalDose: 100, // krad
      seuRate: 1e-10, // upsets/bit/second
      errorCorrection: 'Reed-Solomon-255-223'
    },
    thermalManagement: {
      operatingRange: [-55, 125], // Celsius
      thermalCycling: 1000, // cycles
      heatDissipation: 'passive'
    },
    atomicClock: {
      enabled: true,
      accuracy: 1e-15, // fractional frequency stability
      holdover: 24 // hours
    }
  },

  // AGV real-time konfigürasyonu
  agvRealTime: {
    safetyIntegrityLevel: 'SIL-3',
    deterministicLatency: 10, // ms
    jitterTolerance: 1, // ms
    reliabilityTarget: 0.999999, // Six nines
    
    emergencyResponse: {
      maxStopTime: 50, // ms
      reactionTime: 10, // ms
      failsafeMode: 'IMMEDIATE_STOP'
    },
    
    pathPlanning: {
      algorithm: 'A*',
      planningHorizon: 10, // seconds
      replanningRate: 10, // Hz
      obstacleAvoidance: 'VELOCITY_OBSTACLE'
    }
  },

  // Ağ topolojisi
  networkTopology: {
    architecture: 'MESH',
    redundancy: 'TRIPLE',
    failoverTime: 1, // ms
    selfHealing: true,
    
    backbone: {
      protocol: 'AFDX-ENHANCED',
      bandwidth: '1Gbps',
      latency: '1ms',
      jitter: '100us'
    }
  },

  // Görev kritik parametreler
  missionCritical: {
    availability: '99.9999%', // Six nines
    reliability: 'FAULT_TOLERANT',
    maintainability: 'HOT_SWAPPABLE',
    testability: 'BUILT_IN_TEST',
    
    redundancy: {
      level: 'TRIPLE_MODULAR',
      voting: 'MAJORITY',
      failureDetection: 'IMMEDIATE',
      recovery: 'AUTOMATIC'
    }
  },

  // Performans metrikleri
  performanceTargets: {
    latency: {
      emergency: 1, // ms
      critical: 5, // ms
      operational: 10, // ms
      background: 100 // ms
    },
    
    throughput: {
      minimum: '100Mbps',
      sustained: '500Mbps',
      peak: '1Gbps'
    },
    
    reliability: {
      mtbf: 100000, // hours
      mttr: 15, // minutes
      availability: 0.999999
    }
  },

  // Güvenlik politikaları
  securityPolicies: {
    accessControl: 'RBAC', // Role-Based Access Control
    authentication: 'MULTI_FACTOR',
    authorization: 'ATTRIBUTE_BASED',
    audit: 'COMPREHENSIVE',
    
    dataClassification: {
      levels: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET'],
      handling: 'AUTOMATIC',
      retention: 'POLICY_BASED',
      destruction: 'SECURE_ERASE'
    }
  },

  // Test ve doğrulama
  testingRequirements: {
    functionalTesting: 'COMPREHENSIVE',
    performanceTesting: 'STRESS_LOAD',
    securityTesting: 'PENETRATION',
    reliabilityTesting: 'ACCELERATED_LIFE',
    
    certification: {
      required: ['DO-178C', 'IEC-61508', 'ISO-26262'],
      level: 'DAL-A', // Design Assurance Level A
      verification: 'FORMAL_METHODS'
    }
  }
};

module.exports = militaryConfig;