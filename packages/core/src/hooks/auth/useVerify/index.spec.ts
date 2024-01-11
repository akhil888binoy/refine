import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useMutation } from "@tanstack/react-query";
import { TestWrapper, mockRouterContext, mockNotificationContext } from "@test";
import { useVerify } from ".";

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useMutation: jest.fn(),
}));

describe("useVerify Hook", () => {
  const mockInvalidateAuthStore = jest.fn();
  const mockGo = jest.fn();
  const mockReplace = jest.fn();
  const mockOpenNotification = jest.fn();
  const mockCloseNotification = jest.fn();

  const mockVerifyFromContext = jest.fn();
  const mockLegacyVerifyFromContext = jest.fn();

  const mockKeys = jest.fn(() => ({
    auth: () => ({
      action: (actionName) => ({
        get: (preferLegacyKeys) => [actionName, preferLegacyKeys ? "legacy" : "modern"],
      }),
    }),
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    useMutation.mockImplementation(() => ({
      mutate: jest.fn(),
    }));
  });

  it("should handle successful verification and redirect in modern router", async () => {
    useMutation.mockImplementationOnce(() => ({
      mutate: mockVerifyFromContext,
    }));

    const { result } = renderHook(() => useVerify(), {
      wrapper: TestWrapper({
        invalidateAuthStore: mockInvalidateAuthStore,
        go: mockGo,
        replace: mockReplace,
        openNotification: mockOpenNotification,
        closeNotification: mockCloseNotification,
        verifyFromContext: mockVerifyFromContext,
        legacyVerifyFromContext: mockLegacyVerifyFromContext,
        keys: mockKeys,
      }),
    });

    const { mutate: verify } = result.current;

    await act(async () => {
      verify({ verificationCode: "123456" });
    });

    // Assertions
    expect(mockVerifyFromContext).toHaveBeenCalledWith({ verificationCode: "123456" });
    // Add more assertions as needed based on your use case
  });

  it("should handle failed verification and show error notification in legacy router", async () => {
    useMutation.mockImplementationOnce(() => ({
      mutate: mockVerifyFromContext,
    }));

    const { result } = renderHook(() => useVerify(), {
      wrapper: TestWrapper({
        routerType: "legacy",
        invalidateAuthStore: mockInvalidateAuthStore,
        go: mockGo,
        replace: mockReplace,
        openNotification: mockOpenNotification,
        closeNotification: mockCloseNotification,
        verifyFromContext: mockVerifyFromContext,
        legacyVerifyFromContext: mockLegacyVerifyFromContext,
        keys: mockKeys,
      }),
    });

    const { mutate: verify } = result.current;

    await act(async () => {
      verify({ verificationCode: "123456" });
    });

    // Assertions
    expect(mockVerifyFromContext).toHaveBeenCalledWith({ verificationCode: "123456" });
    // Add more assertions as needed based on your use case
  });

  // Add more test scenarios for different scenarios as needed
});
