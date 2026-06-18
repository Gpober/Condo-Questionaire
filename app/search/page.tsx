import TopBar from "@/components/TopBar";
import SearchClient from "@/components/SearchClient";
import EmailCapture from "@/components/EmailCapture";

export default function SearchPage() {
  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head">
          <h1>Find a condo project</h1>
          <p>Search the cached questionnaire database before ordering a new one.</p>
        </div>
        <SearchClient />
        <div style={{ marginTop: 28 }}>
          <EmailCapture source="search" />
        </div>
      </div>
    </>
  );
}
