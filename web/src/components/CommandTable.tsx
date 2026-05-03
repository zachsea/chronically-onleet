const commands = [
  {
    command: "/daily send",
    description: "Post the daily LeetCode problem in the current channel.",
    options: [{ name: "compact", description: "Show a compact version of the problem embed.", required: false }],
  },
  {
    command: "/daily settings",
    description: "Configure automated daily problem posting for your server.",
    options: [],
  },
  {
    command: "/problem send",
    description: "Fetch and display a specific LeetCode problem by ID, slug, or URL.",
    options: [
      { name: "query", description: "The ID, slug, or URL of the problem.", required: true },
      { name: "compact", description: "Show a compact version of the problem embed.", required: false },
    ],
  },
  {
    command: "/problem post",
    description: "Create a thread or forum post for sharing solutions to a problem.",
    options: [
      { name: "query", description: "The ID, slug, keyword, or URL of the problem.", required: true },
      { name: "channel", description: "Channel to post the thread or forum post in.", required: true },
      { name: "compact", description: "Show a compact version of the problem embed.", required: false },
    ],
  },
  {
    command: "/reminder",
    description: "Set or manage a personal reminder for the daily problem.",
    options: [],
  },
];

export function CommandTable() {
  return (
    <div className="flex flex-col gap-4">
      {commands.map((cmd) => (
        <div key={cmd.command} className="rounded-xl border border-secondary/20 bg-bg/60 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-4 border-b border-secondary/10">
            <code className="text-primary font-mono text-sm font-semibold">{cmd.command}</code>
            <span className="text-text/70 text-sm sm:ml-4">{cmd.description}</span>
          </div>

          {cmd.options.length > 0 && (
            <div className="px-5 py-3 flex flex-col gap-2">
              {cmd.options.map((opt) => (
                <div key={opt.name} className="flex items-start gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-[160px]">
                    <code className="text-text/80 font-mono">{opt.name}</code>
                    {!opt.required && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-secondary/15 text-text/40 font-medium">
                        optional
                      </span>
                    )}
                  </div>
                  <span className="text-text/50">{opt.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
