function AboutDoodle() {
  return (
    <div className="about-doodle" aria-hidden="true">
      <svg viewBox="0 0 100 200" fill="none" focusable="false">
        <path
          className="about-doodle-line"
          d="M80 182
             C12 164 10 113 48 108
             C91 103 82 158 42 141
             C7 125 14 73 61 59"
          pathLength="1"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <g className="about-doodle-heart">
          <path
            d="M62 53
               C32 37 38 15 52 19
               C59 21 62 27 62 27
               C62 27 70 14 81 20
               C98 30 79 47 62 53Z"
            fill="#FFDA65"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  )
}

export default AboutDoodle