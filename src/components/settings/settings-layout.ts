import {
  ActionRowBuilder,
  APIButtonComponentWithCustomId,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageActionRowComponentBuilder,
  TextDisplayBuilder,
} from "discord.js";

interface SettingsLayoutProps {
  title: string;
  rows: ContainerBuilder[];
  buttons: ButtonBuilder[];
  currentPageButton?: string;
}

export default function SettingsLayout(props: SettingsLayoutProps) {
  props.buttons.forEach((button) =>
    button
      .setDisabled((button.data as APIButtonComponentWithCustomId).custom_id === props.currentPageButton)
      .setStyle(button.data.disabled ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );
  const components = [
    new TextDisplayBuilder().setContent(`## ${props.title}`),
    ...props.rows,
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(props.buttons),
  ];

  return components;
}
