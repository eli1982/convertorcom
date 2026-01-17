// Simple icon component using Font Awesome
window.Icon = ({ name, size = 16, className = "" }) => (
  <i className={`fas fa-${name} ${className}`} style={{ fontSize: `${size}px` }}></i>
);
