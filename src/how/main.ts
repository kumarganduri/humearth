// How We Know page entry: fetch the same data files the site uses and render them.
import '../styles.css';
import './how.css';
import { renderPage } from './render';
import { loadChangelog, loadConstants, loadHubs } from '../data/load';

async function main() {
  const content = document.getElementById('content')!;
  try {
    const [c, hubs, log] = await Promise.all([loadConstants(), loadHubs(), loadChangelog()]);
    content.innerHTML = renderPage(c, hubs, log); // every data string is escaped in render.ts
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  } catch {
    content.innerHTML = '<p>We couldn\'t load the numbers right now. Please try again in a moment.</p>';
  }
}
main();
