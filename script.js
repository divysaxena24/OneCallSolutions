
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.custom-navbar-dark');
    if (window.scrollY > 10) {
      navbar.classList.add('shadow-lg');
    } else {
      navbar.classList.remove('shadow-lg');
    }
  });

  
<script>
document.addEventListener('DOMContentLoaded', function() {
  const navbar = document.querySelector('.custom-navbar-dark');
  
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
});
</script>
