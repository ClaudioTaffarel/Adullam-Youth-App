const whatsappUrl =
  'https://wa.me/62818833038?text=' +
  encodeURIComponent(
    'Halo! Aku mau kenalan dan tahu lebih lanjut tentang ADULLAM Youth.',
  )

function ContactSection() {
  return (
    <footer className="compact-contact" id="contact">
      <div className="compact-contact-copy">
        <div className="compact-contact-brand">
          <a href="#home">#SEMUAORANGDITERIMA</a>
        </div>

        <p>
          Baru pertama kali? Datang aja. Kalau mau tanya-tanya dulu,
          boleh banget.
        </p>
      </div>

      <nav className="compact-contact-links" aria-label="Kontak komunitas">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hubungi ADULLAM Youth lewat WhatsApp"
          title="WhatsApp"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M20.52 3.48A11.85 11.85 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.88c0 2.09.55 4.13 1.59 5.93L.06 24l6.34-1.66a11.9 11.9 0 0 0 5.65 1.44h.01c6.55 0 11.88-5.33 11.89-11.88a11.8 11.8 0 0 0-3.43-8.42ZM12.06 21.77a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.76.98 1-3.66-.24-.38a9.84 9.84 0 0 1-1.51-5.24C2.16 6.44 6.6 2 12.06 2a9.8 9.8 0 0 1 7 2.9 9.82 9.82 0 0 1 2.88 7c0 5.45-4.44 9.87-9.88 9.87Zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.09 4.48.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"
            />
          </svg>
        </a>

        <a
          href="https://www.instagram.com/adullamyouth_rkd/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram ADULLAM Youth"
          title="Instagram"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle
              cx="17.5"
              cy="6.5"
              r="1"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </a>

        <a
          href="https://maps.app.goo.gl/GjUcPjnXNFHaiB4K8"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Buka lokasi pertemuan di Google Maps"
          title="Google Maps"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </a>
      </nav>
    </footer>
  )
}

export default ContactSection