import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../services/api";
import ProgressHeatmap from "../components/ProgressHeatmap";
import "../styles/Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        const data = response.data;

        setUser(data.user);
        setStats(data.stats);
        setProgressData(data.progress);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-wrapper">
        <div className="loading-state">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">

      {/* ================= TOP SECTION ================= */}
      <section className="profile-identity">

        <div className="avatar">
          {user?.name?.charAt(0) || "U"}
        </div>

        <div className="identity-info">
          <h2>{user?.name || "User Name"}</h2>
          <p>{user?.email || "user@email.com"}</p>
          <p className="goal">
            Goal: {user?.goal || "Not Set"}
          </p>
          <p className="join-date">
            Joined: {user?.joinDate || "-"}
          </p>
        </div>

        <button className="edit-btn">
          Edit Profile
        </button>

      </section>

      {/* ================= MIDDLE SECTION ================= */}
      <section className="profile-stats">

        {!stats ? (
          <div className="empty-state">
            No statistics available.
          </div>
        ) : (
          <>
            <div className="stat-card">
              <h3>{stats.totalWorkouts}</h3>
              <p>Total Workouts</p>
            </div>

            <div className="stat-card">
              <h3>{stats.avgAccuracy}%</h3>
              <p>Avg Accuracy</p>
            </div>

            <div className="stat-card">
              <h3>{stats.totalCalories}</h3>
              <p>Total Calories</p>
            </div>

            <div className="stat-card">
              <h3>{stats.streak} Days</h3>
              <p>Current Streak</p>
            </div>
          </>
        )}

      </section>

      {/* ================= BOTTOM SECTION ================= */}
      <section className="profile-progress">

        <div className="progress-header">
          <h2>Workout Activity</h2>

          {stats?.streak > 0 && (
            <div className="streak-badge">
              🔥 {stats.streak} Day Streak
            </div>
          )}
        </div>

        {progressData.length === 0 ? (
          <div className="empty-state">
            No activity data available. Complete a workout to see your progress!
          </div>
        ) : (
          <ProgressHeatmap data={progressData} />
        )}

      </section>

    </div>
  );
}
