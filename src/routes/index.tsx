import { createFileRoute } from "@tanstack/react-router";
import { PushideaApp } from "@/components/pushidea-app";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <PushideaApp />;
}
