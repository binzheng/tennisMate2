import { auth } from "~/server/auth";

export default auth((req) => {
	const isLoggedIn = !!req.auth;
	const isOnLoginPage = req.nextUrl.pathname.startsWith("/login");
	const isOnProtectedRoute =
		req.nextUrl.pathname.startsWith("/users") ||
		req.nextUrl.pathname.startsWith("/facilities") ||
		req.nextUrl.pathname.startsWith("/lessons");

	// 保護されたルートで未認証の場合、ログインページにリダイレクト
	if (isOnProtectedRoute && !isLoggedIn) {
		return Response.redirect(
			new URL(
				`/login?callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`,
				req.nextUrl.origin,
			),
		);
	}

	// ログイン済みでログインページにアクセスした場合、ユーザーマスタにリダイレクト
	if (isOnLoginPage && isLoggedIn) {
		return Response.redirect(new URL("/users", req.nextUrl.origin));
	}

	return;
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
