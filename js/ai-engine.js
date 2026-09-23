/**
 * FixMyCampus - AI Priority & Duplicate Detection Engine (Simulated Frontend AI)
 */

class AIEngine {
  constructor() {
    // Critical danger keywords (90-100)
    this.criticalKeywords = [
      'fire', 'spark', 'electric shock', 'exposed wire', 'water leakage electrical',
      'danger', 'smoke', 'gas leak', 'burning', 'shock', 'blast', 'short circuit',
      'structural collapse', 'hazard', 'electrocution', 'sparks'
    ];

    // High disruption keywords (60-89)
    this.highKeywords = [
      'ac not working', 'fan not working', 'wi-fi down', 'wifi down', 'projector broken',
      'internet outage', 'lift stuck', 'elevator', 'water flood', 'exam hall', 'server down',
      'blackout', 'no water', 'overflow', 'plumbing leak', 'mic not working', 'ac failure'
    ];

    // Low / Medium routine maintenance keywords (20-59)
    this.lowKeywords = [
      'chair', 'desk', 'paint', 'dust', 'cleaning', 'trash', 'broken tile', 'squeaky door',
      'whiteboard marker', 'light bulb flickering', 'curtain', 'bench', 'dirty', 'stain'
    ];
  }

  /**
   * Performs simulated deep AI heuristic analysis on user complaint
   * @param {Object} input - { title, description, category, building, floor, room }
   * @returns {Object} AI Analysis breakdown
   */
  analyzeIssue(input) {
    const text = `${input.title || ''} ${input.description || ''}`.toLowerCase();
    
    let score = 45; // baseline
    let priorityLevel = 'MEDIUM';
    let matchedTriggers = [];
    let detectedCategory = input.category || 'Infrastructure';
    let department = 'Campus Facilities';

    // 1. Check Critical Hazards (Score 90 - 100)
    let hasCritical = false;
    for (const kw of this.criticalKeywords) {
      if (text.includes(kw)) {
        hasCritical = true;
        matchedTriggers.push(kw);
      }
    }

    if (hasCritical) {
      // Dynamic score between 91 and 99 based on triggers count
      score = Math.min(99, 90 + matchedTriggers.length * 3);
      priorityLevel = 'CRITICAL';
      department = 'Emergency Response & Electrical';
      if (!input.category || input.category === 'Other') detectedCategory = 'Safety';
    } 
    // 2. Check High Disruptions (Score 60 - 89)
    else {
      let hasHigh = false;
      for (const kw of this.highKeywords) {
        if (text.includes(kw)) {
          hasHigh = true;
          matchedTriggers.push(kw);
        }
      }

      if (hasHigh) {
        score = Math.min(88, 65 + matchedTriggers.length * 5);
        priorityLevel = score >= 75 ? 'HIGH' : 'MEDIUM';
        
        if (text.includes('wi-fi') || text.includes('wifi') || text.includes('internet') || text.includes('server')) {
          detectedCategory = 'Internet';
          department = 'IT & Campus Networks';
        } else if (text.includes('ac') || text.includes('fan') || text.includes('cooler')) {
          detectedCategory = 'Electrical';
          department = 'HVAC & Electrical Maintenance';
        } else if (text.includes('projector') || text.includes('mic') || text.includes('screen')) {
          detectedCategory = 'Classroom Equipment';
          department = 'AV & Academic Support';
        } else if (text.includes('water') || text.includes('flood') || text.includes('leak')) {
          detectedCategory = 'Plumbing';
          department = 'Plumbing & Water Works';
        }
      } 
      // 3. Routine Maintenance (Score 20 - 59)
      else {
        let hasLow = false;
        for (const kw of this.lowKeywords) {
          if (text.includes(kw)) {
            hasLow = true;
            matchedTriggers.push(kw);
          }
        }

        if (hasLow) {
          score = Math.max(25, 50 - matchedTriggers.length * 4);
          priorityLevel = 'LOW';
          if (text.includes('chair') || text.includes('desk') || text.includes('bench')) {
            detectedCategory = 'Furniture';
            department = 'Carpentry & Estate Depot';
          } else if (text.includes('dust') || text.includes('trash') || text.includes('cleaning') || text.includes('dirty')) {
            detectedCategory = 'Cleanliness';
            department = 'Sanitation & Housekeeping';
          }
        }
      }
    }

    // Assign fallback department according to category if not set
    if (!department || department === 'Campus Facilities') {
      department = this.getDepartmentByCategory(detectedCategory);
    }

    // AI Summary synthesis
    const aiSummary = this.generateSummary(input.title, input.description, priorityLevel, detectedCategory);
    const recommendedAction = this.generateRecommendation(priorityLevel, detectedCategory, input.room);

    return {
      category: detectedCategory,
      priorityScore: score,
      priorityLevel: priorityLevel,
      department: department,
      aiSummary: aiSummary,
      recommendedAction: recommendedAction,
      matchedTriggers: matchedTriggers,
      timestamp: new Date().toISOString()
    };
  }

  getDepartmentByCategory(category) {
    switch (category) {
      case 'Electrical': return 'Maintenance & Electrical';
      case 'Plumbing': return 'Plumbing & Water Works';
      case 'Internet': return 'IT & Campus Networks';
      case 'Furniture': return 'Carpentry & Estate Depot';
      case 'Cleanliness': return 'Sanitation & Housekeeping';
      case 'Safety': return 'Campus Safety & Emergency Security';
      case 'Classroom Equipment': return 'AV Support & Classroom Logistics';
      default: return 'General Campus Estate';
    }
  }

  generateSummary(title, desc, priority, category) {
    if (priority === 'CRITICAL') {
      return `Potential high-severity safety hazard or major campus disruption detected in ${category}. Prompt mitigation required to prevent escalation.`;
    }
    if (priority === 'HIGH') {
      return `Significant operational issue affecting academic routine or campus utility in ${category}. Priority resolution scheduled.`;
    }
    if (priority === 'MEDIUM') {
      return `Moderate maintenance requirement reported for ${category}. Routed to standard queue.`;
    }
    return `Minor aesthetic or routine wear-and-tear reported for ${category}. Non-urgent queue allocated.`;
  }

  generateRecommendation(priority, category, room) {
    const loc = room ? `in ${room}` : 'at reported location';
    if (priority === 'CRITICAL') {
      return `Deploy emergency response technician to inspect ${loc} immediately and isolate risks (power/water/hazard) if necessary.`;
    }
    if (priority === 'HIGH') {
      return `Dispatch on-duty service engineer to ${loc} within 2 hours. Notify affected faculty/students.`;
    }
    if (priority === 'MEDIUM') {
      return `Include in next 24-hour maintenance shift checklist for ${loc}. Verify replacement spares.`;
    }
    return `Queue for scheduled weekend depot maintenance or general asset inspection.`;
  }

  /**
   * Simulated Progressive Loading Sequence
   */
  simulateScanningProgress(onStepUpdate, onComplete) {
    const steps = [
      { message: 'Extracting linguistic markers & location metadata...', percent: 25 },
      { message: 'Evaluating safety hazard risk matrix (0 - 100)...', percent: 55 },
      { message: 'Checking active duplicate ticket clusters in vicinity...', percent: 80 },
      { message: 'Synthesizing automated triage & department routing...', percent: 100 }
    ];

    let current = 0;
    const runNextStep = () => {
      if (current < steps.length) {
        onStepUpdate(steps[current]);
        current++;
        setTimeout(runNextStep, 500);
      } else {
        setTimeout(onComplete, 300);
      }
    };

    runNextStep();
  }
}

window.CampusAIEngine = new AIEngine();
