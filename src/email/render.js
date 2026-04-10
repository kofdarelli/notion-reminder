const CSS = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.5; color: #333; background-color: #f9f9f9; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .header { padding: 20px; text-align: center; background: #ffffff; border-bottom: 1px solid #eee; }
  .header h1 { margin: 0; font-size: 24px; color: #111; font-weight: 700; letter-spacing: -0.5px; }
  .section { margin-bottom: 24px; }
  .section-title { padding: 10px 20px; font-weight: 700; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px; }
  .items { padding: 8px 16px; }
  .item { margin-bottom: 10px; padding: 12px 16px; border-radius: 8px; position: relative; }
  .item-title { font-weight: 500; font-size: 15px; display: block; margin-bottom: 2px; }
  .item-meta { font-size: 12px; opacity: 0.8; }
  .icon { display: inline-block; width: 18px; height: 18px; margin-right: 8px; vertical-align: middle; }
  
  /* Overdue Styling */
  .section-overdue .section-title { background: #ff4d4d; color: white; }
  .section-overdue .item { background: #ffebeb; color: #cc0000; border: 1px solid #ffcccc; }
  .section-overdue .item-title { color: #cc0000; }
  
  /* Yet To Do Styling */
  .section-today .section-title { background: #2b7fff; color: white; }
  .section-today .item { background: #ffffff; border: 2px solid #2b7fff; color: #111; }
  
  /* Upcoming Styling */
  .section-upcoming .section-title { background: #ffcc00; color: #000; }
  .section-upcoming .item { background: #fffcf0; border: 1px solid #ffeb99; color: #856404; }

  .footer { padding: 20px; text-align: center; color: #888; font-size: 12px; background: #fdfdfd; border-top: 1px solid #eee; }
`;

function bullet(line) {
  return `- ${line}`;
}

function formatChecklistLine(item) {
  return bullet(`${item.title} (${item.weekday})`);
}

function formatDeadlineLine(item) {
  const coursePart = item.course ? ` [${item.course}]` : "";
  const typePart = item.isAssignment ? "Assignment" : "Study item";
  return bullet(`${item.title}${coursePart} - ${typePart}, ${item.dueLabel}`);
}

function renderHtmlSection(title, items, type) {
  if (items.length === 0) return "";
  
  const sectionClass = `section-${type}`;
  const itemHtml = items.map(item => {
    let titleText = item.title;
    let metaText = "";
    
    if (type === "overdue") {
      metaText = item.weekday || (item.dueLabel ? `(DUE ${item.dueLabel.toUpperCase()})` : "PAST DUE");
    } else if (type === "today") {
      metaText = item.weekday || "TODAY";
    } else {
      metaText = item.dueLabel || `IN ${item.daysUntilDue} DAYS`;
    }

    const icon = type === "overdue" 
      ? `<span style="font-size: 16px; margin-right: 5px;">⚠️</span>` 
      : `<span style="font-size: 16px; margin-right: 5px;">📅</span>`;

    return `
      <div class="item">
        <span class="item-title">${icon} ${titleText}</span>
        <span class="item-meta">${metaText}</span>
      </div>
    `;
  }).join("");

  return `
    <div class="section ${sectionClass}">
      <div class="section-title">${title} (${items.length})</div>
      <div class="items">${itemHtml}</div>
    </div>
  `;
}

function renderHtml(payload) {
  const { overdue, today, upcoming, subject, generatedAt } = payload;
  
  const content = [
    renderHtmlSection("TODAY'S TASKS", today, "today"),
    renderHtmlSection("UPCOMING DEADLINES", upcoming, "upcoming")
  ].join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${CSS}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Daily Reminder</h1>
          </div>
          <div class="content">
            ${content || '<div style="padding: 40px; text-align: center; color: #888;">All clear! No tasks found.</div>'}
          </div>
          <div class="footer">
            Generated at ${generatedAt}<br>
            Stay productive.
          </div>
        </div>
      </body>
    </html>
  `;
}

function joinSections(sections) {
  return sections
    .filter((section) => section.lines.length > 0)
    .map((section) => `${section.title}\n${section.lines.join("\n")}`)
    .join("\n\n");
}

function buildDigestPayload({ nowContext, checklistItems, deadlineItems, runLabel, runType, timeZone, windowDays }) {
  const todayChecklist = checklistItems.filter((item) => item.isToday);
  const upcomingDeadlines = deadlineItems.filter(
    (item) => item.daysUntilDue >= 0 && item.daysUntilDue <= windowDays
  );

  const sections = [
    {
      title: "Today's Tasks",
      lines: todayChecklist.map(formatChecklistLine)
    },
    {
      title: "Upcoming Deadlines",
      lines: upcomingDeadlines.map(formatDeadlineLine)
    }
  ];

  const body = joinSections(sections);
  const finalBody =
    body ||
    [
      "All clear for today.",
      "",
      `No tasks are scheduled for today and no deadlines are due within the next ${windowDays} days.`
    ].join("\n");

  const generatedAt = `${String(nowContext.hour).padStart(2, "0")}:${String(nowContext.minute).padStart(2, "0")} ${timeZone}`;
  const subject = `Study Digest - ${nowContext.subjectLabel}`;

  const html = renderHtml({
    overdue: [],
    today: todayChecklist,
    upcoming: upcomingDeadlines,
    subject,
    generatedAt
  });

  return {
    subject,
    generatedAt,
    runType,
    text: [`${runLabel} reminder`, "", finalBody].join("\n"),
    html
  };
}

function buildUrgentPayload({ nowContext, checklistItems, deadlineItems, runType, timeZone }) {
  const todayChecklist = checklistItems.filter((item) => item.isToday);
  const todayDeadlines = deadlineItems.filter((item) => item.daysUntilDue === 0);
  const todayItems = [...todayChecklist, ...todayDeadlines];

  const sections = [
    {
      title: "Today's Tasks",
      lines: [...todayChecklist.map(formatChecklistLine), ...todayDeadlines.map(formatDeadlineLine)]
    }
  ];

  const body = joinSections(sections);
  if (!body) {
    return null;
  }

  const generatedAt = `${String(nowContext.hour).padStart(2, "0")}:${String(nowContext.minute).padStart(2, "0")} ${timeZone}`;
  const subject = `Today's Tasks - ${nowContext.subjectLabel}`;

  const html = renderHtml({
    overdue: [],
    today: todayItems,
    upcoming: [],
    subject,
    generatedAt
  });

  return {
    subject,
    generatedAt,
    runType,
    text: ["Today reminder", "", body].join("\n"),
    html
  };
}

function buildEmailPayload({
  nowContext,
  checklistItems,
  deadlineItems,
  runType,
  timeZone,
  windowDays
}) {
  if (runType === "urgent") {
    return buildUrgentPayload({
      nowContext,
      checklistItems,
      deadlineItems,
      runType,
      timeZone
    });
  }

  const runLabel = nowContext.hour < 12 ? "Morning digest" : "Evening digest";
  return buildDigestPayload({
    nowContext,
    checklistItems,
    deadlineItems,
    runLabel,
    runType,
    timeZone,
    windowDays
  });
}

module.exports = {
  buildEmailPayload
};
