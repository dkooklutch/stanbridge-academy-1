(function () {
  const RULES = [
    {
      id: "sensory-overload",
      tags: ["sensory overload", "noise sensitivity", "used headphones", "needed quiet space"],
      pattern: "Sensory load may be influencing engagement, especially when noise or crowded spaces are logged.",
      trigger: "Noise, hallway transitions, lunch, or visually busy settings may be useful to review.",
      strategy: "Consider a predictable sensory plan: headphones available, quiet re-entry option, and a specific return-to-task cue.",
      accommodation: "Review access to quiet space, headphones, and transition timing.",
      risk: "Repeated sensory overload notes may need team review if they begin limiting access to class activities.",
    },
    {
      id: "task-initiation",
      tags: ["task avoidance", "needed prompting", "writing support", "executive functioning"],
      pattern: "Task initiation appears easier when the first step is concrete and visible.",
      trigger: "Open-ended tasks or multi-step directions may increase initiation demands.",
      strategy: "Write the first step clearly, model the expected output, and check for start within five minutes.",
      accommodation: "Review first-step cards, exemplars, and chunked assignment directions.",
      risk: "Multiple low engagement logs with task avoidance may indicate a follow-up planning need.",
    },
    {
      id: "visual-checklist",
      tags: ["visual checklist helped", "planning", "transition planning"],
      pattern: "Visual checklists appear to be a helpful support across settings.",
      trigger: "Transitions, stations, or long-term work may benefit from the same checklist routine.",
      strategy: "Make the checklist routine consistent across classes and invite the student to self-check the last item.",
      accommodation: "Review common checklist language so teachers use a shared format.",
      risk: "",
    },
    {
      id: "group-work",
      tags: ["group work challenge", "peer conflict", "structured peer roles", "peer success"],
      pattern: "Group work success appears connected to clear peer roles and explicit communication expectations.",
      trigger: "Unstructured collaboration may create avoidable social or flexibility demands.",
      strategy: "Assign named roles, define the first group action, and provide a repair phrase before group work starts.",
      accommodation: "Review structured roles, scripts, and low-risk partner selection.",
      risk: "",
    },
    {
      id: "creative-writing",
      tags: ["creative writing", "writing strength"],
      pattern: "Creative writing appears to be a strength and a possible entry point for broader assignments.",
      trigger: "Assignments with no personal choice may reduce access to this strength.",
      strategy: "Use a brief creative choice, character voice, or storyboard as the first bridge into academic tasks.",
      accommodation: "Review choice-based writing prompts and alternative planning formats.",
      risk: "",
    },
    {
      id: "break-helped",
      tags: ["break helped", "recovered", "used coping strategy"],
      pattern: "Regulation appears to improve after planned breaks or coping strategies.",
      trigger: "Periods following lunch, transitions, or intense discussions may need proactive regulation supports.",
      strategy: "Offer a short scheduled reset before predictable high-demand moments, then return with a concrete re-entry task.",
      accommodation: "Review break pass expectations and re-entry language.",
      risk: "",
    },
  ];

  function collectStudentRecords(student, data) {
    const notes = data.notes.filter((note) => note.studentId === student.id);
    const engagementLogs = data.engagementLogs.filter((log) => log.studentId === student.id);
    const efLogs = data.executiveFunctionLogs.filter((log) => log.studentId === student.id);
    const emergencies = data.emergencyParentNotes.filter((note) => note.studentId === student.id);
    const tags = [
      ...student.supportNeeds,
      ...student.strengths,
      ...student.triggers,
      ...notes.flatMap((note) => note.tags || []),
      ...engagementLogs.flatMap((log) => log.tags || []),
    ].map((tag) => String(tag).toLowerCase());
    const text = [
      student.supportSummary,
      student.communicationStyle,
      student.profile?.whatWorkedRecently,
      ...notes.map((note) => note.text),
      ...engagementLogs.map((log) => `${log.whatHappened} ${log.whatHelped} ${log.whatDidNotHelp}`),
      ...efLogs.map((log) => log.notes),
    ]
      .join(" ")
      .toLowerCase();
    return { notes, engagementLogs, efLogs, emergencies, tags, text };
  }

  function countMatches(tags, keywords, text) {
    return keywords.reduce((total, keyword) => {
      const lower = keyword.toLowerCase();
      const tagHits = tags.filter((tag) => tag.includes(lower)).length;
      const textHit = text.includes(lower) ? 1 : 0;
      return total + tagHits + textHit;
    }, 0);
  }

  function averageEf(efLogs, field) {
    if (!efLogs.length) return null;
    return efLogs.reduce((sum, log) => sum + Number(log[field] || 0), 0) / efLogs.length;
  }

  function analyze(student, data) {
    const records = collectStudentRecords(student, data);
    const matchedRules = RULES.map((rule) => ({
      ...rule,
      score: countMatches(records.tags, rule.tags, records.text),
    }))
      .filter((rule) => rule.score > 0)
      .sort((a, b) => b.score - a.score);

    const lowEngagementCount = records.engagementLogs.filter((log) =>
      ["Low", "Avoidant", "Dysregulated"].includes(log.engagementLevel)
    ).length;
    const followUps = records.engagementLogs.filter((log) => log.followUpNeeded).length;
    const unresolvedEmergency = records.emergencies.some((note) => !note.resolved);
    const taskInitiationAvg = averageEf(records.efLogs, "taskInitiation");
    const independenceAvg = averageEf(records.efLogs, "independenceLevel");

    const patterns = matchedRules.map((rule) => rule.pattern);
    const possibleTriggers = matchedRules.map((rule) => rule.trigger).filter(Boolean);
    const helpfulStrategies = matchedRules.map((rule) => rule.strategy);
    const accommodations = matchedRules.map((rule) => rule.accommodation).filter(Boolean);
    const riskFlags = matchedRules.map((rule) => rule.risk).filter(Boolean);

    if (taskInitiationAvg !== null && taskInitiationAvg <= 2.5) {
      patterns.push("Task initiation ratings are currently low enough to merit a shared support routine.");
      helpfulStrategies.push("Consider a two-minute start conference with a written first step and one check-back time.");
    }
    if (independenceAvg !== null && independenceAvg >= 4) {
      patterns.push("Independence ratings appear to be strengthening in the logged settings.");
      helpfulStrategies.push("Consider gradually fading adult prompts while keeping the successful visual support available.");
    }
    if (lowEngagementCount >= 2) {
      riskFlags.push("Low, avoidant, or dysregulated engagement has appeared multiple times and may need team review.");
    }
    if (followUps > 0) {
      riskFlags.push("At least one log is marked follow-up needed.");
    }
    if (unresolvedEmergency) {
      riskFlags.push("An unresolved emergency parent note is currently pinned on this profile.");
    }

    const strengths = [
      ...(student.strengths || []),
      ...matchedRules.filter((rule) => rule.id === "creative-writing").map(() => "Use creative choice as an academic bridge."),
    ];

    return {
      patterns: uniqueOrFallback(patterns, [
        "Based on the current records, patterns are still emerging. Continue logging across settings to strengthen the picture.",
      ]),
      possibleTriggers: uniqueOrFallback(possibleTriggers, [
        "No repeated trigger pattern is clear yet. Track setting, time of day, and support used for the next few entries.",
      ]),
      helpfulStrategies: uniqueOrFallback(helpfulStrategies, [
        "Continue using the known helpful strategies in the profile and log which ones produce the strongest re-entry.",
      ]),
      parentUpdateSuggestions: buildParentSuggestions(student, records, matchedRules),
      questionsForTeam: buildTeamQuestions(student, records, matchedRules, lowEngagementCount),
      accommodationsToReview: uniqueOrFallback(accommodations, student.accommodations || []),
      strengthsToBuildOn: uniqueOrFallback(strengths, ["Look for one strength-based entry point in tomorrow's lesson."]),
      riskFlags: uniqueOrFallback(riskFlags, ["No urgent risk flags from the current logged observations."]),
      generatedAt: new Date().toISOString(),
    };
  }

  function uniqueOrFallback(values, fallback) {
    const unique = [...new Set(values.filter(Boolean))];
    return unique.length ? unique : fallback;
  }

  function buildParentSuggestions(student, records, matchedRules) {
    const suggestions = [];
    const parentVisible = records.notes.filter((note) => note.includeInWeeklyReport).slice(-3);
    parentVisible.forEach((note) => {
      suggestions.push(`Consider sharing: ${student.firstName} ${soften(note.text)}`);
    });
    if (matchedRules.some((rule) => rule.id === "visual-checklist")) {
      suggestions.push("Parent update could mention that visual checklists appear to support independence.");
    }
    if (matchedRules.some((rule) => rule.id === "break-helped")) {
      suggestions.push("Parent update could mention successful use of a quiet reset or coping strategy.");
    }
    return uniqueOrFallback(suggestions, [
      `Share one strength-based highlight and one concrete support that helped ${student.firstName} access learning this week.`,
    ]);
  }

  function buildTeamQuestions(student, records, matchedRules, lowEngagementCount) {
    const questions = [];
    if (matchedRules.some((rule) => rule.id === "sensory-overload")) {
      questions.push("Which settings have the highest sensory load, and can the team make the support plan consistent there?");
    }
    if (matchedRules.some((rule) => rule.id === "task-initiation")) {
      questions.push("What is the shared first-step language teachers should use for task initiation?");
    }
    if (matchedRules.some((rule) => rule.id === "group-work")) {
      questions.push("Which peer role gives the student meaningful participation without unnecessary social ambiguity?");
    }
    if (lowEngagementCount > 0) {
      questions.push("Are low-engagement moments clustering by time of day, class setting, or task type?");
    }
    questions.push(`What is one strength from ${student.firstName}'s Spark Profile that can be used in tomorrow's lesson?`);
    return uniqueOrFallback(questions, ["What should the team log next to make patterns clearer?"]);
  }

  function soften(text) {
    return String(text || "")
      .replace(/\brefused to work\b/gi, "had difficulty initiating the task")
      .replace(/\brefused\b/gi, "had difficulty engaging")
      .replace(/\bnoncompliant\b/gi, "needed additional support")
      .replace(/\bmeltdown\b/gi, "became dysregulated");
  }

  function generateStrategyPlan(student, data) {
    const insights = analyze(student, data);
    return {
      immediateStrategies: insights.helpfulStrategies.slice(0, 3),
      longerTermSupports: insights.accommodationsToReview.slice(0, 2),
      parentCommunicationSuggestion: insights.parentUpdateSuggestions[0],
      teamDiscussionQuestion: insights.questionsForTeam[0],
      createdAt: new Date().toISOString(),
    };
  }

  window.StanbridgeStrategist = {
    analyze,
    generateStrategyPlan,
  };
})();
