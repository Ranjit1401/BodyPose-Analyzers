import { useNavigate } from "react-router-dom";
import "../styles/Menu.css";

// Import images
import burpees from "../assets/exercises/burpees.png";
import dumbbells from "../assets/exercises/dumbbells.png";
import jumpingJacks from "../assets/exercises/jumping_jacks.png";
import planks from "../assets/exercises/planks.png";
import pilates from "../assets/exercises/pliates.png";
import pushup from "../assets/exercises/pushup.png";
import resistanceBand from "../assets/exercises/resistance_band.png";
import squats from "../assets/exercises/squats.png";
import steps from "../assets/exercises/steps.png";
import yoga from "../assets/exercises/yoga.png";
import zumba from "../assets/exercises/zumba.png";
import youtube from "../assets/exercises/youtube.png";
export default function Menu() {
  const navigate = useNavigate();

  const exercises = [
    { id: "burpees", title: "Burpees", image: burpees },
    { id: "dumbbells", title: "Dumbbells", image: dumbbells },
    { id: "jumping_jacks", title: "Jumping Jacks", image: jumpingJacks },
    { id: "planks", title: "Planks", image: planks },
    { id: "pilates", title: "Pilates", image: pilates },
    { id: "pushup", title: "Pushups", image: pushup },
    { id: "resistance_band", title: "Resistance Band", image: resistanceBand },
    { id: "squats", title: "Squats", image: squats },
    { id: "steps", title: "Steps", image: steps },
    { id: "yoga", title: "Yoga", image: yoga },
    { id: "zumba", title: "Zumba", image: zumba },
    {id: "Import", title:"Import from Youtube", image:youtube },
  ];

  const handleClick = (id) => {
    navigate(`/workout?type=${id}`);
  };

  return (
    <div className="menu-wrapper">

      <h1 className="menu-title">Select Exercise</h1>
      <p className="menu-subtitle">
        AI Pose Detection Powered Workouts
      </p>

      <div className="exercise-grid">
        {exercises.map((exercise) => (
         <div
  key={exercise.id}
  className="exercise-card"
  onClick={() => handleClick(exercise.id)}
>
  <div className="image-wrapper">
    <img
      src={exercise.image}
      alt={exercise.title}
    />
  </div>

  {/* 👇 ADD THIS LINE */}
  <h3 className="exercise-title">
    {exercise.title}
  </h3>

</div>

        ))}
      </div>

    </div>
  );
}
