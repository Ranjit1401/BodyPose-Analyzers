import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Workout from "./pages/Workout";
import History from "./pages/History";
import MainLayout from "./components/MainLayout";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Routes>
  <Route path="/" element={<Landing />} />

  <Route
    path="/home"
    element={
      <MainLayout>
        <Home />
      </MainLayout>
    }
  />

  <Route
    path="/menu"
    element={
      <MainLayout>
        <Menu />
      </MainLayout>
    }
  />

  <Route
    path="/workout"
    element={
      <MainLayout>
        <Workout />
      </MainLayout>
    }
  />

  {/* 🔐 Protected History */}
  <Route
    path="/history"
    element={
      <ProtectedRoute>
        <MainLayout>
          <History />
        </MainLayout>
      </ProtectedRoute>
    }
  />

  {/* 🔐 Protected Profile */}
  <Route
    path="/profile"
    element={
      <ProtectedRoute>
        <MainLayout>
          <Profile />
        </MainLayout>
      </ProtectedRoute>
    }
  />
</Routes>

    </>
  );
}

export default App;
