import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import { FaInstagram, FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();

  /* ================= TYPING ANIMATION ================= */

  const words = [
    "Train Smart.",
    "Move Correct.",
    "Let AI Perfect Your Form."
  ];

  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const typing = setTimeout(() => {
      if (charIndex < words[wordIndex].length) {
        setText(prev => prev + words[wordIndex][charIndex]);
        setCharIndex(charIndex + 1);
      } else {
        setTimeout(() => {
          setText("");
          setCharIndex(0);
          setWordIndex((wordIndex + 1) % words.length);
        }, 1500);
      }
    }, 60);

    return () => clearTimeout(typing);
  }, [charIndex, wordIndex]);

  /* ================= SCROLL FADE ================= */

  useEffect(() => {
    const elements = document.querySelectorAll(".fade-in");

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach(el => observer.observe(el));
  }, []);

  /* ================= FAQ ================= */

  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "Is FitFlicks free to use?",
      answer:
        "Yes. You can access workouts and AI pose detection features for free. Advanced analytics and progress tracking require login."
    },
    {
      question: "How does AI pose detection work?",
      answer:
        "FitFlicks uses computer vision and body landmark tracking technology to analyze posture and movement in real-time."
    },
    {
      question: "Do I need special equipment?",
      answer:
        "No. A device with a camera is enough. Some workouts may optionally use dumbbells or resistance bands."
    },
    {
      question: "Is my camera or uploaded video data stored?",
      answer:
        "FitFlicks processes live camera input and uploaded videos for posture analysis. Video content is used only during analysis and is not permanently stored."
    },
    {
      question: "Can I track my progress?",
      answer:
        "Yes. Once logged in, you can track workout history, streaks, and performance improvements."
    }
  ];

  const toggleFAQ = index => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="home-wrapper">

      {/* ================= HERO ================= */}
      <section className="hero-section">

        <div className="hero-glow"></div>

        <h1 className="hero-title">
          {text}
          <span className="cursor">|</span>
        </h1>

        <p className="hero-subtitle">
          Real-time AI-powered posture correction built for modern fitness.
        </p>

        <button
          className="primary-btn"
          onClick={() => navigate("/menu")}
        >
          Begin Training
        </button>

      </section>

      {/* ================= FEATURES ================= */}
      <section className="features-section fade-in">

        <h2 className="section-title">Why FitFlicks?</h2>

        <div className="features-grid">

          <div className="feature-card">
            <h3>Real-Time Pose Detection</h3>
            <p>Advanced landmark tracking powered by computer vision.</p>
          </div>

          <div className="feature-card">
            <h3>Accuracy Metrics</h3>
            <p>Measure posture precision and movement quality.</p>
          </div>

          <div className="feature-card">
            <h3>Workout History</h3>
            <p>Track past sessions and monitor improvement.</p>
          </div>

          <div className="feature-card">
            <h3>Progress Analytics</h3>
            <p>Visualize your performance with structured insights.</p>
          </div>

        </div>

      </section>

      {/* ================= FAQ ================= */}
      <section className="faq-section fade-in">

        <h2 className="section-title">Q & A</h2>

        <div className="faq-container">
          {faqs.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${activeIndex === index ? "active" : ""}`}
              onClick={() => toggleFAQ(index)}
            >
              <div className="faq-question">
                {item.question}
                <span className="arrow">
                  {activeIndex === index ? "−" : "+"}
                </span>
              </div>

              {activeIndex === index && (
                <div className="faq-answer">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="landing-footer">

  <div className="footer-content">

    <div className="footer-brand">
      <h3>FitFlicks</h3>
      <p>AI-powered fitness for real results.</p>

      <button
  onClick={() =>
    navigate("/", {
      state: { openLogin: true }
    })
  }
>
  Start Your AI Journey →
</button>

    </div>

    <div className="footer-links">
      <div>
        <h4>Product</h4>
        <p>Workouts</p>
        <p>AI Detection</p>
        <p>Progress Tracking</p>
      </div>

      <div>
        <h4>Resources</h4>
        <p>Blog</p>
        <p>Support</p>
        <p>Contact</p>
      </div>

      <div>
        <h4>Company</h4>
        <p>About Us</p>
        <p>Careers</p>
        <p>Privacy</p>
      </div>
    </div>

  </div>

  {/* Social Icons */}
  <div className="footer-social">
    <FaInstagram />
    <FaGithub />
    <FaLinkedin />
    <FaTwitter />
  </div>

  <div className="footer-bottom">
    © 2026 FitFlicks. All rights reserved.
  </div>

</footer>


    </div>
  );
}
