import { ButtonBuilder, ButtonStyle } from "discord.js";

interface ToggleButtonProps {
  isEnabled: boolean;
  customIdEnable: string;
  customIdDisable: string;
}

export default function ToggleButton(props: ToggleButtonProps) {
  return new ButtonBuilder()
    .setStyle(props.isEnabled ? ButtonStyle.Success : ButtonStyle.Danger)
    .setLabel(props.isEnabled ? "Enabled" : "Disabled")
    .setCustomId(props.isEnabled ? props.customIdDisable : props.customIdEnable);
}
