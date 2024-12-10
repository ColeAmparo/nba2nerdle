import NBAConnectionGame from './components/NBAConnectionGame'
import { ThemeToggle } from './components/ThemeToggle'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <NBAConnectionGame />
      </div>
    </div>
  )
}

export default App