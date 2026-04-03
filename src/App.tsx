function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">
        SecureLearn
      </h1>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl">
        A highly scalable SaaS e-learning platform with a strong focus on Digital Rights Management (DRM) and content security.
      </p>
      
      <div className="flex gap-4">
        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Get Started
        </button>
        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
          View Courses
        </button>
      </div>
    </div>
  )
}

export default App
