import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import NBAConnectionGame from './components/NBAConnectionGame'


function App() {
  const [count, setCount] = useState(0)

  return (
      <div className="min-h-screen bg-gray-100 p-4">
        <NBAConnectionGame />
      </div>
  )
}

export default App
