/// <reference types="vite/client" />
import { createRootRoute, Outlet } from "@tanstack/react-router";
import appCss from "../styles/app.css?url";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const footerItems = [
  {
    label: "GitHub",
    to: "https://github.com/zachsea/chronically-onleet",
    item: <>GitHub</>,
  },
  {
    label: "Privacy Policy & Terms of Service",
    to: "/legal",
    item: <>Legal</>,
  },
];

export const Route = createRootRoute({
  head: () => ({
    meta: [],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: () => (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <NavBar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer items={footerItems} />
    </div>
  ),
});
