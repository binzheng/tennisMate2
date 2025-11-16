import {
	defaultShouldDehydrateQuery,
	QueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "~/server/api/root";

function handleAuthError(error: unknown) {
	if (typeof window === "undefined") return;

	if (error instanceof TRPCClientError<AppRouter>) {
		const code = error.data?.code;
		if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
			window.location.href = "/";
		}
	}
}

export const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				// With SSR, we usually want to set some default staleTime
				// above 0 to avoid refetching immediately on the client
				staleTime: 30 * 1000,
				onError: handleAuthError,
			},
			mutations: {
				onError: handleAuthError,
			},
			dehydrate: {
				serializeData: SuperJSON.serialize,
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === "pending",
			},
			hydrate: {
				deserializeData: SuperJSON.deserialize,
			},
		},
	});
