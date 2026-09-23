/**
 * FixMyCampus - Data Layer & LocalStorage State Management
 */

const STORAGE_KEY = 'fixmycampus_issues_db_v1';

// Initial Mock Dataset matching user requirements
const DEFAULT_ISSUES = [
  {
    id: 'FMC-1024',
    title: 'Water leakage near electrical main switchboard',
    description: 'Continuous dripping from overhead pipes right above the main distribution panel in Block B corridor. Poses immediate short circuit & fire danger.',
    category: 'Electrical',
    priorityScore: 96,
    priorityLevel: 'CRITICAL',
    department: 'Electrical & Maintenance',
    building: 'Block B',
    floor: 'Ground Floor',
    room: 'Main Panel Corridor',
    status: 'In Progress',
    reportedBy: 'Aarav Sharma (Roll #21CS108)',
    date: '2026-09-23',
    timeAgo: '2 hours ago',
    stageIndex: 3, // 0: Reported, 1: AI Analyzed, 2: Assigned, 3: In Progress, 4: Resolved
    aiSummary: 'Extreme hazard: Active water ingress over energized high-voltage junction.',
    recommendedAction: 'Isolate circuit breaker B-02 immediately. Deploy emergency waterproof containment.',
    photoUrl: null,
    duplicateCount: 1
  },
  {
    id: 'FMC-1023',
    title: 'Computer Lab 2 core Wi-Fi router blackout',
    description: 'The primary access point in Lab 2 has stopped broadcasting SSID. 60+ students in Distributed Systems practical unable to push code or access internal servers.',
    category: 'Internet',
    priorityScore: 91,
    priorityLevel: 'CRITICAL',
    department: 'IT & Campus Networks',
    building: 'Technology Tower',
    floor: '2nd Floor',
    room: 'Computer Lab 2',
    status: 'Under Review',
    reportedBy: 'Sneha Patel (Roll #22IT045)',
    date: '2026-09-23',
    timeAgo: '4 hours ago',
    stageIndex: 1,
    aiSummary: 'Critical network infrastructure failure halting scheduled laboratory session.',
    recommendedAction: 'Reboot core PoE switch in Rack TT-2. Check gateway fiber uplink.',
    photoUrl: null,
    duplicateCount: 3
  },
  {
    id: 'FMC-1022',
    title: 'AC unit compressor tripping & rattling noise',
    description: 'The ceiling cassette AC is blowing warm humid air and producing harsh grinding noise every 5 minutes.',
    category: 'Electrical',
    priorityScore: 78,
    priorityLevel: 'HIGH',
    department: 'HVAC & Maintenance',
    building: 'Academic Block 1',
    floor: '2nd Floor',
    room: 'Room 204',
    status: 'In Progress',
    reportedBy: 'Rohan Verma (Roll #23ME019)',
    date: '2026-09-22',
    timeAgo: 'Yesterday',
    stageIndex: 3,
    aiSummary: 'HVAC compressor malfunction causing thermal discomfort in lecture hall.',
    recommendedAction: 'Service condenser coil and check refrigerant pressure level.',
    photoUrl: null,
    duplicateCount: 0
  },
  {
    id: 'FMC-1021',
    title: 'Broken projector HDMI port & distorted lens',
    description: 'Ceiling mounted EPSON projector in Seminar Hall 1 only shows magenta tint and input port is physically loose.',
    category: 'Classroom Equipment',
    priorityScore: 74,
    priorityLevel: 'HIGH',
    department: 'AV Support Team',
    building: 'Main Auditorium Wing',
    floor: '1st Floor',
    room: 'Seminar Hall 1',
    status: 'Assigned',
    reportedBy: 'Kavita Reddy (Roll #21EC088)',
    date: '2026-09-21',
    timeAgo: '2 days ago',
    stageIndex: 2,
    aiSummary: 'AV display malfunction impacting presentation readiness.',
    recommendedAction: 'Replace 10m high-speed HDMI patch cable and realign projector prism.',
    photoUrl: null,
    duplicateCount: 0
  },
  {
    id: 'FMC-1020',
    title: 'Broken ergonomic study chair with exposed steel frame',
    description: 'Arm rest cracked off leaving sharp metal edge. Someone could tear clothes or get injured.',
    category: 'Furniture',
    priorityScore: 35,
    priorityLevel: 'LOW',
    department: 'Carpentry & Estate',
    building: 'Library Building',
    floor: '1st Floor',
    room: 'Room 103 (Reading Hall)',
    status: 'Resolved',
    reportedBy: 'Meera Iyer (Roll #24BT012)',
    date: '2026-09-20',
    timeAgo: '3 days ago',
    stageIndex: 4,
    aiSummary: 'Minor physical damage to seating unit in public reading zone.',
    recommendedAction: 'Replace chair with spare inventory unit from storage depot.',
    photoUrl: null,
    duplicateCount: 0
  },
  {
    id: 'FMC-1019',
    title: 'Restroom tap leaking water continuously',
    description: 'Sink 3 tap faucet washer is degraded, causing continuous water wastage on 3rd floor restroom.',
    category: 'Plumbing',
    priorityScore: 68,
    priorityLevel: 'MEDIUM',
    department: 'Plumbing & Sanitation',
    building: 'Science Block',
    floor: '3rd Floor',
    room: 'Restroom West Wing',
    status: 'Resolved',
    reportedBy: 'Aditya Sen (Roll #22CH033)',
    date: '2026-09-19',
    timeAgo: '4 days ago',
    stageIndex: 4,
    aiSummary: 'Continuous water loss due to valve seal deterioration.',
    recommendedAction: 'Replace ceramic cartridge valve on tap fixture #3.',
    photoUrl: null,
    duplicateCount: 0
  },
  {
    id: 'FMC-1018',
    title: 'Ceiling fan regulator vibrating excessively',
    description: 'Regulator knob at speed 4 and 5 causes high-frequency buzzing and sparks inside the switchbox.',
    category: 'Electrical',
    priorityScore: 84,
    priorityLevel: 'HIGH',
    department: 'Electrical & Maintenance',
    building: 'Block C',
    floor: '2nd Floor',
    room: 'Lecture Theatre 3',
    status: 'In Progress',
    reportedBy: 'Vikram Das (Roll #23EE015)',
    date: '2026-09-18',
    timeAgo: '5 days ago',
    stageIndex: 3,
    aiSummary: 'Electrical switch sparking indicates loose internal wiring contacts.',
    recommendedAction: 'Replace step-regulator module and check grounding wire resistance.',
    photoUrl: null,
    duplicateCount: 0
  }
];

