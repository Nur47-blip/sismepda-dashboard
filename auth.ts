import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { identifier: {}, password: {} },
      async authorize(raw) {
        const parsed = z.object({ identifier: z.string().min(1), password: z.string().min(1) }).safeParse(raw)
        if (!parsed.success) return null
        const identifier = parsed.data.identifier.trim().toLowerCase()
        const user = await prisma.user.findFirst({
          where: { active: true, OR: [{ email: identifier }, { nip: parsed.data.identifier.trim() }] },
        })
        if (!user || !(await compare(parsed.data.password, user.passwordHash))) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role, nip: user.nip }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role; token.nip = user.nip }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as "ADMIN" | "GURU"
      session.user.nip = token.nip as string | null
      return session
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname
      const loggedIn = Boolean(auth?.user)
      if (path === "/login") return loggedIn ? Response.redirect(new URL("/", request.nextUrl)) : true
      if (!loggedIn) return false
      const adminOnly = ["/siswa/input", "/guru/input", "/wali-kelas/input", "/pengaturan"]
      if (adminOnly.some((route) => path.startsWith(route)) && auth?.user.role !== "ADMIN") {
        return Response.redirect(new URL("/", request.nextUrl))
      }
      return true
    },
  },
})
