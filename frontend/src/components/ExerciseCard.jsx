import { useNavigate } from "react-router-dom";

export default function ExerciseCard({ exercise }) {
  const navigate = useNavigate();

  return (
    <div className="bento-card">
      <h3 className="exercise-title">{exercise.name}</h3>
      <button 
        className="start-btn"
        onClick={() => navigate("/workout")}
      >
        Start
      </button>
    </div>
  );
}