class DataStore {
  constructor() {
    this.init();
  }

  init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ISSUES));
    }
  }

  getIssues() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_ISSUES;
    } catch (e) {
      console.error('Error reading localStorage', e);
      return DEFAULT_ISSUES;
    }
  }

  saveIssues(issues) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  addIssue(newIssue) {
    const issues = this.getIssues();
    const idNum = 1025 + issues.length;
    const item = {
      id: `FMC-${idNum}`,
      date: new Date().toISOString().split('T')[0],
      timeAgo: 'Just now',
      status: 'Under Review',
      stageIndex: 1,
      duplicateCount: 0,
      reportedBy: 'Aarav Sharma (You)',
      ...newIssue
    };
    issues.unshift(item);
    this.saveIssues(issues);
    return item;
  }

  updateIssueStatus(id, newStatus) {
    const issues = this.getIssues();
    const target = issues.find(i => i.id === id);
    if (target) {
      target.status = newStatus;
      if (newStatus === 'Under Review') target.stageIndex = 1;
      else if (newStatus === 'Assigned') target.stageIndex = 2;
      else if (newStatus === 'In Progress') target.stageIndex = 3;
      else if (newStatus === 'Resolved') target.stageIndex = 4;
      this.saveIssues(issues);
      return target;
    }
    return null;
  }

  getIssueById(id) {
    const issues = this.getIssues();
    return issues.find(i => i.id === id) || null;
  }

  getStats() {
    const issues = this.getIssues();
    const total = issues.length;
    const critical = issues.filter(i => i.priorityLevel === 'CRITICAL').length;
    const high = issues.filter(i => i.priorityLevel === 'HIGH').length;
    const inProgress = issues.filter(i => i.status === 'In Progress').length;
    const underReview = issues.filter(i => i.status === 'Under Review').length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;

    return {
      total: total + 120, // Augmented for SaaS realistic scale
      actualTotal: total,
      critical: critical + 14,
      inProgress: inProgress + 18,
      underReview: underReview + 3,
      resolved: resolved + 78,
      avgResolutionTime: '2.4 days',
      myTotal: issues.filter(i => i.reportedBy.includes('Aarav Sharma')).length,
      myUnderReview: issues.filter(i => i.reportedBy.includes('Aarav Sharma') && i.status === 'Under Review').length,
      myInProgress: issues.filter(i => i.reportedBy.includes('Aarav Sharma') && i.status === 'In Progress').length,
      myResolved: issues.filter(i => i.reportedBy.includes('Aarav Sharma') && i.status === 'Resolved').length
    };
  }

  findPotentialDuplicates(title, description, room, building) {
    const issues = this.getIssues();
    const combinedQuery = `${title} ${description} ${room} ${building}`.toLowerCase();
    
    return issues.filter(issue => {
      // Check room match or keyword matches
      const sameLocation = issue.room && room && issue.room.toLowerCase().includes(room.toLowerCase());
      const sameBuilding = issue.building && building && issue.building.toLowerCase().includes(building.toLowerCase());
      
      const issueText = `${issue.title} ${issue.description} ${issue.category}`.toLowerCase();
      
      const keywords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      let keywordHits = 0;
      keywords.forEach(k => {
        if (issueText.includes(k)) keywordHits++;
      });

      return (sameLocation && keywordHits >= 1) || (sameBuilding && keywordHits >= 2) || (keywordHits >= 3);
    });
  }

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.init();
  }
}

window.CampusDataStore = new DataStore();
