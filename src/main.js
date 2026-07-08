import '../main.css'
import '../index.css'
import '../about.css'
import '../pet-meadow.css'
import '../sticky-note.css'

const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('hidden');
});