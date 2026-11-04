import UserSelector from "@/components/UserSelector";
import SiteNav from "@/components/SiteNav";

export default function Team2MemberPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <SiteNav active="/equipo-2" team="TEAM2" />
      <div className="py-8 sm:py-12 px-4">
        <UserSelector team="TEAM2" />
      </div>
    </div>
  );
}
