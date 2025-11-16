import { MainLayout } from "~/components/layout/main-layout";

import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
	const _session = await auth();

	return (
		<MainLayout>
			<HydrateClient>
				<main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#004e92] to-[#000428] text-white">
					<div className="container flex flex-col gap-8 px-4 py-10 md:py-16">
						<header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
							<div>
								<h1 className="font-extrabold text-3xl tracking-tight md:text-4xl">
									テニス用語一覧
								</h1>
								<p className="mt-2 max-w-2xl text-gray-200 text-sm md:text-base">
									スコア・ショット・戦術など、テニスでよく登場する基本用語をまとめています。
									レッスンや試合の前に、意味をサッと確認できるホーム画面です。
								</p>
							</div>
						</header>

						<section className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							<div className="rounded-xl bg-white/10 p-4 backdrop-blur">
								<h2 className="font-bold text-lg">スコア・ゲーム進行</h2>
								<ul className="mt-3 space-y-2 text-gray-100 text-sm">
									<li>
										<span className="font-semibold">ラブ（Love）</span>: 0点。
										例:「ラブ・フォーティ」は 0-40。
									</li>
									<li>
										<span className="font-semibold">デュース（Deuce）</span>:
										40-40。 どちらかが2ポイント連続で取るまで続く。
									</li>
									<li>
										<span className="font-semibold">アドバンテージ（Adv）</span>
										: デュース後に1ポイントリードした状態。
									</li>
									<li>
										<span className="font-semibold">ゲーム</span>:
										ラリーの最小単位。 ポイントを先取して1ゲーム獲得。
									</li>
									<li>
										<span className="font-semibold">セット</span>:
										規定ゲーム数を先取して獲得する単位（例:
										6ゲーム先取、2ゲーム差など）。
									</li>
								</ul>
							</div>

							<div className="rounded-xl bg-white/10 p-4 backdrop-blur">
								<h2 className="font-bold text-lg">ショット・テクニック</h2>
								<ul className="mt-3 space-y-2 text-gray-100 text-sm">
									<li>
										<span className="font-semibold">フォアハンド</span>:
										利き腕側で打つ基本ショット。
									</li>
									<li>
										<span className="font-semibold">バックハンド</span>:
										非利き腕側で打つショット。片手/両手がある。
									</li>
									<li>
										<span className="font-semibold">ボレー</span>:
										バウンドさせずにネット付近で打つショット。
									</li>
									<li>
										<span className="font-semibold">スマッシュ</span>:
										高いボールを上から叩き込む攻撃的なショット。
									</li>
									<li>
										<span className="font-semibold">トップスピン</span>:
										順回転をかけたショット。弾んでから大きく跳ねる。
									</li>
									<li>
										<span className="font-semibold">スライス</span>:
										逆回転をかけたショット。弾んでから伸びにくく低く滑る。
									</li>
								</ul>
							</div>

							<div className="rounded-xl bg-white/10 p-4 backdrop-blur">
								<h2 className="font-bold text-lg">コート・ポジション</h2>
								<ul className="mt-3 space-y-2 text-gray-100 text-sm">
									<li>
										<span className="font-semibold">ベースライン</span>:
										コートの一番後ろのライン。ラリーの基準位置。
									</li>
									<li>
										<span className="font-semibold">サービスライン</span>:
										サーブが入るエリアの前後を区切るライン。
									</li>
									<li>
										<span className="font-semibold">デュースサイド</span>:
										サーバーから見て右側のサイド。デュース時にサーブする側。
									</li>
									<li>
										<span className="font-semibold">アドサイド</span>:
										サーバーから見て左側のサイド。アドバンテージ時にサーブする側。
									</li>
									<li>
										<span className="font-semibold">
											ダブルス alleys（アレー）
										</span>
										: ダブルスでのみ有効なサイドの通路部分。
									</li>
								</ul>
							</div>

							<div className="rounded-xl bg-white/10 p-4 backdrop-blur">
								<h2 className="font-bold text-lg">サーブ関連</h2>
								<ul className="mt-3 space-y-2 text-gray-100 text-sm">
									<li>
										<span className="font-semibold">ファーストサーブ</span>:
										1本目のサーブ。リスクを取って攻撃的に打つことが多い。
									</li>
									<li>
										<span className="font-semibold">セカンドサーブ</span>:
										2本目のサーブ。確実に入れることが優先される。
									</li>
									<li>
										<span className="font-semibold">ダブルフォルト</span>:
										2本ともサーブミスとなり相手のポイントになること。
									</li>
									<li>
										<span className="font-semibold">エース</span>:
										相手に触られずに決まるサーブ。
									</li>
								</ul>
							</div>

							<div className="rounded-xl bg-white/10 p-4 backdrop-blur">
								<h2 className="font-bold text-lg">戦術・その他</h2>
								<ul className="mt-3 space-y-2 text-gray-100 text-sm">
									<li>
										<span className="font-semibold">クロス</span>:
										対角線方向へのショット。
									</li>
									<li>
										<span className="font-semibold">ストレート</span>:
										サイドラインに沿って真っすぐ打つショット。
									</li>
									<li>
										<span className="font-semibold">パッシングショット</span>:
										ネットにいる相手を抜くショット。
									</li>
									<li>
										<span className="font-semibold">ドロップショット</span>:
										ネット際に短く落とすショット。
									</li>
									<li>
										<span className="font-semibold">カウンター</span>:
										相手の強いボールを利用して打ち返す攻撃。
									</li>
								</ul>
							</div>
						</section>
					</div>
				</main>
			</HydrateClient>
		</MainLayout>
	);
}
