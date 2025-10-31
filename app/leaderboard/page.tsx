import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { STAGES } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch top scores for each stage
  const leaderboardData = await Promise.all(
    STAGES.map(async (stage) => {
      const { data } = await supabase
        .from("game_scores")
        .select(
          `
          *,
          profiles (display_name, avatar_color)
        `,
        )
        .eq("stage_id", stage.id)
        .order("score", { ascending: false })
        .limit(10)

      return {
        stage,
        scores: data || [],
      }
    }),
  )

  // Fetch user's personal history
  const { data: userHistory } = await supabase
    .from("game_scores")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b-4 border-primary/20 shadow-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🏆</div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">Top players and your history</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-full border-2 bg-transparent">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="global" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 rounded-2xl">
            <TabsTrigger value="global" className="rounded-xl text-base">
              Global Rankings
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl text-base">
              My History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-6">
            {leaderboardData.map(({ stage, scores }) => (
              <Card key={stage.id} className="border-4 border-primary/20 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <span className="text-3xl">{stage.icon}</span>
                    {stage.title}
                  </CardTitle>
                  <CardDescription className="text-base">Top 10 players</CardDescription>
                </CardHeader>
                <CardContent>
                  {scores.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No scores yet. Be the first!</p>
                  ) : (
                    <div className="space-y-3">
                      {scores.map((score, index) => (
                        <div
                          key={score.id}
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                            score.user_id === user.id
                              ? "bg-primary/10 border-2 border-primary"
                              : "bg-muted/30 hover:bg-muted/50"
                          }`}
                        >
                          {/* Rank */}
                          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-card border-2 border-primary/30">
                            <span className="text-xl font-bold">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                            </span>
                          </div>

                          {/* Player Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">
                              {score.profiles?.display_name || "Anonymous"}
                              {score.user_id === user.id && (
                                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {score.game_type.charAt(0).toUpperCase() + score.game_type.slice(1)} Game
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex gap-6 text-right">
                            <div>
                              <p className="text-xs text-muted-foreground">Score</p>
                              <p className="text-lg font-bold text-primary">{score.score}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">WPM</p>
                              <p className="text-lg font-bold text-accent">{score.wpm}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Accuracy</p>
                              <p className="text-lg font-bold text-secondary">{score.accuracy}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border-4 border-accent/20 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <span className="text-3xl">📊</span>
                  Your Game History
                </CardTitle>
                <CardDescription className="text-base">Recent 20 games</CardDescription>
              </CardHeader>
              <CardContent>
                {!userHistory || userHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎮</div>
                    <p className="text-xl text-muted-foreground mb-4">No games played yet</p>
                    <Link href="/dashboard">
                      <Button className="rounded-2xl shadow-lg">Start Playing</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userHistory.map((score) => {
                      const stage = STAGES.find((s) => s.id === score.stage_id)
                      return (
                        <div
                          key={score.id}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all"
                        >
                          {/* Stage Icon */}
                          <div className="flex-shrink-0 text-4xl">{stage?.icon || "🎯"}</div>

                          {/* Game Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground">{stage?.title || "Unknown Stage"}</p>
                            <p className="text-sm text-muted-foreground">
                              {score.game_type.charAt(0).toUpperCase() + score.game_type.slice(1)} Game •{" "}
                              {new Date(score.created_at).toLocaleDateString()} at{" "}
                              {new Date(score.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex gap-6 text-right">
                            <div>
                              <p className="text-xs text-muted-foreground">Score</p>
                              <p className="text-lg font-bold text-primary">{score.score}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">WPM</p>
                              <p className="text-lg font-bold text-accent">{score.wpm}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Accuracy</p>
                              <p className="text-lg font-bold text-secondary">{score.accuracy}%</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Stats Summary */}
            {userHistory && userHistory.length > 0 && (
              <Card className="border-4 border-secondary/20 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <span className="text-3xl">📈</span>
                    Your Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-primary/10 rounded-2xl">
                      <p className="text-sm text-muted-foreground mb-1">Total Games</p>
                      <p className="text-3xl font-bold text-primary">{userHistory.length}</p>
                    </div>
                    <div className="text-center p-4 bg-accent/10 rounded-2xl">
                      <p className="text-sm text-muted-foreground mb-1">Best WPM</p>
                      <p className="text-3xl font-bold text-accent">{Math.max(...userHistory.map((s) => s.wpm))}</p>
                    </div>
                    <div className="text-center p-4 bg-secondary/10 rounded-2xl">
                      <p className="text-sm text-muted-foreground mb-1">Avg Accuracy</p>
                      <p className="text-3xl font-bold text-secondary">
                        {Math.round(userHistory.reduce((sum, s) => sum + s.accuracy, 0) / userHistory.length)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-2xl">
                      <p className="text-sm text-muted-foreground mb-1">Total Score</p>
                      <p className="text-3xl font-bold text-foreground">
                        {userHistory.reduce((sum, s) => sum + s.score, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
