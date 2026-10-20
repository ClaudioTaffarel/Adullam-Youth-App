function AuthArtwork() {
  return (
    <div className="auth-artwork" aria-hidden="true">
    <svg className="fire-mascot" viewBox="0 0 260 260" fill="none">
        {/* Kaki */}
        <path
          d="M105 208L100 232H77M151 208L160 232H181"
          stroke="#38251d"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tangan kiri */}
        <path
          d="M69 150C43 157 39 178 27 174"
          stroke="#38251d"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Tangan yang melambai */}
        <g className="mascot-wave">
          <path
            d="M190 148C217 137 223 112 222 94"
            stroke="#38251d"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M222 96L209 81M222 96L225 73M222 96L239 83"
            stroke="#38251d"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>

        {/* Badan api */}
        <path
          d="M130 25C139 67 180 72 176 113
             C192 104 194 89 193 81
             C225 123 215 183 181 206
             C151 228 101 226 75 202
             C42 171 47 134 70 108
             C67 133 79 143 89 147
             C79 103 114 79 130 25Z"
          fill="#F47B38"
          stroke="#38251d"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        <path
          d="M129 138C134 162 160 167 156 190
             C153 211 112 214 103 193
             C95 174 118 159 129 138Z"
          fill="#FFDA65"
        />

        {/* Wajah */}
        <ellipse cx="106" cy="133" rx="5" ry="8" fill="#38251d" />
        <ellipse cx="153" cy="133" rx="5" ry="8" fill="#38251d" />

        <path
          d="M117 151Q130 163 143 151"
          stroke="#38251d"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <ellipse cx="91" cy="147" rx="10" ry="5" fill="#E65B32" />
        <ellipse cx="168" cy="147" rx="10" ry="5" fill="#E65B32" />
    </svg>
    </div>
  )
}

export default AuthArtwork