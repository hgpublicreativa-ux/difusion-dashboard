import UserSelector from "@/components/UserSelector";
import SiteNav from "@/components/SiteNav";

export default function UserPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <SiteNav active="/user" />
      <div className="py-8 sm:py-12 px-4">
        <UserSelector />
      </div>
    </div>
  );
}
