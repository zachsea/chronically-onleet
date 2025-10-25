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
  title?: string;
  rows: ContainerBuilder[];
  buttons?: ButtonBuilder[];
  currentPageButton?: string;
}

export default function SettingsLayout(props: SettingsLayoutProps) {
  const components: (ContainerBuilder | TextDisplayBuilder | ActionRowBuilder<MessageActionRowComponentBuilder>)[] = [];
  if (props.title) components.push(new TextDisplayBuilder().setContent(`## ${props.title}`));
  components.push(...props.rows);
  if (props.buttons) {
    props.buttons.forEach((button) =>
      button
        .setDisabled((button.data as APIButtonComponentWithCustomId).custom_id === props.currentPageButton)
        .setStyle(button.data.disabled ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );
    components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(props.buttons));
  }

  return components;
}
