// The Share button on answers and reveals: the phone's share sheet where there is one, else copy, else a
// selectable box. Text and URL come from data attributes written at build time.

export function bindShares(root: ParentNode = document) {
  for (const box of root.querySelectorAll<HTMLElement>('.share[data-share-text]')) {
    if (box.dataset.bound) continue;
    box.dataset.bound = '1';
    const text = box.dataset.shareText!, url = box.dataset.shareUrl!;
    const done = box.querySelector<HTMLElement>('.share-done')!;
    box.querySelector('button')!.addEventListener('click', async () => {
      try {
        if (navigator.share) { await navigator.share({ text, url }); done.textContent = 'Shared'; return; }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        done.textContent = 'Copied. Paste it anywhere.';
      } catch {
        let ta = box.querySelector('textarea');
        if (!ta) { ta = document.createElement('textarea'); ta.readOnly = true; ta.setAttribute('aria-label', 'Text to share'); ta.value = `${text} ${url}`; box.append(ta); }
        ta.focus(); ta.select();
        done.textContent = 'Selected. Copy it from here.';
      }
    });
  }
}
