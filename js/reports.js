(function () {
  function parseDate(value) {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day);
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function inRange(iso, start, end) {
    const date = parseDate(iso);
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    if (!date) return false;
    if (startDate && date < startDate) return false;
    if (endDate) {
      const inclusiveEnd = new Date(endDate);
      inclusiveEnd.setHours(23, 59, 59, 999);
      if (date > inclusiveEnd) return false;
    }
    return true;
  }

  function soften(text) {
    return String(text || "")
      .replace(/\brefused to work\b/gi, "had difficulty initiating the task")
      .replace(/\brefused\b/gi, "had difficulty engaging")
      .replace(/\bnoncompliant\b/gi, "needed additional support")
      .replace(/\bmeltdown\b/gi, "became dysregulated")
      .replace(/\bavoided the task\b/gi, "had difficulty initiating the task")
      .replace(/\bshutdown\b/gi, "showed signs of needing reduced demand and regulation support");
  }

  function sentence(text) {
    const clean = soften(text).trim();
    if (!clean) return "";
    return /[.!?]$/.test(clean) ? clean : `${clean}.`;
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(parseDate(value));
  }

  function readableList(items) {
    const unique = [...new Set(items.filter(Boolean))].slice(0, 6);
    if (!unique.length) return "";
    if (unique.length === 1) return unique[0];
    return `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}`;
  }

  function scopedRecords(student, data, options) {
    const notes = data.notes
      .filter((note) => note.studentId === student.id)
      .filter((note) => inRange(note.createdAt, options.dateRangeStart, options.dateRangeEnd))
      .filter((note) => {
        if (options.selectedNoteIds && options.selectedNoteIds.length) return options.selectedNoteIds.includes(note.id);
        return options.parentVisibleOnly ? note.includeInWeeklyReport : true;
      });
    const engagementLogs = data.engagementLogs
      .filter((log) => log.studentId === student.id)
      .filter((log) => inRange(log.date || log.createdAt, options.dateRangeStart, options.dateRangeEnd));
    const efLogs = data.executiveFunctionLogs
      .filter((log) => log.studentId === student.id)
      .filter((log) => inRange(log.date || log.createdAt, options.dateRangeStart, options.dateRangeEnd));
    return { notes, engagementLogs, efLogs };
  }

  function generateWeeklyReport(student, data, options) {
    const defaults = {
      includeSparkNotes: true,
      includeEngagementLog: true,
      includeExecutiveFunctioning: true,
      includeCommunication: true,
      includeSensoryRegulation: true,
      includeTeacherRecommendations: true,
      includeGoalsNextWeek: true,
      parentVisibleOnly: false,
    };
    const config = { ...defaults, ...options };
    const { notes, engagementLogs, efLogs } = scopedRecords(student, data, config);
    const strategist = window.StanbridgeStrategist.analyze(student, data);

    const sparkNotes = notes.filter((note) => note.type === "Spark" || note.sourceTab === "Spark Profile");
    const communicationNotes = notes.filter((note) => note.sourceTab === "Communication" || note.type === "Communication");
    const sensoryNotes = notes.filter((note) => /sensory|regulation/i.test(`${note.type} ${note.sourceTab} ${note.tags.join(" ")}`));
    const positiveNotes = notes.filter((note) =>
      /spark|success|strong|creative|completed|confidence|positive|independent/i.test(
        `${note.type} ${note.category} ${note.tags.join(" ")} ${note.text}`
      )
    );
    const helpfulSupports = [
      ...notes.flatMap((note) => (note.tags || []).filter((tag) => /helped|support|checklist|break|role|prompt/i.test(tag))),
      ...engagementLogs.map((log) => log.whatHelped),
      ...student.accommodations,
    ];
    const engagementSummary = engagementLogs.map((log) => {
      const level = log.engagementLevel ? `${log.engagementLevel.toLowerCase()} engagement` : "engagement";
      return `${student.firstName} showed ${level} in ${log.classSetting || "class"}. ${sentence(
        log.academicParticipation || log.whatHappened
      )} ${log.whatHelped ? `Helpful support: ${sentence(log.whatHelped)}` : ""}`;
    });

    const efAverages = efLogs.length
      ? {
          taskInitiation: average(efLogs, "taskInitiation"),
          planning: average(efLogs, "planning"),
          organization: average(efLogs, "organization"),
          timeManagement: average(efLogs, "timeManagement"),
          independenceLevel: average(efLogs, "independenceLevel"),
        }
      : null;

    const title = `Weekly Student Summary: ${formatDate(config.dateRangeStart)}-${formatDate(config.dateRangeEnd)}`;
    const sections = [
      ["Positive Highlights", positiveHighlights(student, sparkNotes, positiveNotes)],
      ["Academic Engagement", config.includeEngagementLog ? fallbackParagraph(engagementSummary, student.supportSummary) : ""],
      [
        "Executive Functioning",
        config.includeExecutiveFunctioning
          ? efAverages
            ? `${student.firstName}'s logged EF ratings suggest task initiation around ${efAverages.taskInitiation}/5 and independence around ${efAverages.independenceLevel}/5. ${sentence(
                efLogs[efLogs.length - 1]?.notes
              )}`
            : `${student.firstName} continues to benefit from ${readableList(student.accommodations)}.`
          : "",
      ],
      [
        "Communication and Social Learning",
        config.includeCommunication
          ? fallbackParagraph(
              communicationNotes.map((note) => sentence(note.text)),
              `${student.firstName} communicates best with ${student.communicationStyle || "clear, respectful prompts and time to respond"}.`
            )
          : "",
      ],
      [
        "Regulation/Sensory Supports",
        config.includeSensoryRegulation
          ? fallbackParagraph(
              sensoryNotes.map((note) => sentence(note.text)),
              `${student.firstName} may benefit from ${readableList(student.sensoryNeeds)}.`
            )
          : "",
      ],
      [
        "Strategies That Helped",
        fallbackParagraph(
          helpfulSupports.slice(0, 5).map((support) => sentence(support)),
          `${readableList(student.accommodations)} were helpful supports to keep consistent.`
        ),
      ],
      [
        "Growth Noticed",
        `${student.firstName} is building confidence through ${readableList(student.strengths)}. ${sentence(
          sparkNotes[0]?.text || strategist.strengthsToBuildOn[0]
        )}`,
      ],
      [
        "Goals for Next Week",
        config.includeGoalsNextWeek
          ? fallbackParagraph(
              student.currentGoals.map((goal) => sentence(goal)),
              `Continue one consistent goal tied to ${student.firstName}'s current support plan.`
            )
          : "",
      ],
      [
        "Suggested Home Support",
        config.includeTeacherRecommendations
          ? sentence(
              config.homeSupport ||
                strategist.parentUpdateSuggestions[0] ||
                `At home, a short preview of the next school day and one visible first step may support follow-through.`
            )
          : "",
      ],
      [
        "Teacher Notes",
        sentence(
          config.teacherNotes ||
            `This report is a draft for educational support communication and should be reviewed before sending.`
        ),
      ],
    ];

    const content = sections
      .map(([heading, body]) => `${heading}\n${soften(body || "No update selected for this section.")}`)
      .join("\n\n");

    return {
      title,
      content,
      includedNoteIds: notes.map((note) => note.id),
      dateRangeStart: config.dateRangeStart,
      dateRangeEnd: config.dateRangeEnd,
    };
  }

  function average(logs, field) {
    return (logs.reduce((sum, log) => sum + Number(log[field] || 0), 0) / logs.length).toFixed(1);
  }

  function fallbackParagraph(items, fallback) {
    const clean = items.filter(Boolean).map(sentence).filter(Boolean);
    return clean.length ? clean.slice(0, 4).join(" ") : sentence(fallback);
  }

  function positiveHighlights(student, sparkNotes, positiveNotes) {
    const highlights = [...sparkNotes, ...positiveNotes].map((note) => sentence(note.text));
    if (highlights.length) return [...new Set(highlights)].slice(0, 4).join(" ");
    return `${student.firstName}'s strengths include ${readableList(student.strengths)}. Staff will continue using these strengths as entry points for learning.`;
  }

  window.StanbridgeReports = {
    generateWeeklyReport,
    soften,
  };
})();
