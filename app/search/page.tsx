import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import SearchClient from "@/components/SearchClient";

export default function SearchPage() {
  return (
    <AuthGuard>
      <TopBar />
      <div className="container">
        <h1 style={{ marginTop: 0 }}>Find a condo project</h1>
        <p className="muted" style={{ marginTop: -8 }}>
          Search the cached questionnaire database before ordering a new one.
        </p>
        <SearchClient />
      </div>
    </AuthGuard>
  );
}
