/**
 * FixMyCampus - Main Application Logic & View Controller
 */

// Global App Router & State
const AppRouter = {
  currentView: 'landing',
  currentRole: 'student', // 'student' | 'admin'

  init() {
    this.setupNavigation();
    this.navigate('landing');
  },

  setupNavigation() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'landing';
      this.navigate(hash, false);
    });

    // Check initial hash
    if (window.location.hash) {
      const initHash = window.location.hash.replace('#', '');
      this.navigate(initHash, false);
    }
  },

  navigate(viewId, updateHash = true) {
    this.currentView = viewId;
    if (updateHash) {
      window.location.hash = viewId;
    }

    // Hide all views
    document.querySelectorAll('.app-view').forEach(view => {
      view.style.display = 'none';
    });

    // Show target view
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      if (viewId === 'student-dashboard' || viewId === 'admin-dashboard') {
        target.style.display = 'flex';
      } else {
        target.style.display = 'block';
      }
    }

    // Update Header Nav Links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // Highlight matching link
    const navLinks = document.querySelectorAll('.nav-link');
    if (viewId === 'landing') navLinks[0]?.classList.add('active');
    else if (viewId === 'student-dashboard') navLinks[1]?.classList.add('active');
    else if (viewId === 'report-issue') navLinks[2]?.classList.add('active');
    else if (viewId === 'my-reports') navLinks[3]?.classList.add('active');
    else if (viewId === 'admin-dashboard' || viewId === 'admin-issues-table') navLinks[4]?.classList.add('active');
    else if (viewId === 'analytics') navLinks[5]?.classList.add('active');

    // Re-render view contents
    AppRenderer.renderView(viewId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setRole(role) {
    this.currentRole = role;
    const btnStudent = document.getElementById('btn-role-student');
    const btnAdmin = document.getElementById('btn-role-admin');
    const avatar = document.getElementById('header-avatar');

    if (role === 'student') {
      btnStudent.classList.add('active');
      btnAdmin.classList.remove('active');
      avatar.textContent = 'AS';
      avatar.className = 'avatar';
      avatar.title = 'Logged in as Aarav Sharma (Student)';
      this.showToast('Switched to Student Mode', 'info');
      if (this.currentView === 'admin-dashboard' || this.currentView === 'admin-issues-table') {
        this.navigate('student-dashboard');
      }
    } else {
      btnAdmin.classList.add('active');
      btnStudent.classList.remove('active');
      avatar.textContent = 'AD';
      avatar.className = 'avatar admin-avatar';
      avatar.title = 'Logged in as Facility Admin';
      this.showToast('Switched to Campus Admin Command', 'info');
      if (this.currentView === 'student-dashboard' || this.currentView === 'my-reports') {
        this.navigate('admin-dashboard');
      }
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'danger') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size:1.1rem; font-weight:bold;">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// Global App Renderer & Event Handlers
const AppRenderer = {
  currentPendingAnalysis: null,
  activeAdminFilter: 'ALL',
  activeMyReportsFilter: 'ALL',
  selectedImageBase64: null,
  detectedDuplicateIssue: null,

  init() {
    this.renderAll();
    this.setupDragAndDrop();
  },

  renderAll() {
    this.renderLandingStats();
    this.renderStudentDashboard();
    this.renderMyReports();
    this.renderAdminDashboard();
    this.renderAdminMasterTable();
  },

  renderView(viewId) {
    if (viewId === 'landing') this.renderLandingStats();
    else if (viewId === 'student-dashboard') this.renderStudentDashboard();
    else if (viewId === 'my-reports') this.renderMyReports();
    else if (viewId === 'admin-dashboard') this.renderAdminDashboard();
    else if (viewId === 'admin-issues-table') this.renderAdminMasterTable();
  },

  /* ------------------------------------------------------------------------
     1. LANDING PAGE RENDERING
     ------------------------------------------------------------------------ */
  renderLandingStats() {
    const stats = CampusDataStore.getStats();
    const issues = CampusDataStore.getIssues();

    const elTotal = document.getElementById('landing-stat-total');
    const elCrit = document.getElementById('landing-stat-critical');
    const elRes = document.getElementById('landing-stat-resolved');

    if (elTotal) elTotal.textContent = stats.total;
    if (elCrit) elCrit.textContent = stats.critical;
    if (elRes) elRes.textContent = stats.resolved;

    const tbody = document.getElementById('landing-preview-tbody');
    if (tbody) {
      const top4 = issues.slice(0, 4);
      tbody.innerHTML = top4.map(issue => `
        <tr onclick="AppRenderer.openDetailsModal('${issue.id}')" style="cursor:pointer;">
          <td>
            <div class="table-issue-cell">
              <span class="table-issue-title">${issue.title}</span>
              <span class="table-issue-meta">${issue.id} • ${issue.reportedBy}</span>
            </div>
          </td>
          <td><strong>${issue.building}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${issue.room}</span></td>
          <td><span class="badge badge-secondary">${issue.category}</span></td>
          <td>
            <span class="score-badge ${issue.priorityLevel.toLowerCase()}">${issue.priorityScore} ${issue.priorityLevel}</span>
          </td>
          <td>
            <span class="badge badge-${this.getStatusBadgeClass(issue.status)}">
              <span class="badge-dot"></span>
              ${issue.status}
            </span>
          </td>
        </tr>
      `).join('');
    }
  },

  /* ------------------------------------------------------------------------
     2. STUDENT DASHBOARD RENDERING
     ------------------------------------------------------------------------ */
  renderStudentDashboard() {
    const stats = CampusDataStore.getStats();
    const issues = CampusDataStore.getIssues();

    document.getElementById('student-stat-total').textContent = stats.myTotal;
    document.getElementById('student-stat-review').textContent = stats.myUnderReview;
    document.getElementById('student-stat-progress').textContent = stats.myInProgress;
    document.getElementById('student-stat-resolved').textContent = stats.myResolved;
    document.getElementById('sidebar-my-count').textContent = stats.myTotal;

    this.renderStudentTable(issues);
  },

  renderStudentTable(issues) {
    const tbody = document.getElementById('student-recent-tbody');
    if (!tbody) return;

    if (issues.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No reports found matching your query.</td></tr>`;
      return;
    }

    tbody.innerHTML = issues.map(issue => `
      <tr onclick="AppRenderer.openDetailsModal('${issue.id}')" style="cursor:pointer;">
        <td>
          <div class="table-issue-cell">
            <span class="table-issue-title">${issue.title}</span>
            <span class="table-issue-meta">${issue.id} • ${issue.timeAgo}</span>
          </div>
        </td>
        <td>${issue.room} <span style="font-size:0.75rem; color:var(--text-muted);">(${issue.building})</span></td>
        <td><span class="badge badge-secondary">${issue.category}</span></td>
        <td>
          <span class="score-badge ${issue.priorityLevel.toLowerCase()}">${issue.priorityScore}</span>
        </td>
        <td>
          <span class="badge badge-${this.getStatusBadgeClass(issue.status)}">
            <span class="badge-dot"></span>
            ${issue.status}
          </span>
        </td>
        <td><span style="font-size:0.82rem; color:var(--text-muted);">${issue.date}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); AppRenderer.openDetailsModal('${issue.id}')">View</button>
        </td>
      </tr>
    `).join('');
  },

  filterStudentTable() {
    const q = (document.getElementById('student-search-input')?.value || '').toLowerCase();
    const issues = CampusDataStore.getIssues();
    const filtered = issues.filter(i => 
      i.title.toLowerCase().includes(q) ||
      i.room.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
    this.renderStudentTable(filtered);
  },

  /* ------------------------------------------------------------------------
     3. REPORT ISSUE & DRAG & DROP
     ------------------------------------------------------------------------ */
  setupDragAndDrop() {
    const dropzone = document.getElementById('photo-dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.processUploadedFile(files[0]);
      }
    });
  },

  handlePhotoSelect(e) {
    if (e.target.files && e.target.files.length > 0) {
      this.processUploadedFile(e.target.files[0]);
    }
  },

  processUploadedFile(file) {
    const chip = document.getElementById('image-preview-chip');
    const filenameSpan = document.getElementById('preview-filename');
    if (chip && filenameSpan) {
      filenameSpan.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
      chip.style.display = 'flex';
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      this.selectedImageBase64 = event.target.result;
    };
    reader.readAsDataURL(file);
  },

  removePhoto(e) {
    e.stopPropagation();
    this.selectedImageBase64 = null;
    const fileInput = document.getElementById('form-photo-file');
    if (fileInput) fileInput.value = '';
    const chip = document.getElementById('image-preview-chip');
    if (chip) chip.style.display = 'none';
  },

  checkInstantDuplicates() {
    const title = document.getElementById('form-title')?.value || '';
    const desc = document.getElementById('form-desc')?.value || '';
    const room = document.getElementById('form-room')?.value || '';
    const building = document.getElementById('form-building')?.value || '';

    if (!title && !room) return;

    const duplicates = CampusDataStore.findPotentialDuplicates(title, desc, room, building);
    const banner = document.getElementById('duplicate-warning-banner');

    if (duplicates.length > 0) {
      this.detectedDuplicateIssue = duplicates[0];
      const bannerTitle = document.getElementById('dup-banner-title');
      const bannerMsg = document.getElementById('dup-banner-msg');

      if (bannerTitle) bannerTitle.textContent = `Possible Duplicate Found (${duplicates.length} similar active tickets)`;
      if (bannerMsg) {
        bannerMsg.innerHTML = `We found an existing active report for <strong>"${duplicates[0].title}"</strong> in <strong>${duplicates[0].room} (${duplicates[0].building})</strong> with status <strong>${duplicates[0].status}</strong>.`;
      }
      if (banner) banner.style.display = 'flex';
    } else {
      if (banner) banner.style.display = 'none';
      this.detectedDuplicateIssue = null;
    }
  },

  dismissDuplicateBanner() {
    const banner = document.getElementById('duplicate-warning-banner');
    if (banner) banner.style.display = 'none';
  },

  viewExistingDuplicate() {
    if (this.detectedDuplicateIssue) {
      this.openDetailsModal(this.detectedDuplicateIssue.id);
    }
  },

  handleReportSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('form-title').value.trim();
    const category = document.getElementById('form-category').value;
    const building = document.getElementById('form-building').value;
    const floor = document.getElementById('form-floor').value;
    const room = document.getElementById('form-room').value.trim();
    const description = document.getElementById('form-desc').value.trim();

    const inputData = {
      title,
      category,
      building,
      floor,
      room,
      description,
      photoUrl: this.selectedImageBase64
    };

    // Trigger AI Analysis Modal Simulation
    this.triggerAIAnalysisSimulation(inputData);
  },

  triggerAIAnalysisSimulation(inputData) {
    const modal = document.getElementById('ai-modal');
    const stepLoading = document.getElementById('ai-step-loading');
    const stepResult = document.getElementById('ai-step-result');
    const statusText = document.getElementById('ai-loading-status-text');
    const progressBar = document.getElementById('ai-progress-bar-fill');

    if (!modal) return;

    // Reset modal state
    stepLoading.style.display = 'block';
    stepResult.style.display = 'none';
    progressBar.style.width = '20%';
    modal.classList.add('active');

    // Run AI Engine
    const analysis = CampusAIEngine.analyzeIssue(inputData);
    this.currentPendingAnalysis = {
      ...inputData,
      ...analysis
    };

    // Simulate animated scanning steps
    CampusAIEngine.simulateScanningProgress(
      (step) => {
        if (statusText) statusText.textContent = step.message;
        if (progressBar) progressBar.style.width = `${step.percent}%`;
      },
      () => {
        // Render results into modal
        document.getElementById('ai-res-score').textContent = analysis.priorityScore;
        document.getElementById('ai-res-circle-val').textContent = analysis.priorityScore;
        
        const circle = document.getElementById('ai-res-score-circle');
        circle.className = `ai-score-circle ${analysis.priorityLevel.toLowerCase()}`;

        const badge = document.getElementById('ai-res-level-badge');
        badge.className = `badge badge-${analysis.priorityLevel.toLowerCase()}`;
        badge.textContent = `${analysis.priorityLevel} PRIORITY`;

        document.getElementById('ai-res-category').textContent = analysis.category;
        document.getElementById('ai-res-dept').textContent = analysis.department;
        document.getElementById('ai-res-summary').textContent = `“${analysis.aiSummary}”`;
        document.getElementById('ai-res-action').textContent = `“${analysis.recommendedAction}”`;

        stepLoading.style.display = 'none';
        stepResult.style.display = 'block';
      }
    );
  },

  closeAIModal() {
    const modal = document.getElementById('ai-modal');
    if (modal) modal.classList.remove('active');
  },

  confirmAndSaveReport() {
    if (!this.currentPendingAnalysis) return;

    // Add to DataStore
    const newIssue = CampusDataStore.addIssue(this.currentPendingAnalysis);

    this.closeAIModal();

    // Reset Form
    const form = document.getElementById('report-issue-form');
    if (form) form.reset();
    this.removePhoto(new Event('click'));
    this.dismissDuplicateBanner();

    AppRouter.showToast(`Issue ${newIssue.id} submitted & prioritized successfully!`, 'success');

    // Re-render views & navigate to My Reports
    this.renderAll();
    AppRouter.navigate('my-reports');
  },

  /* ------------------------------------------------------------------------
     4. MY REPORTS RENDERING (With 5-Stage Visual Progress Timeline)
     ------------------------------------------------------------------------ */
  renderMyReports() {
    const issues = CampusDataStore.getIssues();
    const container = document.getElementById('my-reports-list');
    if (!container) return;

    let filtered = issues;
    if (this.activeMyReportsFilter !== 'ALL') {
      filtered = issues.filter(i => i.status === this.activeMyReportsFilter);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:50px 20px;">
          <h3 style="color:var(--brand-navy-900); font-family:var(--font-display);">No Reports Found</h3>
          <p style="color:var(--text-muted); margin-top:8px;">You haven't submitted any complaints under this filter.</p>
          <button class="btn btn-primary" style="margin-top:18px;" onclick="AppRouter.navigate('report-issue')">Create New Report</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(issue => `
      <div class="report-item-card" onclick="AppRenderer.openDetailsModal('${issue.id}')">
        <div class="report-top-row">
          <div class="report-title-meta">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span class="badge badge-ai" style="font-size:0.75rem;">${issue.id}</span>
              <span class="badge badge-${this.getStatusBadgeClass(issue.status)}">
                <span class="badge-dot"></span>
                ${issue.status}
              </span>
            </div>
            <h3>${issue.title}</h3>
            <div class="report-meta-tags">
              <span class="report-meta-item">📍 ${issue.building} • ${issue.room}</span>
              <span class="report-meta-item">🏷️ ${issue.category}</span>
              <span class="report-meta-item">🏢 ${issue.department}</span>
              <span class="report-meta-item">🕒 ${issue.timeAgo}</span>
            </div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <div class="score-badge ${issue.priorityLevel.toLowerCase()}" style="font-size:0.9rem; padding:4px 10px;">
              ${issue.priorityScore} / 100 (${issue.priorityLevel})
            </div>
          </div>
        </div>

        <!-- 5-Stage Visual Progress Timeline -->
        <div class="timeline-container">
          <div class="timeline-steps">
            <div class="timeline-progress-bar" style="width: ${this.getTimelinePercent(issue.stageIndex)}%;"></div>
            
            <div class="timeline-node ${issue.stageIndex >= 0 ? (issue.stageIndex === 0 ? 'active' : 'completed') : ''}">
              <div class="node-bullet">${issue.stageIndex > 0 ? '✓' : '1'}</div>
              <div class="node-title">Reported</div>
            </div>

            <div class="timeline-node ${issue.stageIndex >= 1 ? (issue.stageIndex === 1 ? 'active' : 'completed') : ''}">
              <div class="node-bullet">${issue.stageIndex > 1 ? '✓' : '2'}</div>
              <div class="node-title">AI Analyzed</div>
            </div>

            <div class="timeline-node ${issue.stageIndex >= 2 ? (issue.stageIndex === 2 ? 'active' : 'completed') : ''}">
              <div class="node-bullet">${issue.stageIndex > 2 ? '✓' : '3'}</div>
              <div class="node-title">Assigned</div>
            </div>

            <div class="timeline-node ${issue.stageIndex >= 3 ? (issue.stageIndex === 3 ? 'active' : 'completed') : ''}">
              <div class="node-bullet">${issue.stageIndex > 3 ? '✓' : '4'}</div>
              <div class="node-title">In Progress</div>
            </div>

            <div class="timeline-node ${issue.stageIndex >= 4 ? 'completed active' : ''}">
              <div class="node-bullet">${issue.stageIndex >= 4 ? '✓' : '5'}</div>
              <div class="node-title">Resolved</div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  filterMyReports(status, element) {
    this.activeMyReportsFilter = status;
    document.querySelectorAll('.filter-btn-group .filter-chip').forEach(c => c.classList.remove('active'));
    if (element) element.classList.add('active');
    this.renderMyReports();
  },

  getTimelinePercent(stageIndex) {
    // 5 steps: 0, 1, 2, 3, 4
    if (stageIndex === 0) return 0;
    if (stageIndex === 1) return 25;
    if (stageIndex === 2) return 50;
    if (stageIndex === 3) return 75;
    if (stageIndex >= 4) return 96;
    return 0;
  },

  /* ------------------------------------------------------------------------
     5. ADMIN DASHBOARD RENDERING
     ------------------------------------------------------------------------ */
  renderAdminDashboard() {
    const stats = CampusDataStore.getStats();
    const issues = CampusDataStore.getIssues();

    document.getElementById('admin-stat-total').textContent = stats.total;
    document.getElementById('admin-stat-critical').textContent = stats.critical;
    document.getElementById('admin-stat-progress').textContent = stats.inProgress;
    document.getElementById('admin-stat-resolved').textContent = stats.resolved;

    document.getElementById('admin-sidebar-total').textContent = stats.total;
    document.getElementById('admin-sidebar-critical').textContent = stats.critical;

    // Render Critical Priority Cards Section (Issues Requiring Immediate Attention)
    const criticalContainer = document.getElementById('admin-critical-cards-grid');
    if (criticalContainer) {
      const criticals = issues.filter(i => i.priorityLevel === 'CRITICAL' || i.priorityScore >= 88).slice(0, 3);
      criticalContainer.innerHTML = criticals.map(c => `
        <div class="critical-issue-card" onclick="AppRenderer.openDetailsModal('${c.id}')" style="cursor:pointer;">
          <div class="critical-top-bar">
            <span class="critical-badge-pill">
              <span class="badge-dot" style="background:var(--critical-red);"></span>
              Priority: ${c.priorityScore} (CRITICAL)
            </span>
            <span class="badge badge-ai" style="font-size:0.7rem;">${c.id}</span>
          </div>
          <div class="critical-issue-title">🔴 ${c.title}</div>
          <div class="critical-details-grid">
            <div><span>Location:</span><br><strong>${c.building}</strong></div>
            <div><span>Department:</span><br><strong>${c.department}</strong></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge badge-${this.getStatusBadgeClass(c.status)}">${c.status}</span>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); AppRenderer.openDetailsModal('${c.id}')">Dispatch Crew</button>
          </div>
        </div>
      `).join('');
    }

    // Render Admin Live Table Preview
    const tbody = document.getElementById('admin-dashboard-tbody');
    if (tbody) {
      const top5 = issues.slice(0, 5);
      tbody.innerHTML = top5.map(issue => `
        <tr onclick="AppRenderer.openDetailsModal('${issue.id}')" style="cursor:pointer;">
          <td><strong style="color:var(--brand-primary);">${issue.id}</strong></td>
          <td>
            <div class="table-issue-cell">
              <span class="table-issue-title">${issue.title}</span>
              <span class="table-issue-meta">${issue.reportedBy}</span>
            </div>
          </td>
          <td>${issue.room} (${issue.building})</td>
          <td><span class="badge badge-secondary">${issue.category}</span></td>
          <td>
            <span class="score-badge ${issue.priorityLevel.toLowerCase()}">${issue.priorityScore}</span>
          </td>
          <td>${issue.department}</td>
          <td>
            <span class="badge badge-${this.getStatusBadgeClass(issue.status)}">
              <span class="badge-dot"></span>
              ${issue.status}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); AppRenderer.openDetailsModal('${issue.id}')">Manage</button>
          </td>
        </tr>
      `).join('');
    }
  },

  /* ------------------------------------------------------------------------
     6. ADMIN MASTER ISSUES TABLE
     ------------------------------------------------------------------------ */
  renderAdminMasterTable() {
    const issues = CampusDataStore.getIssues();
    let filtered = issues;

    if (this.activeAdminFilter !== 'ALL') {
      filtered = issues.filter(i => i.priorityLevel === this.activeAdminFilter);
    }

    const q = (document.getElementById('admin-table-search')?.value || '').toLowerCase();
    if (q) {
      filtered = filtered.filter(i => 
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.room.toLowerCase().includes(q) ||
        i.building.toLowerCase().includes(q) ||
        i.department.toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById('admin-master-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No records found matching filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(issue => `
      <tr onclick="AppRenderer.openDetailsModal('${issue.id}')" style="cursor:pointer;">
        <td><strong style="color:var(--brand-primary);">${issue.id}</strong></td>
        <td>
          <div class="table-issue-cell">
            <span class="table-issue-title">${issue.title}</span>
            <span class="table-issue-meta">${issue.reportedBy} • ${issue.timeAgo}</span>
          </div>
        </td>
        <td>${issue.room} <span style="font-size:0.75rem; color:var(--text-muted);">(${issue.building})</span></td>
        <td><span class="badge badge-secondary">${issue.category}</span></td>
        <td>
          <span class="score-badge ${issue.priorityLevel.toLowerCase()}">${issue.priorityScore}</span>
        </td>
        <td>${issue.department}</td>
        <td>
          <span class="badge badge-${this.getStatusBadgeClass(issue.status)}">
            <span class="badge-dot"></span>
            ${issue.status}
          </span>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); AppRenderer.openDetailsModal('${issue.id}')">View</button>
        </td>
      </tr>
    `).join('');
  },

  setAdminFilter(filter, element) {
    this.activeAdminFilter = filter;
    document.querySelectorAll('#view-admin-issues-table .filter-chip').forEach(c => c.classList.remove('active'));
    if (element) element.classList.add('active');
    this.renderAdminMasterTable();
  },

  filterAdminMasterTable() {
    this.renderAdminMasterTable();
  },

  filterAdminCriticalOnly() {
    AppRouter.navigate('admin-issues-table');
    const critChip = document.getElementById('admin-chip-crit');
    this.setAdminFilter('CRITICAL', critChip);
  },

  /* ------------------------------------------------------------------------
     7. ISSUE DETAILS MODAL
     ------------------------------------------------------------------------ */
  currentModalIssueId: null,

  openDetailsModal(id) {
    const issue = CampusDataStore.getIssueById(id);
    if (!issue) return;

    this.currentModalIssueId = id;
    const modal = document.getElementById('issue-details-modal');

    document.getElementById('modal-id-badge').textContent = issue.id;
    
    const prioBadge = document.getElementById('modal-priority-badge');
    prioBadge.className = `badge badge-${issue.priorityLevel.toLowerCase()}`;
    prioBadge.textContent = `${issue.priorityLevel} PRIORITY (${issue.priorityScore}/100)`;

    document.getElementById('modal-title').textContent = issue.title;
    document.getElementById('modal-location').textContent = `${issue.building} • ${issue.floor} • ${issue.room}`;
    document.getElementById('modal-dept').textContent = issue.department;
    document.getElementById('modal-reporter').textContent = issue.reportedBy;
    document.getElementById('modal-date').textContent = `${issue.date} (${issue.timeAgo})`;
    document.getElementById('modal-desc').textContent = issue.description;
    
    document.getElementById('modal-ai-score').textContent = `AI Score: ${issue.priorityScore}/100`;
    document.getElementById('modal-ai-summary').textContent = issue.aiSummary || 'Standard automated triage summary generated.';
    document.getElementById('modal-ai-action').textContent = issue.recommendedAction || 'Technician dispatch recommended.';

    // Render modal timeline
    const timelineContainer = document.getElementById('modal-timeline-steps');
    if (timelineContainer) {
      timelineContainer.innerHTML = `
        <div class="timeline-progress-bar" style="width: ${this.getTimelinePercent(issue.stageIndex)}%;"></div>
        <div class="timeline-node ${issue.stageIndex >= 0 ? (issue.stageIndex === 0 ? 'active' : 'completed') : ''}">
          <div class="node-bullet">${issue.stageIndex > 0 ? '✓' : '1'}</div>
          <div class="node-title">Reported</div>
        </div>
        <div class="timeline-node ${issue.stageIndex >= 1 ? (issue.stageIndex === 1 ? 'active' : 'completed') : ''}">
          <div class="node-bullet">${issue.stageIndex > 1 ? '✓' : '2'}</div>
          <div class="node-title">AI Analyzed</div>
        </div>
        <div class="timeline-node ${issue.stageIndex >= 2 ? (issue.stageIndex === 2 ? 'active' : 'completed') : ''}">
          <div class="node-bullet">${issue.stageIndex > 2 ? '✓' : '3'}</div>
          <div class="node-title">Assigned</div>
        </div>
        <div class="timeline-node ${issue.stageIndex >= 3 ? (issue.stageIndex === 3 ? 'active' : 'completed') : ''}">
          <div class="node-bullet">${issue.stageIndex > 3 ? '✓' : '4'}</div>
          <div class="node-title">In Progress</div>
        </div>
        <div class="timeline-node ${issue.stageIndex >= 4 ? 'completed active' : ''}">
          <div class="node-bullet">${issue.stageIndex >= 4 ? '✓' : '5'}</div>
          <div class="node-title">Resolved</div>
        </div>
      `;
    }

    modal.classList.add('active');
  },

  closeDetailsModal() {
    const modal = document.getElementById('issue-details-modal');
    if (modal) modal.classList.remove('active');
    this.currentModalIssueId = null;
  },

  updateModalStatus(newStatus) {
    if (!this.currentModalIssueId) return;

    const updated = CampusDataStore.updateIssueStatus(this.currentModalIssueId, newStatus);
    if (updated) {
      AppRouter.showToast(`Issue ${updated.id} status updated to "${newStatus}"`, 'success');
      this.openDetailsModal(this.currentModalIssueId); // refresh modal timeline & state
      this.renderAll();
    }
  },

  /* ------------------------------------------------------------------------
     Helper Utility Methods
     ------------------------------------------------------------------------ */
  getStatusBadgeClass(status) {
    switch (status) {
      case 'Under Review': return 'review';
      case 'Assigned': return 'ai';
      case 'In Progress': return 'progress';
      case 'Resolved': return 'resolved';
      default: return 'secondary';
    }
  }
};

// Initialize Application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AppRenderer.init();
  AppRouter.init();
});
