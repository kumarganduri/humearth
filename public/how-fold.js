// How We Know on phones: close every source fold before the page is first painted (it is built open, so
// desktop and scripts-off visitors see every quote). A classic, synchronous script placed right after the
// content: it runs before first paint, so nothing jumps.
if (window.matchMedia('(max-width: 560px)').matches) {
  document.querySelectorAll('details.src-fold[open]').forEach(function (d) { d.removeAttribute('open'); });
}
