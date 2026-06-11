function LoadingSpinner({ fullHeight = false }) {
  return (
    <div className={fullHeight ? "app-loader app-loader-full" : "app-loader"} aria-label="Loading">
      <span className="app-loader-ring" />
      <span className="app-loader-dot" />
    </div>
  );
}

export default LoadingSpinner;
