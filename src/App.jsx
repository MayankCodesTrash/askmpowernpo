import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Impact from './components/Impact'
import Roles from './components/Roles'
import IowaStats from './components/IowaStats'
import Founder from './components/Founder'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Login from './pages/Login'
import YouthDashboard from './pages/YouthDashboard'
import MentorDashboard from './pages/MentorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function Home() {
  useEffect(() => {
    const onScroll = () => {
      const nav = document.querySelector('nav')
      if (nav) nav.style.boxShadow = window.scrollY > 40 ? '0 2px 20px rgba(26,58,143,0.1)' : 'none'
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <Nav />
      <Hero />
      <hr className="divider" />
      <HowItWorks />
      <hr className="divider" />
      <Impact />
      <hr className="divider" />
      <Roles />
      <hr className="divider" />
      <IowaStats />
      <hr className="divider" />
      <Founder />
      <hr className="divider" />
      <Contact />
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard/youth" element={
        <ProtectedRoute role="youth"><YouthDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard/mentor" element={
        <ProtectedRoute role="mentor"><MentorDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard/admin" element={
        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
      } />
    </Routes>
  )
}
