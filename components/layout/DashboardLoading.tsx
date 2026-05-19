export default function DashboardLoading() {
  return (
    <div className="dash-loading" aria-busy="true" aria-label="Loading page">
      <div className="dash-loading-line dash-loading-line--short" />
      <div className="dash-loading-line dash-loading-line--long" />
      <div className="dash-loading-cards">
        <div className="dash-loading-card" />
        <div className="dash-loading-card" />
        <div className="dash-loading-card" />
        <div className="dash-loading-card" />
      </div>
    </div>
  );
}
