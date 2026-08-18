import { useAuth } from "../../features/auth/useAuth";
import { CommunityComposer } from "../../features/community/components/CommunityComposer";
import { CommunityFeed } from "../../features/community/components/CommunityFeed";
import { CommunitySidebar } from "../../features/community/components/CommunitySidebar";

export function CommunityPage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <section className="community-page-state">
        <p>Đang tải hồ sơ thành viên...</p>
      </section>
    );
  }

  return (
    <div className="community-main">
      <section
        className="community-feed"
        aria-labelledby="community-feed-title"
      >
        <header className="community-feed-heading">
          <p>IDEAS / CODE / PEOPLE</p>

          <h1 id="community-feed-title">
            COMMUNITY FEED
          </h1>
        </header>

        <CommunityComposer profile={profile} />

        <CommunityFeed />
      </section>

      <CommunitySidebar />
    </div>
  );
}