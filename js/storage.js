(function () {
  const DATA_KEY = "stanbridgeSupportHub.data.v1";
  const SESSION_KEY = "stanbridgeSupportHub.session.v1";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix) {
    if (window.crypto && window.crypto.randomUUID) {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function mockHash(password) {
    return `mock:${btoa(unescape(encodeURIComponent(password)))}`;
  }

  function normalizeData(data) {
    const base = clone(window.StanbridgeDemo || {});
    return {
      users: data.users || base.users || [],
      students: data.students || base.students || [],
      notes: data.notes || base.notes || [],
      engagementLogs: data.engagementLogs || base.engagementLogs || [],
      executiveFunctionLogs: data.executiveFunctionLogs || base.executiveFunctionLogs || [],
      reports: data.reports || base.reports || [],
      emergencyParentNotes: data.emergencyParentNotes || base.emergencyParentNotes || [],
      activity: data.activity || [],
      settings: data.settings || base.settings || { allowTeachersEditStudentInfo: true },
    };
  }

  function loadData() {
    const saved = localStorage.getItem(DATA_KEY);
    if (!saved) {
      const seeded = normalizeData(clone(window.StanbridgeDemo || {}));
      saveData(seeded);
      return seeded;
    }

    try {
      return normalizeData(JSON.parse(saved));
    } catch (error) {
      console.warn("Stanbridge data reset after parse failure", error);
      const seeded = normalizeData(clone(window.StanbridgeDemo || {}));
      saveData(seeded);
      return seeded;
    }
  }

  function saveData(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(normalizeData(data)));
  }

  function getSession() {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return loadData().users.find((user) => user.id === id) || null;
  }

  function setSession(userId) {
    if (userId) {
      localStorage.setItem(SESSION_KEY, userId);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  function recordActivity(data, item) {
    data.activity = [
      {
        id: uid("activity"),
        timestamp: nowIso(),
        ...item,
      },
      ...(data.activity || []),
    ].slice(0, 120);
  }

  function touchStudent(data, studentId) {
    const student = data.students.find((entry) => entry.id === studentId);
    if (student) student.updatedAt = nowIso();
  }

  function login(email, password) {
    const data = loadData();
    const user = data.users.find((entry) => entry.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.passwordHash !== mockHash(password)) {
      throw new Error("Email or password did not match a teacher account.");
    }
    setSession(user.id);
    return clone(user);
  }

  function createAccount({ name, email, password, role }) {
    const data = loadData();
    if (data.users.some((entry) => entry.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new Error("An account with that email already exists.");
    }
    const user = {
      id: uid("user"),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: mockHash(password),
      role: role === "Administrator" ? "Administrator" : "Teacher",
      createdAt: nowIso(),
    };
    data.users.push(user);
    recordActivity(data, {
      actorName: user.name,
      actorEmail: user.email,
      type: "Account Created",
      text: `${user.name} joined as ${user.role}.`,
    });
    saveData(data);
    setSession(user.id);
    return clone(user);
  }

  function logout() {
    setSession(null);
  }

  function addUser(userInput) {
    const data = loadData();
    const user = {
      id: uid("user"),
      name: userInput.name.trim(),
      email: userInput.email.trim().toLowerCase(),
      passwordHash: mockHash(userInput.password || "stanbridge2026"),
      role: userInput.role === "Administrator" ? "Administrator" : "Teacher",
      createdAt: nowIso(),
    };
    data.users.push(user);
    saveData(data);
    return clone(user);
  }

  function updateUser(userId, patch) {
    const data = loadData();
    const user = data.users.find((entry) => entry.id === userId);
    if (!user) throw new Error("User not found.");
    Object.assign(user, patch);
    if (patch.password) {
      user.passwordHash = mockHash(patch.password);
      delete user.password;
    }
    saveData(data);
    return clone(user);
  }

  function deleteUser(userId) {
    const data = loadData();
    data.users = data.users.filter((entry) => entry.id !== userId);
    saveData(data);
  }

  function addStudent(input) {
    const data = loadData();
    const student = {
      id: uid("stu"),
      firstName: "",
      lastName: "",
      grade: "K",
      email: "",
      photoUrl: "",
      supportSummary: "",
      supportNeeds: [],
      strengths: [],
      motivators: [],
      sensoryNeeds: [],
      triggers: [],
      communicationStyle: "",
      accommodations: [],
      currentGoals: [],
      parentContacts: [],
      emergencyContacts: [],
      profile: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...input,
    };
    data.students.push(student);
    saveData(data);
    return clone(student);
  }

  function updateStudent(studentId, patch) {
    const data = loadData();
    const student = data.students.find((entry) => entry.id === studentId);
    if (!student) throw new Error("Student not found.");
    Object.assign(student, patch, { updatedAt: nowIso() });
    saveData(data);
    return clone(student);
  }

  function deleteStudent(studentId) {
    const data = loadData();
    data.students = data.students.filter((entry) => entry.id !== studentId);
    data.notes = data.notes.filter((entry) => entry.studentId !== studentId);
    data.engagementLogs = data.engagementLogs.filter((entry) => entry.studentId !== studentId);
    data.executiveFunctionLogs = data.executiveFunctionLogs.filter((entry) => entry.studentId !== studentId);
    data.reports = data.reports.filter((entry) => entry.studentId !== studentId);
    data.emergencyParentNotes = data.emergencyParentNotes.filter((entry) => entry.studentId !== studentId);
    saveData(data);
  }

  function archiveStudent(studentId) {
    return updateStudent(studentId, { archived: true });
  }

  function addNote(input, user) {
    const data = loadData();
    const note = {
      id: uid("note"),
      studentId: input.studentId,
      authorId: user.id,
      authorName: user.name,
      authorEmail: user.email,
      type: input.type || "Observation",
      sourceTab: input.sourceTab || "Quick Log",
      text: input.text || "",
      category: input.category || "",
      tags: input.tags || [],
      classSetting: input.classSetting || "",
      visibility: input.visibility || "internal only",
      includeInWeeklyReport: Boolean(input.includeInWeeklyReport),
      createdAt: input.createdAt || nowIso(),
      updatedAt: input.updatedAt || nowIso(),
    };
    data.notes.push(note);
    touchStudent(data, note.studentId);
    recordActivity(data, {
      actorName: user.name,
      actorEmail: user.email,
      studentId: note.studentId,
      type: note.type,
      text: note.text,
    });
    saveData(data);
    return clone(note);
  }

  function updateNote(noteId, patch) {
    const data = loadData();
    const note = data.notes.find((entry) => entry.id === noteId);
    if (!note) throw new Error("Note not found.");
    Object.assign(note, patch, { updatedAt: nowIso() });
    touchStudent(data, note.studentId);
    saveData(data);
    return clone(note);
  }

  function deleteNote(noteId) {
    const data = loadData();
    const note = data.notes.find((entry) => entry.id === noteId);
    data.notes = data.notes.filter((entry) => entry.id !== noteId);
    if (note) touchStudent(data, note.studentId);
    saveData(data);
  }

  function addEngagementLog(input, user) {
    const data = loadData();
    const log = {
      id: uid("eng"),
      studentId: input.studentId,
      authorId: user.id,
      authorName: user.name,
      authorEmail: user.email,
      date: input.date || nowIso(),
      classSetting: input.classSetting || "",
      engagementLevel: input.engagementLevel || "Medium",
      academicParticipation: input.academicParticipation || "",
      socialParticipation: input.socialParticipation || "",
      independenceLevel: input.independenceLevel || "",
      supportNeeded: input.supportNeeded || "",
      whatHappened: input.whatHappened || "",
      whatHelped: input.whatHelped || "",
      whatDidNotHelp: input.whatDidNotHelp || "",
      followUpNeeded: Boolean(input.followUpNeeded),
      tags: input.tags || [],
      includeInWeeklyReport: Boolean(input.includeInWeeklyReport),
      createdAt: nowIso(),
    };
    data.engagementLogs.push(log);
    touchStudent(data, log.studentId);
    recordActivity(data, {
      actorName: user.name,
      actorEmail: user.email,
      studentId: log.studentId,
      type: "Engagement",
      text: log.whatHappened || log.academicParticipation || "Engagement log added.",
    });
    saveData(data);
    addNote(
      {
        studentId: log.studentId,
        type: "Engagement",
        sourceTab: "Engagement Log",
        text: `${log.engagementLevel}: ${log.whatHappened || log.academicParticipation}`.trim(),
        tags: log.tags,
        classSetting: log.classSetting,
        visibility: log.includeInWeeklyReport ? "include in parent report" : "internal only",
        includeInWeeklyReport: log.includeInWeeklyReport,
        createdAt: log.createdAt,
      },
      user
    );
    return clone(log);
  }

  function addExecutiveFunctionLog(input, user) {
    const data = loadData();
    const log = {
      id: uid("ef"),
      studentId: input.studentId,
      authorId: user.id,
      authorName: user.name,
      authorEmail: user.email,
      date: input.date || nowIso(),
      taskInitiation: Number(input.taskInitiation || 3),
      planning: Number(input.planning || 3),
      organization: Number(input.organization || 3),
      timeManagement: Number(input.timeManagement || 3),
      workingMemory: Number(input.workingMemory || 3),
      flexibility: Number(input.flexibility || 3),
      selfMonitoring: Number(input.selfMonitoring || 3),
      homeworkCompletion: Number(input.homeworkCompletion || 3),
      assignmentTracking: Number(input.assignmentTracking || 3),
      projectBreakdown: Number(input.projectBreakdown || 3),
      independenceLevel: Number(input.independenceLevel || 3),
      notes: input.notes || "",
      createdAt: nowIso(),
    };
    data.executiveFunctionLogs.push(log);
    touchStudent(data, log.studentId);
    recordActivity(data, {
      actorName: user.name,
      actorEmail: user.email,
      studentId: log.studentId,
      type: "Executive Functioning",
      text: log.notes || "Executive functioning observation added.",
    });
    saveData(data);
    addNote(
      {
        studentId: log.studentId,
        type: "Executive Functioning",
        sourceTab: "Executive Functioning",
        text: log.notes || "Executive functioning ratings were added.",
        tags: ["executive functioning"],
        classSetting: input.classSetting || "",
        visibility: input.includeInWeeklyReport ? "include in parent report" : "internal only",
        includeInWeeklyReport: Boolean(input.includeInWeeklyReport),
        createdAt: log.createdAt,
      },
      user
    );
    return clone(log);
  }

  function addReport(input, user) {
    const data = loadData();
    const report = {
      id: uid("report"),
      studentId: input.studentId,
      createdBy: user.id,
      createdByName: user.name,
      dateRangeStart: input.dateRangeStart,
      dateRangeEnd: input.dateRangeEnd,
      title: input.title || "Weekly Spark Report",
      status: input.status || "Draft",
      content: input.content || "",
      includedNoteIds: input.includedNoteIds || [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sentAt: input.sentAt || "",
    };
    data.reports.push(report);
    touchStudent(data, report.studentId);
    recordActivity(data, {
      actorName: user.name,
      actorEmail: user.email,
      studentId: report.studentId,
      type: "Weekly Report",
      text: `${report.title} saved as ${report.status}.`,
    });
    saveData(data);
    return clone(report);
  }

  function updateReport(reportId, patch) {
    const data = loadData();
    const report = data.reports.find((entry) => entry.id === reportId);
    if (!report) throw new Error("Report not found.");
    Object.assign(report, patch, { updatedAt: nowIso() });
    if (patch.status === "Sent" && !report.sentAt) report.sentAt = nowIso();
    touchStudent(data, report.studentId);
    saveData(data);
    return clone(report);
  }

  function addEmergencyParentNote(input, user) {
    const data = loadData();
    const emergency = {
      id: uid("emg"),
      studentId: input.studentId,
      createdBy: user.id,
      createdByName: user.name,
      reason: input.reason || "",
      whatHappened: input.whatHappened || "",
      studentStatusNow: input.studentStatusNow || "",
      actionTaken: input.actionTaken || "",
      followUpNeeded: input.followUpNeeded || "",
      parentContactMethod: input.parentContactMethod || "",
      contacted: Boolean(input.contacted),
      resolved: Boolean(input.resolved),
      createdAt: nowIso(),
      resolvedAt: input.resolved ? nowIso() : "",
    };
    data.emergencyParentNotes.push(emergency);
    touchStudent(data, emergency.studentId);
    recordActivity(data, {
      actorName: user.name,
      actorEmail: user.email,
      studentId: emergency.studentId,
      type: "Emergency Parent Note",
      text: emergency.reason || emergency.whatHappened,
    });
    saveData(data);
    addNote(
      {
        studentId: emergency.studentId,
        type: "Emergency Parent Note",
        sourceTab: "Emergency Parent Note",
        text: `${emergency.reason}: ${emergency.whatHappened}`.replace(/^: /, ""),
        tags: ["emergency", "follow-up needed"],
        classSetting: "Parent contact",
        visibility: "internal only",
        includeInWeeklyReport: false,
        createdAt: emergency.createdAt,
      },
      user
    );
    return clone(emergency);
  }

  function updateEmergencyParentNote(emergencyId, patch) {
    const data = loadData();
    const emergency = data.emergencyParentNotes.find((entry) => entry.id === emergencyId);
    if (!emergency) throw new Error("Emergency parent note not found.");
    Object.assign(emergency, patch);
    if (patch.resolved && !emergency.resolvedAt) emergency.resolvedAt = nowIso();
    touchStudent(data, emergency.studentId);
    saveData(data);
    return clone(emergency);
  }

  function resetDemoData() {
    const seeded = normalizeData(clone(window.StanbridgeDemo || {}));
    saveData(seeded);
    setSession(null);
    return seeded;
  }

  window.StanbridgeStore = {
    loadData,
    saveData,
    getSession,
    login,
    createAccount,
    logout,
    addUser,
    updateUser,
    deleteUser,
    addStudent,
    updateStudent,
    deleteStudent,
    archiveStudent,
    addNote,
    updateNote,
    deleteNote,
    addEngagementLog,
    addExecutiveFunctionLog,
    addReport,
    updateReport,
    addEmergencyParentNote,
    updateEmergencyParentNote,
    resetDemoData,
    uid,
    nowIso,
    mockHash,
  };
})();
