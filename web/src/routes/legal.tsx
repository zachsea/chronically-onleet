import { createFileRoute } from "@tanstack/react-router";
import Legal from "./legal.lazy";

export const Route = createFileRoute("/legal")({
  component: Legal,
});
