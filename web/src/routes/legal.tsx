import { createFileRoute } from "@tanstack/react-router";
import Legal from "./legal.component";

export const Route = createFileRoute("/legal")({
  component: Legal,
});
