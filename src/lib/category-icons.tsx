export const categoryIcons: Record<string, React.ReactNode> = {
  Corte: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  ),
  Barba: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      {/* Bigode */}
      <path d="M7 9c0 0 1.5-3 3.5-2 .7.3 1.1.6 1.5.6s.8-.3 1.5-.6c2-1 3.5 2 3.5 2" fillOpacity="0.8"/>
      {/* Barba */}
      <path d="M7 9c-1 2.5-1 8 2 11 1.5 1.5 2.5 2 3 2s1.5-.5 3-2c3-3 3-8.5 2-11C15 10 13.5 10.5 12 10.5S9 10 7 9z"/>
    </svg>
  ),
  Combo: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      {/* Anéis da tesoura */}
      <circle cx="7.5" cy="5.5" r="2.5"/>
      <circle cx="7.5" cy="5.5" r="1" fill="white" fillOpacity="0.7"/>
      <circle cx="16.5" cy="5.5" r="2.5"/>
      <circle cx="16.5" cy="5.5" r="1" fill="white" fillOpacity="0.7"/>
      {/* Lâminas cruzadas */}
      <path d="M9.5 6.7L14.5 4.3M9.5 4.3L14.5 6.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Base do pente */}
      <rect x="3" y="16.5" width="18" height="3" rx="1.5"/>
      {/* Dentes do pente */}
      <rect x="5" y="11" width="2" height="6.5" rx="1"/>
      <rect x="9" y="11" width="2" height="6.5" rx="1"/>
      <rect x="13" y="11" width="2" height="6.5" rx="1"/>
      <rect x="17" y="11" width="2" height="6.5" rx="1"/>
    </svg>
  ),
  Tratamento: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      {/* Cabeça da bomba */}
      <rect x="9.5" y="2" width="5" height="2.5" rx="1.25" fillOpacity="0.9"/>
      {/* Bico dispensador */}
      <path d="M14.5 2.5H17a.5.5 0 010 1h-2.5v-1z" fillOpacity="0.75"/>
      {/* Pescoço */}
      <rect x="10.5" y="4.5" width="3" height="2.5" rx="1"/>
      {/* Ombros */}
      <path d="M9 7l-2 2h10l-2-2H9z" fillOpacity="0.85"/>
      {/* Corpo do frasco */}
      <path d="M7 9h10v11a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"/>
      {/* Linha decorativa */}
      <rect x="8" y="13.5" width="8" height="1.5" rx="0.75" fill="white" fillOpacity="0.25"/>
    </svg>
  ),
  Estética: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

export const fallbackIcon = categoryIcons["Estética"];
