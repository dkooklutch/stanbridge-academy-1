(function () {
  const app = document.getElementById("app");
  const toastRoot = document.getElementById("toast-root");

  const TAB_LABELS = [
    ["spark", "Spark Profile", "✦"],
    ["communication", "Communication", "◐"],
    ["daily", "Daily Needs", "☑"],
    ["executive", "Executive Functioning", "▦"],
    ["sensory", "Sensory & Regulation", "◌"],
    ["engagement", "Engagement Log", "▤"],
    ["strategist", "Strategist", "✧"],
    ["patterns", "Patterns", "↗"],
    ["reports", "Reports", "▣"],
    ["archive", "Notes Archive", "⌕"],
  ];

  const QUICK_TYPES = [
    "Spark",
    "Motivator",
    "Trigger",
    "Observation",
    "Executive Functioning",
    "Communication",
    "Sensory/Regulation",
    "Engagement",
    "Parent Note",
    "Concern",
    "Follow-Up Needed",
  ];

  const DAILY_BUTTONS = [
    "Arrived regulated",
    "Needed transition support",
    "Forgot materials",
    "Needed adult prompting",
    "Completed work independently",
    "Needed break",
    "Peer conflict",
    "Positive peer interaction",
    "Strong participation",
    "Avoided task",
    "Used coping strategy",
    "Asked for help appropriately",
  ];

  const SENSORY_BUTTONS = [
    "Noise sensitivity",
    "Visual overwhelm",
    "Movement need",
    "Needed quiet space",
    "Used headphones",
    "Used fidget/tool",
    "Deep pressure helped",
    "Breathing strategy helped",
    "Shutdown signs",
    "Anxiety signs",
    "Recovered successfully",
  ];

  const ENGAGEMENT_TAGS = [
    "Strong focus",
    "Creative thinking",
    "Completed assignment",
    "Needed prompting",
    "Task avoidance",
    "Transition difficulty",
    "Group work challenge",
    "Peer success",
    "Peer conflict",
    "Sensory overload",
    "Anxiety",
    "Used coping strategy",
    "Asked for help",
    "Independent work",
    "Break helped",
    "Visual checklist helped",
    "Speech/language support",
    "Reading support",
    "Writing support",
    "Math support",
  ];

  const GRADE_FILTERS = [
    "All Grades",
    "K-2",
    "3-5",
    "Middle School",
    "High School",
    "K",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  const PROFILE_FIELDS = {
    spark: [
      ["Strengths", "strengths"],
      ["Interests", "interests", true],
      ["Motivators", "motivators"],
      ["Preferred activities", "preferredActivities", true],
      ["Confidence builders", "confidenceBuilders", true],
      ["Successful moments", "successfulMoments", true],
      ["What worked well recently?", "whatWorkedRecently", true],
    ],
    communication: [
      ["Preferred communication style", "preferredCommunicationStyle", true],
      ["How they ask for help", "helpSigns", true],
      ["Signs they are confused", "confusedSigns", true],
      ["Signs they are overwhelmed", "overwhelmedSigns", true],
      ["Best teacher prompts", "bestPrompts", true],
      ["Peer/social communication notes", "peerNotes", true],
      ["Speech/language support notes", "speechLanguageNotes", true],
      ["Conversation starters that work", "conversationStarters", true],
      ["What not to do", "whatNotToDo", true],
    ],
    daily: [
      ["Morning arrival notes", "arrival", true],
      ["Transition support", "transitionSupport", true],
      ["Materials/organization", "materialsOrganization", true],
      ["Breaks needed", "breaksNeeded", true],
      ["Homework support", "homeworkSupport", true],
      ["Classroom seating", "seating", true],
      ["Food/water/medication reminders", "reminders", true],
      ["Attendance/tardiness notes", "attendanceNotes", true],
      ["Support checklist", "supportChecklist", true],
    ],
    sensory: [
      ["Sensory sensitivities", "sensorySensitivities", true],
      ["Sensory seeking behaviors", "sensorySeeking", true],
      ["Helpful tools", "helpfulTools", true],
      ["Calming strategies", "calmingStrategies", true],
      ["Regulation signs", "regulationSigns", true],
      ["Escalation signs", "escalationSigns", true],
      ["Recovery strategies", "recoveryStrategies", true],
      ["Environmental triggers", "environmentalTriggers", true],
      ["Best break options", "breakOptions", true],
    ],
  };

  const state = {
    data: window.StanbridgeStore.loadData(),
    currentUser: window.StanbridgeStore.getSession(),
    dashboard: {
      search: "",
      grade: "All Grades",
      support: "All support needs",
      activity: "All activity",
      flag: "All students",
    },
    profile: {
      reportDrafts: {},
      strategyPlans: {},
      engagementFilters: {
        start: "",
        end: "",
        teacher: "All",
        setting: "",
        tag: "All",
        level: "All",
        visibility: "All",
      },
      archiveFilters: {
        scope: "All notes",
        teacher: "All",
        type: "All",
        start: "",
        end: "",
        visibility: "All",
      },
    },
    modal: null,
  };

  function refresh() {
    state.data = window.StanbridgeStore.loadData();
    state.currentUser = window.StanbridgeStore.getSession();
  }

  function parseRoute() {
    const raw = location.hash.replace(/^#/, "") || "signin";
    const [path, queryString = ""] = raw.split("?");
    const parts = path.split("/").filter(Boolean);
    return {
      name: parts[0] || "signin",
      id: parts[1] || "",
      query: new URLSearchParams(queryString),
    };
  }

  function navigate(hash) {
    location.hash = hash;
  }

  function render() {
    refresh();
    const route = parseRoute();

    if (!state.currentUser && !["signin", "create-account"].includes(route.name)) {
      navigate("signin");
      return;
    }

    if (state.currentUser && ["signin", "create-account", ""].includes(route.name)) {
      navigate("dashboard");
      return;
    }

    if (route.name === "signin") {
      app.innerHTML = renderSignIn();
    } else if (route.name === "create-account") {
      app.innerHTML = renderCreateAccount();
    } else if (route.name === "dashboard") {
      app.innerHTML = renderLayout(renderDashboard(), "dashboard");
    } else if (route.name === "student") {
      app.innerHTML = renderLayout(renderStudentProfile(route.id, route.query), "students");
    } else if (route.name === "reports") {
      app.innerHTML = renderLayout(renderReportsArchive(), "reports");
    } else if (route.name === "admin") {
      app.innerHTML = renderLayout(renderAdmin(), "admin");
    } else {
      app.innerHTML = renderLayout(renderNotFound(), "");
    }

    if (state.modal) {
      app.insertAdjacentHTML("beforeend", renderModal());
    }
  }

  function renderLayout(content, active) {
    const user = state.currentUser;
    return `
      <header class="topbar">
        <a class="brand" href="#dashboard" aria-label="Stanbridge dashboard">
          <span class="brand-mark">S</span>
          <span>
            <strong>Stanbridge</strong>
            <small>Student Support Hub</small>
          </span>
        </a>
        <nav class="main-nav" aria-label="Main navigation">
          <a class="${active === "dashboard" || active === "students" ? "active" : ""}" href="#dashboard">Students</a>
          <a class="${active === "reports" ? "active" : ""}" href="#reports">Reports</a>
          ${user.role === "Administrator" ? `<a class="${active === "admin" ? "active" : ""}" href="#admin">Admin</a>` : ""}
        </nav>
        <div class="user-actions">
          <details class="profile-menu">
            <summary>
              <span class="mini-avatar">${initials(user.name)}</span>
              <span>${escapeHtml(user.name)}</span>
            </summary>
            <div class="profile-popover">
              <strong>${escapeHtml(user.name)}</strong>
              <span>${escapeHtml(user.email)}</span>
              <span class="role-pill">${escapeHtml(user.role)}</span>
              <button class="ghost-button full" type="button" data-action="logout">Logout</button>
            </div>
          </details>
        </div>
      </header>
      ${content}
      <footer class="app-footer">
        <span>This prototype is for educational support documentation. It should not be used for medical diagnosis. Follow school privacy policies and FERPA requirements before using real student data.</span>
      </footer>
    `;
  }

  function renderSignIn() {
    return `
      <main class="auth-page">
        <section class="auth-card">
          <div class="auth-brand">
            <span class="brand-mark large">S</span>
            <div>
              <h1>Stanbridge Student Support Hub</h1>
              <p>Teacher-only documentation, support planning, collaboration, and weekly Spark reports.</p>
            </div>
          </div>
          <form class="form-stack" data-form="signin">
            <label>Email
              <input name="email" type="email" autocomplete="email" required placeholder="lena.morales@stanbridge.example" />
            </label>
            <label>Password
              <input name="password" type="password" autocomplete="current-password" required placeholder="Password" />
            </label>
            <button class="primary-button" type="submit">Sign in</button>
          </form>
          <div class="demo-access">
            <span>Demo access</span>
            <button type="button" class="chip-button" data-action="demo-login" data-email="lena.morales@stanbridge.example">Teacher</button>
            <button type="button" class="chip-button" data-action="demo-login" data-email="maren.sato@stanbridge.example">Administrator</button>
            <small>Password: stanbridge2026</small>
          </div>
          <p class="muted centered">First launch? <a href="#create-account">Create a teacher account</a>.</p>
        </section>
        <aside class="auth-aside">
          <div class="glass-panel">
            <p class="eyebrow">Teacher MVP</p>
            <h2>Understand each learner, document today, and prepare clear family communication.</h2>
            <div class="insight-grid">
              <span>Learning profiles</span>
              <span>Daily observations</span>
              <span>Team visibility</span>
              <span>Weekly reports</span>
            </div>
          </div>
        </aside>
      </main>
    `;
  }

  function renderCreateAccount() {
    return `
      <main class="auth-page">
        <section class="auth-card">
          <div class="auth-brand">
            <span class="brand-mark large">S</span>
            <div>
              <h1>Create Teacher Account</h1>
              <p>Prototype accounts are stored locally on this device for demo purposes.</p>
            </div>
          </div>
          <form class="form-stack" data-form="create-account">
            <label>Name
              <input name="name" required autocomplete="name" placeholder="Your name" />
            </label>
            <label>Email
              <input name="email" type="email" autocomplete="email" required placeholder="name@stanbridge.example" />
            </label>
            <label>Password
              <input name="password" type="password" autocomplete="new-password" required minlength="6" />
            </label>
            <label>Role
              <select name="role">
                <option>Teacher</option>
                <option>Administrator</option>
              </select>
            </label>
            <button class="primary-button" type="submit">Create account</button>
          </form>
          <p class="muted centered"><a href="#signin">Back to sign in</a></p>
        </section>
        <aside class="auth-aside">
          <div class="glass-panel">
            <p class="eyebrow">Privacy-first prototype</p>
            <h2>No real email is sent, and no real student data should be entered until a production backend and privacy review are configured.</h2>
          </div>
        </aside>
      </main>
    `;
  }

  function renderDashboard() {
    const students = getVisibleStudents();
    const recent = getRecentActivity().slice(0, 8);
    const followUps = getFollowUpStudents();
    const supportNeeds = unique(
      state.data.students.flatMap((student) => student.supportNeeds || []).sort((a, b) => a.localeCompare(b))
    );
    const stats = {
      students: state.data.students.filter((student) => !student.archived).length,
      notes: state.data.notes.length,
      followUps: followUps.length,
      reports: state.data.reports.length,
    };

    return `
      <main class="page dashboard-page">
        <section class="dashboard-hero">
          <div>
            <p class="eyebrow">Teacher Dashboard</p>
            <h1>All students, shared support context, and the next useful action.</h1>
          </div>
          <div class="metric-strip">
            ${metric("Students", stats.students)}
            ${metric("Notes", stats.notes)}
            ${metric("Follow-ups", stats.followUps)}
            ${metric("Reports", stats.reports)}
          </div>
        </section>

        <section class="quick-actions-row" aria-label="Today's quick actions">
          <button class="action-card" data-modal="global-note">
            <span>＋</span>
            <strong>Add student note</strong>
            <small>Quick observation for any learner</small>
          </button>
          <a class="action-card" href="#reports">
            <span>▣</span>
            <strong>Generate weekly reports</strong>
            <small>Review saved reports and drafts</small>
          </a>
          <button class="action-card" data-action="scroll-followups">
            <span>!</span>
            <strong>Review follow-ups</strong>
            <small>Emergency, concerns, and low engagement</small>
          </button>
          <button class="action-card" data-action="filter-emergency">
            <span>◇</span>
            <strong>Recent emergency notes</strong>
            <small>Check unresolved items</small>
          </button>
        </section>

        <section class="dashboard-grid">
          <div class="main-column">
            <div class="filter-panel">
              <label class="search-label">Search students
                <input data-dashboard-filter="search" value="${escapeAttr(state.dashboard.search)}" placeholder="Name, email, grade, support need..." />
              </label>
              <label>Grade
                <select data-dashboard-filter="grade">
                  ${GRADE_FILTERS.map((item) => option(item, state.dashboard.grade)).join("")}
                </select>
              </label>
              <label>Support needs
                <select data-dashboard-filter="support">
                  ${option("All support needs", state.dashboard.support)}
                  ${supportNeeds.map((item) => option(item, state.dashboard.support)).join("")}
                </select>
              </label>
              <label>Activity
                <select data-dashboard-filter="activity">
                  ${["All activity", "Updated today", "Updated this week"].map((item) => option(item, state.dashboard.activity)).join("")}
                </select>
              </label>
              <label>Flags
                <select data-dashboard-filter="flag">
                  ${["All students", "Flagged students", "Follow-up needed", "Unresolved emergency"].map((item) =>
                    option(item, state.dashboard.flag)
                  ).join("")}
                </select>
              </label>
            </div>

            <div class="section-heading">
              <div>
                <h2>Student Roster</h2>
                <p>${students.length} visible, sorted by last name.</p>
              </div>
            </div>
            <div class="student-grid">
              ${students.length ? students.map(renderStudentCard).join("") : emptyState("No students match these filters.", "Try clearing grade or support filters.")}
            </div>
          </div>

          <aside class="side-column">
            <section id="followups" class="panel">
              <div class="section-heading compact">
                <div>
                  <h2>Students Needing Follow-Up</h2>
                  <p>Based on recent logs and unresolved notes.</p>
                </div>
              </div>
              <div class="mini-list">
                ${followUps.length ? followUps.map(renderFollowUpItem).join("") : emptyState("No current follow-ups.", "Recent records do not show urgent review needs.")}
              </div>
            </section>

            <section class="panel">
              <div class="section-heading compact">
                <div>
                  <h2>Recent Activity</h2>
                  <p>Visible across all teachers.</p>
                </div>
              </div>
              <div class="activity-list">
                ${recent.length ? recent.map(renderActivityItem).join("") : emptyState("No activity yet.", "Saved notes and reports will appear here.")}
              </div>
            </section>
          </aside>
        </section>
      </main>
    `;
  }

  function metric(label, value) {
    return `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`;
  }

  function getVisibleStudents() {
    const query = state.dashboard.search.trim().toLowerCase();
    return state.data.students
      .filter((student) => !student.archived)
      .filter((student) => gradeMatches(student.grade, state.dashboard.grade))
      .filter((student) => state.dashboard.support === "All support needs" || (student.supportNeeds || []).includes(state.dashboard.support))
      .filter((student) => activityMatches(student, state.dashboard.activity))
      .filter((student) => flagMatches(student, state.dashboard.flag))
      .filter((student) => {
        if (!query) return true;
        return [
          student.firstName,
          student.lastName,
          `${student.firstName} ${student.lastName}`,
          student.email,
          student.grade,
          student.supportSummary,
          ...(student.supportNeeds || []),
          ...(student.strengths || []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }

  function gradeMatches(grade, filter) {
    if (!filter || filter === "All Grades") return true;
    const number = grade === "K" ? 0 : Number(grade);
    if (filter === "K-2") return number >= 0 && number <= 2;
    if (filter === "3-5") return number >= 3 && number <= 5;
    if (filter === "Middle School") return number >= 6 && number <= 8;
    if (filter === "High School") return number >= 9 && number <= 12;
    return grade === filter;
  }

  function activityMatches(student, filter) {
    if (filter === "All activity") return true;
    const updated = new Date(student.updatedAt);
    const now = new Date();
    const diffDays = (now - updated) / 86400000;
    if (filter === "Updated today") return diffDays <= 1;
    if (filter === "Updated this week") return diffDays <= 7;
    return true;
  }

  function flagMatches(student, filter) {
    if (filter === "All students") return true;
    const flags = getStudentFlags(student);
    if (filter === "Flagged students") return flags.length > 0;
    if (filter === "Follow-up needed") return flags.some((flag) => /follow|low engagement|concern/i.test(flag));
    if (filter === "Unresolved emergency") return flags.some((flag) => /emergency/i.test(flag));
    return true;
  }

  function renderStudentCard(student) {
    const latestNote = getLatestNote(student.id);
    return `
      <a class="student-card" href="#student/${student.id}">
        <div class="card-topline">
          ${renderAvatar(student, "medium")}
          <div>
            <h3>${escapeHtml(student.lastName)}, ${escapeHtml(student.firstName)}</h3>
            <p>Grade ${escapeHtml(student.grade)} · ${escapeHtml(student.email)}</p>
          </div>
        </div>
        <p class="support-summary">${escapeHtml(student.supportSummary)}</p>
        <div class="badge-row">
          ${(student.supportNeeds || []).slice(0, 4).map((need) => `<span class="support-badge">${escapeHtml(need)}</span>`).join("")}
        </div>
        <div class="strength-line"><strong>Strengths:</strong> ${escapeHtml((student.strengths || []).slice(0, 3).join(", "))}</div>
        <div class="latest-note">
          <span>${latestNote ? escapeHtml(latestNote.type) : "No notes yet"}</span>
          <p>${latestNote ? escapeHtml(truncate(latestNote.text, 120)) : "Add the first shared observation."}</p>
        </div>
        <div class="card-footer">
          <span>Updated ${relativeTime(student.updatedAt)}</span>
          ${getStudentFlags(student).slice(0, 1).map((flag) => `<span class="flag-pill">${escapeHtml(flag)}</span>`).join("")}
        </div>
      </a>
    `;
  }

  function renderFollowUpItem(item) {
    return `
      <a class="mini-item" href="#student/${item.student.id}">
        ${renderAvatar(item.student, "small")}
        <span>
          <strong>${escapeHtml(item.student.firstName)} ${escapeHtml(item.student.lastName)}</strong>
          <small>${escapeHtml(item.reasons.join(" · "))}</small>
        </span>
      </a>
    `;
  }

  function renderActivityItem(item) {
    const student = item.studentId ? getStudent(item.studentId) : null;
    return `
      <a class="activity-item" href="${student ? `#student/${student.id}` : "#dashboard"}">
        <span class="activity-dot"></span>
        <span>
          <strong>${escapeHtml(item.type || "Activity")}${student ? ` · ${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}` : ""}</strong>
          <small>${escapeHtml(item.actorName || item.authorName || "Stanbridge")} · ${relativeTime(item.timestamp || item.createdAt)}</small>
          <p>${escapeHtml(truncate(item.text || "", 94))}</p>
        </span>
      </a>
    `;
  }

  function renderStudentProfile(studentId, query) {
    const student = getStudent(studentId);
    if (!student) return renderNotFound("Student not found.");
    const activeTab = query.get("tab") || "spark";
    const alerts = state.data.emergencyParentNotes.filter((note) => note.studentId === student.id && !note.resolved);
    const notes = state.data.notes.filter((note) => note.studentId === student.id);
    const reports = state.data.reports.filter((report) => report.studentId === student.id);

    return `
      <main class="page profile-page">
        <a class="back-link" href="#dashboard">← Back to all students</a>
        ${alerts.map(renderEmergencyAlert).join("")}
        <div class="profile-layout">
          <aside class="quick-log-panel">
            ${renderQuickLog(student)}
          </aside>
          <section class="profile-main">
            <div class="profile-hero-card">
              <div class="profile-identity">
                ${renderAvatar(student, "large")}
                <div>
                  <p class="eyebrow">Grade ${escapeHtml(student.grade)} · ${escapeHtml(student.email)}</p>
                  <h1>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</h1>
                  <p>${escapeHtml(student.supportSummary)}</p>
                  <div class="badge-row">
                    ${(student.supportNeeds || []).map((need) => `<span class="support-badge">${escapeHtml(need)}</span>`).join("")}
                  </div>
                </div>
              </div>
              <div class="profile-actions">
                <button class="secondary-button" data-modal="edit-student" data-student-id="${student.id}">Edit Info</button>
                <button class="secondary-button" data-modal="parent-note" data-student-id="${student.id}">Add Parent Note</button>
                <button class="warning-button" data-modal="emergency-note" data-student-id="${student.id}">Emergency Parent Note</button>
                <button class="secondary-button" data-modal="daily-photo-note" data-student-id="${student.id}">Daily Photo Note</button>
                <a class="primary-button" href="#student/${student.id}?tab=reports">Generate Weekly Report</a>
              </div>
              <div class="profile-snapshot">
                <div><strong>${notes.length}</strong><span>Shared notes</span></div>
                <div><strong>${state.data.engagementLogs.filter((log) => log.studentId === student.id).length}</strong><span>Engagement logs</span></div>
                <div><strong>${reports.length}</strong><span>Reports</span></div>
              </div>
            </div>

            <nav class="tabbar" aria-label="Student profile tabs">
              ${TAB_LABELS.map(
                ([id, label, icon]) => `
                  <a class="${id === activeTab ? "active" : ""}" href="#student/${student.id}?tab=${id}">
                    <span>${icon}</span>${label}
                  </a>
                `
              ).join("")}
            </nav>

            <div class="tab-content">
              ${renderTab(activeTab, student)}
            </div>
          </section>
        </div>
      </main>
    `;
  }

  function renderEmergencyAlert(note) {
    return `
      <section class="emergency-alert">
        <div>
          <strong>Unresolved emergency parent note</strong>
          <p>${escapeHtml(note.reason)} · ${escapeHtml(note.studentStatusNow || "Student status not entered")}</p>
        </div>
        <button class="secondary-button compact-button" data-action="resolve-emergency" data-emergency-id="${note.id}">Mark resolved</button>
      </section>
    `;
  }

  function renderQuickLog(student) {
    return `
      <div class="panel sticky-panel">
        <p class="eyebrow">Quick Log</p>
        <h2>What did you notice today?</h2>
        <form class="quick-log-form" data-form="quick-log" data-student-id="${student.id}">
          <input type="hidden" name="type" value="Observation" />
          <div class="quick-type-grid">
            ${QUICK_TYPES.map(
              (type) => `<button class="${type === "Observation" ? "active" : ""}" type="button" data-action="set-log-type" data-type="${escapeAttr(type)}">${escapeHtml(type)}</button>`
            ).join("")}
          </div>
          <label>
            <span class="sr-only">Observation</span>
            <textarea name="text" required rows="6" placeholder="What did you notice today?"></textarea>
          </label>
          <label>Class/setting
            <input name="classSetting" placeholder="English, advisory, lunch, transition..." />
          </label>
          <label>Tags
            <input name="tags" placeholder="visual checklist helped, anxiety, peer success" />
          </label>
          <div class="toggle-row">
            <label><input type="checkbox" name="includeInWeeklyReport" /> Include in weekly report</label>
          </div>
          <label>Visibility
            <select name="visibility">
              <option value="internal only">Internal only</option>
              <option value="include in parent report">Parent-visible</option>
            </select>
          </label>
          <button class="primary-button full" type="submit">Save Log</button>
        </form>
      </div>
    `;
  }

  function renderTab(tab, student) {
    if (tab === "spark") return renderSparkTab(student);
    if (tab === "communication") return renderCommunicationTab(student);
    if (tab === "daily") return renderDailyTab(student);
    if (tab === "executive") return renderExecutiveTab(student);
    if (tab === "sensory") return renderSensoryTab(student);
    if (tab === "engagement") return renderEngagementTab(student);
    if (tab === "strategist") return renderStrategistTab(student);
    if (tab === "patterns") return renderPatternsTab(student);
    if (tab === "reports") return renderReportsTab(student);
    if (tab === "archive") return renderArchiveTab(student);
    return renderSparkTab(student);
  }

  function renderSparkTab(student) {
    const notes = getStudentNotes(student.id).filter((note) => note.sourceTab === "Spark Profile" || note.type === "Spark");
    return `
      <div class="tab-grid two-one">
        <section class="panel">
          <div class="section-heading compact">
            <div>
              <h2>Spark Profile</h2>
              <p>Strengths, motivators, and successful entry points.</p>
            </div>
          </div>
          ${renderInfoCards(student, PROFILE_FIELDS.spark)}
        </section>
        <section class="panel">
          <h2>Add Spark Note</h2>
          <form class="form-stack" data-form="spark-note" data-student-id="${student.id}">
            <label>Category
              <select name="category">
                <option>Strength</option>
                <option>Interest</option>
                <option>Motivator</option>
                <option>Confidence builder</option>
                <option>Successful moment</option>
                <option>What worked well</option>
              </select>
            </label>
            <label>Note
              <textarea name="text" rows="5" required placeholder="Capture a strength-based observation..."></textarea>
            </label>
            <label>Tags
              <input name="tags" placeholder="creative writing, confidence, peer success" />
            </label>
            <div class="toggle-row">
              <label><input type="checkbox" name="includeInWeeklyReport" checked /> Include in parent report</label>
            </div>
            <label>Visibility
              <select name="visibility">
                <option value="include in parent report">Parent-visible</option>
                <option value="internal only">Internal only</option>
              </select>
            </label>
            <button class="primary-button" type="submit">Save Spark Note</button>
          </form>
        </section>
      </div>
      <section class="panel">
        <h2>Spark Notes</h2>
        ${renderNoteTimeline(notes)}
      </section>
    `;
  }

  function renderCommunicationTab(student) {
    const notes = getStudentNotes(student.id).filter((note) => note.sourceTab === "Communication" || note.type === "Communication");
    return `
      <div class="tab-grid two-one">
        <section class="panel">
          <h2>Communication Supports</h2>
          ${renderInfoCards(student, PROFILE_FIELDS.communication)}
        </section>
        <section class="panel">
          <h2>Add Communication Observation</h2>
          <form class="form-stack" data-form="communication-observation" data-student-id="${student.id}">
            <label>Observation
              <textarea name="text" rows="6" required placeholder="What communication support helped or what did you notice?"></textarea>
            </label>
            <label>Class/setting
              <input name="classSetting" placeholder="Discussion, speech/language support, group work..." />
            </label>
            <label>Tags
              <input name="tags" placeholder="sentence starters, peer success, speech/language support" />
            </label>
            <div class="toggle-row">
              <label><input type="checkbox" name="includeInWeeklyReport" /> Include in weekly report</label>
            </div>
            <button class="primary-button" type="submit">Save Observation</button>
          </form>
        </section>
      </div>
      <section class="panel">
        <h2>Communication Observations</h2>
        ${renderNoteTimeline(notes)}
      </section>
    `;
  }

  function renderDailyTab(student) {
    const notes = getStudentNotes(student.id).filter((note) => note.sourceTab === "Daily Needs" || note.type === "Daily Needs");
    return `
      <div class="tab-grid two-one">
        <section class="panel">
          <h2>Daily Supports</h2>
          ${renderInfoCards(student, PROFILE_FIELDS.daily)}
        </section>
        <section class="panel">
          <h2>Daily Check-In Log</h2>
          <div class="quick-button-grid">
            ${DAILY_BUTTONS.map(
              (label) =>
                `<button type="button" data-action="quick-note" data-student-id="${student.id}" data-source-tab="Daily Needs" data-type="Daily Needs" data-text="${escapeAttr(label)}" data-tag="${escapeAttr(label)}">${escapeHtml(label)}</button>`
            ).join("")}
          </div>
          <form class="form-stack top-spacer" data-form="daily-note" data-student-id="${student.id}">
            <label>Daily support note
              <textarea name="text" rows="5" placeholder="Add context for today's practical support..." required></textarea>
            </label>
            <label>Class/setting
              <input name="classSetting" placeholder="Arrival, transition, homework, dismissal..." />
            </label>
            <label>Tags
              <input name="tags" placeholder="materials, transition support, prompting" />
            </label>
            <div class="toggle-row">
              <label><input type="checkbox" name="includeInWeeklyReport" /> Include in weekly report</label>
            </div>
            <button class="primary-button" type="submit">Save Daily Note</button>
          </form>
        </section>
      </div>
      <section class="panel">
        <h2>Daily Needs Notes</h2>
        ${renderNoteTimeline(notes)}
      </section>
    `;
  }

  function renderExecutiveTab(student) {
    const efLogs = state.data.executiveFunctionLogs
      .filter((log) => log.studentId === student.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const notes = getStudentNotes(student.id).filter((note) => note.sourceTab === "Executive Functioning" || note.type === "Executive Functioning");
    return `
      <div class="tab-grid two-one">
        <section class="panel">
          <h2>Executive Functioning Profile</h2>
          <div class="info-grid">
            ${infoCard("Best supports", student.profile?.efBestSupports)}
            ${infoCard("Current EF goal", student.profile?.efCurrentGoal)}
            ${infoCard("Next strategy to try", student.profile?.efNextStrategy)}
            ${infoCard("Task initiation", "Use the 1-5 scale below to log current support level.")}
            ${infoCard("Planning", "Track planning, organization, time management, working memory, flexibility, and self-monitoring.")}
            ${infoCard("Independence level", "Look for skill generalization across classes and settings.")}
          </div>
          <h3 class="subheading">Recent EF Ratings</h3>
          ${efLogs.length ? efLogs.slice(0, 5).map(renderEfLog).join("") : emptyState("No EF ratings yet.", "Add the first scale-based observation.")}
        </section>
        <section class="panel">
          <h2>Add EF Observation</h2>
          <form class="form-stack" data-form="ef-log" data-student-id="${student.id}">
            ${renderScale("taskInitiation", "Task initiation")}
            ${renderScale("planning", "Planning")}
            ${renderScale("organization", "Organization")}
            ${renderScale("timeManagement", "Time management")}
            ${renderScale("workingMemory", "Working memory")}
            ${renderScale("flexibility", "Cognitive flexibility")}
            ${renderScale("selfMonitoring", "Self-monitoring")}
            ${renderScale("homeworkCompletion", "Homework completion")}
            ${renderScale("assignmentTracking", "Assignment tracking")}
            ${renderScale("projectBreakdown", "Long-term project breakdown")}
            ${renderScale("independenceLevel", "Independence level")}
            <label>Notes
              <textarea name="notes" rows="5" required placeholder="What support level was needed and what helped?"></textarea>
            </label>
            <label>Class/setting
              <input name="classSetting" placeholder="Advisory, English, project work..." />
            </label>
            <div class="toggle-row">
              <label><input type="checkbox" name="includeInWeeklyReport" /> Include in weekly report</label>
            </div>
            <button class="primary-button" type="submit">Save EF Log</button>
          </form>
        </section>
      </div>
      <section class="panel">
        <h2>Executive Functioning Notes</h2>
        ${renderNoteTimeline(notes)}
      </section>
    `;
  }

  function renderSensoryTab(student) {
    const notes = getStudentNotes(student.id).filter((note) => /Sensory|Regulation/i.test(`${note.sourceTab} ${note.type}`));
    return `
      <div class="tab-grid two-one">
        <section class="panel">
          <h2>Sensory & Regulation Profile</h2>
          ${renderInfoCards(student, PROFILE_FIELDS.sensory)}
        </section>
        <section class="panel">
          <h2>Quick Regulation Log</h2>
          <div class="quick-button-grid">
            ${SENSORY_BUTTONS.map(
              (label) =>
                `<button type="button" data-action="quick-note" data-student-id="${student.id}" data-source-tab="Sensory & Regulation" data-type="Sensory/Regulation" data-text="${escapeAttr(label)}" data-tag="${escapeAttr(label)}">${escapeHtml(label)}</button>`
            ).join("")}
          </div>
          <form class="form-stack top-spacer" data-form="sensory-note" data-student-id="${student.id}">
            <label>Regulation note
              <textarea name="text" rows="5" placeholder="What regulation pattern, support, or recovery did you notice?" required></textarea>
            </label>
            <label>Class/setting
              <input name="classSetting" placeholder="Lunch, hallway, classroom, assembly..." />
            </label>
            <label>Tags
              <input name="tags" placeholder="noise sensitivity, break helped, used headphones" />
            </label>
            <div class="toggle-row">
              <label><input type="checkbox" name="includeInWeeklyReport" /> Include in weekly report</label>
            </div>
            <button class="primary-button" type="submit">Save Regulation Note</button>
          </form>
        </section>
      </div>
      <section class="panel">
        <h2>Sensory & Regulation Notes</h2>
        ${renderNoteTimeline(notes)}
      </section>
    `;
  }

  function renderEngagementTab(student) {
    const filters = state.profile.engagementFilters;
    const logs = getFilteredEngagementLogs(student.id);
    const teachers = unique(state.data.engagementLogs.filter((log) => log.studentId === student.id).map((log) => log.authorName));
    const tags = unique(state.data.engagementLogs.filter((log) => log.studentId === student.id).flatMap((log) => log.tags || []));
    return `
      <div class="tab-grid one-one">
        <section class="panel">
          <h2>Add Engagement Log</h2>
          <form class="form-stack" data-form="engagement-log" data-student-id="${student.id}">
            <label>Class/setting
              <input name="classSetting" required placeholder="English, lunch, advisory, science lab..." />
            </label>
            <label>Engagement level
              <select name="engagementLevel">
                ${["High", "Medium", "Low", "Avoidant", "Dysregulated", "Recovered"].map((item) => `<option>${item}</option>`).join("")}
              </select>
            </label>
            <label>Academic participation
              <textarea name="academicParticipation" rows="3" required></textarea>
            </label>
            <label>Social participation
              <textarea name="socialParticipation" rows="3"></textarea>
            </label>
            <label>Independence level
              <select name="independenceLevel">
                ${["Needed full adult support", "Needed frequent prompting", "Completed with some support", "Mostly independent", "Independent / generalized skill"].map((item) => `<option>${item}</option>`).join("")}
              </select>
            </label>
            <label>Support needed
              <textarea name="supportNeeded" rows="2"></textarea>
            </label>
            <label>What happened?
              <textarea name="whatHappened" rows="3" required></textarea>
            </label>
            <label>What helped?
              <textarea name="whatHelped" rows="3"></textarea>
            </label>
            <label>What did not help?
              <textarea name="whatDidNotHelp" rows="3"></textarea>
            </label>
            <div class="tag-checkbox-grid">
              ${ENGAGEMENT_TAGS.map((tag) => `<label><input type="checkbox" name="tags" value="${escapeAttr(tag)}" /> ${escapeHtml(tag)}</label>`).join("")}
            </div>
            <div class="toggle-row">
              <label><input type="checkbox" name="followUpNeeded" /> Follow-up needed</label>
              <label><input type="checkbox" name="includeInWeeklyReport" /> Include in weekly report</label>
            </div>
            <button class="primary-button" type="submit">Save Engagement Log</button>
          </form>
        </section>

        <section class="panel">
          <h2>Timeline & Filters</h2>
          <div class="filter-panel compact-filters">
            <label>Start
              <input type="date" data-engagement-filter="start" value="${escapeAttr(filters.start)}" />
            </label>
            <label>End
              <input type="date" data-engagement-filter="end" value="${escapeAttr(filters.end)}" />
            </label>
            <label>Teacher
              <select data-engagement-filter="teacher">
                ${option("All", filters.teacher)}
                ${teachers.map((item) => option(item, filters.teacher)).join("")}
              </select>
            </label>
            <label>Class/setting
              <input data-engagement-filter="setting" value="${escapeAttr(filters.setting)}" placeholder="Any setting" />
            </label>
            <label>Tag
              <select data-engagement-filter="tag">
                ${option("All", filters.tag)}
                ${tags.map((item) => option(item, filters.tag)).join("")}
              </select>
            </label>
            <label>Level
              <select data-engagement-filter="level">
                ${["All", "High", "Medium", "Low", "Avoidant", "Dysregulated", "Recovered"].map((item) => option(item, filters.level)).join("")}
              </select>
            </label>
            <label>Visibility
              <select data-engagement-filter="visibility">
                ${["All", "Parent-visible", "Internal only"].map((item) => option(item, filters.visibility)).join("")}
              </select>
            </label>
          </div>
          <div class="timeline">
            ${logs.length ? logs.map(renderEngagementLog).join("") : emptyState("No engagement logs match these filters.", "Try adjusting the date, teacher, or tag filters.")}
          </div>
        </section>
      </div>
    `;
  }

  function renderStrategistTab(student) {
    const insights = window.StanbridgeStrategist.analyze(student, state.data);
    const plan = state.profile.strategyPlans[student.id];
    return `
      <section class="panel strategist-hero">
        <div>
          <p class="eyebrow">Rule-based strategist</p>
          <h2>AI-inspired support suggestions from logged observations</h2>
          <p>Suggestions use cautious language and never diagnose. Connect a real AI API later by replacing the strategist module.</p>
        </div>
        <button class="primary-button" data-action="generate-strategy-plan" data-student-id="${student.id}">Generate Strategy Plan</button>
      </section>
      ${plan ? renderStrategyPlan(plan) : ""}
      <div class="insight-board">
        ${insightColumn("Patterns I’m noticing", insights.patterns)}
        ${insightColumn("Possible triggers", insights.possibleTriggers)}
        ${insightColumn("Strategies to try tomorrow", insights.helpfulStrategies)}
        ${insightColumn("Questions for the team", insights.questionsForTeam)}
        ${insightColumn("Possible accommodations to review", insights.accommodationsToReview)}
        ${insightColumn("Strengths to build on", insights.strengthsToBuildOn)}
        ${insightColumn("Parent update suggestions", insights.parentUpdateSuggestions)}
        ${insightColumn("Risk flags", insights.riskFlags, "risk")}
      </div>
    `;
  }

  function renderStrategyPlan(plan) {
    return `
      <section class="panel strategy-plan">
        <div class="section-heading compact">
          <div>
            <h2>Generated Strategy Plan</h2>
            <p>${formatDateTime(plan.createdAt)}</p>
          </div>
        </div>
        <div class="strategy-plan-grid">
          ${insightColumn("3 immediate classroom strategies", plan.immediateStrategies)}
          ${insightColumn("2 longer-term supports", plan.longerTermSupports)}
          ${insightColumn("Parent communication suggestion", [plan.parentCommunicationSuggestion])}
          ${insightColumn("Team discussion question", [plan.teamDiscussionQuestion])}
        </div>
      </section>
    `;
  }

  function insightColumn(title, items, tone = "") {
    return `
      <section class="insight-card ${tone}">
        <h3>${escapeHtml(title)}</h3>
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function renderPatternsTab(student) {
    const patterns = computePatterns(student);
    return `
      <section class="panel">
        <div class="section-heading compact">
          <div>
            <h2>Patterns</h2>
            <p>Simple trend views for the selected student. Filters are represented as demo controls for the MVP.</p>
          </div>
        </div>
        <div class="filter-panel compact-filters">
          <label>Range
            <select>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Semester</option>
              <option>Custom date range</option>
            </select>
          </label>
          <label>Teacher
            <select>
              <option>All teachers</option>
              ${unique(state.data.notes.filter((note) => note.studentId === student.id).map((note) => note.authorName)).map((name) => `<option>${escapeHtml(name)}</option>`).join("")}
            </select>
          </label>
          <label>Class/setting
            <input placeholder="Any class/setting" />
          </label>
        </div>
      </section>
      <div class="pattern-grid">
        ${chartCard("Engagement over time", patterns.engagement)}
        ${chartCard("Regulation over time", patterns.regulation)}
        ${chartCard("Most common triggers", patterns.triggers)}
        ${chartCard("Most helpful supports", patterns.supports)}
        ${chartCard("Notes by category", patterns.categories)}
        ${chartCard("Notes by teacher", patterns.teachers)}
        ${chartCard("Independence growth", patterns.independence)}
        ${chartCard("Executive functioning ratings", patterns.ef)}
        ${chartCard("Sensory events by time of day", patterns.sensoryTime)}
        ${chartCard("Positive moments over time", patterns.positive)}
      </div>
    `;
  }

  function chartCard(title, rows) {
    const max = Math.max(1, ...rows.map((row) => row.value));
    return `
      <section class="panel chart-card">
        <h3>${escapeHtml(title)}</h3>
        <div class="bar-list">
          ${rows.length ? rows.map((row) => `
            <div class="bar-row">
              <span>${escapeHtml(row.label)}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.max(8, (row.value / max) * 100)}%"></div></div>
              <strong>${escapeHtml(row.value)}</strong>
            </div>
          `).join("") : `<p class="muted">No data yet.</p>`}
        </div>
      </section>
    `;
  }

  function renderReportsTab(student) {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
    const start = startDate.toISOString().slice(0, 10);
    const draft = state.profile.reportDrafts[student.id];
    const reports = state.data.reports
      .filter((report) => report.studentId === student.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const selectableNotes = getStudentNotes(student.id)
      .filter((note) => note.includeInWeeklyReport)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 12);

    return `
      <div class="tab-grid one-one">
        <section class="panel">
          <h2>Weekly Spark Report</h2>
          <form class="form-stack" data-form="generate-report" data-student-id="${student.id}">
            <div class="inline-fields">
              <label>Date range start
                <input name="dateRangeStart" type="date" value="${draft?.dateRangeStart || start}" required />
              </label>
              <label>Date range end
                <input name="dateRangeEnd" type="date" value="${draft?.dateRangeEnd || end}" required />
              </label>
            </div>
            <div class="tag-checkbox-grid">
              ${[
                ["includeSparkNotes", "Include spark notes"],
                ["includeEngagementLog", "Include engagement log"],
                ["includeExecutiveFunctioning", "Include executive functioning"],
                ["includeCommunication", "Include communication"],
                ["includeSensoryRegulation", "Include sensory/regulation"],
                ["includeTeacherRecommendations", "Include teacher recommendations"],
                ["includeGoalsNextWeek", "Include goals for next week"],
              ]
                .map(([name, label]) => `<label><input type="checkbox" name="${name}" checked /> ${label}</label>`)
                .join("")}
            </div>
            <details class="note-selector">
              <summary>Select notes to include</summary>
              ${selectableNotes.length ? selectableNotes.map((note) => `
                <label>
                  <input type="checkbox" name="selectedNoteIds" value="${note.id}" checked />
                  <span>${escapeHtml(note.type)} · ${formatDateTime(note.createdAt)} · ${escapeHtml(truncate(note.text, 90))}</span>
                </label>
              `).join("") : `<p class="muted">No parent-visible notes in this range yet.</p>`}
            </details>
            <label>Teacher recommendations / home support
              <textarea name="homeSupport" rows="3" placeholder="Optional suggested home support..."></textarea>
            </label>
            <label>Teacher notes
              <textarea name="teacherNotes" rows="3" placeholder="Optional closing note..."></textarea>
            </label>
            <button class="primary-button" type="submit">Generate Draft</button>
          </form>
        </section>

        <section class="panel report-editor-panel">
          <h2>Draft Editor</h2>
          ${draft ? `
            <form class="form-stack" data-form="save-report" data-student-id="${student.id}">
              <label>Title
                <input name="title" value="${escapeAttr(draft.title)}" required />
              </label>
              <label>Status
                <select name="status">
                  ${["Draft", "Ready to Send", "Sent", "Archived"].map((status) => option(status, draft.status || "Draft")).join("")}
                </select>
              </label>
              <label>Report content
                <textarea class="report-textarea" name="content" rows="22" required>${escapeHtml(draft.content)}</textarea>
              </label>
              <input type="hidden" name="dateRangeStart" value="${escapeAttr(draft.dateRangeStart)}" />
              <input type="hidden" name="dateRangeEnd" value="${escapeAttr(draft.dateRangeEnd)}" />
              <input type="hidden" name="includedNoteIds" value="${escapeAttr((draft.includedNoteIds || []).join(","))}" />
              <div class="button-row">
                <button class="primary-button" type="submit">Save Report</button>
                <button class="secondary-button" type="button" data-action="copy-draft-report" data-student-id="${student.id}">Copy Text</button>
                <button class="secondary-button" type="button" data-action="download-draft-report" data-student-id="${student.id}">Download</button>
              </div>
            </form>
          ` : emptyState("No draft generated yet.", "Generate a weekly report draft, edit it, then save it for the team.")}
        </section>
      </div>

      <section class="panel">
        <h2>Previous Reports</h2>
        <div class="report-list">
          ${reports.length ? reports.map(renderReportCard).join("") : emptyState("No saved reports yet.", "Saved reports will be visible to all teachers on this student profile.")}
        </div>
      </section>
    `;
  }

  function renderReportCard(report) {
    return `
      <article class="report-card">
        <div>
          <span class="status-pill ${statusClass(report.status)}">${escapeHtml(report.status)}</span>
          <h3>${escapeHtml(report.title)}</h3>
          <p>${escapeHtml(report.dateRangeStart)} to ${escapeHtml(report.dateRangeEnd)} · Created by ${escapeHtml(report.createdByName)} · ${formatDateTime(report.createdAt)}</p>
        </div>
        <pre>${escapeHtml(truncate(report.content, 420))}</pre>
        <div class="button-row">
          <button class="secondary-button compact-button" data-action="copy-report" data-report-id="${report.id}">Copy</button>
          <button class="secondary-button compact-button" data-action="download-report" data-report-id="${report.id}">Download</button>
          ${report.status !== "Sent" ? `<button class="primary-button compact-button" data-action="send-report" data-report-id="${report.id}">Simulate Send</button>` : ""}
        </div>
      </article>
    `;
  }

  function renderArchiveTab(student) {
    const filters = state.profile.archiveFilters;
    const items = getFilteredArchiveItems(student.id);
    const teachers = unique(getArchiveItems(student.id).map((item) => item.authorName || item.createdByName).filter(Boolean));
    const types = unique(getArchiveItems(student.id).map((item) => item.type));
    return `
      <section class="panel">
        <div class="section-heading compact">
          <div>
            <h2>Notes Archive</h2>
            <p>Every saved note, log summary, emergency note, and report reference for this student.</p>
          </div>
        </div>
        <div class="filter-panel compact-filters">
          <label>Scope
            <select data-archive-filter="scope">
              ${["All notes", "Notes written by me", "Everyone except me"].map((item) => option(item, filters.scope)).join("")}
            </select>
          </label>
          <label>Teacher
            <select data-archive-filter="teacher">
              ${option("All", filters.teacher)}
              ${teachers.map((item) => option(item, filters.teacher)).join("")}
            </select>
          </label>
          <label>Note type
            <select data-archive-filter="type">
              ${option("All", filters.type)}
              ${types.map((item) => option(item, filters.type)).join("")}
            </select>
          </label>
          <label>Start
            <input type="date" data-archive-filter="start" value="${escapeAttr(filters.start)}" />
          </label>
          <label>End
            <input type="date" data-archive-filter="end" value="${escapeAttr(filters.end)}" />
          </label>
          <label>Visibility
            <select data-archive-filter="visibility">
              ${["All", "Parent-visible only", "Internal only", "Emergency notes", "Spark notes", "Engagement notes", "Communication notes", "Sensory notes", "Executive functioning notes"].map((item) => option(item, filters.visibility)).join("")}
            </select>
          </label>
        </div>
      </section>
      <section class="archive-list">
        ${items.length ? items.map(renderArchiveItem).join("") : emptyState("No archive items match these filters.", "Try changing type, visibility, or teacher filters.")}
      </section>
    `;
  }

  function renderArchiveItem(item) {
    const canEdit = item.kind === "note" && canEditNote(item);
    return `
      <article class="archive-card">
        <div class="archive-meta">
          <span class="support-badge">${escapeHtml(item.type)}</span>
          <span>${escapeHtml(item.authorName || item.createdByName || "Unknown")}</span>
          <span>${escapeHtml(item.authorEmail || "")}</span>
          <span>${formatDateTime(item.createdAt)}</span>
          <span>${escapeHtml(item.visibility || item.status || "internal only")}</span>
          <span>${escapeHtml(item.sourceTab || item.kind)}</span>
        </div>
        <p>${escapeHtml(item.text || item.content || "")}</p>
        <div class="badge-row">
          ${(item.tags || []).map((tag) => `<span class="mini-badge">${escapeHtml(tag)}</span>`).join("")}
        </div>
        ${canEdit ? `
          <div class="button-row">
            <button class="secondary-button compact-button" data-modal="edit-note" data-note-id="${item.id}">Edit</button>
            <button class="ghost-danger compact-button" data-action="delete-note" data-note-id="${item.id}">Delete</button>
          </div>
        ` : ""}
      </article>
    `;
  }

  function renderReportsArchive() {
    const reports = state.data.reports
      .map((report) => ({ ...report, student: getStudent(report.studentId) }))
      .filter((report) => report.student)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return `
      <main class="page">
        <section class="dashboard-hero">
          <div>
            <p class="eyebrow">Reports Archive</p>
            <h1>Weekly Spark reports across all students.</h1>
          </div>
        </section>
        <section class="panel">
          <div class="report-list">
            ${reports.length ? reports.map((report) => `
              <article class="report-card">
                <div>
                  <span class="status-pill ${statusClass(report.status)}">${escapeHtml(report.status)}</span>
                  <h3>${escapeHtml(report.title)}</h3>
                  <p><a href="#student/${report.studentId}?tab=reports">${escapeHtml(report.student.firstName)} ${escapeHtml(report.student.lastName)}</a> · ${escapeHtml(report.createdByName)} · ${formatDateTime(report.createdAt)}</p>
                </div>
                <pre>${escapeHtml(truncate(report.content, 420))}</pre>
              </article>
            `).join("") : emptyState("No saved reports yet.", "Generate a report from any student profile.")}
          </div>
        </section>
      </main>
    `;
  }

  function renderAdmin() {
    if (state.currentUser.role !== "Administrator") {
      return `
        <main class="page">
          <section class="panel">
            <h1>Administrator access required</h1>
            <p class="muted">Teacher accounts can view students, add notes, and generate reports.</p>
          </section>
        </main>
      `;
    }

    return `
      <main class="page admin-page">
        <section class="dashboard-hero">
          <div>
            <p class="eyebrow">Admin Settings</p>
            <h1>Manage teacher accounts, students, and prototype data.</h1>
          </div>
        </section>
        <div class="tab-grid one-one">
          <section class="panel">
            <h2>Add Teacher Account</h2>
            <form class="form-stack" data-form="admin-add-user">
              <label>Name <input name="name" required /></label>
              <label>Email <input name="email" type="email" required /></label>
              <label>Temporary password <input name="password" value="stanbridge2026" required /></label>
              <label>Role
                <select name="role"><option>Teacher</option><option>Administrator</option></select>
              </label>
              <button class="primary-button" type="submit">Add Account</button>
            </form>
            <h3 class="subheading">Teacher Accounts</h3>
            <div class="mini-list">
              ${state.data.users.map((user) => `
                <div class="mini-item static">
                  <span class="mini-avatar">${initials(user.name)}</span>
                  <span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.email)} · ${escapeHtml(user.role)}</small></span>
                  <div class="button-row">
                    <button class="secondary-button compact-button" data-action="toggle-user-role" data-user-id="${user.id}">${user.role === "Administrator" ? "Make Teacher" : "Make Admin"}</button>
                    <button class="secondary-button compact-button" data-action="reset-user-password" data-user-id="${user.id}">Reset Password</button>
                    <button class="ghost-danger compact-button" data-action="delete-user" data-user-id="${user.id}">Delete</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </section>
          <section class="panel">
            <h2>Add Student</h2>
            <form class="form-stack" data-form="admin-add-student">
              <div class="inline-fields">
                <label>First name <input name="firstName" required /></label>
                <label>Last name <input name="lastName" required /></label>
              </div>
              <label>Grade
                <select name="grade">${GRADE_FILTERS.slice(5).map((grade) => `<option>${grade}</option>`).join("")}</select>
              </label>
              <label>Student email <input name="email" type="email" required /></label>
              <label>Learning profile/support needs summary <textarea name="supportSummary" rows="4"></textarea></label>
              <label>Support needs <input name="supportNeeds" placeholder="Executive Functioning, Sensory" /></label>
              <label>Strengths <input name="strengths" placeholder="Creative writing, coding" /></label>
              <button class="primary-button" type="submit">Add Student</button>
            </form>
          </section>
        </div>
        <section class="panel">
          <div class="section-heading compact">
            <div>
              <h2>Student Administration</h2>
              <p>Archive students instead of deleting whenever possible.</p>
            </div>
            <button class="ghost-danger" data-action="reset-demo-data">Reset Demo Data</button>
          </div>
          <div class="admin-student-list">
            ${state.data.students.map((student) => `
              <div class="admin-row">
                ${renderAvatar(student, "small")}
                <span><strong>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</strong><small>Grade ${escapeHtml(student.grade)} · ${escapeHtml(student.email)}</small></span>
                <button class="secondary-button compact-button" data-modal="edit-student" data-student-id="${student.id}">Edit</button>
                <button class="ghost-button compact-button" data-action="archive-student" data-student-id="${student.id}">${student.archived ? "Archived" : "Archive"}</button>
                <button class="ghost-danger compact-button" data-action="delete-student" data-student-id="${student.id}">Delete</button>
              </div>
            `).join("")}
          </div>
        </section>
      </main>
    `;
  }

  function renderNotFound(message = "The page you requested was not found.") {
    return `
      <main class="page">
        <section class="panel">
          <h1>Not found</h1>
          <p>${escapeHtml(message)}</p>
          <a class="primary-button" href="#dashboard">Return to dashboard</a>
        </section>
      </main>
    `;
  }

  function renderInfoCards(student, fields) {
    return `<div class="info-grid">${fields.map(([label, key, profileField]) => infoCard(label, getStudentField(student, key, profileField))).join("")}</div>`;
  }

  function infoCard(label, value) {
    const clean = Array.isArray(value) ? value.join(", ") : value || "Not yet documented.";
    return `
      <article class="info-card">
        <h3>${escapeHtml(label)}</h3>
        <p>${escapeHtml(clean)}</p>
      </article>
    `;
  }

  function getStudentField(student, key, profileField) {
    if (profileField) return student.profile?.[key];
    return student[key];
  }

  function renderNoteTimeline(notes) {
    const sorted = notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!sorted.length) return emptyState("No notes yet.", "Saved observations will appear here for all teachers.");
    return `<div class="timeline">${sorted.map(renderNoteCard).join("")}</div>`;
  }

  function renderNoteCard(note) {
    return `
      <article class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-body">
          <div class="timeline-header">
            <span class="support-badge">${escapeHtml(note.type)}</span>
            <strong>${escapeHtml(note.authorName)}</strong>
            <time>${formatDateTime(note.createdAt)}</time>
          </div>
          <p>${escapeHtml(note.text)}</p>
          <div class="badge-row">
            ${(note.tags || []).map((tag) => `<span class="mini-badge">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="note-footer">
            <span>${escapeHtml(note.classSetting || "No setting")}</span>
            <span>${escapeHtml(note.visibility)}</span>
            ${note.includeInWeeklyReport ? "<span>Weekly report</span>" : ""}
          </div>
          ${canEditNote(note) ? `
            <div class="button-row">
              <button class="secondary-button compact-button" data-modal="edit-note" data-note-id="${note.id}">Edit</button>
              <button class="ghost-danger compact-button" data-action="delete-note" data-note-id="${note.id}">Delete</button>
            </div>
          ` : ""}
        </div>
      </article>
    `;
  }

  function renderScale(name, label) {
    return `
      <label class="range-field">${escapeHtml(label)}
        <input name="${escapeAttr(name)}" type="range" min="1" max="5" value="3" />
        <span class="range-help">1 full adult support · 3 some support · 5 independent/generalized</span>
      </label>
    `;
  }

  function renderEfLog(log) {
    return `
      <article class="compact-log">
        <div>
          <strong>${formatDateTime(log.date)}</strong>
          <span>${escapeHtml(log.authorName)} · Independence ${escapeHtml(log.independenceLevel)}/5</span>
        </div>
        <p>${escapeHtml(log.notes)}</p>
      </article>
    `;
  }

  function renderEngagementLog(log) {
    return `
      <article class="timeline-item engagement ${levelClass(log.engagementLevel)}">
        <div class="timeline-marker"></div>
        <div class="timeline-body">
          <div class="timeline-header">
            <span class="status-pill ${levelClass(log.engagementLevel)}">${escapeHtml(log.engagementLevel)}</span>
            <strong>${escapeHtml(log.classSetting || "Class")}</strong>
            <time>${formatDateTime(log.date)}</time>
          </div>
          <p><strong>What happened:</strong> ${escapeHtml(log.whatHappened)}</p>
          <p><strong>What helped:</strong> ${escapeHtml(log.whatHelped || "Not logged")}</p>
          <p><strong>Support needed:</strong> ${escapeHtml(log.supportNeeded || "Not logged")}</p>
          <div class="badge-row">${(log.tags || []).map((tag) => `<span class="mini-badge">${escapeHtml(tag)}</span>`).join("")}</div>
          <div class="note-footer">
            <span>${escapeHtml(log.authorName)}</span>
            <span>${log.includeInWeeklyReport ? "Parent-visible" : "Internal only"}</span>
            ${log.followUpNeeded ? "<span>Follow-up needed</span>" : ""}
          </div>
        </div>
      </article>
    `;
  }

  function renderModal() {
    const { type } = state.modal;
    if (type === "edit-student") return modalShell("Edit Student Info", renderEditStudentModal());
    if (type === "parent-note") return modalShell("Add Parent Note", renderParentNoteModal());
    if (type === "emergency-note") return modalShell("Emergency Parent Note", renderEmergencyNoteModal());
    if (type === "daily-photo-note") return modalShell("Daily Photo Note", renderDailyPhotoNoteModal());
    if (type === "edit-note") return modalShell("Edit Note", renderEditNoteModal());
    if (type === "global-note") return modalShell("Add Student Note", renderGlobalNoteModal());
    return "";
  }

  function modalShell(title, body) {
    return `
      <div class="modal-backdrop" role="presentation" data-action="close-modal">
        <section class="modal" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}" data-modal-panel>
          <div class="modal-header">
            <h2>${escapeHtml(title)}</h2>
            <button class="icon-button" type="button" data-action="close-modal" aria-label="Close modal">×</button>
          </div>
          ${body}
        </section>
      </div>
    `;
  }

  function renderEditStudentModal() {
    const student = getStudent(state.modal.studentId);
    if (!student) return `<p>Student not found.</p>`;
    return `
      <form class="form-stack modal-form" data-form="edit-student" data-student-id="${student.id}">
        <div class="inline-fields">
          <label>First name <input name="firstName" value="${escapeAttr(student.firstName)}" required /></label>
          <label>Last name <input name="lastName" value="${escapeAttr(student.lastName)}" required /></label>
        </div>
        <div class="inline-fields">
          <label>Grade
            <select name="grade">${GRADE_FILTERS.slice(5).map((grade) => option(grade, student.grade)).join("")}</select>
          </label>
          <label>Student email <input name="email" type="email" value="${escapeAttr(student.email)}" required /></label>
        </div>
        <label>Student photo/avatar URL <input name="photoUrl" value="${escapeAttr(student.photoUrl || "")}" placeholder="Optional image URL" /></label>
        <label>Learning profile/support needs summary <textarea name="supportSummary" rows="3">${escapeHtml(student.supportSummary || "")}</textarea></label>
        <label>Diagnoses/support categories <textarea name="supportNeeds" rows="2">${escapeHtml((student.supportNeeds || []).join(", "))}</textarea></label>
        <label>Strengths <textarea name="strengths" rows="2">${escapeHtml((student.strengths || []).join(", "))}</textarea></label>
        <label>Motivators <textarea name="motivators" rows="2">${escapeHtml((student.motivators || []).join(", "))}</textarea></label>
        <label>Sensory needs <textarea name="sensoryNeeds" rows="2">${escapeHtml((student.sensoryNeeds || []).join(", "))}</textarea></label>
        <label>Known triggers <textarea name="triggers" rows="2">${escapeHtml((student.triggers || []).join(", "))}</textarea></label>
        <label>Communication style <textarea name="communicationStyle" rows="2">${escapeHtml(student.communicationStyle || "")}</textarea></label>
        <label>Helpful strategies / accommodations <textarea name="accommodations" rows="2">${escapeHtml((student.accommodations || []).join(", "))}</textarea></label>
        <label>Current goals <textarea name="currentGoals" rows="2">${escapeHtml((student.currentGoals || []).join(", "))}</textarea></label>
        <label>Parent/guardian contacts <textarea name="parentContacts" rows="4" placeholder="Name | email | phone | relationship">${escapeHtml(formatContacts(student.parentContacts))}</textarea></label>
        <label>Emergency contacts <textarea name="emergencyContacts" rows="3" placeholder="Name | phone | relationship">${escapeHtml(formatContacts(student.emergencyContacts, true))}</textarea></label>
        <label>Notes visibility level
          <select name="notesVisibilityLevel">
            ${["Shared with support team", "Teacher team only", "Administrator review required"].map((item) => option(item, student.notesVisibilityLevel || "Shared with support team")).join("")}
          </select>
        </label>
        <details class="advanced-profile-fields" open>
          <summary>Detailed profile fields</summary>
          ${renderProfileEditFields(student)}
        </details>
        <button class="primary-button" type="submit">Save Student Info</button>
      </form>
    `;
  }

  function renderProfileEditFields(student) {
    const fields = [
      ...PROFILE_FIELDS.spark.filter(([, key, profile]) => profile).map(([label, key]) => [label, key]),
      ...PROFILE_FIELDS.communication.map(([label, key]) => [label, key]),
      ...PROFILE_FIELDS.daily.map(([label, key]) => [label, key]),
      ["Best supports", "efBestSupports"],
      ["Current EF goal", "efCurrentGoal"],
      ["Next strategy to try", "efNextStrategy"],
      ...PROFILE_FIELDS.sensory.map(([label, key]) => [label, key]),
    ];
    const seen = new Set();
    return fields
      .filter(([, key]) => {
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(([label, key]) => `<label>${escapeHtml(label)}<textarea name="profile.${escapeAttr(key)}" rows="2">${escapeHtml(student.profile?.[key] || "")}</textarea></label>`)
      .join("");
  }

  function renderParentNoteModal() {
    const student = getStudent(state.modal.studentId);
    return `
      <form class="form-stack" data-form="parent-note" data-student-id="${student.id}">
        <p class="muted">Prototype mode saves the note and can simulate sending. No real email is sent.</p>
        <label>Parent note
          <textarea name="text" rows="7" required placeholder="Write a strength-based, parent-friendly update..."></textarea>
        </label>
        <label>Status
          <select name="status">
            <option>Draft</option>
            <option>Ready to Send</option>
            <option>Sent</option>
          </select>
        </label>
        <label>Contact method
          <select name="classSetting">
            <option>Email</option>
            <option>Phone</option>
            <option>Conference</option>
            <option>Internal draft</option>
          </select>
        </label>
        <div class="toggle-row">
          <label><input type="checkbox" name="includeInWeeklyReport" checked /> Include in weekly report</label>
        </div>
        <button class="primary-button" type="submit">Save Parent Note</button>
      </form>
    `;
  }

  function renderEmergencyNoteModal() {
    const student = getStudent(state.modal.studentId);
    return `
      <form class="form-stack" data-form="emergency-note" data-student-id="${student.id}">
        <p class="muted">Use only for urgent parent communication. This saves a pinned internal flag until resolved.</p>
        <label>Reason <input name="reason" required /></label>
        <label>What happened? <textarea name="whatHappened" rows="4" required></textarea></label>
        <label>Student status now <textarea name="studentStatusNow" rows="3" required></textarea></label>
        <label>Action taken <textarea name="actionTaken" rows="3" required></textarea></label>
        <label>Follow-up needed <textarea name="followUpNeeded" rows="3"></textarea></label>
        <label>Parent contact method
          <select name="parentContactMethod">
            <option>Phone call</option>
            <option>Email</option>
            <option>Voicemail</option>
            <option>In-person</option>
            <option>Not yet contacted</option>
          </select>
        </label>
        <div class="inline-fields">
          <label>Contacted by <input name="contactedBy" value="${escapeAttr(state.currentUser.name)}" /></label>
          <label class="checkbox-label"><input type="checkbox" name="contacted" /> Mark as contacted</label>
        </div>
        <button class="warning-button" type="submit">Save Emergency Note</button>
      </form>
    `;
  }

  function renderDailyPhotoNoteModal() {
    const student = getStudent(state.modal.studentId);
    return `
      <form class="form-stack" data-form="daily-photo-note" data-student-id="${student.id}">
        <p class="muted">Prototype photo notes store an optional image URL only. Do not upload real student images in this local MVP.</p>
        <label>Image URL <input name="imageUrl" placeholder="Optional prototype image URL" /></label>
        <label>Photo note <textarea name="text" rows="6" required placeholder="What does this moment show about engagement or support?"></textarea></label>
        <label>Class/setting <input name="classSetting" /></label>
        <div class="toggle-row">
          <label><input type="checkbox" name="includeInWeeklyReport" /> Include in weekly report</label>
        </div>
        <button class="primary-button" type="submit">Save Photo Note</button>
      </form>
    `;
  }

  function renderEditNoteModal() {
    const note = state.data.notes.find((entry) => entry.id === state.modal.noteId);
    if (!note) return `<p>Note not found.</p>`;
    return `
      <form class="form-stack" data-form="edit-note" data-note-id="${note.id}">
        <label>Type <input name="type" value="${escapeAttr(note.type)}" required /></label>
        <label>Text <textarea name="text" rows="7" required>${escapeHtml(note.text)}</textarea></label>
        <label>Tags <input name="tags" value="${escapeAttr((note.tags || []).join(", "))}" /></label>
        <label>Class/setting <input name="classSetting" value="${escapeAttr(note.classSetting || "")}" /></label>
        <label>Visibility
          <select name="visibility">
            ${["internal only", "include in parent report"].map((item) => option(item, note.visibility)).join("")}
          </select>
        </label>
        <div class="toggle-row">
          <label><input type="checkbox" name="includeInWeeklyReport" ${note.includeInWeeklyReport ? "checked" : ""} /> Include in weekly report</label>
        </div>
        <button class="primary-button" type="submit">Save Note</button>
      </form>
    `;
  }

  function renderGlobalNoteModal() {
    return `
      <form class="form-stack" data-form="global-note">
        <label>Student
          <select name="studentId" required>
            ${state.data.students
              .filter((student) => !student.archived)
              .sort((a, b) => a.lastName.localeCompare(b.lastName))
              .map((student) => `<option value="${student.id}">${escapeHtml(student.lastName)}, ${escapeHtml(student.firstName)} · Grade ${escapeHtml(student.grade)}</option>`)
              .join("")}
          </select>
        </label>
        <label>Type
          <select name="type">${QUICK_TYPES.map((type) => `<option>${escapeHtml(type)}</option>`).join("")}</select>
        </label>
        <label>Observation <textarea name="text" rows="6" required></textarea></label>
        <label>Class/setting <input name="classSetting" /></label>
        <label>Tags <input name="tags" placeholder="visual checklist helped, peer success" /></label>
        <div class="toggle-row">
          <label><input type="checkbox" name="includeInWeeklyReport" /> Include in weekly report</label>
        </div>
        <button class="primary-button" type="submit">Save Note</button>
      </form>
    `;
  }

  function handleSubmit(event) {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    const type = form.dataset.form;
    try {
      if (type === "signin") submitSignIn(form);
      if (type === "create-account") submitCreateAccount(form);
      if (type === "quick-log") submitQuickLog(form);
      if (type === "global-note") submitGlobalNote(form);
      if (type === "spark-note") submitBasicNote(form, "Spark", "Spark Profile");
      if (type === "communication-observation") submitBasicNote(form, "Communication", "Communication");
      if (type === "daily-note") submitBasicNote(form, "Daily Needs", "Daily Needs");
      if (type === "sensory-note") submitBasicNote(form, "Sensory/Regulation", "Sensory & Regulation");
      if (type === "ef-log") submitEfLog(form);
      if (type === "engagement-log") submitEngagementLog(form);
      if (type === "generate-report") submitGenerateReport(form);
      if (type === "save-report") submitSaveReport(form);
      if (type === "parent-note") submitParentNote(form);
      if (type === "emergency-note") submitEmergencyNote(form);
      if (type === "daily-photo-note") submitDailyPhotoNote(form);
      if (type === "edit-student") submitEditStudent(form);
      if (type === "edit-note") submitEditNote(form);
      if (type === "admin-add-user") submitAdminAddUser(form);
      if (type === "admin-add-student") submitAdminAddStudent(form);
    } catch (error) {
      toast(error.message || "Something went wrong.", "error");
    }
  }

  function handleClick(event) {
    const actionTarget = event.target.closest("[data-action], [data-modal]");
    if (!actionTarget) return;

    if (actionTarget.dataset.modal) {
      event.preventDefault();
      state.modal = {
        type: actionTarget.dataset.modal,
        studentId: actionTarget.dataset.studentId,
        noteId: actionTarget.dataset.noteId,
      };
      render();
      return;
    }

    const action = actionTarget.dataset.action;
    if (!action) return;

    if (action === "close-modal") {
      if (event.target.matches(".modal-backdrop") || event.target.closest("[data-action='close-modal']")) {
        state.modal = null;
        render();
      }
      return;
    }

    if (event.target.closest("[data-modal-panel]") && action !== "close-modal") {
      event.stopPropagation();
    }

    if (action === "logout") {
      window.StanbridgeStore.logout();
      toast("Signed out.");
      navigate("signin");
      return;
    }
    if (action === "demo-login") {
      window.StanbridgeStore.login(actionTarget.dataset.email, "stanbridge2026");
      toast("Signed in with demo account.");
      navigate("dashboard");
      return;
    }
    if (action === "set-log-type") {
      const form = actionTarget.closest("form");
      form.querySelector("input[name='type']").value = actionTarget.dataset.type;
      form.querySelectorAll("[data-action='set-log-type']").forEach((button) => button.classList.remove("active"));
      actionTarget.classList.add("active");
      return;
    }
    if (action === "quick-note") {
      quickAddNote(actionTarget);
      return;
    }
    if (action === "generate-strategy-plan") {
      const student = getStudent(actionTarget.dataset.studentId);
      state.profile.strategyPlans[student.id] = window.StanbridgeStrategist.generateStrategyPlan(student, state.data);
      toast("Strategy plan generated.");
      render();
      return;
    }
    if (action === "resolve-emergency") {
      window.StanbridgeStore.updateEmergencyParentNote(actionTarget.dataset.emergencyId, { resolved: true, contacted: true });
      toast("Emergency note marked resolved.");
      render();
      return;
    }
    if (action === "delete-note") {
      if (confirm("Delete this note? This cannot be undone.")) {
        window.StanbridgeStore.deleteNote(actionTarget.dataset.noteId);
        toast("Note deleted.");
        render();
      }
      return;
    }
    if (action === "send-report") {
      window.StanbridgeStore.updateReport(actionTarget.dataset.reportId, { status: "Sent" });
      toast("Prototype send complete. No real email was sent.");
      render();
      return;
    }
    if (action === "copy-report") {
      const report = state.data.reports.find((entry) => entry.id === actionTarget.dataset.reportId);
      copyText(report.content);
      return;
    }
    if (action === "download-report") {
      const report = state.data.reports.find((entry) => entry.id === actionTarget.dataset.reportId);
      downloadText(`${safeFileName(report.title)}.txt`, report.content);
      return;
    }
    if (action === "copy-draft-report") {
      copyText(state.profile.reportDrafts[actionTarget.dataset.studentId]?.content || "");
      return;
    }
    if (action === "download-draft-report") {
      const draft = state.profile.reportDrafts[actionTarget.dataset.studentId];
      downloadText(`${safeFileName(draft.title)}.txt`, draft.content);
      return;
    }
    if (action === "archive-student") {
      window.StanbridgeStore.archiveStudent(actionTarget.dataset.studentId);
      toast("Student archived.");
      render();
      return;
    }
    if (action === "delete-student") {
      if (confirm("Delete this student and all local prototype records for them?")) {
        window.StanbridgeStore.deleteStudent(actionTarget.dataset.studentId);
        toast("Student deleted from local prototype data.");
        render();
      }
      return;
    }
    if (action === "toggle-user-role") {
      const user = state.data.users.find((entry) => entry.id === actionTarget.dataset.userId);
      window.StanbridgeStore.updateUser(user.id, { role: user.role === "Administrator" ? "Teacher" : "Administrator" });
      toast("Teacher role updated.");
      render();
      return;
    }
    if (action === "reset-user-password") {
      window.StanbridgeStore.updateUser(actionTarget.dataset.userId, { password: "stanbridge2026" });
      toast("Password reset to stanbridge2026.");
      render();
      return;
    }
    if (action === "delete-user") {
      if (actionTarget.dataset.userId === state.currentUser.id) {
        toast("You cannot delete the signed-in account.", "error");
        return;
      }
      if (confirm("Delete this teacher account from the local prototype?")) {
        window.StanbridgeStore.deleteUser(actionTarget.dataset.userId);
        toast("Teacher account deleted.");
        render();
      }
      return;
    }
    if (action === "reset-demo-data") {
      if (confirm("Reset all prototype data to the original demo set?")) {
        window.StanbridgeStore.resetDemoData();
        toast("Demo data reset.");
        navigate("signin");
      }
      return;
    }
    if (action === "scroll-followups") {
      document.getElementById("followups")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "filter-emergency") {
      state.dashboard.flag = "Unresolved emergency";
      render();
    }
  }

  function handleInput(event) {
    const dashboardFilter = event.target.closest("[data-dashboard-filter]");
    if (dashboardFilter) {
      state.dashboard[dashboardFilter.dataset.dashboardFilter] = dashboardFilter.value;
      render();
      return;
    }

    const engagementFilter = event.target.closest("[data-engagement-filter]");
    if (engagementFilter) {
      state.profile.engagementFilters[engagementFilter.dataset.engagementFilter] = engagementFilter.value;
      render();
      return;
    }

    const archiveFilter = event.target.closest("[data-archive-filter]");
    if (archiveFilter) {
      state.profile.archiveFilters[archiveFilter.dataset.archiveFilter] = archiveFilter.value;
      render();
    }
  }

  function submitSignIn(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.login(values.email, values.password);
    toast("Signed in.");
    navigate("dashboard");
  }

  function submitCreateAccount(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.createAccount(values);
    toast("Account created.");
    navigate("dashboard");
  }

  function submitQuickLog(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.addNote(
      {
        studentId: form.dataset.studentId,
        type: values.type,
        sourceTab: sourceForType(values.type),
        text: values.text,
        tags: parseList(values.tags),
        classSetting: values.classSetting,
        visibility: values.visibility,
        includeInWeeklyReport: Boolean(values.includeInWeeklyReport),
      },
      state.currentUser
    );
    toast("Quick log saved.");
    render();
  }

  function submitGlobalNote(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.addNote(
      {
        studentId: values.studentId,
        type: values.type,
        sourceTab: sourceForType(values.type),
        text: values.text,
        tags: parseList(values.tags),
        classSetting: values.classSetting,
        visibility: values.includeInWeeklyReport ? "include in parent report" : "internal only",
        includeInWeeklyReport: Boolean(values.includeInWeeklyReport),
      },
      state.currentUser
    );
    state.modal = null;
    toast("Student note saved.");
    render();
  }

  function submitBasicNote(form, type, sourceTab) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.addNote(
      {
        studentId: form.dataset.studentId,
        type,
        sourceTab,
        text: values.text,
        category: values.category || "",
        tags: parseList(values.tags),
        classSetting: values.classSetting,
        visibility: values.visibility || (values.includeInWeeklyReport ? "include in parent report" : "internal only"),
        includeInWeeklyReport: Boolean(values.includeInWeeklyReport),
      },
      state.currentUser
    );
    toast(`${type} note saved.`);
    render();
  }

  function submitEfLog(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.addExecutiveFunctionLog(
      {
        studentId: form.dataset.studentId,
        ...values,
      },
      state.currentUser
    );
    toast("Executive functioning log saved.");
    render();
  }

  function submitEngagementLog(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.addEngagementLog(
      {
        studentId: form.dataset.studentId,
        ...values,
        tags: checkboxValues(form, "tags"),
      },
      state.currentUser
    );
    toast("Engagement log saved.");
    render();
  }

  function submitGenerateReport(form) {
    const values = valuesFromForm(form);
    const student = getStudent(form.dataset.studentId);
    const generated = window.StanbridgeReports.generateWeeklyReport(student, state.data, {
      ...values,
      selectedNoteIds: checkboxValues(form, "selectedNoteIds"),
      includeSparkNotes: Boolean(values.includeSparkNotes),
      includeEngagementLog: Boolean(values.includeEngagementLog),
      includeExecutiveFunctioning: Boolean(values.includeExecutiveFunctioning),
      includeCommunication: Boolean(values.includeCommunication),
      includeSensoryRegulation: Boolean(values.includeSensoryRegulation),
      includeTeacherRecommendations: Boolean(values.includeTeacherRecommendations),
      includeGoalsNextWeek: Boolean(values.includeGoalsNextWeek),
    });
    state.profile.reportDrafts[student.id] = {
      ...generated,
      status: "Draft",
    };
    toast("Weekly report draft generated.");
    render();
  }

  function submitSaveReport(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.addReport(
      {
        studentId: form.dataset.studentId,
        title: values.title,
        status: values.status,
        content: values.content,
        dateRangeStart: values.dateRangeStart,
        dateRangeEnd: values.dateRangeEnd,
        includedNoteIds: parseList(values.includedNoteIds),
      },
      state.currentUser
    );
    delete state.profile.reportDrafts[form.dataset.studentId];
    toast(values.status === "Sent" ? "Report saved as sent. No real email was sent." : "Report saved.");
    render();
  }

  function submitParentNote(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.addNote(
      {
        studentId: form.dataset.studentId,
        type: "Parent Note",
        sourceTab: "Parent Note",
        text: `${values.status}: ${values.text}`,
        tags: ["parent note", values.status.toLowerCase()],
        classSetting: values.classSetting,
        visibility: "include in parent report",
        includeInWeeklyReport: Boolean(values.includeInWeeklyReport),
      },
      state.currentUser
    );
    state.modal = null;
    toast(values.status === "Sent" ? "Parent note saved and simulated as sent." : "Parent note saved.");
    render();
  }

  function submitEmergencyNote(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.addEmergencyParentNote(
      {
        studentId: form.dataset.studentId,
        ...values,
      },
      state.currentUser
    );
    state.modal = null;
    toast("Emergency parent note saved and pinned.");
    render();
  }

  function submitDailyPhotoNote(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.addNote(
      {
        studentId: form.dataset.studentId,
        type: "Daily Photo Note",
        sourceTab: "Daily Photo Note",
        text: `${values.imageUrl ? `Image: ${values.imageUrl}\n` : ""}${values.text}`,
        tags: ["daily photo note"],
        classSetting: values.classSetting,
        visibility: values.includeInWeeklyReport ? "include in parent report" : "internal only",
        includeInWeeklyReport: Boolean(values.includeInWeeklyReport),
      },
      state.currentUser
    );
    state.modal = null;
    toast("Daily photo note saved.");
    render();
  }

  function submitEditStudent(form) {
    const values = valuesFromForm(form);
    const profile = {};
    Array.from(form.elements).forEach((element) => {
      if (element.name && element.name.startsWith("profile.")) {
        profile[element.name.replace("profile.", "")] = element.value;
      }
    });
    const current = getStudent(form.dataset.studentId);
    window.StanbridgeStore.updateStudent(form.dataset.studentId, {
      firstName: values.firstName,
      lastName: values.lastName,
      grade: values.grade,
      email: values.email,
      photoUrl: values.photoUrl,
      supportSummary: values.supportSummary,
      supportNeeds: parseList(values.supportNeeds),
      strengths: parseList(values.strengths),
      motivators: parseList(values.motivators),
      sensoryNeeds: parseList(values.sensoryNeeds),
      triggers: parseList(values.triggers),
      communicationStyle: values.communicationStyle,
      accommodations: parseList(values.accommodations),
      currentGoals: parseList(values.currentGoals),
      parentContacts: parseContacts(values.parentContacts),
      emergencyContacts: parseContacts(values.emergencyContacts, true),
      notesVisibilityLevel: values.notesVisibilityLevel,
      profile: { ...(current.profile || {}), ...profile },
    });
    state.modal = null;
    toast("Student profile updated.");
    render();
  }

  function submitEditNote(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.updateNote(form.dataset.noteId, {
      type: values.type,
      text: values.text,
      tags: parseList(values.tags),
      classSetting: values.classSetting,
      visibility: values.visibility,
      includeInWeeklyReport: Boolean(values.includeInWeeklyReport),
    });
    state.modal = null;
    toast("Note updated.");
    render();
  }

  function submitAdminAddUser(form) {
    const values = valuesFromForm(form);
    window.StanbridgeStore.addUser(values);
    toast("Teacher account added.");
    render();
  }

  function submitAdminAddStudent(form) {
    const values = valuesFromForm(form);
    const student = window.StanbridgeStore.addStudent({
      firstName: values.firstName,
      lastName: values.lastName,
      grade: values.grade,
      email: values.email,
      supportSummary: values.supportSummary,
      supportNeeds: parseList(values.supportNeeds),
      strengths: parseList(values.strengths),
      profile: {},
    });
    toast("Student added.");
    navigate(`student/${student.id}`);
  }

  function quickAddNote(button) {
    window.StanbridgeStore.addNote(
      {
        studentId: button.dataset.studentId,
        type: button.dataset.type,
        sourceTab: button.dataset.sourceTab,
        text: button.dataset.text,
        tags: [button.dataset.tag.toLowerCase()],
        classSetting: button.dataset.sourceTab,
        visibility: "internal only",
        includeInWeeklyReport: false,
      },
      state.currentUser
    );
    toast(`${button.dataset.text} logged.`);
    render();
  }

  function getLatestNote(studentId) {
    return getStudentNotes(studentId)[0] || null;
  }

  function getStudentNotes(studentId) {
    return state.data.notes
      .filter((note) => note.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function getStudent(studentId) {
    return state.data.students.find((student) => student.id === studentId);
  }

  function getRecentActivity() {
    const fromActivity = (state.data.activity || []).map((item) => ({ ...item, timestamp: item.timestamp || item.createdAt }));
    const fromNotes = state.data.notes.map((note) => ({
      studentId: note.studentId,
      actorName: note.authorName,
      actorEmail: note.authorEmail,
      type: note.type,
      text: note.text,
      timestamp: note.createdAt,
    }));
    const fromReports = state.data.reports.map((report) => ({
      studentId: report.studentId,
      actorName: report.createdByName,
      type: "Weekly Report",
      text: `${report.title} · ${report.status}`,
      timestamp: report.updatedAt || report.createdAt,
    }));
    const fromEmergency = state.data.emergencyParentNotes.map((note) => ({
      studentId: note.studentId,
      actorName: note.createdByName,
      type: "Emergency Parent Note",
      text: note.reason,
      timestamp: note.createdAt,
    }));
    return [...fromActivity, ...fromNotes, ...fromReports, ...fromEmergency].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  function getFollowUpStudents() {
    return state.data.students
      .filter((student) => !student.archived)
      .map((student) => ({ student, reasons: getStudentFlags(student) }))
      .filter((item) => item.reasons.length)
      .sort((a, b) => a.student.lastName.localeCompare(b.student.lastName));
  }

  function getStudentFlags(student) {
    const emergency = state.data.emergencyParentNotes.some((note) => note.studentId === student.id && !note.resolved);
    const followUp = state.data.engagementLogs.some((log) => log.studentId === student.id && log.followUpNeeded);
    const lowEngagement = state.data.engagementLogs.filter((log) => log.studentId === student.id && ["Low", "Avoidant", "Dysregulated"].includes(log.engagementLevel)).length >= 2;
    const concerns = state.data.notes.filter((note) => note.studentId === student.id && /concern|follow-up|emergency/i.test(`${note.type} ${note.tags.join(" ")}`)).length >= 1;
    const reasons = [];
    if (emergency) reasons.push("Unresolved emergency");
    if (followUp) reasons.push("Follow-up needed");
    if (lowEngagement) reasons.push("Multiple low engagement logs");
    if (concerns) reasons.push("Concern tag");
    return reasons;
  }

  function getFilteredEngagementLogs(studentId) {
    const filters = state.profile.engagementFilters;
    return state.data.engagementLogs
      .filter((log) => log.studentId === studentId)
      .filter((log) => dateFilter(log.date, filters.start, filters.end))
      .filter((log) => filters.teacher === "All" || log.authorName === filters.teacher)
      .filter((log) => !filters.setting || (log.classSetting || "").toLowerCase().includes(filters.setting.toLowerCase()))
      .filter((log) => filters.tag === "All" || (log.tags || []).includes(filters.tag))
      .filter((log) => filters.level === "All" || log.engagementLevel === filters.level)
      .filter((log) => filters.visibility === "All" || (filters.visibility === "Parent-visible" ? log.includeInWeeklyReport : !log.includeInWeeklyReport))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function getArchiveItems(studentId) {
    const notes = state.data.notes
      .filter((note) => note.studentId === studentId)
      .map((note) => ({ ...note, kind: "note" }));
    const reports = state.data.reports
      .filter((report) => report.studentId === studentId)
      .map((report) => ({
        id: report.id,
        studentId,
        kind: "report",
        type: "Weekly Report",
        sourceTab: "Reports",
        createdByName: report.createdByName,
        createdAt: report.createdAt,
        status: report.status,
        visibility: report.status === "Ready to Send" || report.status === "Sent" ? "include in parent report" : "internal only",
        text: `${report.title}\n${truncate(report.content, 600)}`,
        tags: ["weekly report", report.status.toLowerCase()],
      }));
    const emergencies = state.data.emergencyParentNotes
      .filter((note) => note.studentId === studentId)
      .map((note) => ({
        id: note.id,
        studentId,
        kind: "emergency",
        type: "Emergency Parent Note",
        sourceTab: "Emergency Parent Note",
        createdByName: note.createdByName,
        createdAt: note.createdAt,
        visibility: "internal only",
        text: `${note.reason}: ${note.whatHappened} Status now: ${note.studentStatusNow}`,
        tags: ["emergency", note.resolved ? "resolved" : "unresolved"],
      }));
    return [...notes, ...reports, ...emergencies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function getFilteredArchiveItems(studentId) {
    const filters = state.profile.archiveFilters;
    return getArchiveItems(studentId)
      .filter((item) => dateFilter(item.createdAt, filters.start, filters.end))
      .filter((item) => {
        if (filters.scope === "Notes written by me") return (item.authorId || item.createdBy) === state.currentUser.id || item.authorName === state.currentUser.name;
        if (filters.scope === "Everyone except me") return (item.authorId || item.createdBy) !== state.currentUser.id && item.authorName !== state.currentUser.name;
        return true;
      })
      .filter((item) => filters.teacher === "All" || item.authorName === filters.teacher || item.createdByName === filters.teacher)
      .filter((item) => filters.type === "All" || item.type === filters.type)
      .filter((item) => {
        if (filters.visibility === "All") return true;
        const search = `${item.type} ${item.sourceTab} ${(item.tags || []).join(" ")} ${item.visibility}`.toLowerCase();
        if (filters.visibility === "Parent-visible only") return item.visibility === "include in parent report";
        if (filters.visibility === "Internal only") return item.visibility !== "include in parent report";
        if (filters.visibility === "Emergency notes") return search.includes("emergency");
        if (filters.visibility === "Spark notes") return search.includes("spark");
        if (filters.visibility === "Engagement notes") return search.includes("engagement");
        if (filters.visibility === "Communication notes") return search.includes("communication");
        if (filters.visibility === "Sensory notes") return search.includes("sensory") || search.includes("regulation");
        if (filters.visibility === "Executive functioning notes") return search.includes("executive");
        return true;
      });
  }

  function computePatterns(student) {
    const notes = getStudentNotes(student.id);
    const engagement = state.data.engagementLogs.filter((log) => log.studentId === student.id);
    const ef = state.data.executiveFunctionLogs.filter((log) => log.studentId === student.id);
    const tagCounts = countBy(notes.flatMap((note) => note.tags || []));
    const teacherCounts = countBy(notes.map((note) => note.authorName));
    const categoryCounts = countBy(notes.map((note) => note.category || note.type));
    const engagementCounts = countBy(engagement.map((log) => log.engagementLevel));
    const regulationTags = notes.flatMap((note) => (note.tags || []).filter((tag) => /sensory|anxiety|break|recovered|quiet|headphones|overwhelm/i.test(tag)));
    const supportTags = notes.flatMap((note) => (note.tags || []).filter((tag) => /helped|support|checklist|break|role|prompt/i.test(tag)));
    const independence = ef.map((log, index) => ({ label: `Log ${index + 1}`, value: Number(log.independenceLevel || 0) }));
    const efRows = ["taskInitiation", "planning", "organization", "timeManagement", "workingMemory", "flexibility", "selfMonitoring"].map((field) => ({
      label: readableField(field),
      value: ef.length ? Number((ef.reduce((sum, log) => sum + Number(log[field] || 0), 0) / ef.length).toFixed(1)) : 0,
    }));
    const sensoryTime = countBy(
      engagement
        .filter((log) => (log.tags || []).some((tag) => /sensory|noise|break|quiet|headphones|anxiety/i.test(tag)))
        .map((log) => timeBucket(log.date))
    );
    const positive = countBy(
      notes
        .filter((note) => /spark|success|strong|completed|positive|confidence|independent/i.test(`${note.type} ${note.tags.join(" ")} ${note.text}`))
        .map((note) => new Date(note.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" }))
    );
    return {
      engagement: objectRows(engagementCounts),
      regulation: objectRows(countBy(regulationTags)),
      triggers: objectRows(tagCounts).filter((row) => /trigger|avoidance|anxiety|sensory|conflict|difficulty|overload/i.test(row.label)).slice(0, 6),
      supports: objectRows(countBy(supportTags)).slice(0, 6),
      categories: objectRows(categoryCounts),
      teachers: objectRows(teacherCounts),
      independence: independence.length ? independence : [{ label: "No EF logs", value: 0 }],
      ef: efRows,
      sensoryTime: objectRows(sensoryTime),
      positive: objectRows(positive),
    };
  }

  function countBy(items) {
    return items.filter(Boolean).reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  }

  function objectRows(object) {
    return Object.entries(object)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }

  function valuesFromForm(form) {
    const data = new FormData(form);
    const result = {};
    for (const [key, value] of data.entries()) {
      if (result[key]) {
        result[key] = Array.isArray(result[key]) ? [...result[key], value] : [result[key], value];
      } else {
        result[key] = value;
      }
    }
    form.querySelectorAll("input[type='checkbox']").forEach((input) => {
      if (!input.name || input.name === "tags" || input.name === "selectedNoteIds") return;
      result[input.name] = input.checked;
    });
    return result;
  }

  function checkboxValues(form, name) {
    return Array.from(form.querySelectorAll(`input[name='${name}']:checked`)).map((input) => input.value);
  }

  function parseList(value) {
    if (Array.isArray(value)) return value;
    return String(value || "")
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function parseContacts(value, emergency = false) {
    return String(value || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name = "", emailOrPhone = "", phoneOrRelationship = "", relationship = ""] = line.split("|").map((part) => part.trim());
        return emergency
          ? { name, phone: emailOrPhone, relationship: phoneOrRelationship }
          : { name, email: emailOrPhone, phone: phoneOrRelationship, relationship };
      });
  }

  function formatContacts(contacts = [], emergency = false) {
    return contacts
      .map((contact) => emergency
        ? [contact.name, contact.phone, contact.relationship].filter(Boolean).join(" | ")
        : [contact.name, contact.email, contact.phone, contact.relationship].filter(Boolean).join(" | "))
      .join("\n");
  }

  function sourceForType(type) {
    if (/spark|motivator/i.test(type)) return "Spark Profile";
    if (/executive/i.test(type)) return "Executive Functioning";
    if (/communication/i.test(type)) return "Communication";
    if (/sensory|regulation/i.test(type)) return "Sensory & Regulation";
    if (/engagement/i.test(type)) return "Engagement Log";
    if (/parent/i.test(type)) return "Parent Note";
    if (/follow|concern|trigger|observation/i.test(type)) return "Notes Archive";
    return "Quick Log";
  }

  function canEditNote(note) {
    return state.currentUser.role === "Administrator" || note.authorId === state.currentUser.id;
  }

  function dateFilter(iso, start, end) {
    const date = new Date(iso);
    if (start && date < parseLocalDate(start)) return false;
    if (end) {
      const endDate = parseLocalDate(end);
      endDate.setHours(23, 59, 59, 999);
      if (date > endDate) return false;
    }
    return true;
  }

  function parseLocalDate(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(value);
  }

  function renderAvatar(student, size) {
    const style = avatarStyle(student);
    if (student.photoUrl) {
      return `<img class="avatar ${size}" src="${escapeAttr(student.photoUrl)}" alt="${escapeAttr(`${student.firstName} ${student.lastName}`)}" />`;
    }
    return `<span class="avatar ${size}" style="${style}">${initials(`${student.firstName} ${student.lastName}`)}</span>`;
  }

  function avatarStyle(student) {
    const palettes = [
      ["#1f3a5f", "#f2a65a"],
      ["#235e5b", "#d9efe8"],
      ["#6b3d4a", "#f7d6d0"],
      ["#34415e", "#c7d8f0"],
      ["#5d6b3b", "#f4e7bd"],
      ["#704c2e", "#f0d2a2"],
    ];
    const index = Math.abs(hashCode(`${student.firstName}${student.lastName}`)) % palettes.length;
    const [a, b] = palettes[index];
    return `background:linear-gradient(135deg, ${a}, ${b});`;
  }

  function hashCode(text) {
    return text.split("").reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
  }

  function initials(name) {
    return String(name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }

  function unique(items) {
    return [...new Set(items.filter(Boolean))];
  }

  function option(value, selected) {
    return `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`;
  }

  function emptyState(title, subtitle) {
    return `<div class="empty-state"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(subtitle)}</span></div>`;
  }

  function levelClass(level) {
    return String(level || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function statusClass(status) {
    return String(status || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function readableField(field) {
    return field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
  }

  function timeBucket(iso) {
    const hour = new Date(iso).getHours();
    if (hour < 11) return "Morning";
    if (hour < 14) return "Midday";
    return "Afternoon";
  }

  function truncate(text, length) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
  }

  function relativeTime(iso) {
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 8) return `${days}d ago`;
    return formatDateTime(iso);
  }

  function formatDateTime(iso) {
    if (!iso) return "Not recorded";
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text || "")
        .then(() => toast("Copied to clipboard."))
        .catch(() => fallbackCopyText(text));
      return;
    }
    fallbackCopyText(text);
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text || "";
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      toast("Copied to clipboard.");
    } catch (error) {
      toast("Copy failed in this browser.", "error");
    }
    textarea.remove();
  }

  function downloadText(filename, text) {
    const blob = new Blob([text || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("Download started.");
  }

  function safeFileName(name) {
    return String(name || "stanbridge-report").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  }

  function toast(message, tone = "success") {
    const item = document.createElement("div");
    item.className = `toast ${tone}`;
    item.textContent = message;
    toastRoot.appendChild(item);
    setTimeout(() => item.classList.add("visible"), 20);
    setTimeout(() => {
      item.classList.remove("visible");
      setTimeout(() => item.remove(), 220);
    }, 3200);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  document.addEventListener("submit", handleSubmit);
  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleInput);
  window.addEventListener("hashchange", render);
  render();
})();
