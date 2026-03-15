import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface" />,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame" />,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("shows preview view by default", () => {
  render(<MainContent />);

  // PreviewFrame is always mounted; preview container should be visible (no 'hidden' class)
  const previewFrame = screen.getByTestId("preview-frame");
  expect(previewFrame).toBeDefined();
  expect(previewFrame.closest(".hidden")).toBeNull();

  // Code editor should not be mounted
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("switches to code view when Code tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  // PreviewFrame is still mounted but its container is hidden
  const previewFrame = screen.getByTestId("preview-frame");
  expect(previewFrame.closest(".hidden")).toBeDefined();

  // Code editor is now mounted
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("file-tree")).toBeDefined();
});

test("switches back to preview view when Preview tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();

  await user.click(screen.getByRole("tab", { name: "Preview" }));

  // Preview is visible again (no hidden class)
  const previewFrame = screen.getByTestId("preview-frame");
  expect(previewFrame.closest(".hidden")).toBeNull();

  // Code editor is unmounted
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("Preview tab is active by default", () => {
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  expect(previewTab.getAttribute("data-state")).toBe("active");

  const codeTab = screen.getByRole("tab", { name: "Code" });
  expect(codeTab.getAttribute("data-state")).toBe("inactive");
});

test("Code tab becomes active after clicking it", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  const codeTab = screen.getByRole("tab", { name: "Code" });
  expect(codeTab.getAttribute("data-state")).toBe("active");

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  expect(previewTab.getAttribute("data-state")).toBe("inactive");
});

test("toggle can be repeated multiple times", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const getPreviewContainer = () =>
    screen.getByTestId("preview-frame").closest(".hidden");

  // Start: preview visible
  expect(getPreviewContainer()).toBeNull();

  // Switch to code
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(getPreviewContainer()).toBeDefined();

  // Switch back to preview
  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(getPreviewContainer()).toBeNull();
  expect(screen.queryByTestId("code-editor")).toBeNull();

  // Switch to code again
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Switch back to preview again
  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(getPreviewContainer()).toBeNull();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("PreviewFrame stays mounted when switching to code view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // PreviewFrame exists initially
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Switch to code
  await user.click(screen.getByRole("tab", { name: "Code" }));

  // PreviewFrame is still in the DOM (just hidden) - this prevents flash on switch-back
  expect(screen.getByTestId("preview-frame")).toBeDefined();
});
