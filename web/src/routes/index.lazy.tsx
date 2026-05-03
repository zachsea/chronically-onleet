import { CommandTable } from "../components/CommandTable";
import IconButton from "../components/IconButton";

const features = [
  {
    title: "Daily Problem Posts",
    description:
      "Get daily LeetCode problems posted directly in your server at a time you choose. Supports forums (recommended), threads, or channels for easy access and discussion.",
    image: "/img/posts.png",
  },
  {
    title: "User Install",
    description:
      "Leverage the bot's problem parsing to post problems in any context, including user DMs, groups, and in the bot's DMs. This also allows you to receive dailies in your DMs without needing to set up a server for it, if you prefer that!",
    image: "/img/embed.png",
  },
  {
    title: "Configurability",
    description:
      "Make sure to set up the bot to fit your own preferences, open to further customization suggestions or contributions if you need them :)",
    image: "/img/settings.png",
  },
];

export function Index() {
  return (
    <>
      <main className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-none text-text">
              LeetCode Suffering
              <br />
              With <span className="text-primary">Friends!</span>
            </h1>

            <p className="text-lg sm:text-xl text-text/60 max-w-lg leading-normal">
              Receive daily problem posts in a forum, thread, or channel context for collaboration or discussion. Or
              just send your friends any problem you want...
            </p>

            <div className="flex flex-wrap gap-3 mt-2">
              <IconButton
                variant="primary"
                onClick={() =>
                  window.open(
                    "https://discord.com/oauth2/authorize?client_id=1434137504142987295",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Invite Now
              </IconButton>
              <IconButton
                variant="hollow"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                View Features
              </IconButton>
            </div>
          </div>
        </div>
      </main>

      <section id="features" className="py-24">
        <div className="w-full max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col gap-12">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`flex flex-col-reverse md:flex-row items-center gap-8 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
              >
                <img src={feature.image} alt={feature.title} className="w-full md:w-1/2 rounded-xl object-cover" />
                <div className="md:w-1/2 flex flex-col gap-4">
                  <h3 className="text-2xl font-bold text-text">{feature.title}</h3>
                  <p className="text-text/60 text-lg leading-normal">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-24 border-t border-secondary/20">
        <div className="w-full max-w-[1200px] mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12">Commands</h2>
          <CommandTable />
        </div>
      </section>
    </>
  );
}
