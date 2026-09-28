"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";
import type { ProjectMessageRecord } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Message = Pick<ProjectMessageRecord, "role" | "content">;

type CopilotPanelProps = {
  projectId: string;
  initialMessages: Message[];
};

export function CopilotPanel({ projectId, initialMessages }: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!draft.trim()) return;
    const userMessage: Message = { role: "user", content: draft.trim() };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setPending(true);
    setError("");

    const response = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, message: userMessage.content }),
    });

    setPending(false);

    if (!response.ok) {
      setError("Bouldrr could not answer that question yet.");
      return;
    }

    const data = (await response.json()) as { content: string; enabled: boolean };
    setMessages((current) => [
      ...current,
      { role: "assistant", content: data.content },
    ]);
  }

  return (
    <div className="grid min-h-[calc(100vh-9rem)] gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="flex min-h-[32rem] flex-col shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-5" />
            Project copilot
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-3">
            {messages.length === 0 && (
              <div className="flex h-full min-h-64 items-center justify-center text-center text-sm text-muted-foreground">
                Ask about your next permit step, missing documents, zoning research, or blocked tasks.
              </div>
            )}
            {messages.map((message, index) => (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-auto max-w-[85%] bg-foreground text-background"
                    : "mr-auto max-w-[85%] bg-card shadow-sm"
                }`}
                key={`${message.role}-${index}`}
              >
                {message.content}
              </div>
            ))}
            {pending && (
              <div className="mr-auto max-w-[85%] rounded-lg bg-card px-3 py-2 text-sm shadow-sm">
                Thinking...
              </div>
            )}
          </div>
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              className="min-h-20"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What permit do I need next?"
              value={draft}
            />
            <Button
              className="sm:self-end"
              disabled={pending || !draft.trim()}
              onClick={submit}
              type="button"
            >
              <Send className="size-4" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
      <Alert className="h-fit">
        <Bot className="size-4" />
        <AlertTitle>AI is disabled for now</AlertTitle>
        <AlertDescription>
          The copilot route is built server-side and will use OPENAI_API_KEY when
          you add it. Until then it returns a graceful development placeholder.
        </AlertDescription>
      </Alert>
    </div>
  );
}
