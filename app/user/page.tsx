import UserForm from "@/components/UserForm";

export default function UserPage() {
  // In a real app, you'd get userId and userName from session/auth
  // For now, we'll use placeholder values that should come from your auth provider
  const userId = process.env.DEMO_USER_ID || "user-demo-123";
  const userName = process.env.DEMO_USER_NAME || "Demo User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <UserForm userId={userId} userName={userName} />
      </div>
    </div>
  );
}
