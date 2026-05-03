const CONTACT_EMAIL = "zach@zach.cafe";
const CONTACT_DISCORD = "@3zachm";
const BOT_NAME = "Chronically Onleet";
const LAST_UPDATED = "May 2, 2025";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-text">{title}</h2>
      <div className="flex flex-col gap-3 text-text/70 leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-text/90">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export default function Legal() {
  return (
    <main className="min-h-screen px-6 py-32">
      <div className="w-full max-w-[760px] mx-auto flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3 pb-8 border-b border-secondary/20">
          <h1 className="text-4xl font-bold text-text">Legal</h1>
          <p className="text-text/50 text-sm">Last updated {LAST_UPDATED}</p>
        </div>

        {/* Terms of Service */}
        <div className="flex flex-col gap-12">
          <h2 className="text-3xl font-bold text-primary">Terms of Service</h2>

          <Section title="Usage Agreement">
            <p>
              Usage of {BOT_NAME} is subject to the following terms and conditions. By using {BOT_NAME}, you agree to be
              bound by these terms.
            </p>
            <p>
              Inviting the bot to your server permits storage of your server's data for proper functionality as
              described in the Privacy Policy below. Installing the bot as a user app permits storage of your user data
              as described below.
            </p>
          </Section>

          <Section title="Affiliation">
            <p>
              {BOT_NAME} is not affiliated with any of the services or servers that it is used on. {BOT_NAME} is not
              affiliated with or maintained by Discord Inc., nor do we own any assets associated with Discord. LeetCode
              problem data is fetched from LeetCode's public-facing API; {BOT_NAME} is not affiliated with or endorsed
              by LeetCode.
            </p>
          </Section>

          <Section title="Liability">
            <p>
              {BOT_NAME} is not liable for any loss or damage caused by its use, whether such be lost or damaged data or
              any other damages that may arise. Access to the bot may be removed if usage is deemed to be in violation
              of these Terms, or if activities by the end user are deemed malicious or illegal. Illegal activity
              includes violations of the Discord Terms of Service and Community Guidelines.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              If you have any questions or concerns about these Terms, please contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>{" "}
              or through Discord DM via {CONTACT_DISCORD}.
            </p>
          </Section>
        </div>

        <div className="border-t border-secondary/20" />

        {/* Privacy Policy */}
        <div className="flex flex-col gap-12">
          <h2 className="text-3xl font-bold text-primary">Privacy Policy</h2>

          <Section title="Information We Collect">
            <p>
              {BOT_NAME} collects the minimum data necessary to provide its features. Data is stored in a database and
              is never sold or shared with third parties.
            </p>

            <SubSection title="Server (Guild) Data">
              <p>When the bot is added to a server, we store:</p>
              <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
                <li>
                  <code className="text-primary text-sm">guildId</code>: the Discord server ID
                </li>
                <li>
                  <code className="text-primary text-sm">daily.channelId</code>: the channel configured for daily posts
                </li>
                <li>
                  <code className="text-primary text-sm">daily.roleId</code>: an optional role to ping on daily posts
                </li>
                <li>
                  <code className="text-primary text-sm">daily.config</code>: posting schedule offset and enabled state
                </li>
                <li>
                  <code className="text-primary text-sm">daily.useThreads</code>,{" "}
                  <code className="text-primary text-sm">daily.useCompact</code>,{" "}
                  <code className="text-primary text-sm">daily.useRolePing</code>: display and behavior preferences
                </li>
              </ul>
            </SubSection>

            <SubSection title="User Data">
              <p>When you interact with the bot (including as a user app install), we store:</p>
              <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
                <li>
                  <code className="text-primary text-sm">userId</code>: your Discord user ID
                </li>
                <li>
                  <code className="text-primary text-sm">useCompact</code>: your display preference for problem embeds
                </li>
                <li>
                  <code className="text-primary text-sm">daily.config</code>: your personal daily posting schedule
                  offset and enabled state
                </li>
              </ul>
            </SubSection>

            <SubSection title="Reminder Data">
              <p>If you set a reminder, we additionally store:</p>
              <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
                <li>
                  <code className="text-primary text-sm">userId</code>: your Discord user ID
                </li>
                <li>
                  <code className="text-primary text-sm">triggersAt</code>: the scheduled time for your reminder
                </li>
              </ul>
              <p>Reminder data is deleted automatically once the reminder has been delivered.</p>
            </SubSection>

            <SubSection title="Delivery Records">
              <p>
                To prevent duplicate deliveries, we maintain internal delivery records keyed to a target (user or
                server) and scheduled date. These records contain no message content: only delivery status and
                timestamps used for fault tolerance.
              </p>
            </SubSection>
          </Section>

          <Section title="Temporary Data">
            <p>
              {BOT_NAME} stores temporary data in memory cache as required by the Discord API. This data is not
              persisted and is cleared automatically or upon bot restart.
            </p>
          </Section>

          <Section title="Deleting Your Data">
            <SubSection title="Server data">
              <p>
                Guild configuration data is currently persisted when {BOT_NAME} is removed from your server to provide
                continuity upon re-addition of the bot. To manually request deletion, contact us as outlined in the
                Terms of Service. You will need to provide evidence that you are an owner or administrator of the
                associated server, or that the server no longer exists.
              </p>
            </SubSection>
            <SubSection title="User data">
              <p>
                To request deletion of your user data, contact us directly. You will need to verify your identity via
                Discord.
              </p>
            </SubSection>
          </Section>

          <Section title="Contact">
            <p>
              For privacy-related requests, reach us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>{" "}
              , Discord DM via {CONTACT_DISCORD}, or the support server linked on the Discord Developer Platform.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
