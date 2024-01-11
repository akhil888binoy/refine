import React from "react";
import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import { getXRay } from "@refinedev/devtools-internal";
import qs from "qs";
import { useNavigation, useRouterContext, useNotification, useRouterType, useParsed, useGo } from "@hooks";
import { useAuthBindingsContext, useLegacyAuthContext } from "@contexts/auth";
import { RefineError, OpenNotificationParams } from "../../../interfaces";
import { AuthActionResponse } from "src/interfaces/bindings/auth";
import { useInvalidateAuthStore } from "../useInvalidateAuthStore";
import { useKeys } from "@hooks/useKeys";

export type UseVerifyProps<TVariables> = {
  mutationOptions?: Omit<UseMutationOptions<AuthActionResponse, Error | RefineError, TVariables, unknown>, "mutationFn">;
};

export type UseVerifyReturnType<TVariables> = UseMutationResult<AuthActionResponse, Error | RefineError, TVariables, unknown>;

export function useVerify<TVariables = {}>(props?: UseVerifyProps<TVariables>): UseVerifyReturnType<TVariables> {
  const invalidateAuthStore = useInvalidateAuthStore();
  const routerType = useRouterType();

  const go = useGo();
  const { replace } = useNavigation();

  const parsed = useParsed();

  const { useLocation } = useRouterContext();
  const { search } = useLocation();

  const { close, open } = useNotification();
  const { verify: verifyFromContext } = useAuthBindingsContext();
  const { verify: legacyVerifyFromContext } = useLegacyAuthContext();
  const { keys, preferLegacyKeys } = useKeys();

  const to = React.useMemo(() => {
    if (routerType === "legacy") {
      const legacySearch = qs.parse(search, {
        ignoreQueryPrefix: true,
      });
      return legacySearch.to;
    } else {
      return parsed.params?.to;
    }
  }, [routerType, parsed.params, search]);

  const mutation = useMutation<AuthActionResponse, Error | RefineError, TVariables, unknown>(
    keys().auth().action("verify").get(preferLegacyKeys),
    verifyFromContext,
    {
      onSuccess: async ({ success, redirectTo, error }) => {
        if (success) {
          close?.("verify-error");
        }

        if (error || !success) {
          open?.(buildNotification(error));
        }

        await invalidateAuthStore();

        if (to && success) {
          if (routerType === "legacy") {
            replace(to as string);
          } else {
            go({ to: to as string, type: "replace" });
          }
        } else if (redirectTo) {
          if (routerType === "legacy") {
            replace(redirectTo);
          } else {
            go({ to: redirectTo, type: "replace" });
          }
        } else {
          if (routerType === "legacy") {
            replace("/");
          }
        }
      },
      onError: (error: any) => {
        open?.(buildNotification(error));
      },
      ...props?.mutationOptions,
      meta: {
        ...getXRay("useVerify", preferLegacyKeys),
      },
    },
  );

  const legacyMutation = useMutation<AuthActionResponse, Error | RefineError, TVariables, unknown>(
    [...keys().auth().action("verify").get(preferLegacyKeys), "legacy"],
    legacyVerifyFromContext,
    {
      onSuccess: async (redirectPathFromAuth) => {
        await invalidateAuthStore();

        if (to) {
          replace(to as string);
        }

        if (redirectPathFromAuth !== false && !to) {
          if (typeof redirectPathFromAuth === "string") {
            if (routerType === "legacy") {
              replace(redirectPathFromAuth);
            } else {
              go({ to: redirectPathFromAuth, type: "replace" });
            }
          } else {
            if (routerType === "legacy") {
              replace("/");
            } else {
              go({ to: "/", type: "replace" });
            }
          }
        }

        close?.("verify-error");
      },
      onError: (error: any) => {
        open?.(buildNotification(error));
      },
      ...props?.mutationOptions,
      meta: {
        ...getXRay("useVerify", preferLegacyKeys),
      },
    },
  );

  return legacyVerifyFromContext ? legacyMutation : mutation;
}

const buildNotification = (error?: Error | RefineError): OpenNotificationParams => {
  return {
    message: error?.name || "Verify Error",
    description: error?.message || "Error while verifying",
    key: "verify-error",
    type: "error",
  };
};
