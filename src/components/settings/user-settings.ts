import { ButtonBuilder, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import SettingsLayout from "./settings-layout.js";

export function UserSettings() {
  const dailySettings: ContainerBuilder[] = [
    new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent("### todo")),
  ];

  const buttons = [
    new ButtonBuilder().setLabel("User Settings").setCustomId("settings::user-config"),
    new ButtonBuilder().setLabel("Server Settings").setCustomId("settings::server-config"),
  ];

  const components = SettingsLayout({
    title: "User Settings",
    buttons,
    currentPageButton: "settings::user-config",
    rows: dailySettings,
  });

  return components;
}
