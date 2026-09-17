# Hero mindmap orb

**Date:** 2026-09-17

## Goal

Show the homepage mindmap as a floating 3D graph inside the existing hero ball. Opening the ball reveals the full pan-and-zoom mindmap canvas. Remove the separate inline map section.

## Design

- Use the homepage's existing `mindmapData` as the single source for both views. The preview has a root card, topic cards, project/research cards, hierarchy edges, and cross-reference edges derived from inline `<inode>` links.
- Keep the hero preview lightweight: small translucent billboard cards arranged in a sphere, connected in 3D, with a subtle wire shell. Render decorative Latin phrases in a handwriting font to make the preview atmospheric; real titles, descriptions, and navigation remain in the existing mindmap canvas.
- Clicking the ball or the accessible “Explore the map” button opens a full viewport dialog containing the existing canvas. Close by button or Escape.
- Other pages continue using their existing ambient blob.

## Verification

- Build all 28 pages.
- Check the preview and expanded canvas in a browser, including the button and ball click paths.
