import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignInAction = vi.mocked(signInAction);
const mockSignUpAction = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

const SUCCESS = { success: true };
const FAILURE = { success: false, error: "Invalid credentials" };

const ANON_WORK = {
  messages: [{ role: "user", content: "make a button" }],
  fileSystemData: { "/": {}, "/Button.tsx": {} },
};

const PROJECTS = [{ id: "proj-1" }, { id: "proj-2" }];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-proj" } as any);
});

describe("useAuth", () => {
  describe("initial state", () => {
    it("returns isLoading as false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    it("exposes signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    it("returns the action result on success", async () => {
      mockSignInAction.mockResolvedValue(SUCCESS);
      mockGetProjects.mockResolvedValue(PROJECTS as any);

      const { result } = renderHook(() => useAuth());
      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("a@b.com", "password");
      });

      expect(returnValue).toEqual(SUCCESS);
    });

    it("returns the action result on failure", async () => {
      mockSignInAction.mockResolvedValue(FAILURE);

      const { result } = renderHook(() => useAuth());
      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("a@b.com", "wrong");
      });

      expect(returnValue).toEqual(FAILURE);
    });

    it("calls signInAction with the provided credentials", async () => {
      mockSignInAction.mockResolvedValue(FAILURE);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "mypassword");
      });

      expect(mockSignInAction).toHaveBeenCalledWith("user@example.com", "mypassword");
    });

    it("sets isLoading to true while in flight and false after", async () => {
      let resolveSignIn!: (v: any) => void;
      mockSignInAction.mockReturnValue(new Promise((res) => (resolveSignIn = res)));
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "p" } as any);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("a@b.com", "pass");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn(SUCCESS);
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("resets isLoading to false even when the action throws", async () => {
      mockSignInAction.mockRejectedValue(new Error("network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("does not navigate when sign in fails", async () => {
      mockSignInAction.mockResolvedValue(FAILURE);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "wrong");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("signUp", () => {
    it("returns the action result on success", async () => {
      mockSignUpAction.mockResolvedValue(SUCCESS);
      mockGetProjects.mockResolvedValue(PROJECTS as any);

      const { result } = renderHook(() => useAuth());
      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("a@b.com", "password");
      });

      expect(returnValue).toEqual(SUCCESS);
    });

    it("returns the action result on failure", async () => {
      mockSignUpAction.mockResolvedValue(FAILURE);

      const { result } = renderHook(() => useAuth());
      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("a@b.com", "short");
      });

      expect(returnValue).toEqual(FAILURE);
    });

    it("sets isLoading to true while in flight and false after", async () => {
      let resolveSignUp!: (v: any) => void;
      mockSignUpAction.mockReturnValue(new Promise((res) => (resolveSignUp = res)));
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "p" } as any);

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("a@b.com", "pass");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp(SUCCESS);
        await signUpPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("does not navigate when sign up fails", async () => {
      mockSignUpAction.mockResolvedValue(FAILURE);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("a@b.com", "bad");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("post-auth navigation (handlePostSignIn)", () => {
    describe("when anonymous work exists with messages", () => {
      beforeEach(() => {
        mockGetAnonWorkData.mockReturnValue(ANON_WORK);
        mockCreateProject.mockResolvedValue({ id: "anon-proj" } as any);
      });

      it("creates a project from the anonymous work", async () => {
        mockSignInAction.mockResolvedValue(SUCCESS);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("a@b.com", "pass");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: ANON_WORK.messages,
          data: ANON_WORK.fileSystemData,
        });
      });

      it("clears the anonymous work after claiming it", async () => {
        mockSignInAction.mockResolvedValue(SUCCESS);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("a@b.com", "pass");
        });

        expect(mockClearAnonWork).toHaveBeenCalled();
      });

      it("navigates to the newly created project", async () => {
        mockSignInAction.mockResolvedValue(SUCCESS);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("a@b.com", "pass");
        });

        expect(mockPush).toHaveBeenCalledWith("/anon-proj");
      });

      it("does not fetch existing projects when anon work is available", async () => {
        mockSignInAction.mockResolvedValue(SUCCESS);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("a@b.com", "pass");
        });

        expect(mockGetProjects).not.toHaveBeenCalled();
      });
    });

    describe("when anonymous work has no messages", () => {
      beforeEach(() => {
        mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
      });

      it("falls through to check existing projects", async () => {
        mockSignInAction.mockResolvedValue(SUCCESS);
        mockGetProjects.mockResolvedValue(PROJECTS as any);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("a@b.com", "pass");
        });

        expect(mockGetProjects).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/proj-1");
      });
    });

    describe("when no anonymous work exists", () => {
      beforeEach(() => {
        mockGetAnonWorkData.mockReturnValue(null);
      });

      it("navigates to the most recent existing project", async () => {
        mockSignInAction.mockResolvedValue(SUCCESS);
        mockGetProjects.mockResolvedValue(PROJECTS as any);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("a@b.com", "pass");
        });

        expect(mockPush).toHaveBeenCalledWith("/proj-1");
      });

      it("creates a new project when the user has none", async () => {
        mockSignInAction.mockResolvedValue(SUCCESS);
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "fresh-proj" } as any);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("a@b.com", "pass");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
      });

      it("navigates to the newly created project when user has none", async () => {
        mockSignInAction.mockResolvedValue(SUCCESS);
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "fresh-proj" } as any);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("a@b.com", "pass");
        });

        expect(mockPush).toHaveBeenCalledWith("/fresh-proj");
      });

      it("does not create a project when existing ones are found", async () => {
        mockSignInAction.mockResolvedValue(SUCCESS);
        mockGetProjects.mockResolvedValue(PROJECTS as any);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("a@b.com", "pass");
        });

        expect(mockCreateProject).not.toHaveBeenCalled();
      });
    });

    it("same post-auth logic applies after signUp", async () => {
      mockSignUpAction.mockResolvedValue(SUCCESS);
      mockGetProjects.mockResolvedValue(PROJECTS as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@b.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });
  });
});
